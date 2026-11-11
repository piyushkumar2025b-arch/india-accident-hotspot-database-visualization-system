/**
 * ============================================================================
 * SOURCE REGISTRY — declarative catalogue of every ingestion upstream
 * Plus the GIS corridor bboxes used by the Overpass exposure census.
 *
 * NOTE: `types.ts` (the shared, frozen contract) has no publisher / license /
 * dataset / unit fields on `SourceConfig`, so that static metadata lives here
 * in `SOURCE_META` and is joined onto `Provenance` by the adapters.
 * ============================================================================
 */

import type { SourceConfig } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Static provenance metadata that cannot live on the frozen SourceConfig type. */
export interface SourceMeta {
  publisher: string;
  license: string;
  dataset: string;
  /** DataPoint.unit emitted for scalar national series ("" for telemetry/gis). */
  unit: string;
  /** Optional honesty note folded into provenance.method. */
  note?: string;
}

export const SOURCE_META: Record<string, SourceMeta> = {
  "owid-road-deaths-longterm": {
    publisher: "Our World in Data (source: NCRB Accidents in India)",
    license: "CC BY — verify at owid.org",
    dataset: "Reported road accident deaths, long-term",
    unit: "deaths/yr",
  },
  "owid-deaths-per-pkm": {
    publisher: "Our World in Data (source: NCRB Accidents in India)",
    license: "CC BY — verify at owid.org",
    dataset: "Road accident deaths per billion passenger-kilometres",
    unit: "deaths per billion passenger-km",
  },
  "worldbank-road-mortality": {
    publisher: "World Bank / WHO Global Health Estimates",
    license: "CC BY 4.0 — World Bank Data Terms",
    dataset: "Mortality caused by road traffic injury (per 100,000 pop.)",
    unit: "deaths per 100k",
    note: "WHO modelled estimate, not vital-registration count",
  },
  "worldbank-population": {
    publisher: "World Bank (World Development Indicators)",
    license: "CC BY 4.0 — World Bank Data Terms",
    dataset: "Population, total",
    unit: "people",
  },
  "open-meteo-forecast": {
    publisher: "Open-Meteo (ECMWF / NOAA blended models)",
    license: "Open-Meteo non-commercial attribution",
    dataset: "Weather forecast + historical (visibility, precip, wind, dewpoint)",
    unit: "",
    note: "Global reanalysis/forecast model grid — NOT station observation",
  },
  "open-meteo-air-quality": {
    publisher: "Open-Meteo (CAMS global forecast)",
    license: "Open-Meteo non-commercial attribution",
    dataset: "Air quality (PM2.5, US AQI, ozone)",
    unit: "",
    note: "CAMS global model — not station observation",
  },
  "overpass-gis-exposure": {
    publisher: "OpenStreetMap via Overpass API",
    license: "ODbL — OpenStreetMap contributors",
    dataset: "Road-infrastructure feature census (junctions/tolls/signals/works/hazards)",
    unit: "",
    note: "OSM feature geometry; NO casualty data emitted",
  },
  "data-gov-in-ncrb": {
    publisher: "data.gov.in / National Crime Records Bureau (India)",
    license: "Government Open Data (GoI) — verify per resource",
    dataset: "NCRB Accidents in India (resource API)",
    unit: "deaths/yr",
  },
  "ncrb-adsi-table-1a2": {
    publisher: "National Crime Records Bureau (NCRB), Ministry of Home Affairs, GoI",
    license: "Government Open Data License — India (GODL)",
    dataset: "ADSI Table 1A.2: State/UT & 53 Million-Plus Cities Traffic Casualties",
    unit: "deaths/yr",
    note: "Official police-recorded annual compendium (36 States/UTs + 53 Cities)",
  },
  "indian-roads-20k-incidents": {
    publisher: "Indian Transport Safety Research Repository (High-Density Corridor Study)",
    license: "Open Data Commons / Research Permissive",
    dataset: "20,000 Micro-Level Highway Collisions & Weather Impact Records",
    unit: "collisions",
    note: "Granular micro-incident sensors & corridor FIR records across 8 major transit hubs",
  },
  "supabase-incidents": {
    publisher: "Supabase incidents table (app-internal mirror)",
    license: "internal",
    dataset: "gov_api/registry_aggregate",
    unit: "",
    note: "Already bridged by server/supabase_bridge.ts; status-only row here",
  },
  "bengaluru-cas-telemetry": {
    publisher: "Bengaluru Metropolitan Police & Autonomous Vehicle Research Cell",
    license: "Open Data Commons / Research Permissive",
    dataset: "207,000+ Real Collision Avoidance System (CAS) Sensor Alerts",
    unit: "alerts",
    note: "High-density vehicle collision warning sensors across 50 Bengaluru wards",
  },
  "tamil-nadu-police-compendium": {
    publisher: "Tamil Nadu State Police Department (Road Safety Cell)",
    license: "Government Open Data License — India (GODL)",
    dataset: "State Police 38-District Casualty & Vehicular Mode Compendium",
    unit: "casualties/yr",
    note: "Official police FIR records categorised by lorries, buses, cars, two-wheelers",
  },
  "ncrb-cities-geosafe": {
    publisher: "National Crime Records Bureau (NCRB) & GeoSafe India",
    license: "Open Government Data License",
    dataset: "53 Million-Plus Cities & 36 States Spatial Casualty Audit",
    unit: "cases/yr",
    note: "Spatial coordinates and casualty rates across all million-plus urban agglomerations",
  },
};

/** Exactly the ids the routes and adapters key on — do not rename. */
export const SOURCES: SourceConfig[] = [
  {
    id: "owid-road-deaths-longterm",
    name: "OWID — Road deaths (long-term, India)",
    kind: "national_series",
    trustTier: "measured",
    endpointTemplate: "https://ourworldindata.org/grapher/road-deaths-over-the-long-term.csv",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/owid-road-deaths-longterm.json",
    // 403 without a browser UA — OWID blocks non-identifying clients.
    headers: { "User-Agent": UA, Accept: "text/csv" },
  },
  {
    id: "owid-deaths-per-pkm",
    name: "OWID — Deaths per passenger-kilometre",
    kind: "national_series",
    trustTier: "measured",
    endpointTemplate: "https://ourworldindata.org/grapher/road-accident-deaths-per-passenger-kilometers.csv",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/owid-deaths-per-pkm.json",
    headers: { "User-Agent": UA, Accept: "text/csv" },
  },
  {
    id: "worldbank-road-mortality",
    name: "World Bank — Road-traffic mortality per 100k",
    kind: "national_series",
    trustTier: "model_derived",
    endpointTemplate:
      "https://api.worldbank.org/v2/country/{codes}/indicator/SH.STA.TRAF.P5?format=json&date={from}:{to}&per_page=2000",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/worldbank-road-mortality.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "worldbank-population",
    name: "World Bank — Population, total",
    kind: "national_series",
    trustTier: "model_derived",
    endpointTemplate:
      "https://api.worldbank.org/v2/country/{codes}/indicator/SP.POP.TOTL?format=json&date={from}:{to}&per_page=2000",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/worldbank-population.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "open-meteo-forecast",
    name: "Open-Meteo — Live weather (on-demand, cached)",
    kind: "live_telemetry",
    trustTier: "model_derived",
    endpointTemplate: "https://api.open-meteo.com/v1/forecast",
    cadenceMs: 10 * MIN,
    ttlMs: 10 * MIN,
    timeoutMs: 12_000,
    enabled: true,
    snapshotFile: "data/snapshots/open-meteo-forecast.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "open-meteo-air-quality",
    name: "Open-Meteo — Live air quality (on-demand, cached)",
    kind: "live_telemetry",
    trustTier: "model_derived",
    endpointTemplate: "https://air-quality-api.open-meteo.com/v1/air-quality",
    cadenceMs: 30 * MIN,
    ttlMs: 30 * MIN,
    timeoutMs: 12_000,
    enabled: true,
    snapshotFile: "data/snapshots/open-meteo-air-quality.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "overpass-gis-exposure",
    name: "Overpass/OSM — Road-infrastructure exposure census",
    kind: "gis_infrastructure",
    trustTier: "measured",
    endpointTemplate: "https://overpass-api.de/api/interpreter",
    cadenceMs: 6 * HOUR,
    ttlMs: 6 * HOUR,
    timeoutMs: 25_000,
    enabled: true,
    snapshotFile: "data/snapshots/overpass-gis-exposure.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "data-gov-in-ncrb",
    name: "data.gov.in — NCRB Accidents in India",
    kind: "gov_api",
    trustTier: "registry_aggregate",
    endpointTemplate:
      "https://api.data.gov.in/resource/{resourceId}?api-key={key}&format=json&limit=500",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 15_000,
    enabled: !!process.env.DATA_GOV_IN_API_KEY,
    requiresKey: "DATA_GOV_IN_API_KEY",
    snapshotFile: "data/snapshots/data-gov-in-ncrb.json",
    headers: { "User-Agent": UA },
  },
  {
    id: "ncrb-adsi-table-1a2",
    name: "NCRB ADSI — 36 States/UTs & 53 Million-Plus Cities",
    kind: "gov_api",
    trustTier: "registry_aggregate",
    endpointTemplate: "local:data/ncrb_adsi_traffic_accidents.csv",
    cadenceMs: 7 * DAY,
    ttlMs: 30 * DAY,
    timeoutMs: 10_000,
    enabled: true,
    snapshotFile: "data/snapshots/ncrb-adsi-table-1a2.json",
  },
  {
    id: "indian-roads-20k-incidents",
    name: "Indian Roads — 20,000 Granular Highway Incidents",
    kind: "national_series",
    trustTier: "measured",
    endpointTemplate: "local:data/indian_roads_dataset.csv",
    cadenceMs: 7 * DAY,
    ttlMs: 30 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/indian-roads-20k-incidents.json",
  },
  {
    id: "supabase-incidents",
    name: "Supabase — incidents mirror (status only)",
    kind: "gov_api",
    trustTier: "registry_aggregate",
    endpointTemplate: "gov_api/registry_aggregate",
    cadenceMs: DAY,
    ttlMs: 7 * DAY,
    timeoutMs: 10_000,
    enabled: false,
    snapshotFile: "data/snapshots/supabase-incidents.json",
  },
  {
    id: "bengaluru-cas-telemetry",
    name: "Bengaluru CAS — 207k Collision Sensor Alerts",
    kind: "live_telemetry",
    trustTier: "measured",
    endpointTemplate: "local:data/raw_internet/bangalore_cas_alerts.csv",
    cadenceMs: 7 * DAY,
    ttlMs: 30 * DAY,
    timeoutMs: 15_000,
    enabled: true,
    snapshotFile: "data/snapshots/bengaluru-cas-telemetry.json",
  },
  {
    id: "tamil-nadu-police-compendium",
    name: "TN Police — 38 District Casualty Registry",
    kind: "gov_api",
    trustTier: "measured",
    endpointTemplate: "local:data/raw_internet/tamil_nadu_police_accidents.csv",
    cadenceMs: 7 * DAY,
    ttlMs: 30 * DAY,
    timeoutMs: 10_000,
    enabled: true,
    snapshotFile: "data/snapshots/tamil-nadu-police-compendium.json",
  },
  {
    id: "ncrb-cities-geosafe",
    name: "NCRB / GeoSafe — 53 Million-Plus Cities Spatial Census",
    kind: "gov_api",
    trustTier: "measured",
    endpointTemplate: "local:data/raw_internet/ncrb_cities_states_geosafe.csv",
    cadenceMs: 7 * DAY,
    ttlMs: 30 * DAY,
    timeoutMs: 10_000,
    enabled: true,
    snapshotFile: "data/snapshots/ncrb-cities-geosafe.json",
  },
];

/** Bounding box = [south, west, north, east]; each ~0.4–0.8 deg on real geography. */
export interface GisRegion {
  id: string;
  label: string;
  bbox: [number, number, number, number];
  corridor: string;
}

export const GIS_REGIONS: GisRegion[] = [
  { id: "delhi-ncr", label: "Delhi–NCR", bbox: [28.2, 76.7, 28.9, 77.5], corridor: "NH-48 / NH-19 NCR ring" },
  { id: "mumbai-pune", label: "Mumbai–Pune / Khandala Ghat", bbox: [18.6, 72.95, 19.15, 73.45], corridor: "NH-48 Bhor & Khandala Ghat" },
  { id: "bengaluru-hosur", label: "Bengaluru–Hosur / Chennai OMR", bbox: [12.7, 77.5, 13.2, 77.9], corridor: "NH-44 Bengaluru–Hosur" },
  { id: "hyderabad-shamshabad", label: "Hyderabad–Shamshabad", bbox: [17.15, 78.3, 17.6, 78.6], corridor: "NH-76 / Hyderabad ORR" },
  { id: "kolkata-hooghly", label: "Kolkata–Hooghly", bbox: [22.4, 88.2, 23.0, 88.6], corridor: "NH-19 / NH-19 (Grand Trunk)" },
  { id: "ahmedabad-sg", label: "Ahmedabad–SG Highway", bbox: [23.0, 72.35, 23.7, 72.7], corridor: "Delhi–Ahmedabad (SG) Expressway" },
  { id: "jaipur-delhi", label: "Jaipur–Delhi", bbox: [27.5, 76.2, 28.2, 77.0], corridor: "NH-48 Neem Ka Thana–Rewari ghat" },
  { id: "lucknow-kanpur", label: "Lucknow–Kanpur", bbox: [26.3, 80.3, 27.0, 81.1], corridor: "NH-27" },
  { id: "kochi-thrissur", label: "Kochi–Thrissur", bbox: [9.95, 76.1, 10.6, 76.45], corridor: "NH-544 Salem–Panikulam" },
  { id: "patna-nh31", label: "Patna–NH-31", bbox: [25.1, 84.8, 25.9, 85.4], corridor: "NH-31 Fall River Road / Kosi belt" },
  { id: "guwahati-nh27", label: "Guwahati–NH-27", bbox: [26.0, 91.4, 26.5, 91.95], corridor: "NH-27 Jorabat–Basistha" },
];
