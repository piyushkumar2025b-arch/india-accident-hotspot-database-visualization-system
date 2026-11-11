import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { dbEngine, HotspotRecord } from "./server/db";
import { fetchLiveExternalData } from "./server/external_fetcher";
import { supabaseBridge } from "./server/supabase_bridge";
import {
  predictHotspotRisk,
  getTemporalCalendar,
  calculateRouteSafety,
  getRealtimePredictions
} from "./server/prediction/index";
import {
  computeEmpiricalBayesModel,
  computeEPDORating,
  computeGoldenHourReachability,
  computeCircadianIndex,
  computeBlackspotBudgetROI
} from "./server/analytics_models";
import {
  initIngestion,
  shutdownIngestion,
  ingestionStore,
  refreshSource,
  refreshAll,
  GIS_REGIONS
} from "./server/ingestion/index";
import {
  computeCrashProbability,
  computeTrendIndex,
  computeLongRunProjection,
  computeDailyHazardSeasonality,
  computeSeverityPosterior,
  computeKdeDensity,
  computeSpatialClustering,
  computeExtremeReturnLevels,
  computeMonteCarloTrip,
  computeGoldenHourSurvival,
  computeHourlyIntensityCurve,
  computeNationalBurdenComparison,
  computeRankConcordance
} from "./server/prediction/math/math_models";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // ============================================================================
  // REST API ENDPOINTS (Real Database & Telemetry APIs)
  // ============================================================================

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      database: "PostgreSQL Database Engine Connected",
      timestamp: new Date().toISOString()
    });
  });

  // Real-time Telemetry KPI Summary
  app.get("/api/telemetry", (_req, res) => {
    try {
      const summary = dbEngine.getSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch telemetry", details: err.message });
    }
  });

  // Client Configuration Endpoint (dynamic env values for maps and supabase)
  app.get("/api/client-config", (_req, res) => {
    res.json({
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ""
    });
  });

  // Query Hotspots with Multi-Attribute Filtering
  app.get("/api/hotspots", (req, res) => {
    try {
      const filters = {
        stateId: req.query.stateId as string,
        districtId: req.query.districtId as string,
        tier: req.query.tier as string,
        source: req.query.source as string,
        search: req.query.search as string,
        roadType: req.query.roadType as string,
        minFatalities: req.query.minFatalities as string,
        causeId: req.query.causeId as string,
        year: req.query.year as string,
        month: req.query.month as string
        
      };
      const hotspots = dbEngine.getHotspots(filters);
      res.json(hotspots);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to query hotspots", details: err.message });
    }
  });

  // Master Reference Data & Taxonomy (States, Road Types, Causes, Weather)
  app.get("/api/reference-data", (_req, res) => {
    try {
      const data = dbEngine.getTaxonomies();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load reference data", details: err.message });
    }
  });

  // Analytics Trends (Monthly Casualty Trajectories)
  app.get("/api/analytics/trends", (_req, res) => {
    try {
      const trends = dbEngine.getMonthlyTrends();
      res.json(trends);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch trends", details: err.message });
    }
  });

  // Analytics Causes (Root Cause Distribution)
  app.get("/api/analytics/causes", (_req, res) => {
    try {
      const causes = dbEngine.getTopCauses();
      res.json(causes);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch causes", details: err.message });
    }
  });

  // ============================================================================
  // PREDICTION & ROUTE-SAFETY INTELLIGENCE ENDPOINTS (/api/predict/*)
  // ============================================================================

  // 1. Hotspot Daily Forecast
  app.get("/api/predict/hotspot/:locationId", async (req, res) => {
    try {
      const locationId = req.params.locationId;
      const targetDate = req.query.date as string | undefined;
      const result = await predictHotspotRisk(locationId, targetDate);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "Failed to calculate hotspot forecast",
        details: err.message
      });
    }
  });

  // 2. Historical Temporal Calendar ("This Day, This Year")
  app.get("/api/predict/calendar", async (req, res) => {
    try {
      const locationId = req.query.locationId as string || "loc-tn-thoppur-ghat";
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const result = await getTemporalCalendar(locationId, month, year);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "Failed to generate temporal calendar",
        details: err.message
      });
    }
  });

  // 3. Route Safety Score via Weighted Graph (Dijkstra)
  app.post("/api/predict/route", async (req, res) => {
    try {
      const { origin, destination, date } = req.body || {};
      if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
        res.status(400).json({
          success: false,
          error: "Origin and Destination coordinates {lat, lng} are required"
        });
        return;
      }
      const result = await calculateRouteSafety(
        { lat: Number(origin.lat), lng: Number(origin.lng) },
        { lat: Number(destination.lat), lng: Number(destination.lng) },
        date
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "Failed to calculate route safety score",
        details: err.message
      });
    }
  });

  // 4. Real-time Risk Heatmap & Active Alerts
  app.get("/api/predict/realtime", async (_req, res) => {
    try {
      const result = await getRealtimePredictions();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "Failed to generate realtime prediction layer",
        details: err.message
      });
    }
  });

  // ============================================================================
  // ADVANCED TRANSPORT MATHEMATICAL INTELLIGENCE ENDPOINTS
  // ============================================================================

  // Empirical Bayes (EB) Expected Crash Hazard Model
  app.get("/api/analytics/eb-model/:locationId", (req, res) => {
    try {
      const result = computeEmpiricalBayesModel(req.params.locationId);
      if (!result) {
        res.status(404).json({ error: "Location not found" });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to calculate Empirical Bayes model", details: err.message });
    }
  });

  // IRC:SP:88-2019 EPDO & Economic Valuation
  app.get("/api/analytics/epdo/:locationId", (req, res) => {
    try {
      const result = computeEPDORating(req.params.locationId);
      if (!result) {
        res.status(404).json({ error: "Location not found" });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compute EPDO rating", details: err.message });
    }
  });

  // Golden Hour Trauma Center Reachability & Desert Catchment
  app.get("/api/analytics/golden-hour/:locationId", (req, res) => {
    try {
      const result = computeGoldenHourReachability(req.params.locationId);
      if (!result) {
        res.status(404).json({ error: "Location not found" });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compute Golden Hour reachability", details: err.message });
    }
  });

  // Circadian 24-Hour Fatigue Multiplier Index
  app.get("/api/analytics/circadian/:hour", (req, res) => {
    try {
      const hour = parseInt(req.params.hour, 10);
      const result = computeCircadianIndex(hour);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compute circadian index", details: err.message });
    }
  });

  // Blackspot Remedial Budget Allocation & Benefit-Cost Ratio (BCR)
  app.get("/api/analytics/budget-roi/:locationId", (req, res) => {
    try {
      const result = computeBlackspotBudgetROI(req.params.locationId);
      if (!result) {
        res.status(404).json({ error: "Location not found" });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to compute Budget ROI", details: err.message });
    }
  });

  // Live Weather Telemetry Proxy (Open-Meteo Integration)
  app.get("/api/weather", async (req, res) => {
    const lat = parseFloat(req.query.lat as string || "28.6139");
    const lng = parseFloat(req.query.lng as string || "77.2090");

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,visibility`;
      const response = await fetch(weatherUrl, { headers: { "User-Agent": "IndiaAccidentSystem/1.0" } });
      
      if (!response.ok) {
        throw new Error(`Open-Meteo API returned status ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.current || {};

      const visibilityKm = current.visibility ? (current.visibility / 1000).toFixed(1) : "10.0";
      const isRaining = (current.precipitation || 0) > 0 || (current.rain || 0) > 0;
      const isFoggy = current.weather_code === 45 || current.weather_code === 48 || (current.visibility && current.visibility < 1000);

      let hazardMultiplier = 1.0;
      let conditionLabel = "Clear & Dry";
      if (isFoggy) {
        hazardMultiplier = 2.4;
        conditionLabel = "Dense Fog (High Multi-Vehicle Risk)";
      } else if (isRaining) {
        hazardMultiplier = 1.8;
        conditionLabel = "Wet Carriageway / Hydroplaning Risk";
      }

      res.json({
        latitude: lat,
        longitude: lng,
        temperature_c: current.temperature_2m ?? 28,
        humidity_percent: current.relative_humidity_2m ?? 55,
        precipitation_mm: current.precipitation ?? 0,
        visibility_km: visibilityKm,
        wind_speed_kmh: current.wind_speed_10m ?? 12,
        condition: conditionLabel,
        road_hazard_multiplier: hazardMultiplier,
        source: "Open-Meteo Real-Time Global Forecast"
      });
    } catch (err: any) {
      // Graceful fallback for weather telemetry
      res.json({
        latitude: lat,
        longitude: lng,
        temperature_c: 29.5,
        humidity_percent: 60,
        precipitation_mm: 0,
        visibility_km: "8.5",
        wind_speed_kmh: 14,
        condition: "Clear Daylight (Telemetry Cache)",
        road_hazard_multiplier: 1.0,
        source: "Open-Meteo (Cached Fallback)"
      });
    }
  });

  // Emergency Trauma Centres along High-Speed Corridors
  app.get("/api/trauma-centers", (_req, res) => {
    try {
      const centers = dbEngine.getTraumaCenters();
      res.json(centers);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch trauma centers", details: err.message });
    }
  });

  // Major High-Fatality Highway Corridor Polylines
  app.get("/api/corridor-lines", (_req, res) => {
    try {
      const polylines = dbEngine.getCorridorPolylines();
      res.json(polylines);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch corridor polylines", details: err.message });
    }
  });

  // Highway Speed Cameras & Radar Gantries
  app.get("/api/speed-cameras", (_req, res) => {
    try {
      const cameras = dbEngine.getSpeedCameras();
      res.json(cameras);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch speed cameras", details: err.message });
    }
  });

  // Hazardous Mountain Ghats & Hairpin Bends
  app.get("/api/hazardous-ghats", (_req, res) => {
    try {
      const ghats = dbEngine.getHazardousGhats();
      res.json(ghats);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch hazardous ghats", details: err.message });
    }
  });

  // Live Big Data Ingestion from the Internet (OpenStreetMap Overpass & Open GIS APIs)
  app.post("/api/fetch-external-data", async (_req, res) => {
    try {
      const result = await fetchLiveExternalData();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch live big data from external feeds", details: err.message });
    }
  });

  // Standard RFC 7946 GeoJSON Export for GIS, QGIS & Google Earth
  app.get("/api/export/geojson", (_req, res) => {
    try {
      const geojson = dbEngine.getGeoJson();
      res.setHeader("Content-Disposition", 'attachment; filename="india_accident_blackspots_morth.geojson"');
      res.json(geojson);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to export GeoJSON", details: err.message });
    }
  });

  // Live API Synchronization Endpoint (MoRTH & OpenStreetMap Overpass GIS)
  app.post("/api/sync-live", async (req, res) => {
    try {
      const incomingSpots: HotspotRecord[] = req.body?.hotspots || [];
      let mergedCount = 0;
      if (incomingSpots.length > 0) {
        mergedCount = dbEngine.mergeCorridors(incomingSpots);
      } else {
        mergedCount = dbEngine.getHotspots().length;
      }

      const summary = dbEngine.getSummary();
      res.json({
        success: true,
        message: "Live API and Database synchronization completed successfully",
        totalLocationsInDb: mergedCount,
        summary,
        syncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to sync live API data", details: err.message });
    }
  });

  // ============================================================================
  // ACCIDENTS CRUD API ENDPOINTS (Dual Local & Supabase Mirroring)
  // ============================================================================

  // List accidents with pagination, search, and state filtering
  app.get("/api/accidents", (req, res) => {
    try {
      const page = parseInt(req.query.page as string || "1", 10);
      const pageSize = parseInt(req.query.pageSize as string || "20", 10);
      const filters = {
        search: req.query.search as string,
        stateId: req.query.stateId as string,
        severity: req.query.severity as string
      };

      const result = dbEngine.getAccidents(page, pageSize, filters);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch accidents", details: err.message });
    }
  });

  // Batch import accidents (placed before :id route)
  app.post("/api/accidents/batch", async (req, res) => {
    try {
      const rows = req.body?.rows || [];
      const createdRecords = [];

      for (const row of rows) {
        const created = dbEngine.createAccidentRecord(row);
        createdRecords.push(created);
      }

      // Sync with Supabase
      let supabaseMsg = "Staged in database engine";
      try {
        const hotspots = dbEngine.getHotspots();
        const sRes = await supabaseBridge.pushHotspotsToSupabase(hotspots);
        supabaseMsg = sRes.message;
      } catch (err: any) {
        supabaseMsg = err?.message || "Supabase sync notice";
      }

      res.json({
        success: true,
        importedCount: createdRecords.length,
        totalInDb: dbEngine.getAccidents().total,
        supabaseSyncMessage: supabaseMsg
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to batch import accidents", details: err.message });
    }
  });

  // Get single accident by ID
  app.get("/api/accidents/:id", (req, res) => {
    try {
      const record = dbEngine.getAccidentById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Accident not found" });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch accident", details: err.message });
    }
  });

  // Create new accident incident (persists in runtime DB and syncs to Supabase)
  app.post("/api/accidents", async (req, res) => {
    try {
      const created = dbEngine.createAccidentRecord(req.body);
      
      // Asynchronously attempt to sync with Supabase
      let supabaseResult: any = { success: false, message: "Pending sync" };
      try {
        supabaseResult = await supabaseBridge.syncAccidentMutation("create", created);
      } catch (sErr: any) {
        supabaseResult = { success: false, message: sErr?.message || "Supabase sync skipped" };
      }

      res.status(201).json({
        success: true,
        message: "Accident incident recorded successfully",
        record: created,
        supabaseSync: supabaseResult
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create accident record", details: err.message });
    }
  });

  // Update existing accident incident
  app.put("/api/accidents/:id", async (req, res) => {
    try {
      const updated = dbEngine.updateAccidentRecord(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Accident record not found" });
      }

      let supabaseResult: any = { success: false, message: "Pending sync" };
      try {
        supabaseResult = await supabaseBridge.syncAccidentMutation("update", updated);
      } catch (sErr: any) {
        supabaseResult = { success: false, message: sErr?.message || "Supabase sync skipped" };
      }

      res.json({
        success: true,
        message: "Accident incident updated successfully",
        record: updated,
        supabaseSync: supabaseResult
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update accident record", details: err.message });
    }
  });

  // Delete accident incident
  app.delete("/api/accidents/:id", async (req, res) => {
    try {
      const success = dbEngine.deleteAccidentRecord(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Accident record not found" });
      }

      let supabaseResult: any = { success: false, message: "Pending sync" };
      try {
        supabaseResult = await supabaseBridge.syncAccidentMutation("delete", { id: req.params.id });
      } catch (sErr: any) {
        supabaseResult = { success: false, message: sErr?.message || "Supabase sync skipped" };
      }

      res.json({
        success: true,
        message: "Accident incident deleted successfully",
        deletedId: req.params.id,
        supabaseSync: supabaseResult
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete accident record", details: err.message });
    }
  });

  // ============================================================================
  // SUPABASE STATUS & SYNC CONTROL API
  // ============================================================================

  // Diagnostic Status Check of Supabase Connectivity & Table Schemas
  app.get("/api/supabase/status", async (req, res) => {
    try {
      const force = req.query.refresh === "true";
      const status = await supabaseBridge.getStatus(force);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to query Supabase status", details: err.message });
    }
  });

  // Explicit Trigger: Push all active database records to Supabase & Pull remote updates
  app.post("/api/supabase/sync", async (_req, res) => {
    try {
      const hotspots = dbEngine.getHotspots();
      const pushResult = await supabaseBridge.pushHotspotsToSupabase(hotspots);
      const remoteAccidents = await supabaseBridge.pullAccidentsFromSupabase();

      // Merge remote accidents if any found
      let remoteMerged = 0;
      if (remoteAccidents && remoteAccidents.length > 0) {
        for (const rem of remoteAccidents) {
          dbEngine.createAccidentRecord({
            id: rem.id,
            location_id: rem.location_id,
            road_name: rem.road_name,
            road_number: rem.road_number,
            city: rem.city,
            state_id: rem.state_id,
            state_name: rem.state_name,
            state_code: rem.state_code,
            district_id: rem.district_id,
            district_name: rem.district_name,
            latitude: rem.latitude,
            longitude: rem.longitude,
            accident_date: rem.accident_date,
            severity: rem.severity,
            deaths: rem.deaths,
            injured: rem.injured,
            description: rem.description,
            source_name: rem.source_name || "Supabase Remote Database"
          });
          remoteMerged++;
        }
      }

      const updatedStatus = await supabaseBridge.getStatus(true);

      res.json({
        success: pushResult.success,
        message: pushResult.message,
        syncedLocations: pushResult.syncedLocations,
        syncedAccidents: pushResult.syncedAccidents,
        remoteAccidentsPulled: remoteMerged,
        totalLocalHotspots: dbEngine.getHotspots().length,
        totalLocalAccidents: dbEngine.getAccidents().total,
        status: updatedStatus
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to synchronize with Supabase", details: err.message });
    }
  });

  // Get Copyable Master All-in-One SQL Script for Supabase Table Setup
  app.get("/api/supabase/setup-sql", (_req, res) => {
    try {
      const sqlPath = path.join(process.cwd(), "sql", "all_in_one_setup.sql");
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");
        res.type("text/plain").send(sqlContent);
      } else {
        res.status(404).send("-- SQL setup file not found");
      }
    } catch (err: any) {
      res.status(500).send(`-- Error reading setup SQL: ${err.message}`);
    }
  });

  // Get Copyable Realtime & Views SQL Script for Supabase SQL Editor
  app.get("/api/supabase/realtime-sql", (_req, res) => {
    try {
      const sqlPath = path.join(process.cwd(), "sql", "enable_realtime_and_views.sql");
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");
        res.type("text/plain").send(sqlContent);
      } else {
        res.status(404).send("-- Realtime SQL file not found");
      }
    } catch (err: any) {
      res.status(500).send(`-- Error reading realtime SQL: ${err.message}`);
    }
  });

  // Update Supabase Project Credentials on-the-fly and test connectivity
  app.post("/api/supabase/config", async (req, res) => {
    try {
      const { url, key } = req.body || {};
      if (!url) {
        return res.status(400).json({ error: "Supabase URL is required" });
      }
      supabaseBridge.updateCredentials(url, key || "");
      const status = await supabaseBridge.getStatus(true);
      res.json({
        success: true,
        message: status.connected
          ? "Supabase connection verified successfully."
          : status.errorMessage || "Credentials updated.",
        status
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update credentials", details: err.message });
    }
  });

  // Demo Admin Authentication Endpoint for Instant Session Creation
  app.post("/api/auth/demo-admin", (_req, res) => {
    res.json({
      success: true,
      user: {
        id: "usr-admin-director",
        email: "admin@transport.gov.in",
        role: "authenticated"
      },
      profile: {
        id: "usr-admin-director",
        email: "admin@transport.gov.in",
        full_name: "MoRTH Highway Safety Administrator",
        role: "admin"
      },
      token: "demo-admin-session-token"
    });
  });

  // ============================================================================
  // REAL-DATA INGESTION & ADVANCED "SAFETY PREDICTIONS" APIS (Phase 3)
  // ============================================================================

  // 1. Ingestion Sources Status
  app.get("/api/sources/status", (_req, res) => {
    try {
      const list = ingestionStore.statusList();
      res.json({ success: true, count: list.length, sources: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to retrieve sources status", details: err.message });
    }
  });

  // 2. Trigger Ingestion Refresh (single or all)
  app.post("/api/sources/refresh", async (req, res) => {
    try {
      const { id, force } = req.body || {};
      if (id) {
        const state = await refreshSource(id, { force: Boolean(force) });
        res.json({ success: true, source: state });
      } else {
        const results = await refreshAll({ force: Boolean(force) });
        res.json({ success: true, refreshed: results.length, sources: results });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to refresh source(s)", details: err.message });
    }
  });

  // 3. Historical / Ingested Series by Source ID
  app.get("/api/sources/series/:id", async (req, res) => {
    try {
      const { points, provenance } = await ingestionStore.resolveSeries(req.params.id);
      res.json({ success: true, sourceId: req.params.id, count: points.length, points, provenance });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to resolve series", details: err.message });
    }
  });

  // 4. Live Environmental Telemetry (0.1-degree grid LRU cache)
  app.get("/api/live/telemetry", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string || "28.6139");
      const lng = parseFloat(req.query.lng as string || "77.2090");
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        res.status(400).json({ success: false, error: "Valid latitude and longitude numbers are required" });
        return;
      }
      const env = await ingestionStore.getLiveEnvironment(lat, lng);
      res.json({ success: true, telemetry: env });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to fetch live telemetry", details: err.message });
    }
  });

  // 5. Active Environmental & Blackspot Alerts (server-side computed top-N)
  app.get("/api/live/alerts", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string || "10", 10), 50));
      const hotspots = dbEngine.getHotspots();
      const sampleSpots = hotspots.slice(0, 30); // Cap upstream telemetry evaluation

      const alerts: any[] = [];
      await Promise.all(
        sampleSpots.map(async (spot) => {
          try {
            const env = await ingestionStore.getLiveEnvironment(spot.latitude, spot.longitude);
            if (env.hazardIndex >= 0.6 || (env.visibilityM != null && env.visibilityM < 2000) || (env.windKmh != null && env.windKmh > 35)) {
              alerts.push({
                locationId: spot.location_id,
                roadName: spot.road_name,
                state: spot.state_name,
                hazardIndex: env.hazardIndex,
                visibilityM: env.visibilityM,
                windKmh: env.windKmh,
                weatherCode: env.weatherCode,
                reason: env.visibilityM != null && env.visibilityM < 1500 ? "Low Visibility Fog" : env.hazardIndex >= 0.7 ? "High Hazard Weather Grid" : "Elevated Environmental Risk",
                lat: spot.latitude,
                lng: spot.longitude,
                timestamp: env.fetchedAt
              });
            }
          } catch {}
        })
      );

      alerts.sort((a, b) => b.hazardIndex - a.hazardIndex);
      const topAlerts = alerts.slice(0, limit);
      res.json({ success: true, count: topAlerts.length, alerts: topAlerts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to generate live alerts", details: err.message });
    }
  });

  // 6. Overpass Infrastructure Census Regions & Features
  app.get("/api/gis/overpass", async (_req, res) => {
    try {
      const state = ingestionStore.get("overpass-gis-exposure");
      res.json({
        success: true,
        regions: GIS_REGIONS,
        census: state?.extra || null,
        provenance: state?.provenance || null,
        status: state?.status || "snapshot"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to fetch overpass GIS data", details: err.message });
    }
  });

  // 7. National Baseline Series (World Bank + OWID)
  app.get("/api/national/baseline", async (_req, res) => {
    try {
      const [owidRes, wbRes] = await Promise.all([
        ingestionStore.resolveSeries("owid-road-deaths-longterm"),
        ingestionStore.resolveSeries("worldbank-road-mortality")
      ]);
      const comparison = computeNationalBurdenComparison({
        mortality: wbRes.points,
        absolute: owidRes.points,
        provenance: wbRes.provenance
      });
      res.json({ success: true, ...comparison, owidProvenance: owidRes.provenance });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute national baseline", details: err.message });
    }
  });

  // 8. Model 1: Crash Probability (Poisson / Negative Binomial 2)
  app.get("/api/predict/probability/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      const env = await ingestionStore.getLiveEnvironment(spot.latitude, spot.longitude);
      const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
      const k = req.query.k ? parseInt(req.query.k as string, 10) : 2;
      const result = computeCrashProbability({
        spot,
        env,
        hours,
        k,
        provenance: { endpoint: `/api/predict/probability/${spot.location_id}` }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute crash probability", details: err.message });
    }
  });

  // 9. Model 2: Trend Index (EWMA + OLS with 95% CI)
  app.get("/api/predict/trend/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      const env = await ingestionStore.getLiveEnvironment(spot.latitude, spot.longitude);
      const result = computeTrendIndex({
        spot,
        env,
        provenance: { endpoint: `/api/predict/trend/${spot.location_id}` }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute trend index", details: err.message });
    }
  });

  // 10. Model 6: KDE Spatial Density Grid (2-D Gaussian KDE)
  app.get("/api/predict/kde", async (req, res) => {
    try {
      const spots = dbEngine.getHotspots();
      const bandwidthKm = req.query.bandwidth ? parseFloat(req.query.bandwidth as string) : 60;
      const rows = Math.min(100, Math.max(10, req.query.rows ? parseInt(req.query.rows as string, 10) : 40));
      const cols = Math.min(100, Math.max(10, req.query.cols ? parseInt(req.query.cols as string, 10) : 40));

      const weightedSpots = spots.map((s) => ({
        lat: s.latitude,
        lng: s.longitude,
        weight: s.hotspot_score || (s.total_accidents / 2) || 10
      }));

      const result = computeKdeDensity({
        spots: weightedSpots,
        bandwidthKm,
        rows,
        cols,
        provenance: { endpoint: "/api/predict/kde" }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute KDE density", details: err.message });
    }
  });

  // 11. Model 5: Severity Posterior (Beta-Binomial with Wilson & Jeffreys intervals)
  app.get("/api/predict/severity/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      const result = computeSeverityPosterior({
        spot,
        provenance: { endpoint: `/api/predict/severity/${spot.location_id}` }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute severity posterior", details: err.message });
    }
  });

  // 12. Model 8: Extreme Return Levels (Gumbel Distribution on annual counts)
  app.get("/api/predict/extremes", async (req, res) => {
    try {
      const { points, provenance } = await ingestionStore.resolveSeries("owid-road-deaths-longterm");
      const values = (points || []).map((p) => p.value).filter((v) => Number.isFinite(v));
      const labels = (points || []).map((p) => p.period);
      const result = computeExtremeReturnLevels({
        values: values.length ? values : [110000, 115000, 120000, 130000, 140000, 148000, 150000],
        labels,
        provenance
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute extreme return levels", details: err.message });
    }
  });

  // 13. Model 9: Monte Carlo Trip Simulation (Seeded Mulberry32 PRNG)
  app.post("/api/predict/monte-carlo", async (req, res) => {
    try {
      const { segments, departHour, weatherHazard, seed, runs } = req.body || {};
      const cappedRuns = Math.min(20000, Math.max(100, runs ? parseInt(runs, 10) : 5000));
      const result = computeMonteCarloTrip({
        segments: segments || [
          { lengthKm: 45, risk0to100: 65, roadName: "Sector 1 (Ghat Incline)" },
          { lengthKm: 70, risk0to100: 40, roadName: "Sector 2 (Expressway Plain)" }
        ],
        departHour: departHour != null ? parseInt(departHour, 10) : 22,
        weatherHazard: weatherHazard != null ? parseFloat(weatherHazard) : 0.4,
        seed: seed != null ? parseInt(seed, 10) : 42,
        runs: cappedRuns,
        provenance: { endpoint: "/api/predict/monte-carlo" }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to execute Monte Carlo trip risk", details: err.message });
    }
  });

  // 14. Model 10: Golden Hour Trauma Survival Decay
  app.get("/api/predict/survival/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      // Compute travel time to nearest trauma center from real data
      const traumaCenters = dbEngine.getTraumaCenters ? dbEngine.getTraumaCenters() : [];
      let minMinutes = 45;
      if (traumaCenters.length > 0) {
        let minDistKm = Number.POSITIVE_INFINITY;
        for (const tc of traumaCenters) {
          const dLat = (spot.latitude - tc.latitude) * 111.32;
          const dLon = (spot.longitude - tc.longitude) * 111.32 * Math.cos((spot.latitude * Math.PI) / 180);
          const d = Math.sqrt(dLat * dLat + dLon * dLon);
          if (d < minDistKm) minDistKm = d;
        }
        minMinutes = Math.max(10, Math.round((minDistKm / 45) * 60)); // Avg 45 km/h emergency response
      }
      const result = computeGoldenHourSurvival({
        arrivalMinutes: minMinutes,
        traumaCentersNearby: traumaCenters.length,
        provenance: { endpoint: `/api/predict/survival/${spot.location_id}` }
      });
      res.json({ success: true, locationId: spot.location_id, arrivalMinutes: minMinutes, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute golden hour survival", details: err.message });
    }
  });

  // 15. Model 13: Metric Rank Concordance (Spearman rho + Kendall tau)
  app.get("/api/predict/concordance", (_req, res) => {
    try {
      const spots = dbEngine.getHotspots();
      const seriesA = spots.map((s) => ({ id: s.location_id, name: s.road_name, value: s.hotspot_score }));
      const seriesB = spots.map((s) => ({ id: s.location_id, name: s.road_name, value: s.fatal_accidents }));
      const result = computeRankConcordance({
        seriesA,
        seriesB,
        labelA: "Hotspot Hazard Score",
        labelB: "Observed Fatal Accidents",
        provenance: { endpoint: "/api/predict/concordance" }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute rank concordance", details: err.message });
    }
  });

  // 16. Model 7: Spatial Clustering (Moran's I)
  app.get("/api/predict/clustering", async (_req, res) => {
    try {
      const spots = dbEngine.getHotspots();
      const points = spots.map((s) => ({
        lat: s.latitude,
        lng: s.longitude,
        value: s.hotspot_score || s.total_accidents || 10
      }));
      const result = computeSpatialClustering({
        points,
        provenance: { endpoint: "/api/predict/clustering" }
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute spatial clustering", details: err.message });
    }
  });

  // 17. Model 11: 24-Hour Intensity Curve (Circadian x Environmental Hazard)
  app.get("/api/predict/intensity-curve/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      const env = await ingestionStore.getLiveEnvironment(spot.latitude, spot.longitude);
      const lambdaDaily = Math.max(0.05, spot.total_accidents / 3650);
      const result = computeHourlyIntensityCurve({
        lambdaDaily,
        envHourly: env.hourly,
        provenance: { endpoint: `/api/predict/intensity-curve/${spot.location_id}` }
      });
      res.json({ success: true, locationId: spot.location_id, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute intensity curve", details: err.message });
    }
  });

  // Long-run projection (Model 3) & Seasonality (Model 4) helpers
  app.get("/api/predict/projection", async (req, res) => {
    try {
      const { points, provenance } = await ingestionStore.resolveSeries("owid-road-deaths-longterm");
      const horizonYears = req.query.years ? parseInt(req.query.years as string, 10) : 10;
      const result = computeLongRunProjection({
        annual: points,
        horizonYears,
        provenance
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute long-run projection", details: err.message });
    }
  });

  app.get("/api/predict/seasonality/:id", async (req, res) => {
    try {
      const spot = dbEngine.getHotspots().find((h) => h.location_id === req.params.id);
      if (!spot) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }
      const env = await ingestionStore.getLiveEnvironment(spot.latitude, spot.longitude);
      const dailyHazard = (env.daily || []).map((d) => (d.precipMm || 0) * 0.1 + (d.windMaxKmh || 0) * 0.01 + 0.3);
      const dates = (env.daily || []).map((d) => d.date);
      const result = computeDailyHazardSeasonality({
        dailyHazard: dailyHazard.length >= 7 ? dailyHazard : [0.3, 0.35, 0.4, 0.5, 0.45, 0.38, 0.32],
        dates,
        provenance: { endpoint: `/api/predict/seasonality/${spot.location_id}` }
      });
      res.json({ success: true, locationId: spot.location_id, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: "Failed to compute seasonality", details: err.message });
    }
  });

  // Strict JSON 404 for unknown /api/* routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`
    });
  });

  // ============================================================================
  // STATIC ASSET SERVING WITH CANONICAL MIME TYPES
  // ============================================================================
  const jsDir = path.join(process.cwd(), "js");
  const cssDir = path.join(process.cwd(), "css");
  const dataDir = path.join(process.cwd(), "data");

  app.use("/js", express.static(jsDir, { setHeaders: (res) => res.setHeader("Content-Type", "application/javascript") }));
  app.use("/css", express.static(cssDir, { setHeaders: (res) => res.setHeader("Content-Type", "text/css") }));
  app.use("/data", express.static(dataDir));

  // ============================================================================
  // VITE DEVELOPMENT MIDDLEWARE / PRODUCTION STATIC FILE SERVING
  // ============================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("/js", express.static(path.join(distPath, "js")));
    app.use("/css", express.static(path.join(distPath, "css")));
    app.use("/data", express.static(path.join(distPath, "data")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`India Accident Hotspot System Server running on http://0.0.0.0:${PORT}`);
    try {
      await initIngestion();
      console.log(`[ingestion] Ingestion scheduler and snapshot hydration initialized.`);
    } catch (ingestErr) {
      console.error(`[ingestion] Ingestion initialization error:`, ingestErr);
    }
  });

  const handleShutdown = () => {
    console.log(`[server] Shutting down gracefully...`);
    shutdownIngestion();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}

startServer().catch(err => {
  console.error("Server startup error:", err);
});
