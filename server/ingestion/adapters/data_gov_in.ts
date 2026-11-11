/**
 * ============================================================================
 * DATA.GOV.IN — NCRB "Accidents in India" resource API (optional, key-gated)
 * Enabled only when DATA_GOV_IN_API_KEY is present. Without a key the adapter
 * throws DisabledError, which the scheduler records as status "disabled" (an
 * intentional non-error state) rather than a fetch failure.
 *
 * The NCRB resource ids below are plausible public-catalogue entries but MUST
 * be re-verified against https://api.data.gov.in/catalog before trusting them.
 * ============================================================================
 */

import type { AdapterFn, DataPoint, Provenance } from "../types";
import { guardedFetch } from "../store";
import { SOURCE_META } from "../source_registry";

/** Thrown when the source is configured but the API key is absent. */
export class DisabledError extends Error {
  constructor(msg = "DATA_GOV_IN_API_KEY not configured") {
    super(msg);
    this.name = "DisabledError";
  }
}

export const RESOURCE_IDS = [
  "55356c930f346d7e1c110082", // TODO verify resource id — NCRB accidents/fatalities by state
  "5df3bbb3e7c743112cf7d103", // TODO verify resource id — road accidents severity table
  "5e0b92d4d1101d058ce1b175", // TODO verify resource id — accidental deaths & suicide
];

/** Best-effort pick of a numeric field that looks like a death/accident count. */
function pickNumber(rec: Record<string, string>, hints: string[]): number | null {
  for (const key of Object.keys(rec)) {
    const lower = key.toLowerCase();
    if (!hints.some((h) => lower.includes(h))) continue;
    const n = Number(String(rec[key]).replace(/[, ]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export const dataGovInAdapter: AdapterFn = async (cfg) => {
  const key = process.env.DATA_GOV_IN_API_KEY;
  if (!key) throw new DisabledError();

  const resourceId = RESOURCE_IDS[0];
  const url = cfg.endpointTemplate.replace("{resourceId}", resourceId).replace("{key}", key);
  const res = await guardedFetch(url, { headers: cfg.headers }, cfg.timeoutMs);
  const json = (await res.json()) as { records?: Array<Record<string, string>> };

  const points: DataPoint[] = [];
  for (const rec of json.records ?? []) {
    if (!rec || typeof rec !== "object") continue;
    const yearField = Object.keys(rec).find((k) => /year|fy|fin_year/i.test(k));
    const year = yearField ? String(rec[yearField]).replace(/[^0-9]/g, "").slice(0, 4) : "";
    const deaths = pickNumber(rec, ["death", "fatal", "kill"]);
    if (!/^\d{4}$/.test(year) || deaths == null) continue; // skip rows we can't read confidently
    const state = String(rec["State/UT"] ?? rec["state_name"] ?? rec["StateName"] ?? "");
    points.push({ period: year, value: deaths, unit: "deaths/yr", entity: state, meta: { resourceId } });
  }

  const meta = SOURCE_META[cfg.id];
  const years = points.map((p) => p.period).sort();
  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: meta.publisher,
    dataset: meta.dataset,
    endpoint: cfg.endpointTemplate.replace("{key}", "***"),
    retrievedAt: new Date().toISOString(),
    coverageFrom: years[0] ?? "",
    coverageTo: years[years.length - 1] ?? "",
    license: meta.license,
    method: `data.gov.in resource ${resourceId} (TODO verify id; column mapping is heuristic)`,
    trustTier: cfg.trustTier,
    cacheAgeMs: 0,
    fromSnapshot: false,
  };
  return { points, provenance, extra: { resourceId } };
};
