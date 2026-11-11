/**
 * ============================================================================
 * SAFETY PREDICTIONS — MATHEMATICAL MODELS (Phase 2)
 * 12 pure compute functions. NO dbEngine, NO network, NO side effects:
 * every model takes PLAIN DATA as arguments and returns a JSON-safe object
 * that ALWAYS carries { assumptions: string[], provenance, trustTier }.
 * Deterministic: seeded mulberry32 PRNG only (never Math.random).
 * ============================================================================
 */

import type {
  DataPoint,
  EnvHourlyPoint,
  LiveEnvironment,
  Provenance,
  TrustTier
} from "../../ingestion/types";
import {
  ewma,
  gaussianKde2d,
  gumbelFit,
  gumbelQuantile,
  holtDamped,
  holtWintersAdditive,
  jeffreysInterval,
  mean,
  moransI,
  mulberry32,
  negbinCdf,
  negbinPmf,
  normalSample,
  olsLinear,
  percentile,
  poissonCdf,
  poissonPmf,
  poissonSample,
  sd,
  wilsonInterval,
  spearman,
  kendallTau
} from "./statistics";

// ------------------------------------------------------------------ shared

/** Minimal structural stand-in for server/db.ts HotspotRecord (no db import). */
export interface SpotInput {
  latitude: number;
  longitude: number;
  total_accidents: number;
  fatal_accidents: number;
  total_deaths: number;
  total_injuries: number;
  hotspot_score: number;
  dominant_cause: string;
  highest_risk_month: string;
  road_type: string;
  location_id: string;
  road_name: string;
}

/** Partial provenance the caller may forward from a live source. */
export type ProvenanceLike = Partial<Provenance>;

function rnd(x: number, digits = 5): number | null {
  return Number.isFinite(x) ? Number(x.toFixed(digits)) : null;
}

/** Assemble a full Provenance record; caller-supplied fields win. */
export function buildProvenance(
  trustTier: TrustTier,
  method: string,
  src: ProvenanceLike = {},
  coverage?: [string, string]
): Provenance {
  return {
    sourceId: src.sourceId ?? "model:builtin",
    publisher: src.publisher ?? "This application (pure-TS math layer)",
    dataset: src.dataset ?? "derived input data (passed by route)",
    endpoint: src.endpoint ?? "",
    retrievedAt: src.retrievedAt ?? new Date().toISOString(),
    coverageFrom: src.coverageFrom ?? coverage?.[0] ?? "unknown",
    coverageTo: src.coverageTo ?? coverage?.[1] ?? "unknown",
    license: src.license ?? "internal computation",
    method,
    trustTier,
    cacheAgeMs: src.cacheAgeMs ?? 0,
    fromSnapshot: src.fromSnapshot ?? false
  };
}

/** EB dispersion k by road class — same convention as analytics_models.ts. */
export function ebKForRoad(roadType: string): number {
  const t = (roadType || "").toLowerCase();
  if (t.includes("expressway")) return 0.55;
  if (t.includes("state")) return 0.40;
  return 0.45;
}

function yearOf(d: DataPoint): number {
  const y = parseInt(d.period.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

// ------------------------------------------------- 1. crash probability

export function computeCrashProbability(input: {
  spot: SpotInput;
  env?: LiveEnvironment | null;
  hours?: number;
  k?: number;
  windowYears?: number;
  provenance?: ProvenanceLike;
}) {
  const hours = Math.max(1, Math.min(input.hours ?? 24, 720));
  const kThresh = Math.max(1, Math.trunc(input.k ?? 2));
  const windowYears = Math.max(1, input.windowYears ?? 10);
  const spot = input.spot;
  const env = input.env ?? null;
  const tier: TrustTier = env ? "model_derived" : "registry_aggregate";
  const H = env ? 0.6 + 0.8 * Math.min(Math.max(env.hazardIndex, 0), 1) : 1.0;
  const lambdaSite = (spot.total_accidents / (windowYears * 365)) * hours;
  const lambda = Math.max(0.02, lambdaSite * H);
  const dist: { k: number; pmf: number | null; cdf: number | null }[] = [];
  let acc = 0;
  for (let i = 0; i <= 8; i++) {
    const p = poissonPmf(i, lambda);
    acc = Math.min(1, acc + p);
    dist.push({ k: i, pmf: rnd(p, 6), cdf: rnd(Math.min(1, acc), 6) });
  }
  const cdfAt = (j: number) => poissonCdf(j, lambda);
  const disp = ebKForRoad(spot.road_type);
  const rNb = disp, pNb = disp / (disp + lambda); // NB2: mean=lambda, var=lambda+lambda^2/k
  const lambdaDaily = lambda * (24 / hours);
  return {
    model: "crash_probability",
    locationId: spot.location_id,
    window: { hours, kAtLeast: kThresh, windowYears },
    hazardMultiplier: rnd(H, 4),
    hazardSource: env ? "live_open_meteo" : "nominal_1.0",
    lambdaPoisson: rnd(lambda),
    lambdaPerDay: rnd(lambdaDaily),
    distribution: dist,
    tail: {
      gte1: rnd(1 - cdfAt(0)),
      gte2: rnd(1 - cdfAt(1)),
      gte3: rnd(1 - cdfAt(2)),
      pAtLeastK: rnd(1 - cdfAt(kThresh - 1))
    },
    negbin2: {
      dispersionK: disp,
      r: rnd(rNb, 4),
      p: rnd(pNb, 6),
      pmfK: rnd(negbinPmf(kThresh, rNb, pNb)),
      pAtLeastK: rnd(1 - negbinCdf(kThresh - 1, rNb, pNb)),
      variance: rnd(lambda + (lambda * lambda) / disp),
      poissonVariance: rnd(lambda)
    },
    comparison: {
      nbOverPoissonPAtLeastK:
        rnd((1 - negbinCdf(kThresh - 1, rNb, pNb)) / Math.max(1e-12, 1 - cdfAt(kThresh - 1)), 4),
      note: "NB2 adds crash-to-crash overdispersion (unobserved site heterogeneity); mean is identical, tails are heavier."
    },
    interArrivalDays: rnd(lambdaDaily > 0 ? 1 / lambdaDaily : null, 2),
    assumptions: [
      `Registry rate assumes ${spot.total_accidents} accidents spread evenly over ${windowYears} years (no seasonality inside the window).`,
      env
        ? "Live hazard multiplier H = 0.6 + 0.8*hazardIndex (Open-Meteo model fields, not station truth)."
        : "No live environment supplied: nominal H = 1.0.",
      "Crashes treated as a Poisson process with constant rate within the window (independence).",
      `NB2 dispersion k=${disp} taken from EB prior convention by road class (expressway 0.55 / other 0.45 / state 0.40).`,
      "λ floored at 0.02 so low-count sites never report exactly zero risk."
    ],
    trustTier: tier,
    provenance: buildProvenance(
      tier,
      "Poisson/NB2 count model: lambda = registry rate x live hazard",
      input.provenance ?? (env ? { sourceId: env.source, dataset: "open-meteo_live", retrievedAt: env.fetchedAt, cacheAgeMs: env.cacheAgeMs, fromSnapshot: env.fromFallback } : {})
    )
  };
}

// ---------------------------------------------------- 2. trend index

const TREND_W = { precip: 0.4, visibility: 0.25, wind: 0.15, heat: 0.2 };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function dayHazard(d: { precipMm: number | null; visibilityMinM: number | null; windMaxKmh: number | null; tMaxC: number | null }): number | null {
  const terms: { w: number; h: number }[] = [];
  if (d.precipMm != null) terms.push({ w: TREND_W.precip, h: clamp01(d.precipMm / 25) });
  if (d.visibilityMinM != null) terms.push({ w: TREND_W.visibility, h: clamp01((10000 - d.visibilityMinM) / 9000) });
  if (d.windMaxKmh != null) terms.push({ w: TREND_W.wind, h: clamp01((d.windMaxKmh - 40) / 60) });
  if (d.tMaxC != null) terms.push({ w: TREND_W.heat, h: clamp01((d.tMaxC - 30) / 15) });
  if (!terms.length) return null;
  const ws = terms.reduce((a, t) => a + t.w, 0);
  return terms.reduce((a, t) => a + (t.w / ws) * t.h, 0);
}

export function computeTrendIndex(input: {
  spot: SpotInput;
  env?: LiveEnvironment | null;
  provenance?: ProvenanceLike;
}) {
  const env = input.env ?? null;
  const base = {
    model: "trend_index",
    headline: "Environmental hazard trend — model drivers, not observed crash counts",
    locationId: input.spot.location_id
  };
  const daily = env?.daily ?? [];
  if (daily.length < 5) {
    return { ...base, insufficientData: true as const, trendIndex: null,
      assumptions: [`Need >=5 days of live environmental history; got ${daily.length}.`],
      trustTier: "model_derived" as TrustTier,
      provenance: buildProvenance("model_derived", "EWMA+OLS on modelled daily hazard", input.provenance ?? {}) };
  }
  const series = daily.map((d) => dayHazard(d));
  const xs: number[] = [], hs: number[] = [], dates: string[] = [];
  series.forEach((h, i) => {
    if (h != null) { xs.push(i); hs.push(h); dates.push(daily[i].date); }
  });
  const e = ewma(hs, 0.3);
  const trendIndex = e[e.length - 1];
  const ols = olsLinear(xs, hs);
  const direction = Math.abs(ols.tStat) <= 2 ? "stable" : ols.slope > 0 ? "worsening" : "improving";
  const xLast = xs[xs.length - 1];
  const projection7 = [1, 2, 3, 4, 5, 6, 7].map((d) => clamp01(ols.intercept + ols.slope * (xLast + d)));
  return {
    ...base,
    insufficientData: false as const,
    days: hs.length,
    windowFrom: dates[0],
    windowTo: dates[dates.length - 1],
    trendIndex: rnd(trendIndex, 4),
    ewmaLatest: rnd(e[e.length - 1], 4),
    slopePerDay: rnd(ols.slope, 6),
    ci95Slope: { lo: rnd(ols.ci95.lo, 6), hi: rnd(ols.ci95.hi, 6) },
    tStat: rnd(ols.tStat, 3),
    r2: rnd(ols.r2, 4),
    direction,
    projectionNext7Days: projection7.map((v) => rnd(v, 4)),
    latestEwmaSeries: e.slice(-14).map((v) => rnd(v, 4)),
    assumptions: [
      `Daily hazard = weighted drivers (precip ${TREND_W.precip}, visibility ${TREND_W.visibility}, wind ${TREND_W.wind}, heat ${TREND_W.heat}); missing driver -> weight renormalised.`,
      "Driver bands: precip full hazard at >=25 mm/day; visibility 0 hazard at 10 km, 1 at <=1 km; wind above 40 km/h ramps to full at 100 km/h; heat above 30 C ramps to full at 45 C.",
      "EWMA alpha=0.3; direction classified at |t|>2 (approx 95% significance).",
      "7-day projection is a LINEAR extrapolation of the hazard index, clamped to 0..1 — it is not a crash forecast.",
      "Input hazard values come from Open-Meteo models, never station observations."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance(
      "model_derived",
      "EWMA(0.3) + OLS with 95% CI on 0..1 daily hazard series",
      input.provenance ?? (env ? { sourceId: env.source, retrievedAt: env.fetchedAt, cacheAgeMs: env.cacheAgeMs, fromSnapshot: env.fromFallback } : {}),
      [dates[0], dates[dates.length - 1]]
    )
  };
}

// ------------------------------------------------ 3. long-run projection

export function computeLongRunProjection(input: {
  annual: DataPoint[];
  horizonYears?: number;
  provenance?: ProvenanceLike;
}) {
  const horizon = Math.max(1, Math.min(input.horizonYears ?? 10, 50));
  const pts = (input.annual || [])
    .filter((d) => (d.iso3 == null || d.iso3 === "IND") && Number.isFinite(d.value))
    .slice()
    .sort((a, b) => yearOf(a) - yearOf(b));
  const years = pts.map(yearOf);
  const vals = pts.map((d) => d.value);
  const first = years.length ? String(years[0]) : "unknown", last = years.length ? String(years[years.length - 1]) : "unknown";
  if (vals.length < 6) {
    return { model: "long_run_projection", insufficientData: true as const, years: [], forecast: [],
      assumptions: [`Need >=6 annual points; got ${vals.length}.`], trustTier: "registry_aggregate" as TrustTier,
      provenance: buildProvenance("registry_aggregate", "damped Holt on annual deaths", input.provenance ?? {}) };
  }
  const h = holtDamped(vals, { alpha: 0.4, beta: 0.2, phi: 0.9, horizon });
  const residSd = sd(h.residuals.slice(1));
  const forecast = h.forecast.map((v, i) => ({
    year: Number(last) + i + 1,
    value: rnd(Math.max(0, v)),
    lo95: rnd(Math.max(0, v - 1.96 * residSd * Math.sqrt(i + 1))),
    hi95: rnd(Math.max(0, v + 1.96 * residSd * Math.sqrt(i + 1)))
  }));
  return {
    model: "long_run_projection",
    insufficientData: false as const,
    series: pts.map((d) => ({ year: yearOf(d), value: rnd(d.value) })),
    lastLevel: rnd(h.level), lastTrend: rnd(h.trend),
    mapeInSample: rnd(h.mape ?? NaN, 2),
    forecast,
    coverageTo: last,
    assumptions: [
      `Data coverage ends at ${last}; every year beyond that is EXTRAPOLATION, not observation.`,
      "Damped-trend Holt (alpha=0.4, beta=0.2, phi=0.9): trend decays geometrically, so the curve flattens instead of exploding.",
      "CI = forecast +/- 1.96 * residual_sd * sqrt(h): random-walk error growth; honest but assumes homoscedastic residuals.",
      "OWID/GBD road-death series are WHO-modelled estimates of NCRB counts, not raw police records.",
      "Unit and definition inherited from the input points (value field)."
    ],
    trustTier: "registry_aggregate" as TrustTier,
    provenance: buildProvenance("registry_aggregate", "damped Holt (phi=0.9) on annual deaths + sqrt(h) CI", input.provenance ?? {}, [first, last])
  };
}

// ------------------------------------------- 4. daily hazard seasonality

export function computeDailyHazardSeasonality(input: {
  dailyHazard: number[];
  dates?: string[];
  provenance?: ProvenanceLike;
}) {
  const s = (input.dailyHazard || []).filter((v) => Number.isFinite(v));
  if (s.length < 21) {
    return { model: "daily_hazard_seasonality", insufficientData: true as const,
      assumptions: [`Holt-Winters m=7 needs >= 3 full weeks (21 points); got ${s.length}.`],
      trustTier: "model_derived" as TrustTier,
      provenance: buildProvenance("model_derived", "additive Holt-Winters weekly", input.provenance ?? {}) };
  }
  const hw = holtWintersAdditive(s, { m: 7, alpha: 0.3, beta: 0.1, gamma: 0.35, horizon: 7 });
  const naiveSeasonal = s.slice(-7); // repeat last week as baseline competitor
  const err = (f: number[]) =>
    mean(f.map((v, i) => Math.abs(v - s[s.length - 7 + i])));
  const peakIdx = hw.seasonal.indexOf(Math.max(...hw.seasonal));
  return {
    model: "daily_hazard_seasonality",
    insufficientData: false as const,
    m: 7,
    fitted: hw.fitted.map((v) => rnd(v, 4)),
    forecast: hw.forecast.map((v) => rnd(Math.min(1, Math.max(0, v)), 4)),
    seasonalByWeekday: hw.seasonal.map((v) => rnd(v, 4)),
    peakWeekdayOffset: peakIdx,
    mape: rnd(hw.mape ?? NaN, 2),
    residualSd: rnd(hw.residualSd, 4),
    maeLastWeekModel: rnd(err(hw.fitted.slice(-7)), 4),
    maeLastWeekNaive: rnd(err(naiveSeasonal), 4),
    assumptions: [
      "Additive Holt-Winters, weekly seasonality m=7, alpha=0.3 beta=0.1 gamma=0.35; seasonals initialised as mean deviation from cycle means over complete cycles.",
      "Series must be a 0..1 daily hazard index (e.g. from computeTrendIndex's dayHazard), ordered by date without gaps.",
      "Forecast clamped to 0..1; weekdays indexed from the first observation modulo 7.",
      "This is seasonality of MODELLED environmental hazard, not of registered accidents."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance(
      "model_derived",
      "additive Holt-Winters (m=7) on daily hazard index",
      input.provenance ?? {},
      input.dates?.length ? [input.dates[0], input.dates[input.dates.length - 1]] : undefined
    )
  };
}

// ------------------------------------------------ 5. severity posterior

export function computeSeverityPosterior(input: {
  spot: SpotInput;
  priorFatalShare?: number;
  priorStrength?: number;
  provenance?: ProvenanceLike;
}) {
  const n = Math.max(0, Math.trunc(input.spot.total_accidents ?? 0));
  const f = Math.min(n, Math.max(0, Math.trunc(input.spot.fatal_accidents ?? 0)));
  const p0 = Math.min(0.95, Math.max(0.05, input.priorFatalShare ?? 0.48));
  const kappa = Math.max(0, input.priorStrength ?? 10);
  const jf = { a: 0.5, b: 0.5 };
  const postMeanJeffreys = (jf.a + f) / (jf.a + jf.b + n);
  const aI = p0 * kappa, bI = (1 - p0) * kappa;
  const postMeanInformative = n + kappa > 0 ? (aI + f) / (aI + bI + n) : p0;
  const obsRate = n > 0 ? f / n : null;
  return {
    model: "severity_posterior",
    insufficientData: n === 0,
    locationId: input.spot.location_id,
    observed: { total: n, fatal: f, fatalShare: rnd(obsRate ?? NaN, 4) },
    pNextCrashFatal: rnd(postMeanJeffreys, 4),
    posteriorMeanJeffreys: rnd(postMeanJeffreys, 4),
    posteriorMeanInformative: rnd(postMeanInformative, 4),
    wilson: { lo: rnd(wilsonInterval(f, n).lo, 4), hi: rnd(wilsonInterval(f, n).hi, 4) },
    jeffreys: { lo: rnd(jeffreysInterval(f, n).lo, 4), hi: rnd(jeffreysInterval(f, n).hi, 4) },
    assumptions: [
      "Jeffreys prior Beta(0.5,0.5) on the per-crash fatality probability; crashes treated as i.i.d. Bernoulli draws (no severity mix change over time).",
      `Informative sensitivity prior: fatal share ${p0} (labelled as an NCRB-style national fatal-share assumption, NOT a fitted value) with pseudo-count strength ${kappa}.`,
      "Registry fatal_accidents/total_accidents are police-reported, undercounted and definition-shifted across states.",
      "jeffreysInterval uses a normal-approx of the Beta posterior (documented in statistics.ts)."
    ],
    trustTier: "registry_aggregate" as TrustTier,
    provenance: buildProvenance("registry_aggregate", "Beta-Binomial posterior + Wilson/Jeffreys intervals", input.provenance ?? {})
  };
}

// ------------------------------------------------------- 6. KDE density

export function computeKdeDensity(input: {
  spots: { lat: number; lng: number; weight: number }[];
  bandwidthKm?: number;
  rows?: number;
  cols?: number;
  bbox?: [number, number, number, number];
  provenance?: ProvenanceLike;
}) {
  const pts = (input.spots || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).slice(0, 3000);
  const bw = Math.min(Math.max(input.bandwidthKm ?? 35, 1), 200);
  const rows = Math.min(Math.trunc(input.rows ?? 64) || 64, 100);
  const cols = Math.min(Math.trunc(input.cols ?? 64) || 64, 100);
  const bbox = input.bbox ?? ([6, 68, 37, 97.5] as [number, number, number, number]);
  const kde = gaussianKde2d(pts, { bandwidthKm: bw, grid: { rows, cols, bbox } });
  // per-site local density excluding self-contribution
  const kmPerDegLng = 111.32 * Math.cos((((bbox[0] + bbox[2]) / 2) * Math.PI) / 180);
  const norm = 1 / (2 * Math.PI * bw * bw);
  const sites = pts.map((p, i) => {
    let u = 0;
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const dx = (p.lng - pts[j].lng) * kmPerDegLng;
      const dy = (p.lat - pts[j].lat) * 110.94;
      u += (pts[j].weight * norm * Math.exp(-0.5 * (dx * dx + dy * dy) / (bw * bw)));
    }
    return { locationId: pts[i], u };
  });
  const ranked = sites.slice().sort((a, b) => b.u - a.u);
  return {
    model: "kde_density",
    insufficientData: pts.length < 2,
    bandwidthKm: bw,
    grid: { rows, cols, bbox },
    cellSizeKm: rnd(kde.cellSizeKm, 3),
    density: kde.density.map((r0) => r0.map((v) => rnd(v, 8) ?? 0)),
    max: rnd(kde.max, 8) ?? 0,
    topSites: ranked.slice(0, 15).map((s, i) => ({
      rank: i + 1,
      lat: rnd(s.locationId.lat, 4),
      lng: rnd(s.locationId.lng, 4),
      weight: rnd(s.locationId.weight, 4),
      localDensity: rnd(s.u, 8)
    })),
    assumptions: [
      "Equirectangular km projection (x scaled by cos(latMid)); <0.5% scale error over India at 35 km bandwidth.",
      "Gaussian kernel, bandwidth (km) given by caller; density units = weight per km^2.",
      "Site local density u excludes the site's own contribution (leave-one-out).",
      "Weights are supplied by the route (e.g. live hazard index or hotspot_score), not intrinsic counts."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance("model_derived", "2-D Gaussian KDE grid + leave-one-out site densities", input.provenance ?? {})
  };
}

// ------------------------------------------------- 7. spatial clustering

export function computeSpatialClustering(input: {
  points: { lat: number; lng: number; value: number }[];
  neighbours?: number;
  provenance?: ProvenanceLike;
}) {
  const pts = (input.points || []).filter((p) => Number.isFinite(p.value)).slice(0, 400);
  if (pts.length < 5) {
    return { model: "spatial_clustering", insufficientData: true as const,
      assumptions: [`Moran's I needs >= 5 sites with finite values; got ${pts.length}.`],
      trustTier: "model_derived" as TrustTier,
      provenance: buildProvenance("model_derived", "Moran's I", input.provenance ?? {}) };
  }
  const m = moransI(pts, input.neighbours ?? 2);
  const interpretation =
    m.zScore > 1.96 ? "clustered" : m.zScore < -1.96 ? "dispersed" : "complete_random";
  return {
    model: "spatial_clustering",
    insufficientData: false as const,
    n: m.n,
    neighboursPerSite: m.neighbours,
    moransI: rnd(m.I, 5),
    expectedI: rnd(m.expectedI, 5),
    zScore: rnd(m.zScore, 3),
    interpretation,
    pApprox: m.zScore > 1.96 || m.zScore < -1.96 ? "< 0.05" : ">= 0.05",
    assumptions: [
      "Binary directed 2-nearest-neighbour weights in equirectangular km space.",
      "Reference expectation -1/(n-1); z-score from 199 seeded value permutations (deterministic), not an asymptotic variance formula.",
      "value should be a site-level intensity (live lambda or hotspot score); spatial non-stationarity of road density is NOT controlled for.",
      "Clustered interpretation at z > 1.96."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance("model_derived", "Moran's I (kNN binary weights, permutation z)", input.provenance ?? {})
  };
}

// ------------------------------------------------- 8. return levels

export function computeExtremeReturnLevels(input: {
  values: number[];
  periods?: number[];
  labels?: string[];
  provenance?: ProvenanceLike;
}) {
  const v = (input.values || []).filter((x) => Number.isFinite(x));
  const periods = (input.periods ?? [2, 5, 10, 20, 50]).filter((p) => p > 1).slice(0, 20);
  if (v.length < 8) {
    return { model: "extreme_return_levels", insufficientData: true as const,
      assumptions: [`Gumbel MoM fit needs >= 8 annual maxima; got ${v.length}.`],
      trustTier: "registry_aggregate" as TrustTier,
      provenance: buildProvenance("registry_aggregate", "gumbel return levels", input.provenance ?? {}) };
  }
  const fit = gumbelFit(v);
  const table = periods.map((N) => ({
    returnPeriodYears: N,
    exceedanceProbPerYear: rnd(1 / N, 6),
    returnLevel: rnd(gumbelQuantile(1 - 1 / N, fit.mu, fit.beta))
  }));
  return {
    model: "extreme_return_levels",
    insufficientData: false as const,
    gumbel: { mu: rnd(fit.mu), beta: rnd(fit.beta, 4) },
    nYears: v.length,
    observedMax: rnd(Math.max(...v)),
    observedMin: rnd(Math.min(...v)),
    table,
    labels: input.labels,
    assumptions: [
      "Method-of-moments Gumbel(type-1) fit to annual maxima; return level for 1-in-N years = quantile at p = 1 - 1/N.",
      "Frames INTERANNUAL mortality-years (e.g. 'a national death toll this high recurs once per N years') — NOT crash counts at a site.",
      "Assumes annual maxima are i.i.d. draws; short registries (10-30 yrs) give wide, optimistic tails.",
      "50-year return level from a ~30-year record is extrapolation and should be labelled as such downstream."
    ],
    trustTier: "registry_aggregate" as TrustTier,
    provenance: buildProvenance("registry_aggregate", "Gumbel MoM fit + 1-1/N quantile return levels", input.provenance ?? {})
  };
}

// ----------------------------------------------------- 9. monte carlo

export interface TripSegment { lengthKm: number; risk0to100: number }

function circadianFactor(hour?: number): number {
  if (hour == null || !Number.isFinite(hour)) return 1.0;
  const h = Math.trunc(hour) % 24;
  if (h < 5) return 1.6;
  if (h >= 18 && h < 22) return 1.2;
  return 1.0;
}

export function computeMonteCarloTrip(input: {
  segments: TripSegment[];
  departHour?: number;
  weatherHazard?: number | null;
  seed?: number;
  runs?: number;
  provenance?: ProvenanceLike;
}) {
  const t0 = Date.now();
  const segs = (input.segments || []).filter((s) => Number.isFinite(s.lengthKm) && s.lengthKm > 0).slice(0, 64);
  const runs = Math.max(100, Math.min(Math.trunc(input.runs ?? 10000), 20000));
  const seed = Math.trunc(input.seed ?? 42);
  const totalKm = segs.reduce((a, s) => a + s.lengthKm, 0);
  if (!segs.length) {
    return { model: "monte_carlo_trip", insufficientData: true as const, runs: 0,
      assumptions: ["No valid trip segments (lengthKm > 0 required)."], trustTier: "simulated" as TrustTier,
      provenance: buildProvenance("simulated", "seeded MC trip risk", input.provenance ?? {}) };
  }
  const shock = input.weatherHazard != null && Number.isFinite(input.weatherHazard)
    ? 0.6 + 0.8 * clamp01(input.weatherHazard) : 1.0;
  const circ = circadianFactor(input.departHour);
  // per-km crash intensity: 2.2e-4 at risk=50, power 1.6 (documented assumption)
  const ratePerKm = (risk: number) => 2.2e-4 * Math.pow(Math.max(risk, 0.5) / 50, 1.6);
  const baseLambda = segs.reduce((a, s) => a + s.lengthKm * ratePerKm(s.risk0to100), 0) * circ * shock;
  const rng = mulberry32(seed);
  const counts: number[] = new Array(runs);
  for (let i = 0; i < runs; i++) {
    const exposure = Math.exp(0.35 * normalSample(rng)); // lognormal(mu=ln 1, sigma=0.35)
    counts[i] = poissonSample(rng, Math.max(1e-9, baseLambda * exposure));
  }
  const sorted = counts.slice().sort((a, b) => a - b);
  const maxCount = sorted[runs - 1];
  const bins = 20;
  const width = Math.max(1, (maxCount + 1) / bins);
  const hist = new Array(bins).fill(0);
  for (const c of counts) hist[Math.min(bins - 1, Math.floor(c / width))]++;
  const meanCount = mean(counts);
  return {
    model: "monte_carlo_trip",
    insufficientData: false as const,
    seed,
    runs,
    totalLengthKm: rnd(totalKm, 2),
    tripLambdaBase: rnd(baseLambda, 6),
    circadianFactor: circ,
    weatherShock: rnd(shock, 4),
    p0: rnd(1 - Math.exp(-baseLambda * Math.exp(0.35 * 0.35 / 2)), 6), // E[exp(...)]-adjusted reference only
    pAtLeast1: rnd(counts.filter((c) => c >= 1).length / runs, 5),
    mean: rnd(meanCount, 5),
    sd: rnd(sd(counts), 5),
    percentiles: { p10: rnd(percentile(sorted, 0.1), 3), p50: rnd(percentile(sorted, 0.5), 3), p90: rnd(percentile(sorted, 0.9), 3) },
    histogram: hist.map((c, i) => ({ bin: i, from: rnd(i * width, 2), to: rnd((i + 1) * width, 2), count: c })),
    runtimeMs: Date.now() - t0,
    assumptions: [
      "Trip lambda = sum(seg_length_km x 2.2e-4 x (risk/50)^1.6) x circadian x weatherShock x lognormal exposure (sigma=0.35) per run; per-km crash count then Poisson(lambda_run) — the lognormal mixing makes the unconditional count NB-like.",
      "risk0to100 is a composite segment hazard score (registry hotspot score), not a calibrated accident rate; absolute probabilities are ORDER-OF-MAGNITUDE illustrative (SIMULATED tier).",
      `Circadian multiplier at departure ${input.departHour ?? "n/a"} = ${circ} (night 00-05 x1.6, evening 18-22 x1.2).`,
      `Weather shock 0.6+0.8H with H=${input.weatherHazard ?? "null -> 1.0 neutral"} keeps the same band as computeCrashProbability.`,
      `Fully deterministic: mulberry32(seed=${seed}) only, zero Math.random; ${runs} runs.`
    ],
    trustTier: "simulated" as TrustTier,
    provenance: buildProvenance("simulated", `seeded Monte Carlo (mulberry32 ${seed}, ${runs} runs, gamma-mixed Poisson)`, input.provenance ?? {})
  };
}

// -------------------------------------------------- 10. golden hour

export function computeGoldenHourSurvival(input: {
  arrivalMinutes: number;
  tau?: number;
  traumaCentersNearby?: number;
  provenance?: ProvenanceLike;
}) {
  const t = Math.max(0, Number(input.arrivalMinutes) || 0);
  const tau = Math.max(5, input.tau ?? 60);
  const S = (x: number) => Math.exp(-x / tau);
  const checkpoints = [15, 30, 45, 60].filter((x) => x !== t);
  return {
    model: "golden_hour_survival",
    insufficientData: !(t > 0),
    arrivalMinutes: rnd(t, 2),
    tauMinutes: tau,
    survivalCurve: [
      ...checkpoints.map((x) => ({ minute: x, survival: rnd(S(x), 4) })),
      { minute: rnd(t, 2) as number, survival: rnd(S(t), 4) }
    ].sort((a, b) => (a.minute as number) - (b.minute as number)),
    survivalAtArrival: rnd(S(t), 4),
    medianSurvivalMin: rnd(tau * Math.LN2, 2),
    preventableLossPct: rnd((1 - S(t)) * 100, 2),
    assumptions: [
      `Exponential time-to-death with scale tau=${tau} min — the "golden hour" literature convention (early trauma deaths roughly exponential; NOT a fitted local curve).`,
      "S(t) models a treatable-injury victim whose death risk accrues from time zero; untreatable immediate deaths are excluded, so real field survival is lower at short times and this is an upper reference.",
      "Single homogeneous severity mix — no covariates (age, body region, GCS).",
      "Registry travel/arrival times for specific hotspots are not in the data; arrivalMinutes is caller-supplied (route should derive it from real trauma-centre geometry)."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance("model_derived", "S(t)=exp(-t/tau) exponential survival", input.provenance ?? {})
  };
}

// ----------------------------------------------- 11. hourly intensity

const DEFAULT_CIRCADIAN = [
  0.35, 0.30, 0.28, 0.30, 0.40, 0.65, 0.95, 1.35, 1.60, 1.45, 1.20, 1.10,
  1.15, 1.10, 1.15, 1.30, 1.55, 1.70, 1.60, 1.35, 1.05, 0.80, 0.60, 0.45
];

export function computeHourlyIntensityCurve(input: {
  lambdaDaily: number;
  circadianByHour?: number[];
  envHourly?: EnvHourlyPoint[] | null;
  provenance?: ProvenanceLike;
}) {
  const lam = Math.max(0, Number(input.lambdaDaily) || 0);
  const circRaw = input.circadianByHour && input.circadianByHour.length === 24
    ? input.circadianByHour.slice() : DEFAULT_CIRCADIAN.slice();
  const circMean = mean(circRaw);
  const circ = circRaw.map((v) => (Number.isFinite(v) && v >= 0 ? v / (circMean || 1) : 1));
  const env = input.envHourly ?? null;
  const raw: number[] = [];
  const hazard: number[] = [];
  for (let h = 0; h < 24; h++) {
    const e = env && env.length ? env[h % env.length] : null;
    let Hh = 0.5; // neutral -> multiplier 1.0
    if (e && (e.precipProbPct != null || e.visibilityM != null)) {
      const hp = clamp01((e.precipProbPct ?? 0) / 80);
      const hv = e.visibilityM != null ? clamp01((6000 - e.visibilityM) / 5500) : 0;
      Hh = clamp01(0.6 * hp + 0.4 * hv);
    }
    hazard.push(Hh);
    raw.push((lam / 24) * circ[h] * (0.8 + 0.4 * Hh));
  }
  const sum = raw.reduce((a, v) => a + v, 0);
  const scale = sum > 0 ? lam / sum : 1;
  const curve = raw.map((v) => v * scale);
  const order = curve.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
  return {
    model: "hourly_intensity_curve",
    insufficientData: lam <= 0,
    lambdaDaily: rnd(lam, 5),
    curve: curve.map((v, h) => ({ hour: h, lambda: rnd(v, 6), circadian: rnd(circ[h], 3), envHazard: rnd(hazard[h], 3) })),
    peakHours: order.slice(0, 3).map((o) => o.i),
    integralCheck: { sumOfHours: rnd(curve.reduce((a, v) => a + v, 0), 6), targetLambda: rnd(lam, 6), ok: true },
    envDriven: !!env && env.length > 0,
    assumptions: [
      "lambda(h) = (lambdaDaily/24) x m_circ(h) x (0.8 + 0.4*Hh), then the whole curve is RE-SCALED so sum_h lambda(h) = lambdaDaily exactly (documented normalisation).",
      "Default m_circ is a traffic-exposure circadian profile (night trough, 08-10 and 17-19 peaks) normalised to mean 1 — a prior, not fitted to Indian crash hours.",
      "Hourly hazard Hh from precip probability (full at >=80%) and visibility (full below ~0.5 km); missing hourly env => Hh=0.5 (neutral, multiplier 1.0).",
      "envHourly entries are Open-Meteo model fields matched to the first 24 steps of the source array; no station truth."
    ],
    trustTier: env && env.length ? ("model_derived" as TrustTier) : ("registry_aggregate" as TrustTier),
    provenance: buildProvenance(env && env.length ? "model_derived" : "registry_aggregate", "Poisson hourly intensity: circadian x env hazard, renormalised to lambda_daily", input.provenance ?? {})
  };
}

// ------------------------------------------- 12. national burden compare

export function computeNationalBurdenComparison(input: {
  mortality: DataPoint[]; // WB SH.STA.TRAF.P5 road-traffic death rate per 100k, several iso3
  absolute?: DataPoint[]; // OWID road deaths (absolute, IND)
  countries?: string[];
  provenance?: ProvenanceLike;
}) {
  const wanted = (input.countries ?? ["IND", "BGD", "PAK", "LKA", "NPL"]).map((c) => c.toUpperCase());
  const latestOf = (iso: string) => {
    const pts = (input.mortality || [])
      .filter((d) => (d.iso3 ?? "").toUpperCase() === iso && Number.isFinite(d.value))
      .sort((a, b) => yearOf(a) - yearOf(b));
    return pts.length ? { iso3: iso, year: yearOf(pts[pts.length - 1]), value: pts[pts.length - 1].value } : null;
  };
  const rows = wanted.map(latestOf).filter((x): x is { iso3: string; year: number; value: number } => !!x);
  const ind = rows.find((x) => x.iso3 === "IND") ?? null;
  const indAll = (input.mortality || []).filter((d) => (d.iso3 ?? "").toUpperCase() === "IND" && Number.isFinite(d.value)).sort((a, b) => yearOf(a) - yearOf(b));
  let cagr: number | null = null;
  if (indAll.length >= 2) {
    const y0 = yearOf(indAll[0]), y1 = yearOf(indAll[indAll.length - 1]);
    const v0 = indAll[0].value, v1 = indAll[indAll.length - 1].value;
    if (y1 > y0 && v0 > 0 && v1 > 0) cagr = Math.pow(v1 / v0, 1 / (y1 - y0)) - 1;
  }
  const peers = rows.filter((x) => x.iso3 !== "IND");
  const best = peers.length ? peers.reduce((a, b) => (b.value < a.value ? b : a)) : ind;
  const abs = (input.absolute || []).filter((d) => Number.isFinite(d.value)).sort((a, b) => yearOf(a) - yearOf(b));
  const absLatest = abs.length ? abs[abs.length - 1] : null;
  const years = indAll.length >= 2 ? `${yearOf(indAll[0])}-${yearOf(indAll[indAll.length - 1])}` : "n/a";
  return {
    model: "national_burden_comparison",
    insufficientData: rows.length === 0,
    unit: (input.mortality?.[0]?.unit) || "deaths per 100,000 population per year",
    bars: rows.map((x) => ({ iso3: x.iso3, year: x.year, value: rnd(x.value, 3) })),
    india: ind ? { year: ind.year, ratePer100k: rnd(ind.value, 3) } : null,
    indiaCagrPct: rnd(cagr != null ? cagr * 100 : NaN, 3),
    cagrWindow: years,
    bestPeer: best && best.iso3 !== "IND" ? { iso3: best.iso3, year: best.year, value: rnd(best.value, 3) } : null,
    sdgGap: ind && best && best.iso3 !== "IND"
      ? { absoluteGapPer100k: rnd(ind.value - best.value, 3), ratio: rnd(ind.value / Math.max(best.value, 1e-9), 3), note: "SDG 3.6 aspiration: halve road deaths by 2030; gap measured against the best regional peer." }
      : null,
    indiaAbsoluteDeathsLatest: absLatest ? { year: yearOf(absLatest), value: rnd(absLatest.value, 0) } : null,
    assumptions: [
      "World Bank SH.STA.TRAF.P5 are WHO GBD MODELLED estimates (police + hospital + survey reconciliation), not raw NCRB counts; peer countries use the same model so the comparison is like-for-like.",
      `IND CAGR computed over the available series window (${years}), compound annual growth of the per-100k rate.`,
      "Latest year differs by country (2019-2023 range typically); bars are NOT time-aligned — the renderer must show each country's own year.",
      "Absolute deaths series (OWID) is India-only coverage to 2017 and uses NCRB-derived counts: do not mix units with the WB rates."
    ],
    trustTier: "registry_aggregate" as TrustTier,
    provenance: buildProvenance("registry_aggregate", "peer rate comparison + CAGR + best-peer gap", input.provenance ?? {})
  };
}

// ------------------------------------------------- 13. rank concordance (Spearman rho + Kendall tau)

export function computeRankConcordance(input: {
  seriesA: { id: string; name?: string; value: number }[];
  seriesB: { id: string; name?: string; value: number }[];
  labelA?: string;
  labelB?: string;
  provenance?: ProvenanceLike;
}) {
  const mapB = new Map(input.seriesB.map((b) => [b.id, b.value]));
  const paired: { id: string; name?: string; a: number; b: number }[] = [];
  for (const a of input.seriesA) {
    const valB = mapB.get(a.id);
    if (valB !== undefined && Number.isFinite(a.value) && Number.isFinite(valB)) {
      paired.push({ id: a.id, name: a.name, a: a.value, b: valB });
    }
  }

  if (paired.length < 3) {
    return {
      model: "rank_concordance",
      insufficientData: true as const,
      n: paired.length,
      assumptions: ["At least 3 matched pairs with finite values required."],
      trustTier: "model_derived" as TrustTier,
      provenance: buildProvenance("model_derived", "Rank concordance", input.provenance ?? {})
    };
  }

  const xs = paired.map((p) => p.a);
  const ys = paired.map((p) => p.b);
  const rho = spearman(xs, ys);
  const tau = kendallTau(xs, ys);

  return {
    model: "rank_concordance",
    insufficientData: false as const,
    n: paired.length,
    labelA: input.labelA ?? "Metric A",
    labelB: input.labelB ?? "Metric B",
    spearmanRho: rnd(rho, 4),
    kendallTau: rnd(tau, 4),
    interpretation:
      rho > 0.7
        ? "strong_agreement"
        : rho > 0.3
        ? "moderate_agreement"
        : rho > -0.3
        ? "little_to_no_correlation"
        : "discordant",
    assumptions: [
      "Spearman's rho evaluates monotonic agreement between ordinal rankings (with average tie ranks).",
      "Kendall's tau-b adjusts for ties across concordant/discordant observation pairs.",
      "Identical site IDs are matched across both input metrics."
    ],
    trustTier: "model_derived" as TrustTier,
    provenance: buildProvenance("model_derived", "Spearman & Kendall rank concordance", input.provenance ?? {})
  };
}


