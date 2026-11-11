/**
 * ============================================================================
 * INGESTION BARREL — single import surface + app lifecycle hooks
 * initIngestion(): hydrate snapshots then start the scheduler.
 * shutdownIngestion(): stop timers + flush pending snapshot writes.
 * ============================================================================
 */

export * from "./types";
export * from "./source_registry";
export * from "./csv_util";

export { IngestionStore, ingestionStore, guardedFetch } from "./store";
export type { ResolveSeriesOptions } from "./store";

export { startIngestionScheduler, stopIngestionScheduler, refreshSource, refreshAll } from "./scheduler";

export { owidAdapter, PEER_COUNTRIES, FALLBACK_IND_SERIES, owidFallbackResult } from "./adapters/owid";
export { worldbankAdapter, WB_CODES } from "./adapters/worldbank";
export { overpassGisAdapter, censusRegion, areaKm2, MIRRORS } from "./adapters/overpass_gis";
export type { RegionCounts, RegionCensus, RegionExposure } from "./adapters/overpass_gis";
export { dataGovInAdapter, DisabledError, RESOURCE_IDS } from "./adapters/data_gov_in";
export { fetchLiveEnvironment } from "./adapters/open_meteo_live";

import { ingestionStore } from "./store";
import { startIngestionScheduler, stopIngestionScheduler } from "./scheduler";

/** Boot hook: hydrate on-disk snapshots, then start the cadence scheduler. */
export async function initIngestion(): Promise<void> {
  await ingestionStore.loadAllSnapshots();
  startIngestionScheduler();
}

/** Shutdown hook: stop all timers and flush debounced snapshots to disk. */
export function shutdownIngestion(): void {
  stopIngestionScheduler();
}
