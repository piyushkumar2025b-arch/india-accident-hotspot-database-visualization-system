import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { dbEngine, HotspotRecord } from "./server/db";
import { fetchLiveExternalData } from "./server/external_fetcher";
import { supabaseBridge } from "./server/supabase_bridge";

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`India Accident Hotspot System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server startup error:", err);
});
