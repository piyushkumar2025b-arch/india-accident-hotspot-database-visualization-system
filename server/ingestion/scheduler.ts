/**
 * ============================================================================
 * INGESTION SCHEDULER — staggered cadence, TTL skip, backoff, throttled ticks
 *  * Per enabled non-telemetry source: initial delay 3s + (hash(id)%45s), then
 *    setInterval(cadence). A tick is skipped if the data is fresher than
 *    ttl*0.75 (unless forced).
 *  * Global concurrency semaphore = 2 across every fetch.
 *  * Exponential backoff into nextFetchAt: min(cadence*2^fails, 6h) +/-20% jitter.
 *  * A tick NEVER throws out to the timer. INGEST_SCHEDULER_ENABLED=0 disables
 *    the timers; INGEST_OFFLINE=1 makes every upstream call fail so the snapshot
 *    path is exercised. SIGINT/SIGTERM stop the scheduler and flush snapshots.
 * ============================================================================
 */

import type { SourceConfig, SourceState, SourceStatus } from "./types";
import { SOURCES } from "./source_registry";
import { ingestionStore } from "./store";
import { owidAdapter } from "./adapters/owid";
import { worldbankAdapter } from "./adapters/worldbank";
import { overpassGisAdapter } from "./adapters/overpass_gis";
import { dataGovInAdapter, DisabledError } from "./adapters/data_gov_in";
import { ncrbAdsiAdapter } from "./adapters/ncrb_adsi";
import { indianRoadsIncidentAdapter } from "./adapters/indian_roads";
import { bengaluruCasAdapter, tamilNaduPoliceAdapter, ncrbCitiesAdapter } from "./adapters/real_sources";

/** Pollable adapters keyed by source id (telemetry sources are on-demand only). */
const ADAPTERS: Record<string, (cfg: SourceConfig) => Promise<import("./types").AdapterResult>> = {
  "owid-road-deaths-longterm": owidAdapter,
  "owid-deaths-per-pkm": owidAdapter,
  "worldbank-road-mortality": worldbankAdapter,
  "worldbank-population": worldbankAdapter,
  "overpass-gis-exposure": overpassGisAdapter,
  "data-gov-in-ncrb": dataGovInAdapter,
  "ncrb-adsi-table-1a2": ncrbAdsiAdapter,
  "indian-roads-20k-incidents": indianRoadsIncidentAdapter,
  "bengaluru-cas-telemetry": bengaluruCasAdapter,
  "tamil-nadu-police-compendium": tamilNaduPoliceAdapter,
  "ncrb-cities-geosafe": ncrbCitiesAdapter,
};

const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
const SEMAPHORE_LIMIT = 2;

let running = 0;
const waiters: Array<() => void> = [];
async function acquire(): Promise<void> {
  if (running < SEMAPHORE_LIMIT) {
    running++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  running++;
}
function release(): void {
  running--;
  const next = waiters.shift();
  if (next) next();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function isDisabled(cfg: SourceConfig): boolean {
  if (!cfg.enabled) return true;
  if (cfg.requiresKey && !process.env[cfg.requiresKey]) return true;
  return false;
}

/** Guarantee a status row exists for every configured source. */
function seedState(cfg: SourceConfig): SourceState {
  const existing = ingestionStore.get(cfg.id);
  if (existing) return existing;
  const disabled = isDisabled(cfg);
  const shell = ingestionStore.newStateShell(cfg);
  const state: SourceState = disabled
    ? { ...shell, status: "disabled", error: cfg.requiresKey ? `${cfg.requiresKey} not configured` : "source disabled" }
    : { ...shell, status: "stale" };
  ingestionStore.upsert(state);
  return state;
}

const jitteredBackoff = (base: number): number => Math.round(base * (0.8 + Math.random() * 0.4));

/** Run one source's fetch cycle. Never throws to the caller. */
async function runTick(cfg: SourceConfig, force: boolean): Promise<SourceState> {
  const prev = seedState(cfg);
  const now = Date.now();
  const age = prev.lastFetchedAt ? now - Date.parse(prev.lastFetchedAt) : Number.POSITIVE_INFINITY;

  if (isDisabled(cfg)) {
    const state: SourceState = {
      ...prev,
      config: cfg,
      status: "disabled",
      error: cfg.requiresKey ? `${cfg.requiresKey} not configured` : "source disabled",
      nextFetchAt: null,
    };
    ingestionStore.upsert(state);
    return state;
  }

  if (!force && age < cfg.ttlMs * 0.75) return prev; // fresh enough, skip

  const adapter = ADAPTERS[cfg.id];
  if (!adapter) return prev; // no polling adapter (should not happen for scheduled ids)

  const start = Date.now();
  await acquire();
  try {
    const result = await adapter(cfg);
    const latencyMs = Date.now() - start;
    const state: SourceState = {
      config: cfg,
      status: "ok",
      lastFetchedAt: new Date().toISOString(),
      nextFetchAt: new Date(Date.now() + cfg.cadenceMs).toISOString(),
      recordCount: result.points.length,
      latencyMs,
      error: null,
      failureCount: 0,
      provenance: result.provenance,
      points: result.points,
      extra: result.extra ?? null,
    };
    ingestionStore.upsert(state);
    ingestionStore.saveSnapshot(cfg.id, state);
    return state;
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof DisabledError) {
      const state: SourceState = { ...prev, config: cfg, status: "disabled", error: err.message, nextFetchAt: null };
      ingestionStore.upsert(state);
      return state;
    }
    const failureCount = prev.failureCount + 1;
    const base = Math.min(cfg.cadenceMs * 2 ** failureCount, MAX_BACKOFF_MS);
    const nextFetchAt = new Date(Date.now() + jitteredBackoff(base)).toISOString();
    const hasData = prev.points.length > 0;
    const status: SourceStatus = hasData ? "stale" : "error";
    const message = err instanceof Error ? err.message : String(err);
    const state: SourceState = {
      ...prev,
      config: cfg,
      status,
      error: message,
      failureCount,
      nextFetchAt,
      latencyMs,
    };
    ingestionStore.upsert(state);
    return state;
  } finally {
    release();
  }
}

async function refreshSource(id: string, opts: { force?: boolean } = {}): Promise<SourceState> {
  const cfg = SOURCES.find((s) => s.id === id);
  if (!cfg) throw new Error(`unknown source id: ${id}`);
  return runTick(cfg, opts.force ?? false);
}

async function refreshAll(opts: { force?: boolean } = {}): Promise<SourceState[]> {
  const force = opts.force ?? false;
  const states = await Promise.all(SOURCES.map((cfg) => runTick(cfg, force)));
  return states;
}

// --- lifecycle -------------------------------------------------------------
let started = false;
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();
const intervals = new Map<string, ReturnType<typeof setInterval>>();
let signalsBound = false;

function onSignal(): void {
  stopIngestionScheduler();
}

function bindSignals(): void {
  if (signalsBound) return;
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  signalsBound = true;
}

function unbindSignals(): void {
  if (!signalsBound) return;
  process.off("SIGINT", onSignal);
  process.off("SIGTERM", onSignal);
  signalsBound = false;
}

function startIngestionScheduler(): void {
  if (started) return; // idempotent
  started = true;

  // Seed every source so the status endpoint is populated even before first tick.
  for (const cfg of SOURCES) seedState(cfg);

  bindSignals();

  if (process.env.INGEST_SCHEDULER_ENABLED === "0") return; // kill switch: no timers

  const targets = SOURCES.filter((cfg) => cfg.enabled && cfg.kind !== "live_telemetry" && ADAPTERS[cfg.id]);
  for (const cfg of targets) {
    const initialDelay = 3000 + (hash(cfg.id) % 45000);
    const t = setTimeout(() => {
      void runTick(cfg, false);
      const iv = setInterval(() => void runTick(cfg, false), cfg.cadenceMs);
      if (typeof (iv as unknown as { unref?: () => void }).unref === "function") {
        (iv as unknown as { unref: () => void }).unref();
      }
      intervals.set(cfg.id, iv);
    }, initialDelay);
    if (typeof (t as unknown as { unref?: () => void }).unref === "function") {
      (t as unknown as { unref: () => void }).unref();
    }
    timeouts.set(cfg.id, t);
  }
}

function stopIngestionScheduler(): void {
  for (const t of timeouts.values()) clearTimeout(t);
  for (const iv of intervals.values()) clearInterval(iv);
  timeouts.clear();
  intervals.clear();
  unbindSignals();
  started = false;
  ingestionStore.flushPending();
}

export { startIngestionScheduler, stopIngestionScheduler, refreshSource, refreshAll, ADAPTERS };
