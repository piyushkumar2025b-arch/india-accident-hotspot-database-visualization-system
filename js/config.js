/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Global Application Configuration & Database Credentials
 * ============================================================================
 */

const CONFIG = {
  // --------------------------------------------------------------------------
  // SUPABASE CREDENTIALS
  // Replace with your project details from Supabase Dashboard -> Settings -> API
  // --------------------------------------------------------------------------
  SUPABASE_URL: "https://ewbkjddovejukoqiibqv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3YmtqZGRvdmVqdWtvcWlpYnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Mjg5NzksImV4cCI6MjEwMzUwNDk3OX0.Y3NadLvPBOXsPhIVPbEzBkp5R93SaPiCswPqbODie8A",

  // --------------------------------------------------------------------------
  // GOOGLE MAPS PLATFORM CREDENTIALS
  // --------------------------------------------------------------------------
  GOOGLE_MAPS_API_KEY: "AIzaSyAqLnJouBYVsgVuu-nVA1Wqp8wJm4rBdEQ",
  GOOGLE_MAPS_ATTRIBUTION_ID: "gmp_mcp_codeassist_v1_aistudio",

  // --------------------------------------------------------------------------
  // MAP DEFAULTS (Geographic Center of India)
  // --------------------------------------------------------------------------
  MAP: {
    MAP_ID: "DEMO_MAP_ID",
    INITIAL_CENTER: [22.5937, 78.9629],
    INITIAL_ZOOM: 5,
    MIN_ZOOM: 4,
    MAX_ZOOM: 19,
    PREFERRED_ENGINE: "google", // 'google', 'carto', 'esri', 'opentopo'
    CURRENT_MODE: "satellite", // 'satellite', 'dark', 'light', 'terrain', 'streets'
    DEFAULT_HEATMAP: true,
    // High-contrast clean dark tile provider with complete OpenStreetMap attribution
    TILE_URL: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    TILE_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    DARK_TILE_URL: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",

    // Comprehensive multi-provider catalog
    PROVIDERS: {
      google: {
        id: "google",
        name: "Google Maps Platform",
        badge: "Vector GIS & 3D Imagery",
        engine: "google"
      },
      carto: {
        id: "carto",
        name: "CARTO / OpenStreetMap",
        badge: "OpenStreetMap Foundation",
        engine: "leaflet",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        tiles: {
          dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          streets: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        }
      },
      esri: {
        id: "esri",
        name: "ESRI ArcGIS World",
        badge: "High-Res Aerial & Topography",
        engine: "leaflet",
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
        tiles: {
          satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          terrain: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          natgeo: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
          streets: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          light: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        }
      },
      opentopo: {
        id: "opentopo",
        name: "OpenTopoMap",
        badge: "Elevation Contours & Relief",
        engine: "leaflet",
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        tiles: {
          terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          light: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          streets: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        }
      }
    }
  },

  // --------------------------------------------------------------------------
  // GEOCODING & NOMINATIM API (OpenStreetMap Ecosystem)
  // --------------------------------------------------------------------------
  GEOCODING: {
    NOMINATIM_URL: "https://nominatim.openstreetmap.org/search",
    DEBOUNCE_MS: 550,
    COUNTRY_CODES: "in"
  },

  // --------------------------------------------------------------------------
  // HOTSPOT SCORING TIERS & WEIGHTS
  // Documented in DBMS specification
  // --------------------------------------------------------------------------
  HOTSPOT: {
    TIERS: {
      CRITICAL: { label: "Critical", min: 75.0, color: "#ef4444" },
      HIGH: { label: "High", min: 50.0, color: "#f97316" },
      MODERATE: { label: "Moderate", min: 25.0, color: "#eab308" },
      LOW: { label: "Low", min: 0.0, color: "#3b82f6" }
    }
  },

  // --------------------------------------------------------------------------
  // CHECK CONFIGURATION VALIDITY
  // --------------------------------------------------------------------------
  isConfigured() {
    return (
      this.SUPABASE_URL &&
      this.SUPABASE_ANON_KEY &&
      !this.SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_ID") &&
      !this.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
    );
  }
};

// Asynchronously load server-injected environment configuration
if (typeof fetch !== "undefined") {
  fetch("/api/client-config")
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      if (data) {
        if (data.GOOGLE_MAPS_API_KEY) CONFIG.GOOGLE_MAPS_API_KEY = data.GOOGLE_MAPS_API_KEY;
        if (data.SUPABASE_URL) CONFIG.SUPABASE_URL = data.SUPABASE_URL;
        if (data.SUPABASE_ANON_KEY) CONFIG.SUPABASE_ANON_KEY = data.SUPABASE_ANON_KEY;
        if (window.db && typeof window.db.initClient === "function") {
          window.db.initClient();
        }
      }
    })
    .catch(() => {});
}

window.CONFIG = CONFIG;
