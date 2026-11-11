/**
 * ============================================================================
 * REAL-DATA INGESTION: SHARED TYPE CONTRACTS
 * Every ingestion adapter, the store, the scheduler and the math layer consume
 * these types. Changing a shape here is a breaking change for all modules.
 * ============================================================================
 */

export type TrustTier = "measured" | "model_derived" | "registry_aggregate" | "simulated";

export type SourceStatus = "ok" | "stale" | "error" | "disabled" | "snapshot";

export type SourceKind =
  | "national_series"
  | "live_telemetry"
  | "gis_infrastructure"
  | "gov_api";

export interface DataPoint {
  /** Year "1990", ISO date "2026-11-02" or ISO datetime "2026-11-02T04:00" */
  period: string;
  value: number;
  unit: string;
  /** ISO3 country code for national series */
  iso3?: string;
  /** Human entity name ("India") */
  entity?: string;
  meta?: Record<string, unknown>;
}

export interface Provenance {
  sourceId: string;
  publisher: string;
  dataset: string;
  endpoint: string;
  retrievedAt: string;
  coverageFrom: string;
  coverageTo: string;
  license: string;
  method: string;
  trustTier: TrustTier;
  cacheAgeMs: number;
  fromSnapshot: boolean;
}

export interface SourceConfig {
  id: string;
  name: string;
  kind: SourceKind;
  trustTier: TrustTier;
  endpointTemplate: string;
  cadenceMs: number;
  ttlMs: number;
  timeoutMs: number;
  enabled: boolean;
  /** Name of the env var required to enable this source (optional-key sources) */
  requiresKey?: string;
  snapshotFile: string;
  headers?: Record<string, string>;
}

export interface SourceState {
  config: SourceConfig;
  status: SourceStatus;
  lastFetchedAt: string | null;
  nextFetchAt: string | null;
  recordCount: number;
  latencyMs: number;
  error: string | null;
  failureCount: number;
  provenance: Provenance | null;
  points: DataPoint[];
  /** Kind-specific structured payload (e.g. gis regions, env grid stats) */
  extra?: Record<string, unknown> | null;
}

/** Single day of modelled meteorological drivers (Open-Meteo global models). */
export interface EnvDailyPoint {
  date: string;
  precipMm: number | null;
  tMaxC: number | null;
  windMaxKmh: number | null;
  visibilityMinM: number | null;
}

export interface EnvHourlyPoint {
  time: string;
  visibilityM: number | null;
  precipProbPct: number | null;
}

/**
 * Live environmental snapshot for one coordinate, served from the shared
 * 0.1-degree cache. ALWAYS model-derived (ECMWF/CAMFS), never station truth.
 */
export interface LiveEnvironment {
  latitude: number;
  longitude: number;
  temperatureC: number | null;
  dewPointC: number | null;
  /** T - Td in Kelvin: physically-grounded fog proxy */
  saturationDeficitK: number | null;
  humidityPct: number | null;
  /** metres; from Open-Meteo FORECAST api (null on air-quality api) */
  visibilityM: number | null;
  precipMm: number | null;
  precipProbPct: number | null;
  windKmh: number | null;
  weatherCode: number | null;
  surfacePressureHpa: number | null;
  /** ug/m3 from Open-Meteo Air Quality api (CAMS) */
  pm25: number | null;
  usAqi: number | null;
  ozone: number | null;
  /** Composite 0..1 driving-hazard index (fog/precip/wind/AQ weighted) */
  hazardIndex: number;
  daily: EnvDailyPoint[];
  hourly: EnvHourlyPoint[];
  fetchedAt: string;
  cacheAgeMs: number;
  fromFallback: boolean;
  trustTier: "model_derived";
  source: string;
}

export interface AdapterResult {
  points: DataPoint[];
  provenance: Provenance;
  extra?: Record<string, unknown> | null;
}

export type AdapterFn = (cfg: SourceConfig) => Promise<AdapterResult>;
