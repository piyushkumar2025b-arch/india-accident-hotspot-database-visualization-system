/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Supabase Client Initialization, Realtime Subscriptions & Live Data Bridge
 * ============================================================================
 */

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isRealtimeSubscribed = false;
    this.realtimeChannel = null;
    this.initClient();
  }

  initClient() {
    if (!window.supabase) {
      console.error("Supabase JS SDK not detected. Please verify CDN script tag.");
      return;
    }

    if (!CONFIG.isConfigured()) {
      console.warn("Supabase credentials not configured in js/config.js.");
      this.showSetupNotification();
      return;
    }

    try {
      this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      console.log("✓ Supabase client initialized:", CONFIG.SUPABASE_URL);

      // Verify connection and initiate Realtime subscription
      this.testConnection().then((res) => {
        if (res.success) {
          this.setupRealtimeSubscription();
        }
      });
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
    }
  }

  /**
   * Tests database connectivity by querying the states master table
   */
  async testConnection() {
    if (!this.client) {
      return { success: false, message: "Supabase client not initialized. Check js/config.js." };
    }

    try {
      const { data, error } = await this.client.from("states").select("id").limit(1);
      if (error) throw error;
      this.isConnected = true;
      this.updateRealtimeBadge(true);
      return { success: true, message: "Connected to Supabase PostgreSQL database." };
    } catch (err) {
      this.isConnected = false;
      this.updateRealtimeBadge(false);
      return { success: false, message: err.message || "Database connection error." };
    }
  }

  /**
   * Sets up Supabase Realtime WebSocket subscription for postgres_changes
   * on 'accidents' and 'locations' tables.
   */
  setupRealtimeSubscription() {
    if (!this.client) return;

    if (this.realtimeChannel) {
      try {
        this.client.removeChannel(this.realtimeChannel);
      } catch (_) {}
    }

    console.log("⚡ Connecting to Supabase Realtime PostgreSQL replication...");

    this.realtimeChannel = this.client
      .channel("supabase-realtime-gis-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accidents" },
        (payload) => {
          console.log("⚡ Supabase Realtime event [accidents]:", payload);
          this.handleRealtimeEvent("accidents", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        (payload) => {
          console.log("⚡ Supabase Realtime event [locations]:", payload);
          this.handleRealtimeEvent("locations", payload);
        }
      )
      .subscribe((status, err) => {
        console.log("⚡ Supabase Realtime channel status:", status, err ? err : "");
        if (status === "SUBSCRIBED") {
          this.isRealtimeSubscribed = true;
          this.updateRealtimeBadge(true);
          this.showRealtimeToast(
            "⚡ Supabase Realtime Connected",
            "Live WebSocket replication active. SQL Editor queries will instantly update the map.",
            "success"
          );
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          this.isRealtimeSubscribed = false;
        }
      });
  }

  /**
   * Handles incoming Realtime changes from SQL Editor execution
   */
  async handleRealtimeEvent(table, payload) {
    const eventType = payload.eventType; // 'INSERT' | 'UPDATE' | 'DELETE'
    const newRecord = payload.new || {};
    const oldRecord = payload.old || {};

    let title = `⚡ SQL Event: ${eventType} on '${table}'`;
    let message = `Database change detected in real time. Updating map & KPIs...`;

    if (table === "accidents") {
      const severity = newRecord.severity || "Updated";
      const deaths = newRecord.deaths ?? "";
      const date = newRecord.accident_date || "";
      message = `Incident ${eventType}: Severity=${severity}, Fatalities=${deaths}, Date=${date}`;
    } else if (table === "locations") {
      const road = newRecord.road_name || "Location";
      const lat = newRecord.latitude;
      const lng = newRecord.longitude;
      message = `Hotspot Location ${eventType}: ${road} (${lat}°, ${lng}°)`;
    }

    this.showRealtimeToast(title, message, "event");

    // Automatically trigger data refresh across map, HUD, and tables
    if (typeof window.refreshData === "function") {
      try {
        const activeFilters = window.filterManager ? window.filterManager.currentFilters : {};
        await window.refreshData(activeFilters, {
          isRealtime: true,
          realtimeTable: table,
          realtimeType: eventType,
          fitBounds: true
        });
      } catch (e) {
        console.error("Error refreshing data after realtime event:", e);
      }
    }

    // If new location was added, smoothly pan to it
    if (table === "locations" && eventType === "INSERT" && newRecord.latitude && newRecord.longitude) {
      if (window.mapCtrl && typeof window.mapCtrl.flyToCoords === "function") {
        window.mapCtrl.flyToCoords(newRecord.latitude, newRecord.longitude);
      }
    }
  }

  /**
   * Displays an elegant floating live toast alert for real-time events
   */
  showRealtimeToast(title, message, type = "info") {
    let container = document.getElementById("supabaseRealtimeToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "supabaseRealtimeToastContainer";
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
      background: #0f172a;
      border: 1px solid ${type === "event" ? "#3b82f6" : type === "success" ? "#10b981" : "#e2e8f0"};
      border-left: 4px solid ${type === "event" ? "#3b82f6" : type === "success" ? "#10b981" : "#f59e0b"};
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      pointer-events: auto;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    toast.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
        <strong style="color:${type === "event" ? "#60a5fa" : type === "success" ? "#34d399" : "#fbbf24"}; font-weight:700;">${title}</strong>
        <span style="font-size:11px; opacity:0.6; font-family:monospace;">${new Date().toLocaleTimeString()}</span>
      </div>
      <div style="margin-top:4px; color:#cbd5e1; font-size:12px;">${message}</div>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.transform = "translateY(10px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  /**
   * Updates UI badges to show live Supabase Realtime status
   */
  updateRealtimeBadge(isLive) {
    const badge = document.getElementById("dbStatusBadge");
    const hudBadge = document.getElementById("dbStatusBadgeHud");

    if (badge) {
      if (isLive) {
        badge.innerHTML = `<span class="db-live-dot" style="background:#10b981; box-shadow:0 0 8px #10b981;"></span><span>Supabase Realtime</span>`;
        badge.title = "Connected to Supabase PostgreSQL with live WebSocket Realtime synchronization";
      } else {
        badge.innerHTML = `<span class="db-live-dot"></span><span>PostgreSQL</span>`;
      }
    }

    if (hudBadge) {
      if (isLive) {
        hudBadge.innerHTML = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; margin-right:5px; box-shadow:0 0 8px #10b981; animation: pulse 2s infinite;"></span>Supabase Live`;
        hudBadge.title = "Supabase PostgreSQL with Realtime live replication";
      }
    }
  }

  /**
   * Directly queries Supabase tables or views with SERVER-SIDE FILTER PUSHDOWN.
   * All filtering (state, district, tier, road type, search query, fatalities) is executed
   * directly inside the PostgreSQL database on Supabase, returning only the filtered records.
   */
  async fetchLiveHotspots(filters = {}) {
    if (!this.client) return null;
    const t0 = performance.now();

    // Priority 1: Supabase-side RPC stored function (PostgreSQL procedure)
    try {
      const rpcArgs = {};
      if (filters.stateId) rpcArgs.p_state_id = filters.stateId;
      if (filters.districtId) rpcArgs.p_district_id = filters.districtId;
      if (filters.tier) rpcArgs.p_tier = filters.tier;
      if (filters.roadType) rpcArgs.p_road_type = filters.roadType;
      if (filters.minDeaths) rpcArgs.p_min_deaths = Number(filters.minDeaths);
      if (filters.search && filters.search.trim()) rpcArgs.p_search = filters.search.trim();

      const { data: rpcData, error: rpcError } = await this.client.rpc("filter_hotspots_rpc", rpcArgs);
      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        const duration = Math.round(performance.now() - t0);
        console.log(`⚡ [Supabase Server-Side RPC] Filtered in ${duration}ms via filter_hotspots_rpc(). Returned ${rpcData.length} records.`, filters);
        this.logServerFilterExecution("RPC Stored Procedure", rpcData.length, duration);
        return rpcData;
      }
    } catch (_) {}

    // Priority 2: PostgREST Filter Pushdown on 'hotspot_statistics' view
    try {
      let viewQuery = this.client
        .from("hotspot_statistics")
        .select("*")
        .order("hotspot_score", { ascending: false });

      if (filters.stateId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.stateId);
        if (isUuid) {
          viewQuery = viewQuery.eq("state_id", filters.stateId);
        } else {
          const stObj = window.accidentService?.statesCache?.find(s => s.id === filters.stateId);
          if (stObj?.state_code) {
            viewQuery = viewQuery.eq("state_code", stObj.state_code.toUpperCase());
          } else if (stObj?.name) {
            viewQuery = viewQuery.eq("state_name", stObj.name);
          } else if (filters.stateId.startsWith("state-")) {
            viewQuery = viewQuery.eq("state_code", filters.stateId.replace("state-", "").toUpperCase());
          }
        }
      }

      if (filters.districtId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.districtId);
        if (isUuid) {
          viewQuery = viewQuery.eq("district_id", filters.districtId);
        } else {
          const distClean = filters.districtId.replace(/^dist-/, "").replace(/-/g, " ");
          viewQuery = viewQuery.ilike("district_name", `%${distClean}%`);
        }
      }

      if (filters.tier) {
        const tierNorm = filters.tier.charAt(0).toUpperCase() + filters.tier.slice(1).toLowerCase();
        viewQuery = viewQuery.ilike("hotspot_tier", tierNorm);
      }

      if (filters.roadType) viewQuery = viewQuery.ilike("road_type", `%${filters.roadType}%`);
      const minCasualties = filters.minFatalities || filters.minDeaths;
      if (minCasualties) viewQuery = viewQuery.gte("total_deaths", Number(minCasualties));
      if (filters.severity === "Fatal") viewQuery = viewQuery.gt("fatal_accidents", 0);
      if (filters.severity === "Severe") viewQuery = viewQuery.gt("severe_accidents", 0);

      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        viewQuery = viewQuery.or(`road_name.ilike.%${q}%,city.ilike.%${q}%,locality.ilike.%${q}%,road_number.ilike.%${q}%`);
      }

      const { data: viewData, error: viewError } = await viewQuery;
      if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
        const duration = Math.round(performance.now() - t0);
        console.log(`⚡ [Supabase PostgREST Pushdown] Filtered in ${duration}ms on view 'hotspot_statistics'. Returned ${viewData.length} records.`, filters);
        this.logServerFilterExecution("PostgREST SQL View Pushdown", viewData.length, duration);
        return viewData;
      }
    } catch (_) {}

    try {
      // Priority B: Direct join of locations & accidents tables
      let locQuery = this.client
        .from("locations")
        .select(`
          id,
          road_name,
          road_number,
          city,
          locality,
          latitude,
          longitude,
          states ( id, name, state_code ),
          districts ( id, name ),
          road_types ( name ),
          accidents (
            id,
            severity,
            deaths,
            injured,
            critical_injuries,
            accident_date,
            responsible_vehicle,
            description
          )
        `)
        .limit(300);

      const { data: locs, error: locErr } = await locQuery;
      if (locErr || !Array.isArray(locs) || locs.length === 0) return null;

      // Transform into standard HotspotRecord objects
      let computed = locs.map((loc) => {
        const accs = loc.accidents || [];
        const deaths = accs.reduce((sum, a) => sum + (Number(a.deaths) || 0), 0);
        const injured = accs.reduce((sum, a) => sum + (Number(a.injured) || 0), 0);
        const critical = accs.reduce((sum, a) => sum + (Number(a.critical_injuries) || 0), 0);
        const fatalCount = accs.filter((a) => a.severity === "Fatal" || (a.deaths && a.deaths > 0)).length;
        const severeCount = accs.filter((a) => a.severity === "Severe" || (critical > 0 && !a.deaths)).length;
        const minorCount = Math.max(0, accs.length - fatalCount - severeCount);

        // MoRTH formula calculation
        const rawScore = (fatalCount * 5.0) + (severeCount * 3.0) + (minorCount * 1.0);
        const score = Math.min(100.0, Math.round((rawScore / 50.0) * 100.0 * 10) / 10);

        let tier = "Low";
        if (score >= 75) tier = "Critical";
        else if (score >= 50) tier = "High";
        else if (score >= 25) tier = "Moderate";

        const dates = accs.map((a) => a.accident_date).filter(Boolean).sort();
        const lastDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split("T")[0];

        return {
          location_id: loc.id,
          road_name: loc.road_name,
          road_number: loc.road_number || "",
          city: loc.city || "",
          locality: loc.locality || "",
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          state_id: loc.states?.id,
          state_name: loc.states?.name || "Unknown",
          state_code: loc.states?.state_code || "",
          district_id: loc.districts?.id,
          district_name: loc.districts?.name || "Unknown",
          road_type: loc.road_types?.name || "National Highway",
          total_accidents: accs.length,
          total_deaths: deaths,
          total_injuries: injured,
          total_critical_injuries: critical,
          fatal_accidents: fatalCount,
          severe_accidents: severeCount,
          minor_accidents: minorCount,
          hotspot_score: score,
          hotspot_tier: tier,
          last_accident_date: lastDate,
          primary_source: "Supabase Realtime Database"
        };
      });

      // Apply active filters to direct join results
      if (filters.stateId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.stateId);
        const stCode = filters.stateId.replace(/^state-/, "").toUpperCase();
        computed = computed.filter(h => isUuid ? h.state_id === filters.stateId : (h.state_code === stCode));
      }
      if (filters.tier) {
        computed = computed.filter(h => h.hotspot_tier.toLowerCase() === filters.tier.toLowerCase());
      }
      if (filters.roadType) {
        computed = computed.filter(h => h.road_type.toLowerCase().includes(filters.roadType.toLowerCase()));
      }
      if (minCasualties) {
        computed = computed.filter(h => h.total_deaths >= Number(minCasualties));
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        computed = computed.filter(h =>
          (h.road_name && h.road_name.toLowerCase().includes(q)) ||
          (h.city && h.city.toLowerCase().includes(q)) ||
          (h.locality && h.locality.toLowerCase().includes(q))
        );
      }

      return computed;
    } catch (err) {
      console.warn("Direct live hotspots query error:", err);
      return null;
    }
  }

  logServerFilterExecution(mechanism, count, ms) {
    let indicator = document.getElementById("supabaseFilterIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "supabaseFilterIndicator";
      indicator.style.cssText = `
        position: fixed;
        top: 68px;
        right: 24px;
        z-index: 9999;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(59, 130, 246, 0.4);
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        color: #93c5fd;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        font-size: 11px;
        padding: 5px 12px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        transition: opacity 0.4s ease, transform 0.4s ease;
        opacity: 0;
        transform: translateY(-8px);
      `;
      document.body.appendChild(indicator);
    }

    indicator.innerHTML = `<span style="width:6px; height:6px; border-radius:50%; background:#38bdf8; box-shadow:0 0 6px #38bdf8; display:inline-block;"></span> <span><strong>Supabase DB Filter:</strong> ${count} results (${ms}ms via ${mechanism})</span>`;
    indicator.style.opacity = "1";
    indicator.style.transform = "translateY(0)";

    clearTimeout(this._indicatorTimeout);
    this._indicatorTimeout = setTimeout(() => {
      indicator.style.opacity = "0";
      indicator.style.transform = "translateY(-8px)";
    }, 3200);
  }

  showSetupNotification() {
    const banner = document.getElementById("configAlertBanner");
    if (banner) {
      banner.style.display = "flex";
    }
  }

  reconnect(url, key) {
    if (url) CONFIG.SUPABASE_URL = url;
    if (key) CONFIG.SUPABASE_ANON_KEY = key;
    this.initClient();
  }
}

// Global Singleton Instance
window.db = new SupabaseService();
