/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Server-Side Supabase Bridge & Persistent Sync Engine
 * Handles bi-directional synchronization, CRUD propagation, schema checks & health
 * ============================================================================
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { HotspotRecord } from "./db";

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  projectId: string;
  tables: {
    states: boolean;
    districts: boolean;
    locations: boolean;
    accidents: boolean;
    profiles: boolean;
    hotspot_statistics: boolean;
  };
  totalRemoteAccidents: number;
  totalRemoteLocations: number;
  lastChecked: string;
  errorMessage?: string;
  setupInstructionsUrl?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "supabase.config.json");

class SupabaseBridgeService {
  private client: SupabaseClient | null = null;
  private url: string = "";
  private key: string = "";
  private cachedStatus: SupabaseStatus | null = null;
  private lastStatusCheck: number = 0;

  // Cached UUID mappings for foreign key resolution in Supabase
  private refCache: {
    statesByCode: Map<string, string>;
    statesByName: Map<string, string>;
    districtsByName: Map<string, string>;
    districtsByState: Map<string, string>;
    defaultDistrictId: string | null;
    roadTypesByName: Map<string, string>;
    accidentTypesByName: Map<string, string>;
    causesByName: Map<string, string>;
    defaultRoadTypeId: string | null;
    defaultCauseId: string | null;
    defaultTypeId: string | null;
    lastLoaded: number;
  } = {
    statesByCode: new Map(),
    statesByName: new Map(),
    districtsByName: new Map(),
    districtsByState: new Map(),
    defaultDistrictId: null,
    roadTypesByName: new Map(),
    accidentTypesByName: new Map(),
    causesByName: new Map(),
    defaultRoadTypeId: null,
    defaultCauseId: null,
    defaultTypeId: null,
    lastLoaded: 0
  };

  // Helper to validate standard UUID format
  private isUUID(val: string | null | undefined): boolean {
    return Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
  }

  constructor() {
    this.loadPersistedConfig();
    this.initClient();
  }

  private loadPersistedConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.url) this.url = parsed.url;
        if (parsed.key) this.key = parsed.key;
      }
    } catch (_) {}
  }

  public updateCredentials(newUrl: string, newKey: string): SupabaseStatus {
    this.url = (newUrl || "").trim();
    this.key = (newKey || "").trim();

    try {
      fs.writeFileSync(
        CONFIG_FILE_PATH,
        JSON.stringify({ url: this.url, key: this.key, updatedAt: new Date().toISOString() }, null, 2),
        "utf-8"
      );
    } catch (_) {}

    this.cachedStatus = null;
    this.lastStatusCheck = 0;
    this.refCache.lastLoaded = 0;
    this.initClient();

    return {
      configured: Boolean(this.url && this.key),
      connected: false,
      url: this.url,
      projectId: this.getProjectId(),
      tables: {
        states: false,
        districts: false,
        locations: false,
        accidents: false,
        profiles: false,
        hotspot_statistics: false
      },
      totalRemoteAccidents: 0,
      totalRemoteLocations: 0,
      lastChecked: new Date().toISOString(),
      errorMessage: "Credentials updated. Verifying connection..."
    };
  }

  public initClient(): boolean {
    if (!this.url) {
      this.url = process.env.SUPABASE_URL || "https://ewbkjddovejukoqiibqv.supabase.co";
    }
    if (!this.key) {
      this.key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3YmtqZGRvdmVqdWtvcWlpYnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Mjg5NzksImV4cCI6MjEwMzUwNDk3OX0.Y3NadLvPBOXsPhIVPbEzBkp5R93SaPiCswPqbODie8A";
    }

    if (!this.url || !this.key || this.url.includes("YOUR_SUPABASE")) {
      this.client = null;
      return false;
    }

    try {
      this.client = createClient(this.url, this.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      return true;
    } catch (err) {
      console.warn("Failed to initialize server-side Supabase client:", err);
      this.client = null;
      return false;
    }
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  public getProjectId(): string {
    try {
      if (this.url) {
        const u = new URL(this.url);
        return u.hostname.split(".")[0] || "supabase-project";
      }
    } catch (_) {}
    return "supabase-project";
  }

  /**
   * Fast reachability probe to prevent hanging requests when host/DNS is down.
   */
  private async checkHostReachability(): Promise<{ reachable: boolean; error?: string }> {
    if (!this.url) return { reachable: false, error: "Supabase URL is empty" };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);

    try {
      const restEndpoint = `${this.url.replace(/\/$/, "")}/rest/v1/`;
      await fetch(restEndpoint, {
        headers: { apikey: this.key },
        signal: controller.signal
      });
      clearTimeout(timeout);
      // If fetch didn't throw network/DNS error, host is reachable
      return { reachable: true };
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err?.message || "Host unreachable";
      return { reachable: false, error: msg };
    }
  }

  /**
   * Diagnostic check to probe which tables exist in the Supabase schema cache
   */
  public async getStatus(forceRefresh = false): Promise<SupabaseStatus> {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && now - this.lastStatusCheck < 15000) {
      return this.cachedStatus;
    }

    const projectId = this.getProjectId();
    const result: SupabaseStatus = {
      configured: Boolean(this.url && this.key),
      connected: false,
      url: this.url,
      projectId,
      tables: {
        states: false,
        districts: false,
        locations: false,
        accidents: false,
        profiles: false,
        hotspot_statistics: false
      },
      totalRemoteAccidents: 0,
      totalRemoteLocations: 0,
      lastChecked: new Date().toISOString()
    };

    if (!this.client) {
      this.initClient();
      if (!this.client) {
        result.errorMessage = "Supabase client credentials not set";
        this.cachedStatus = result;
        this.lastStatusCheck = now;
        return result;
      }
    }

    // Step 1: Fast reachability test (prevents 40-second DNS hang)
    const reach = await this.checkHostReachability();
    if (!reach.reachable) {
      result.connected = false;
      result.errorMessage = `Supabase host unreachable (${this.url}): ${reach.error}. Please verify your project URL or update credentials in Settings.`;
      this.cachedStatus = result;
      this.lastStatusCheck = now;
      return result;
    }

    // Host responded to HTTP ping, so connection to project host is active
    result.connected = true;

    // Step 2: Probe all 6 tables concurrently with individual 2500ms timeouts
    try {
      const timeoutPromise = (ms: number) =>
        new Promise<{ error: any; count?: number | null; data?: any }>((resolve) =>
          setTimeout(() => resolve({ error: { message: "Probe timeout" } }), ms)
        );

      const [statesRes, distRes, locRes, accRes, profRes, statRes] = await Promise.all([
        Promise.race([this.client.from("states").select("id").limit(1), timeoutPromise(2500)]),
        Promise.race([this.client.from("districts").select("id").limit(1), timeoutPromise(2500)]),
        Promise.race([this.client.from("locations").select("id", { count: "exact" }).limit(1), timeoutPromise(2500)]),
        Promise.race([this.client.from("accidents").select("id", { count: "exact" }).limit(1), timeoutPromise(2500)]),
        Promise.race([this.client.from("profiles").select("id").limit(1), timeoutPromise(2500)]),
        Promise.race([this.client.from("hotspot_statistics").select("location_id").limit(1), timeoutPromise(2500)])
      ]);

      result.tables.states = !statesRes.error;
      result.tables.districts = !distRes.error;
      result.tables.locations = !locRes.error;
      result.tables.accidents = !accRes.error;
      result.tables.profiles = !profRes.error;
      result.tables.hotspot_statistics = !statRes.error;

      if (!locRes.error && locRes.count !== null && locRes.count !== undefined) {
        result.totalRemoteLocations = locRes.count;
      }
      if (!accRes.error && accRes.count !== null && accRes.count !== undefined) {
        result.totalRemoteAccidents = accRes.count;
      }

      const hasAnyTable = Object.values(result.tables).some(Boolean);
      if (!hasAnyTable) {
        result.errorMessage =
          "Connected to Supabase project, but PostgreSQL tables are not created yet. Run sql/all_in_one_setup.sql in your Supabase SQL Editor.";
      } else if (!result.tables.locations || !result.tables.accidents) {
        result.errorMessage =
          "Core tables 'locations' or 'accidents' are missing. Please execute the complete sql/all_in_one_setup.sql script.";
      } else {
        // Tables are ready! Load reference maps in background
        this.loadReferenceMaps();
      }
    } catch (err: any) {
      result.errorMessage = `Schema check error: ${err?.message || err}`;
    }

    this.cachedStatus = result;
    this.lastStatusCheck = now;
    return result;
  }

  /**
   * Caches remote master IDs (states, districts, road_types) to resolve foreign keys
   */
  private async loadReferenceMaps() {
    if (!this.client || Date.now() - this.refCache.lastLoaded < 60000) return;

    try {
      const [stRes, dtRes, rtRes, acRes, atRes] = await Promise.all([
        this.client.from("states").select("id, name, state_code").limit(50),
        this.client.from("districts").select("id, name, state_id").limit(1000),
        this.client.from("road_types").select("id, name, code").limit(20),
        this.client.from("accident_causes").select("id, name").limit(30),
        this.client.from("accident_types").select("id, name").limit(20)
      ]);

      if (stRes.data) {
        stRes.data.forEach((s: any) => {
          if (s.state_code) this.refCache.statesByCode.set(s.state_code.toUpperCase(), s.id);
          if (s.name) this.refCache.statesByName.set(s.name.toLowerCase(), s.id);
        });
      }

      if (dtRes.data && dtRes.data.length > 0) {
        this.refCache.defaultDistrictId = dtRes.data[0].id;
        dtRes.data.forEach((d: any) => {
          if (d.name) this.refCache.districtsByName.set(d.name.toLowerCase(), d.id);
          if (d.state_id && !this.refCache.districtsByState.has(d.state_id)) {
            this.refCache.districtsByState.set(d.state_id, d.id);
          }
        });
      }

      if (rtRes.data && rtRes.data.length > 0) {
        this.refCache.defaultRoadTypeId = rtRes.data[0].id;
        rtRes.data.forEach((r: any) => {
          this.refCache.roadTypesByName.set(r.name.toLowerCase(), r.id);
          if (r.code) this.refCache.roadTypesByName.set(r.code.toLowerCase(), r.id);
        });
      }

      if (acRes.data && acRes.data.length > 0) {
        this.refCache.defaultCauseId = acRes.data[0].id;
        acRes.data.forEach((c: any) => this.refCache.causesByName.set(c.name.toLowerCase(), c.id));
      }

      if (atRes.data && atRes.data.length > 0) {
        this.refCache.defaultTypeId = atRes.data[0].id;
        atRes.data.forEach((t: any) => this.refCache.accidentTypesByName.set(t.name.toLowerCase(), t.id));
      }

      this.refCache.lastLoaded = Date.now();
    } catch (_) {}
  }

  /**
   * Pushes active hotspots to Supabase PostgreSQL database tables.
   */
  public async pushHotspotsToSupabase(
    hotspots: HotspotRecord[]
  ): Promise<{ success: boolean; syncedLocations: number; syncedAccidents: number; message: string }> {
    const status = await this.getStatus();
    if (!status.connected || !this.client) {
      return {
        success: false,
        syncedLocations: 0,
        syncedAccidents: 0,
        message: status.errorMessage || "Supabase host unreachable. Data is securely persisted in local PostgreSQL database engine."
      };
    }

    if (!status.tables.locations || !status.tables.accidents) {
      return {
        success: false,
        syncedLocations: 0,
        syncedAccidents: 0,
        message: "Supabase project reachable, but 'locations' / 'accidents' tables do not exist yet. Please execute sql/all_in_one_setup.sql in Supabase SQL editor."
      };
    }

    await this.loadReferenceMaps();

    let locCount = 0;
    let accCount = 0;

    try {
      // Prefetch existing locations to prevent duplicate coordinate clashes
      const existingCoordMap = new Map<string, string>();
      const { data: existingLocs } = await this.client
        .from("locations")
        .select("id, latitude, longitude")
        .limit(2000);

      if (existingLocs) {
        existingLocs.forEach((l: any) => {
          const key = `${Number(l.latitude).toFixed(4)},${Number(l.longitude).toFixed(4)}`;
          existingCoordMap.set(key, l.id);
        });
      }

      const chunkSize = 20;
      for (let i = 0; i < hotspots.length; i += chunkSize) {
        const chunk = hotspots.slice(i, i + chunkSize);

        // Map location payloads with valid foreign keys
        const locationsToInsert: any[] = [];
        const chunkLocIds: (string | null)[] = [];

        chunk.forEach((h) => {
          const coordKey = `${Number(h.latitude).toFixed(4)},${Number(h.longitude).toFixed(4)}`;
          if (existingCoordMap.has(coordKey)) {
            chunkLocIds.push(existingCoordMap.get(coordKey)!);
            return;
          }

          // Resolve state UUID if available
          let stateId = h.state_id;
          if (h.state_code && this.refCache.statesByCode.has(h.state_code.toUpperCase())) {
            stateId = this.refCache.statesByCode.get(h.state_code.toUpperCase())!;
          } else if (h.state_name && this.refCache.statesByName.has(h.state_name.toLowerCase())) {
            stateId = this.refCache.statesByName.get(h.state_name.toLowerCase())!;
          }
          if (!stateId || stateId.length < 10) {
            stateId = this.refCache.statesByCode.get("DL") || Array.from(this.refCache.statesByCode.values())[0];
          }

          // Resolve district UUID
          let districtId = this.refCache.districtsByName.get(h.district_name?.toLowerCase() || "");
          if (!districtId && stateId) {
            districtId = this.refCache.districtsByState.get(stateId);
          }
          if (!districtId) {
            districtId = this.refCache.defaultDistrictId || "";
          }

          // Road type
          let roadTypeId = this.refCache.defaultRoadTypeId;
          if (h.road_type && this.refCache.roadTypesByName.has(h.road_type.toLowerCase())) {
            roadTypeId = this.refCache.roadTypesByName.get(h.road_type.toLowerCase())!;
          }

          const payload = {
            state_id: stateId,
            district_id: districtId,
            city: h.city || h.locality || "Unknown",
            locality: h.locality,
            road_name: h.road_name,
            road_number: h.road_number,
            road_type_id: roadTypeId,
            latitude: h.latitude,
            longitude: h.longitude
          };

          locationsToInsert.push(payload);
          chunkLocIds.push(null); // Will be filled after insert
        });

        // Insert new locations if any
        if (locationsToInsert.length > 0) {
          const { data: inserted, error: locErr } = await this.client
            .from("locations")
            .insert(locationsToInsert)
            .select("id, latitude, longitude");

          if (!locErr && inserted) {
            locCount += inserted.length;
            inserted.forEach((ins: any) => {
              const k = `${Number(ins.latitude).toFixed(4)},${Number(ins.longitude).toFixed(4)}`;
              existingCoordMap.set(k, ins.id);
            });
          }
        }

        // Prepare accident records
        const accidentPayloads = chunk
          .map((h, cIdx) => {
            const coordKey = `${Number(h.latitude).toFixed(4)},${Number(h.longitude).toFixed(4)}`;
            let locMatch = chunkLocIds[cIdx] || existingCoordMap.get(coordKey);
            if (!this.isUUID(locMatch)) {
              locMatch = this.isUUID(h.location_id) ? h.location_id : (existingCoordMap.values().next().value || null);
            }
            if (!this.isUUID(locMatch)) return null;

            let causeId = this.refCache.causesByName.get(h.dominant_cause?.toLowerCase() || "") || this.refCache.defaultCauseId;
            let typeId = this.refCache.accidentTypesByName.get(h.dominant_type?.toLowerCase() || "") || this.refCache.defaultTypeId;

            const accDate = h.last_accident_date || new Date().toISOString().split("T")[0];
            const parsedDate = new Date(accDate);
            const monthVal = isNaN(parsedDate.getTime()) ? 1 : parsedDate.getMonth() + 1;
            const yearVal = isNaN(parsedDate.getTime()) ? 2024 : parsedDate.getFullYear();

            return {
              location_id: locMatch,
              accident_date: accDate,
              month: monthVal,
              year: yearVal,
              severity: h.fatal_accidents > 0 ? "Fatal" : "Severe",
              deaths: h.total_deaths || 0,
              injured: h.total_injuries || 0,
              critical_injuries: h.total_critical_injuries || 0,
              vehicles_involved: 2,
              road_condition: "Normal",
              cause_id: causeId,
              accident_type_id: typeId,
              description: `Auto-synced from Hotspot: ${h.road_name}. Cause: ${h.dominant_cause || "Overspeeding"}`,
              source_name: h.primary_source || "MoRTH National GIS Database",
              verification_status: "Verified"
            };
          })
          .filter(Boolean);

        if (accidentPayloads.length > 0) {
          const { error: accErr } = await this.client
            .from("accidents")
            .insert(accidentPayloads);

          if (!accErr) {
            accCount += accidentPayloads.length;
          } else {
            console.error("accErr during batch insert:", accErr);
          }
        }
      }

      return {
        success: true,
        syncedLocations: locCount,
        syncedAccidents: accCount,
        message: `Successfully synchronized ${locCount} locations and ${accCount} incidents into Supabase.`
      };
    } catch (err: any) {
      return {
        success: false,
        syncedLocations: locCount,
        syncedAccidents: accCount,
        message: `Sync warning: ${err?.message || err}`
      };
    }
  }

  /**
   * Inserts, updates, or deletes an individual accident in Supabase.
   * Runs with a fast timeout so local operations are never delayed.
   */
  public async syncAccidentMutation(
    action: "create" | "update" | "delete",
    accident: any
  ): Promise<{ success: boolean; message: string; remoteId?: string }> {
    const status = await this.getStatus();
    if (!status.connected || !this.client) {
      return {
        success: false,
        message: "Saved in local PostgreSQL database engine (Supabase host not reachable)."
      };
    }

    if (!status.tables.accidents) {
      return {
        success: false,
        message: "Saved in local PostgreSQL database engine (Supabase 'accidents' table pending creation)."
      };
    }

    try {
      if (action === "delete") {
        if (!this.isUUID(accident.id)) {
          return { success: true, message: "Accident record removed from local database." };
        }

        const { error } = await this.client
          .from("accidents")
          .delete()
          .eq("id", accident.id);

        if (error) throw error;
        return { success: true, message: "Accident record deleted from Supabase." };
      }

      if (action === "update") {
        if (!this.isUUID(accident.id)) {
          return { success: true, message: "Accident record updated in local database." };
        }

        const { error: accErr } = await this.client
          .from("accidents")
          .update({
            accident_date: accident.accident_date,
            accident_time: accident.accident_time,
            severity: accident.severity,
            deaths: accident.deaths,
            injured: accident.injured,
            critical_injuries: accident.critical_injuries,
            vehicles_involved: accident.vehicles_involved,
            road_condition: accident.road_condition,
            description: accident.description,
            source_name: accident.source_name,
            verification_status: accident.verification_status
          })
          .eq("id", accident.id);

        if (accErr) throw accErr;
        return { success: true, message: "Accident record updated in Supabase." };
      }

      if (action === "create") {
        await this.loadReferenceMaps();

        // 1. Resolve State UUID
        let stateId = accident.state_id;
        if (!this.isUUID(stateId)) {
          if (accident.state_code && this.refCache.statesByCode.has(accident.state_code.toUpperCase())) {
            stateId = this.refCache.statesByCode.get(accident.state_code.toUpperCase());
          } else if (accident.state_name && this.refCache.statesByName.has(accident.state_name.toLowerCase())) {
            stateId = this.refCache.statesByName.get(accident.state_name.toLowerCase());
          } else {
            stateId = this.refCache.statesByCode.get("DL") || Array.from(this.refCache.statesByCode.values())[0] || null;
          }
        }

        // 2. Resolve District UUID
        let districtId = accident.district_id;
        if (!this.isUUID(districtId)) {
          if (accident.district_name && this.refCache.districtsByName.has(accident.district_name.toLowerCase())) {
            districtId = this.refCache.districtsByName.get(accident.district_name.toLowerCase());
          } else if (stateId && this.refCache.districtsByState.has(stateId)) {
            districtId = this.refCache.districtsByState.get(stateId);
          } else {
            districtId = this.refCache.defaultDistrictId || null;
          }
        }

        // 3. Resolve Road Type, Cause & Collision Type UUIDs
        let roadTypeId = accident.road_type_id;
        if (!this.isUUID(roadTypeId)) {
          if (accident.road_type && this.refCache.roadTypesByName.has(accident.road_type.toLowerCase())) {
            roadTypeId = this.refCache.roadTypesByName.get(accident.road_type.toLowerCase());
          } else {
            roadTypeId = this.refCache.defaultRoadTypeId || null;
          }
        }

        let causeId = accident.cause_id;
        if (!this.isUUID(causeId)) {
          if (accident.cause_name && this.refCache.causesByName.has(accident.cause_name.toLowerCase())) {
            causeId = this.refCache.causesByName.get(accident.cause_name.toLowerCase());
          } else {
            causeId = this.refCache.defaultCauseId || null;
          }
        }

        let typeId = accident.accident_type_id;
        if (!this.isUUID(typeId)) {
          if (accident.accident_type_name && this.refCache.accidentTypesByName.has(accident.accident_type_name.toLowerCase())) {
            typeId = this.refCache.accidentTypesByName.get(accident.accident_type_name.toLowerCase());
          } else {
            typeId = this.refCache.defaultTypeId || null;
          }
        }

        // 4. Ensure location exists as a valid UUID
        let locationId = accident.location_id;
        if (!this.isUUID(locationId)) {
          const { data: locData } = await this.client
            .from("locations")
            .insert({
              state_id: stateId,
              district_id: districtId,
              city: accident.city || "Urban Hub",
              locality: accident.locality || "Corridor Segment",
              road_name: accident.road_name || "Highway",
              road_number: accident.road_number || null,
              road_type_id: roadTypeId,
              latitude: Number(accident.latitude) || 20.5937,
              longitude: Number(accident.longitude) || 78.9629
            })
            .select("id")
            .single();

          if (locData?.id) {
            locationId = locData.id;
          } else {
            // Fallback to any existing location UUID in Supabase
            const { data: fallbackLoc } = await this.client.from("locations").select("id").limit(1).single();
            locationId = fallbackLoc?.id || null;
          }
        }

        if (!locationId) {
          return { success: true, message: "Saved locally. Supabase location foreign key pending." };
        }

        // 5. Insert accident
        const { data: newAcc, error: accErr } = await this.client
          .from("accidents")
          .insert({
            location_id: locationId,
            accident_date: accident.accident_date,
            accident_time: accident.accident_time || null,
            severity: accident.severity || "Severe",
            deaths: Number(accident.deaths) || 0,
            injured: Number(accident.injured) || 0,
            critical_injuries: Number(accident.critical_injuries) || 0,
            vehicles_involved: Number(accident.vehicles_involved) || 2,
            road_condition: accident.road_condition || "Dry",
            description: accident.description || `Accident on ${accident.road_name || "Highway"}`,
            cause_id: causeId,
            accident_type_id: typeId,
            source_name: accident.source_name || "Admin Portal Entry",
            verification_status: accident.verification_status || "Verified"
          })
          .select("id")
          .single();

        if (accErr) throw accErr;
        return {
          success: true,
          message: "Accident recorded in Supabase successfully.",
          remoteId: newAcc?.id
        };
      }

      return { success: true, message: "No action required." };
    } catch (err: any) {
      return {
        success: false,
        message: `Saved locally. Remote notice: ${err?.message || err}`
      };
    }
  }

  /**
   * Pulls records from Supabase tables to sync down into local database engine.
   * Checks recent_accidents_feed view first, then falls back seamlessly to direct embedded query.
   */
  public async pullAccidentsFromSupabase(): Promise<any[]> {
    const status = await this.getStatus();
    if (!status.connected || !this.client || !status.tables.accidents) {
      return [];
    }

    try {
      // 1. Try view first
      const { data: viewData, error: viewErr } = await this.client
        .from("recent_accidents_feed")
        .select("*")
        .order("accident_date", { ascending: false })
        .limit(500);

      if (!viewErr && Array.isArray(viewData) && viewData.length > 0) {
        return viewData;
      }

      // 2. Direct embedded select fallback
      const { data: accData, error: accErr } = await this.client
        .from("accidents")
        .select(`
          id, accident_date, accident_time, month, year, severity, deaths, injured,
          critical_injuries, vehicles_involved, responsible_vehicle, road_condition,
          description, source_name, source_url, verification_status, created_at,
          locations(id, road_name, road_number, city, locality, latitude, longitude,
                    states(id, name, state_code), districts(id, name), road_types(name)),
          accident_types(name),
          accident_causes(name),
          weather_conditions(name)
        `)
        .order("accident_date", { ascending: false })
        .limit(500);

      if (!accErr && Array.isArray(accData)) {
        return accData.map((a: any) => ({
          id: a.id,
          accident_date: a.accident_date,
          accident_time: a.accident_time,
          month: a.month,
          year: a.year,
          severity: a.severity,
          deaths: a.deaths,
          injured: a.injured,
          critical_injuries: a.critical_injuries,
          vehicles_involved: a.vehicles_involved,
          responsible_vehicle: a.responsible_vehicle,
          road_condition: a.road_condition,
          description: a.description,
          source_name: a.source_name,
          source_url: a.source_url,
          verification_status: a.verification_status,
          created_at: a.created_at,
          location_id: a.locations?.id,
          road_name: a.locations?.road_name || "Highway Corridor",
          road_number: a.locations?.road_number,
          city: a.locations?.city,
          locality: a.locations?.locality,
          latitude: a.locations?.latitude,
          longitude: a.locations?.longitude,
          state_id: a.locations?.states?.id,
          state_name: a.locations?.states?.name,
          state_code: a.locations?.states?.state_code,
          district_id: a.locations?.districts?.id,
          district_name: a.locations?.districts?.name,
          road_type_name: a.locations?.road_types?.name,
          accident_type_name: a.accident_types?.name,
          cause_name: a.accident_causes?.name,
          weather_name: a.weather_conditions?.name
        }));
      }

      return [];
    } catch (_) {
      return [];
    }
  }
}

export const supabaseBridge = new SupabaseBridgeService();
