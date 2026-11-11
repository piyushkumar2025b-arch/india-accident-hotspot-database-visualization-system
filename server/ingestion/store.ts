/**
 * ============================================================================
 * INGESTION STORE — in-memory source states + atomic snapshots + live cache
 *  * SourceState map, JSON-safe statusList, hydrate-from-disk at boot.
 *  * Atomic snapshot writes (tmp + rename), debounced ~2s per source id.
 *  * resolveSeries(): live -> snapshot -> caller-supplied fallback, and it
 *    NEVER returns without provenance, so a cold cache still self-describes.
 *  * getLiveEnvironment(): shared 0.1-degree-grid / LRU-400 / 6-min cache with
 *    in-flight de-duplication and a nominal fallback on total upstream failure.
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";

import type {
  AdapterResult,
  DataPoint,
  LiveEnvironment,
  Provenance,
  SourceConfig,
  SourceState,
  TrustTier,
} from "./types";
import { SOURCE_META, SOURCES } from "./source_registry";
import { fetchLiveEnvironment, type LiveEnvironmentRaw } from "./adapters/open_meteo_live";

/**
 * Single entry point for every scheduled / on-demand upstream HTTP call.
 * Injects a User-Agent, enforces an AbortSignal timeout, and hard-fails when
 * INGEST_OFFLINE=1 so the offline snapshot path is exercised in tests.
 */
export async function guardedFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  if (process.env.INGEST_OFFLINE === "1") {
    throw new Error("INGEST_OFFLINE=1: upstream fetch disabled");
  }
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("User-Agent")) headers.set("User-Agent", "Mozilla/5.0");
  const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.slice(0, 80)}`);
  return res;
}

const round1 = (x: number): number => Math.round(x * 10) / 10;
const round2 = (x: number): number => Math.round(x * 100) / 100;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/**
 * Composite driving-hazard index (0..1) for a coordinate.
 * Weights (sum = 1.0): fog 0.27, thunder 0.22, rain 0.18, snow 0.16, wind 0.09,
 * PM2.5 0.08. Sub-scores ramp from a safe level (0) to a severe level (1):
 *   fog    = max( (2000 - visibilityM)/2000 , (5 - satDeficitK)/5 )
 *   rain   = weatherCode in [51..67] ? 1 : min(1, precipMm/10)
 *   snow   = weatherCode in [71..86] ? 1 : 0
 *   thunder= weatherCode >= 95 ? 1 : 0
 *   wind   = (windKmh - 35)/25         (<=35 km/h -> 0, 60 km/h -> 1)
 *   air    = (pm25 - 150)/150          (<=150 ug/m3 -> 0, 300 -> 1)
 * null driver fields contribute 0 (no hazard credit for unknowns).
 */
function computeHazardIndex(
  visibilityM: number | null,
  satDeficitK: number | null,
  precipMm: number | null,
  windKmh: number | null,
  weatherCode: number | null,
  pm25: number | null
): number {
  const fogVis = visibilityM == null ? 0 : clamp01((2000 - visibilityM) / 2000);
  const fogDef = satDeficitK == null ? 0 : clamp01((5 - satDeficitK) / 5);
  const fog = Math.max(fogVis, fogDef);

  const code = weatherCode;
  const rain = code != null && code >= 51 && code <= 67 ? 1 : precipMm && precipMm > 0 ? clamp01(precipMm / 10) : 0;
  const snow = code != null && code >= 71 && code <= 86 ? 1 : 0;
  const thunder = code != null && code >= 95 ? 1 : 0;
  const wind = windKmh == null ? 0 : clamp01((windKmh - 35) / 25);
  const air = pm25 == null ? 0 : clamp01((pm25 - 150) / 150);

  return round2(clamp01(0.27 * fog + 0.18 * rain + 0.16 * snow + 0.22 * thunder + 0.09 * wind + 0.08 * air));
}

function nominalEnvironment(lat: number, lng: number): LiveEnvironment {
  return {
    latitude: lat,
    longitude: lng,
    temperatureC: 28,
    dewPointC: null,
    saturationDeficitK: null,
    humidityPct: 60,
    visibilityM: 10_000,
    precipMm: null,
    precipProbPct: null,
    windKmh: 10,
    weatherCode: null,
    surfacePressureHpa: null,
    pm25: null,
    usAqi: null,
    ozone: null,
    hazardIndex: 0.3,
    daily: [],
    hourly: [],
    fetchedAt: new Date().toISOString(),
    cacheAgeMs: 0,
    fromFallback: true,
    trustTier: "model_derived",
    source: "nominal fallback (upstream unavailable)",
  };
}

export interface ResolveSeriesOptions {
  maxAgeMs?: number;
  fallback?: AdapterResult | null;
}

export class IngestionStore {
  private states = new Map<string, SourceState>();
  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // --- Live telemetry cache (shared across all hotspots / model calls) -------
  private liveCache = new Map<string, { env: LiveEnvironment; storedAt: number }>();
  private liveInflight = new Map<string, Promise<LiveEnvironment>>();
  private readonly LIVE_CACHE_MS = 6 * 60 * 1000;
  private readonly LIVE_CACHE_CAP = 400;

  get(id: string): SourceState | null {
    return this.states.get(id) ?? null;
  }

  upsert(state: SourceState): void {
    this.states.set(state.config.id, state);
  }

  /** JSON-safe view for /api/sources/status (no functions ever leak out). */
  statusList(): SourceState[] {
    return [...this.states.values()].map((s) => ({ ...s }));
  }

  private snapshotPath(cfg: SourceConfig): string {
    return path.resolve(process.cwd(), cfg.snapshotFile);
  }

  /** Debounced (~2s per id) so bursts of refreshes coalesce into one write. */
  saveSnapshot(id: string, _state?: SourceState): void {
    const existing = this.saveTimers.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.saveTimers.delete(id);
      this.writeSnapshotSync(id);
    }, 2000);
    if (typeof (timer as unknown as { unref?: () => void }).unref === "function") {
      (timer as unknown as { unref: () => void }).unref();
    }
    this.saveTimers.set(id, timer);
  }

  private writeSnapshotSync(id: string): void {
    const state = this.states.get(id);
    if (!state) return;
    const file = this.snapshotPath(state.config);
    const tmp = `${file}.tmp`;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
      fs.renameSync(tmp, file);
    } catch (err) {
      console.error(`[ingestion] snapshot write failed for ${id}: ${String(err)}`);
    }
  }

  /** Force all pending debounced snapshot writes out to disk now. */
  flushPending(): void {
    for (const [id, timer] of this.saveTimers) {
      clearTimeout(timer);
      this.writeSnapshotSync(id);
    }
    this.saveTimers.clear();
  }

  /** Hydrate at boot. Fresh files are 'snapshot', expired-by-TTL files are 'stale'. */
  async loadAllSnapshots(): Promise<void> {
    const now = Date.now();
    for (const cfg of SOURCES) {
      const file = this.snapshotPath(cfg);
      let raw: string;
      try {
        raw = fs.readFileSync(file, "utf8");
      } catch {
        continue; // missing file -> skip; adapters' built-in fixtures handle cold start
      }
      try {
        const parsed = JSON.parse(raw) as Partial<SourceState>;
        const lastFetchedAt = parsed.lastFetchedAt ?? null;
        const age = lastFetchedAt ? now - Date.parse(lastFetchedAt) : Infinity;
        const status = age > cfg.ttlMs ? "stale" : "snapshot";
        const state: SourceState = {
          config: cfg, // re-attach CURRENT config (cadence/ttl may have changed)
          status,
          lastFetchedAt,
          nextFetchAt: parsed.nextFetchAt ?? null,
          recordCount: parsed.recordCount ?? (parsed.points?.length ?? 0),
          latencyMs: parsed.latencyMs ?? 0,
          error: parsed.error ?? null,
          failureCount: parsed.failureCount ?? 0,
          provenance: parsed.provenance
            ? { ...parsed.provenance, fromSnapshot: true } // these came from disk, not a live tick
            : null,
          points: (parsed.points ?? []) as DataPoint[],
          extra: parsed.extra ?? null,
        };
        this.states.set(cfg.id, state);
      } catch (err) {
        console.error(`[ingestion] bad snapshot for ${cfg.id}: ${String(err)}`);
      }
    }
  }

  private emptyProvenance(cfg?: SourceConfig, trustTier: TrustTier = "registry_aggregate"): Provenance {
    const meta = cfg ? SOURCE_META[cfg.id] : undefined;
    return {
      sourceId: cfg?.id ?? "unknown",
      publisher: meta?.publisher ?? cfg?.name ?? "unknown",
      dataset: meta?.dataset ?? cfg?.name ?? "unknown",
      endpoint: cfg?.endpointTemplate ?? "",
      retrievedAt: new Date().toISOString(),
      coverageFrom: "",
      coverageTo: "",
      license: meta?.license ?? "unknown",
      method: "no data available (cold cache, no snapshot, no fallback)",
      trustTier: cfg?.trustTier ?? trustTier,
      cacheAgeMs: 0,
      fromSnapshot: false,
    };
  }

  /**
   * Resolve a series for id with live/snapshot/fallback resolution. Always
   * returns { points, provenance } so callers never lose provenance on a miss.
   */
  async resolveSeries(
    id: string,
    opts: ResolveSeriesOptions = {}
  ): Promise<{ points: DataPoint[]; provenance: Provenance }> {
    const state = this.get(id);
    const now = Date.now();
    const cfg = state?.config;
    const ttl = cfg?.ttlMs ?? Number.POSITIVE_INFINITY;
    const maxAge = opts.maxAgeMs ?? ttl;
    const age = state?.lastFetchedAt ? now - Date.parse(state.lastFetchedAt) : Number.POSITIVE_INFINITY;

    if (state && state.points.length > 0 && state.provenance) {
      // fromSnapshot already reflects how the stored points were obtained.
      return {
        points: state.points,
        provenance: { ...state.provenance, cacheAgeMs: Number.isFinite(age) ? Math.max(0, age) : 0 },
      };
    }

    if (opts.fallback) {
      const fb = opts.fallback;
      return {
        points: fb.points,
        provenance: {
          ...fb.provenance,
          cacheAgeMs: Number.isFinite(age) ? Math.max(0, age) : 0,
          fromSnapshot: true,
        },
      };
    }

    const provenance = state?.provenance ?? this.emptyProvenance(cfg);
    return {
      points: [],
      provenance: { ...provenance, cacheAgeMs: Number.isFinite(age) ? Math.max(0, age) : 0 },
    };
  }

  private toLiveEnvironment(raw: LiveEnvironmentRaw, gridLat: number, gridLng: number): LiveEnvironment {
    const satDeficitK =
      raw.temperatureC != null && raw.dewPointC != null ? round2(raw.temperatureC - raw.dewPointC) : null;
    const hazardIndex = computeHazardIndex(
      raw.visibilityM,
      satDeficitK,
      raw.precipMm,
      raw.windKmh,
      raw.weatherCode,
      raw.pm25
    );
    return {
      latitude: gridLat,
      longitude: gridLng,
      temperatureC: raw.temperatureC,
      dewPointC: raw.dewPointC,
      saturationDeficitK: satDeficitK,
      humidityPct: raw.humidityPct,
      visibilityM: raw.visibilityM,
      precipMm: raw.precipMm,
      precipProbPct: raw.precipProbPct,
      windKmh: raw.windKmh,
      weatherCode: raw.weatherCode,
      surfacePressureHpa: raw.surfacePressureHpa,
      pm25: raw.pm25,
      usAqi: raw.usAqi,
      ozone: raw.ozone,
      hazardIndex,
      daily: raw.daily,
      hourly: raw.hourly,
      fetchedAt: raw.fetchedAt,
      cacheAgeMs: 0,
      fromFallback: false,
      trustTier: "model_derived",
      source: "Open-Meteo forecast + CAMS air-quality (model grid)",
    };
  }

  /** Shared, coordinate-gridded live environment lookup with LRU + dedup. */
  async getLiveEnvironment(
    lat: number,
    lng: number,
    opts: { pastDays?: number; forecastDays?: number; timeoutMs?: number } = {}
  ): Promise<LiveEnvironment> {
    const gridLat = round1(lat);
    const gridLng = round1(lng);
    const key = `${gridLat.toFixed(1)},${gridLng.toFixed(1)}`;

    if (process.env.INGEST_OFFLINE === "1") {
      return nominalEnvironment(gridLat, gridLng);
    }

    const cached = this.liveCache.get(key);
    if (cached) {
      const age = Date.now() - cached.storedAt;
      if (age < this.LIVE_CACHE_MS) {
        // touch for LRU ordering
        this.liveCache.delete(key);
        this.liveCache.set(key, cached);
        return { ...cached.env, cacheAgeMs: age };
      }
      this.liveCache.delete(key); // expired -> drop
    }

    const pending = this.liveInflight.get(key);
    if (pending) return pending;

    const task = (async (): Promise<LiveEnvironment> => {
      try {
        const raw = await fetchLiveEnvironment(gridLat, gridLng, opts);
        const env = this.toLiveEnvironment(raw, gridLat, gridLng);
        this.cacheLive(key, env);
        return env;
      } catch {
        const fb = nominalEnvironment(gridLat, gridLng);
        return fb;
      } finally {
        this.liveInflight.delete(key);
      }
    })();

    this.liveInflight.set(key, task);
    return task;
  }

  private cacheLive(key: string, env: LiveEnvironment): void {
    this.liveCache.set(key, { env, storedAt: Date.now() });
    // LRU cap via Map insertion order.
    if (this.liveCache.size > this.LIVE_CACHE_CAP) {
      const oldest = this.liveCache.keys().next().value;
      if (oldest != null) this.liveCache.delete(oldest);
    }
  }

  /** Test / operational helper: drop the live cache (next call refetches). */
  clearLiveCache(): void {
    this.liveCache.clear();
    this.liveInflight.clear();
  }

  /** Build a fresh SourceState shell used by the scheduler. */
  newStateShell(cfg: SourceConfig): SourceState {
    return {
      config: cfg,
      status: "stale",
      lastFetchedAt: null,
      nextFetchAt: null,
      recordCount: 0,
      latencyMs: 0,
      error: null,
      failureCount: 0,
      provenance: null,
      points: [],
      extra: null,
    };
  }
}

export const ingestionStore = new IngestionStore();
