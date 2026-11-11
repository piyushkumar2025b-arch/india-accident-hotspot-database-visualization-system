/**
 * ============================================================================
 * OWID ADAPTER — road fatality national series (quote-aware CSV)
 * Downloads the Our World in Data grapher CSV (requires a browser User-Agent,
 * else HTTP 403), keeps India + the SAARC peer set, and derives coverage
 * bounds FROM THE DATA (India currently ends 2017 — never hardcoded).
 * Exposes an offline FALLBACK_IND_SERIES so routes can answer when the store
 * is empty; it mirrors the observed live values (1990=54,100 -> 2017=147,913).
 * ============================================================================
 */

import type { AdapterResult, AdapterFn, DataPoint, Provenance, SourceConfig } from "../types";
import { guardedFetch } from "../store";
import { parseCsvRows } from "../csv_util";
import { SOURCE_META } from "../source_registry";

export const PEER_COUNTRIES = ["IND", "BGD", "PAK", "NPL", "LKA", "BRN", "MMR"] as const;

const YEARS = Array.from({ length: 28 }, (_, i) => 1990 + i); // 1990..2017
const DEATHS = [
  54100, 56278, 60113, 60380, 64463, 70781, 74665, 76977, 79919, 81966, 78911, 80888, 84674, 85998, 92618, 94968,
  105749, 114444, 119860, 125660, 134513, 142485, 138258, 137572, 139671, 146133, 150785, 147913,
];

/** Offline fixture approximating NCRB-published road deaths as mirrored by OWID. */
export const FALLBACK_IND_SERIES: DataPoint[] = YEARS.map((year, i) => ({
  period: String(year),
  value: DEATHS[i],
  unit: "deaths/yr",
  iso3: "IND",
  entity: "India",
  meta: { offline: true },
}));

export function owidFallbackResult(cfg: SourceConfig): AdapterResult {
  const meta = SOURCE_META[cfg.id];
  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: meta.publisher,
    dataset: meta.dataset,
    endpoint: cfg.endpointTemplate,
    retrievedAt: new Date().toISOString(),
    coverageFrom: "1990",
    coverageTo: "2017",
    license: meta.license,
    method: "offline fixture (built-in, mirrors OWID long-term India series)",
    trustTier: "registry_aggregate",
    cacheAgeMs: 0,
    fromSnapshot: true,
  };
  return { points: FALLBACK_IND_SERIES, provenance, extra: null };
}

export const owidAdapter: AdapterFn = async (cfg) => {
  const res = await guardedFetch(cfg.endpointTemplate, { headers: cfg.headers }, cfg.timeoutMs);
  const text = await res.text();
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error(`OWID CSV empty/truncated for ${cfg.id}`);

  const header = rows[0];
  const colEntity = Math.max(0, header.indexOf("Entity"));
  const colCode = header.indexOf("Code");
  const colYear = header.indexOf("Year");
  // The value column is the last header (differs per grapher dataset).
  const colValue = header.length - 1;
  if (colCode < 0 || colYear < 0) throw new Error(`OWID CSV missing Code/Year columns: ${cfg.id}`);

  const unit = SOURCE_META[cfg.id]?.unit || "deaths/yr";
  const points: DataPoint[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length <= colValue) continue;
    const code = (r[colCode] ?? "").trim();
    if (!PEER_COUNTRIES.includes(code as (typeof PEER_COUNTRIES)[number])) continue;
    const year = (r[colYear] ?? "").trim();
    const value = Number(r[colValue]);
    if (!/^\d{4}$/.test(year) || !Number.isFinite(value)) continue;
    points.push({ period: year, value, unit, iso3: code, entity: (r[colEntity] ?? "").trim() });
  }

  if (points.length === 0) throw new Error(`OWID CSV parsed but no target countries for ${cfg.id}`);

  // Coverage bounds computed from the emitted data, not hardcoded.
  const years = points.map((p) => p.period).sort();
  const coverageFrom = years[0];
  const coverageTo = years[years.length - 1];

  const meta = SOURCE_META[cfg.id];
  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: meta.publisher,
    dataset: meta.dataset,
    endpoint: cfg.endpointTemplate,
    retrievedAt: new Date().toISOString(),
    coverageFrom,
    coverageTo,
    license: meta.license,
    method: meta.note ? `direct CSV download; ${meta.note}` : "direct CSV download (raw OWID values)",
    trustTier: cfg.trustTier,
    cacheAgeMs: 0,
    fromSnapshot: false,
  };

  return { points, provenance, extra: null };
};
