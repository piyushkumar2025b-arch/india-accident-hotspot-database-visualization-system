/**
 * ============================================================================
 * WORLD BANK ADAPTER — GHE road mortality (SH.STA.TRAF.P5) & population
 * Response shape is `[ meta, data[] ]`. Null values are dropped; each surviving
 * row becomes a per-country, per-year DataPoint. Supports ';' separated codes.
 * ============================================================================
 */

import type { AdapterFn, DataPoint, Provenance } from "../types";
import { guardedFetch } from "../store";
import { SOURCE_META } from "../source_registry";

/** SAARC neighbours + India (matches OWID peer intent; WB does carry these). */
export const WB_CODES = "IND;BGD;PAK;NPL;LKA;MMR;BRN";

export const worldbankAdapter: AdapterFn = async (cfg) => {
  const from = 2000;
  const to = new Date().getUTCFullYear();
  const url = cfg.endpointTemplate.replace("{codes}", WB_CODES).replace("{from}", String(from)).replace("{to}", String(to));

  const res = await guardedFetch(url, { headers: cfg.headers }, cfg.timeoutMs);
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json) || !Array.isArray(json[1])) {
    throw new Error(`Unexpected World Bank envelope for ${cfg.id}`);
  }

  const rows = json[1] as Array<Record<string, unknown>>;
  const unit = SOURCE_META[cfg.id]?.unit || "deaths per 100k";
  const points: DataPoint[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const value = row.value;
    if (typeof value !== "number" || !Number.isFinite(value)) continue; // drop null years
    const iso3 = String(row.countryiso3code ?? "").trim();
    if (!iso3) continue;
    const date = String(row.date ?? "").trim();
    if (!/^\d{4}$/.test(date)) continue;
    const country = row.country as Record<string, unknown> | undefined;
    points.push({
      period: date,
      value,
      unit,
      iso3,
      entity: String(country?.value ?? ""),
      meta: { date },
    });
  }

  if (points.length === 0) throw new Error(`World Bank returned no numeric rows for ${cfg.id}`);

  const years = points.map((p) => p.period).sort();
  const meta = SOURCE_META[cfg.id];
  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: meta.publisher,
    dataset: meta.dataset,
    endpoint: url,
    retrievedAt: new Date().toISOString(),
    coverageFrom: years[0],
    coverageTo: years[years.length - 1],
    license: meta.license,
    method: meta.note ? `WB API; ${meta.note}` : "WB API (World Development Indicators)",
    trustTier: cfg.trustTier,
    cacheAgeMs: 0,
    fromSnapshot: false,
  };

  return { points, provenance, extra: null };
};
