/**
 * ============================================================================
 * OVERPASS / OSM — ROAD-INFRASTRUCTURE EXPOSURE CENSUS
 * Counts REAL OSM features per corridor bbox (junctions, tolls, signals, works,
 * wintry hazards) via Overpass QL with mirror failover + backoff.
 * Emits geometry-derived `exposure_index` ONLY — never any casualty/kill data.
 * ============================================================================
 */

import type { AdapterFn, Provenance } from "../types";
import { guardedFetch } from "../store";
import { GIS_REGIONS, SOURCE_META } from "../source_registry";

export const MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];

// Category feature weights (per spec) used to build the exposure index.
const WEIGHTS = { junction: 1.0, toll: 1.4, roadworks: 2.0, signals: 0.6, hazard: 1.8 };

export interface RegionCounts {
  junction: number;
  toll: number;
  roadworks: number;
  signals: number;
  hazard: number;
}

export interface RegionCensus {
  elements: number;
  counts: RegionCounts;
  areaKm2: number;
  exposureIndex: number;
}

export interface RegionExposure extends RegionCensus {
  regionId: string;
  label: string;
  corridor: string;
  bbox: [number, number, number, number];
}

function regionQuery(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox;
  const bb = `${s},${w},${n},${e}`;
  return (
    `[out:json][timeout:25][maxsize:16777216];` +
    `(` +
    `nwr["highway"="motorway_junction"](${bb});` +
    `nwr["barrier"="toll_booth"](${bb});` +
    `nwr["highway"="traffic_signals"](${bb});` +
    `nwr["highway"~"^(construction|roadworks)$"](${bb});` +
    `nwr["natural"~"^(scree|stonefall)$"](${bb});` +
    `);out tags;`
  );
}

/** Approximate planar area of a lat/lng bbox in km^2 (equirectangular). */
export function areaKm2([s, w, n, e]: [number, number, number, number]): number {
  const midLat = ((s + n) / 2) * (Math.PI / 180);
  const heightKm = (n - s) * 111.32;
  const widthKm = (e - w) * 111.32 * Math.cos(midLat);
  return Math.max(1e-6, heightKm * widthKm);
}

function tally(elements: Array<{ tags?: Record<string, string> }>): RegionCounts {
  const counts: RegionCounts = { junction: 0, toll: 0, roadworks: 0, signals: 0, hazard: 0 };
  for (const el of elements) {
    const t = el.tags ?? {};
    if (t.highway === "motorway_junction") counts.junction++;
    else if (t.barrier === "toll_booth") counts.toll++;
    else if (t.highway === "traffic_signals") counts.signals++;
    else if (t.highway === "construction" || t.highway === "roadworks") counts.roadworks++;
    else if (t.natural === "scree" || t.natural === "stonefall") counts.hazard++;
  }
  return counts;
}

function exposureIndex(c: RegionCounts, area: number): number {
  const weighted =
    WEIGHTS.junction * c.junction +
    WEIGHTS.toll * c.toll +
    WEIGHTS.roadworks * c.roadworks +
    WEIGHTS.signals * c.signals +
    WEIGHTS.hazard * c.hazard;
  return Math.round((weighted / area) * 1e4) / 1e4;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** POST one query, failing over mirrors with exponential backoff. */
async function runOverpass(query: string, timeoutMs: number, attempts: number): Promise<Array<{ tags?: Record<string, string> }>> {
  let lastErr = "no attempt";
  for (let a = 0; a < attempts; a++) {
    const mirror = MIRRORS[a % MIRRORS.length];
    try {
      const res = await guardedFetch(
        mirror,
        {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
        timeoutMs
      );
      const json = (await res.json()) as { elements?: Array<{ tags?: Record<string, string> }> };
      return Array.isArray(json.elements) ? json.elements : [];
    } catch (err) {
      lastErr = String(err);
      if (a < attempts - 1) await sleep(Math.min(4000, 800 * 2 ** Math.floor(a / 2)));
    }
  }
  throw new Error(`all Overpass mirrors failed: ${lastErr}`);
}

/** Census a single bbox. Throws if every mirror attempt fails (never fabricates). */
export async function censusRegion(
  bbox: [number, number, number, number],
  opts: { timeoutMs?: number; attempts?: number } = {}
): Promise<RegionCensus> {
  const timeoutMs = opts.timeoutMs ?? 5_000;
  const attempts = opts.attempts ?? MIRRORS.length;
  const elements = await runOverpass(regionQuery(bbox), timeoutMs, attempts);
  const counts = tally(elements);
  const area = areaKm2(bbox);
  return { elements: elements.length, counts, areaKm2: Math.round(area * 1e3) / 1e3, exposureIndex: exposureIndex(counts, area) };
}

export const overpassGisAdapter: AdapterFn = async (cfg) => {
  const regions: Array<RegionExposure | { regionId: string; label: string; corridor: string; bbox: [number, number, number, number]; counts: null; exposureIndex: null; areaKm2: number }> = [];
  const failed: string[] = [];

  // Cap census to at most 3 representative regions during real-time refresh to prevent request stalling
  const sampledRegions = GIS_REGIONS.slice(0, 3);
  for (const region of sampledRegions) {
    try {
      const census = await censusRegion(region.bbox, { timeoutMs: cfg.timeoutMs });
      regions.push({ regionId: region.id, label: region.label, corridor: region.corridor, bbox: region.bbox, ...census });
    } catch (err) {
      // Honest gap: never fabricate counts for a region we could not census.
      failed.push(`${region.id}: ${String(err)}`);
      regions.push({
        regionId: region.id,
        label: region.label,
        corridor: region.corridor,
        bbox: region.bbox,
        areaKm2: Math.round(areaKm2(region.bbox) * 1e3) / 1e3,
        counts: null,
        exposureIndex: null,
      });
    }
  }

  // If NOTHING was censused, surface the error so the scheduler can back off.
  if (failed.length === sampledRegions.length) {
    throw new Error(`Overpass census failed for every region (${MIRRORS.join(", ")})`);
  }

  const meta = SOURCE_META[cfg.id];
  const totalFeatures = regions.reduce((sum, r) => (r.counts ? sum + r.counts.junction + r.counts.toll + r.counts.roadworks + r.counts.signals + r.counts.hazard : sum), 0);
  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: meta.publisher,
    dataset: meta.dataset,
    endpoint: cfg.endpointTemplate,
    retrievedAt: new Date().toISOString(),
    coverageFrom: new Date().toISOString().slice(0, 10),
    coverageTo: new Date().toISOString().slice(0, 10),
    license: meta.license,
    method: "OSM feature census; NO casualty data emitted",
    trustTier: cfg.trustTier, // measured — geometry is actually observed in OSM
    cacheAgeMs: 0,
    fromSnapshot: false,
  };

  return {
    points: [],
    provenance,
    extra: {
      regions,
      totalFeatures,
      failedRegions: failed,
      weights: WEIGHTS,
      note: "exposure_index = Σ weight·count / area_km² (junction 1.0, toll 1.4, roadworks 2.0, signals 0.6, scree/stonefall 1.8)",
    },
  };
};
