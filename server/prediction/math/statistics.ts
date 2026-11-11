/**
 * ============================================================================
 * STATISTICS KERNEL — pure TS, zero dependencies, zero I/O, zero network.
 * Every function is deterministic; the only randomness is seeded (mulberry32).
 * ============================================================================
 * Conventions:
 *  - Negative binomial is NB2: mean m, dispersion k, Var = m + m^2/k.
 *    Implemented as NB(r, p) counting FAILURES before r successes with
 *    r = k (the "size"/aggregation parameter) and p = k / (k + m).
 *    Then E = r(1-p)/p = m and Var = m(1-p) = m + m^2/k exactly.
 *  - All pmf/cdf work in log-space (Lanczos logGamma) to survive large k, r.
 */

// ---------------------------------------------------------------- core math

/** Lanczos g=7, n=9 approximation of ln Gamma(x), valid x > 0 (reflection x < 0.5). */
export function logGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526239863, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    // reflection formula: Gamma(x)Gamma(1-x) = pi / sin(pi x)
    return (
      Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
    );
  }
  const z = x - 1;
  let a = c[0];
  const t = z + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Abramowitz & Stegun 7.1.26, |error| < 1.5e-7 (4-sigma range is all we need). */
export function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return s * y;
}

/** Acklam's inverse-normal CDF approximation (canonical coeffs), + one Halley refinement. */
export function normalQuantile(p: number): number {
  if (!(p > 0) || !(p < 1)) return p <= 0 ? -Infinity : Infinity;
  const a = [-3.969615821104979e1, 2.20946035560869e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 1.097804990302568];
  const b = [-5.447609879822402e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1, 1];
  const c = [-7.784894002430293e-4, -3.223964580411365e-1, -2.400758277161838e-1, -2.549732539343734e-1, 4.374664141464968e-1, 2.938163982698783e1];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.421392294587428e-1, 2.872908573764874e-1, 1];
  const pl = 0.02425, pu = 1 - pl;
  const horner = (co: number[], x: number): number => {
    let v = co[0];
    for (let i = 1; i < co.length; i++) v = v * x + co[i];
    return v;
  };
  let x0: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x0 = horner(c, q) / horner(d, q);
  } else if (p > pu) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x0 = -horner(c, q) / horner(d, q);
  } else {
    const q = p - 0.5;
    x0 = (horner(a, q * q) * q) / horner(b, q * q);
  }
  // one Halley refinement: e = Phi(x0) - p
  const e = 0.5 * (1 + erf(x0 / Math.SQRT2)) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x0 * x0) / 2);
  return u === 0 ? x0 : x0 - u / (1 + (x0 * u) / 2);
}

/** Standard-normal pdf. */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Two-sided student-t 0.975 quantile approximation via Cornish-Fisher
 * expansion of the normal quantile (df >= 1). Accuracy ~0.1% for df>=8,
 * ~1% for df 1..4 — acceptable for small-sample CI reporting; documented.
 */
export function tQuantile975(df: number): number {
  const z = normalQuantile(0.975);
  const g1 = (z ** 3 + z) / 4;
  const g2 = (5 * z ** 7 + 16 * z ** 3 + 3 * z) / 96;
  const g3 = (3 * z ** 9 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / 384;
  const g4 = (79 * z ** 11 + 482 * z ** 7 + 1320 * z ** 5 + 1075 * z ** 3 - 336 * z) / 92160;
  return z + g1 / df + g2 / df ** 2 + g3 / df ** 3 + g4 / df ** 4;
}

// ------------------------------------------------------------------- moments

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample variance (n-1 denominator); population=true uses n. */
export function variance(xs: number[], population = false): number {
  const n = xs.length;
  if (n < (population ? 1 : 2)) return NaN;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (population ? n : n - 1);
}

export function sd(xs: number[], population = false): number {
  return Math.sqrt(variance(xs, population));
}

/** Type-7 (R default / linear interpolation) percentile on a pre-sorted array. */
export function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, n - 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

// ------------------------------------------------------------------ countable

/** Poisson pmf, log-space. lambda<=0 => point mass at 0. */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isFinite(k)) return 0;
  const kk = Math.trunc(k);
  if (lambda <= 0) return kk === 0 ? 1 : 0;
  return Math.exp(kk * Math.log(lambda) - lambda - logGamma(kk + 1));
}

/** Poisson CDF P(X<=k) by direct summation (exact for the range we use). */
export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0;
  const kk = Math.trunc(k);
  let acc = 0;
  for (let i = 0; i <= kk; i++) acc += poissonPmf(i, lambda);
  return Math.min(1, acc);
}

/** NB2 pmf from mean m and dispersion k via r=k, p=k/(k+m) failure-counting form. */
export function negbinPmf(kObs: number, r: number, p: number): number {
  if (kObs < 0 || !(r > 0) || !(p > 0) || !(p < 1)) return 0;
  const k = Math.trunc(kObs);
  return Math.exp(
    logGamma(k + r) - logGamma(r) - logGamma(k + 1) + r * Math.log(p) + k * Math.log(1 - p)
  );
}

/** NB CDF P(X<=k) accumulating pmf 0..k; caps at kMax=200000 (returns ~1). */
export function negbinCdf(k: number, r: number, p: number): number {
  if (k < 0) return 0;
  const kk = Math.min(Math.trunc(k), 200000);
  let pmf = Math.exp(r * Math.log(p)); // pmf(0)
  let acc = pmf;
  for (let j = 1; j <= kk; j++) {
    pmf *= ((j - 1 + r) / j) * (1 - p); // stable recursion
    acc += pmf;
    if (pmf < 1e-18 && j > r * (1 - p) / p) break; // past the mode, negligible tail
  }
  return Math.min(1, acc);
}

// -------------------------------------------------------------------- gumbel

/** Method-of-moments Gumbel(max) fit: beta = s*sqrt(6)/pi, mu = xbar - euler*beta. */
export function gumbelFit(samples: number[]): { mu: number; beta: number } {
  const s = sd(samples);
  const beta = (s * Math.sqrt(6)) / Math.PI;
  return { mu: mean(samples) - 0.5772156649015329 * beta, beta };
}

/** Gumbel inverse-CDF; return level for 1-in-N years => gumbelQuantile(1-1/N,...). */
export function gumbelQuantile(p: number, mu: number, beta: number): number {
  if (!(p > 0) || !(p < 1)) return NaN;
  return mu - beta * Math.log(-Math.log(p));
}

// ---------------------------------------------------------------- regression

export interface OlsResult {
  slope: number;
  intercept: number;
  seSlope: number;
  r2: number;
  tStat: number;
  ci95: { lo: number; hi: number };
  n: number;
}

/** Ordinary least squares y = a + b x; 95% CI via tQuantile975(n-2) expansion. */
export function olsLinear(xs: number[], ys: number[]): OlsResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) throw new Error("olsLinear: need n>=3");
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const e = ys[i] - (intercept + slope * xs[i]);
    sse += e * e;
  }
  const s2 = sse / (n - 2);
  const seSlope = Math.sqrt(s2 / sxx);
  const r2 = syy === 0 ? 1 : 1 - sse / syy;
  const tStat = slope / seSlope;
  const tc = tQuantile975(n - 2);
  return { slope, intercept, seSlope, r2, tStat, ci95: { lo: slope - tc * seSlope, hi: slope + tc * seSlope }, n };
}

/** Average ranks (ties -> mean rank). */
function ranks(xs: number[]): number[] {
  const idx = xs.map((v, i) => i).sort((i, j) => xs[i] - xs[j]);
  const out = new Array(xs.length).fill(0);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && xs[idx[j + 1]] === xs[idx[i]]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k]] = r;
    i = j + 1;
  }
  return out;
}

/** Spearman rho = Pearson on tie-averaged ranks (the average-rank form IS the tie correction). */
export function spearman(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  const rx = ranks(xs.slice(0, n)), ry = ranks(ys.slice(0, n));
  const mrx = mean(rx), mry = mean(ry);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const a = rx[i] - mrx, b = ry[i] - mry;
    sxy += a * b; sxx += a * a; syy += b * b;
  }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

/** Kendall tau-b (tie-corrected), O(n^2); fine for n <= ~120. */
export function kendallTau(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  let sc = 0, n1 = 0, n2 = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Math.sign(xs[i] - xs[j]), dy = Math.sign(ys[i] - ys[j]);
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) { n1++; continue; }
      if (dy === 0) { n2++; continue; }
      sc += dx * dy;
    }
  }
  const n0 = (n * (n - 1)) / 2;
  const den = Math.sqrt((n0 - n1) * (n0 - n2));
  return den === 0 ? 0 : sc / den;
}

// ------------------------------------------------------------------- binomial

/** Wilson score interval for a proportion, z default 1.96 (95%). */
export function wilsonInterval(k: number, n: number, z = 1.96): { lo: number; hi: number } {
  if (n <= 0) return { lo: 0, hi: 1 };
  const ph = k / n;
  const d = 1 + (z * z) / n;
  const c = (ph + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((ph * (1 - ph)) / n + (z * z) / (4 * n * n))) / d;
  return { lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
}

/**
 * Jeffreys interval: posterior Beta(k+0.5, n-k+0.5) summarized by its
 * NORMAL-APPROX quantiles mu +/- 1.96 sigma (mu = (k+.5)/(n+1),
 * sigma^2 = mu(1-mu)/(n+2)) — not the exact beta quantile; good for n >= 10.
 */
export function jeffreysInterval(k: number, n: number): { lo: number; hi: number } {
  if (n <= 0) return { lo: 0, hi: 1 };
  const mu = (k + 0.5) / (n + 1);
  const sig = Math.sqrt((mu * (1 - mu)) / (n + 2));
  return { lo: Math.max(0, mu - 1.96 * sig), hi: Math.min(1, mu + 1.96 * sig) };
}

// ----------------------------------------------------------------- smoothing

/** Exponentially weighted moving average, returns full smoothed series (seeded with x[0]). */
export function ewma(series: number[], alpha: number): number[] {
  const out: number[] = [];
  let e = series.length ? series[0] : NaN;
  for (let i = 0; i < series.length; i++) {
    e = i === 0 ? series[0] : alpha * series[i] + (1 - alpha) * e;
    out.push(e);
  }
  return out;
}

export interface HoltDampedResult {
  level: number;
  trend: number;
  forecast: number[];
  fitted: number[];
  residuals: number[];
  mape: number | null;
}

/** Damped-trend Holt: l = a*x + (1-a)*(l + phi*b); b = beta*(l-lprev) + (1-beta)*phi*b. */
export function holtDamped(
  series: number[],
  opts: { alpha?: number; beta?: number; phi?: number; horizon?: number } = {}
): HoltDampedResult {
  const alpha = opts.alpha ?? 0.4, beta = opts.beta ?? 0.2, phi = opts.phi ?? 0.9;
  const horizon = opts.horizon ?? 10;
  const n = series.length;
  if (n < 3) throw new Error("holtDamped: need n>=3");
  let l = series[0];
  let b = series[1] - series[0];
  const fitted: number[] = [series[0]];
  for (let t = 1; t < n; t++) {
    const lp = l + phi * b;
    fitted.push(lp);
    const lnew = alpha * series[t] + (1 - alpha) * lp;
    b = beta * (lnew - l) + (1 - beta) * phi * b;
    l = lnew;
  }
  const forecast: number[] = [];
  let cum = 0;
  for (let h = 1; h <= horizon; h++) {
    cum += phi ** h;
    forecast.push(l + b * cum);
  }
  const residuals = series.map((y, t) => y - fitted[t]);
  const ape: number[] = [];
  for (let t = 1; t < n; t++) if (Math.abs(series[t]) > 1e-12) ape.push(Math.abs(residuals[t] / series[t]) * 100);
  const mape = ape.length ? mean(ape) : null;
  return { level: l, trend: b, forecast, fitted, residuals, mape };
}

export interface HoltWintersResult {
  fitted: number[];
  forecast: number[];
  seasonal: number[];
  mape: number | null;
  residualSd: number;
}

/**
 * Additive Holt-Winters. Seasonal init = deviation-from-cycle-mean averaged
 * over complete cycles; REQUIRES series.length >= 2*m (throws otherwise).
 */
export function holtWintersAdditive(
  series: number[],
  opts: { m: number; alpha?: number; beta?: number; gamma?: number; horizon?: number }
): HoltWintersResult {
  const m = opts.m, alpha = opts.alpha ?? 0.3, beta = opts.beta ?? 0.1, gamma = opts.gamma ?? 0.35;
  const horizon = opts.horizon ?? m;
  if (m < 2) throw new Error("holtWintersAdditive: m must be >= 2");
  if (series.length < 2 * m) throw new Error("holtWintersAdditive: need series.length >= 2*m");
  const n = series.length;
  // season/level init from complete cycles
  const cycles = Math.floor(n / m);
  const season: number[] = new Array(m).fill(0);
  for (let c = 0; c < cycles; c++) {
    const cm = mean(series.slice(c * m, c * m + m));
    for (let j = 0; j < m; j++) season[j] += series[c * m + j] - cm;
  }
  for (let j = 0; j < m; j++) season[j] /= cycles;
  let l = mean(series.slice(0, m));
  let b = cycles >= 2 ? (mean(series.slice(m, 2 * m)) - mean(series.slice(0, m))) / m : 0;
  const fitted: number[] = [];
  const s = season.slice();
  for (let t = 0; t < n; t++) {
    const st = t - m >= 0 ? s[t - m] : s[t % m]; // in-cycle seasonals for first m steps
    fitted.push(l + b + st);
    const lnew = alpha * (series[t] - st) + (1 - alpha) * (l + b);
    b = beta * (lnew - l) + (1 - beta) * b;
    l = lnew;
    s[t] = gamma * (series[t] - lnew) + (1 - gamma) * st;
  }
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    forecast.push(l + h * b + s[n - m + ((h - 1) % m)]);
  }
  const residuals = series.map((y, t) => y - fitted[t]);
  const ape: number[] = [];
  for (let t = 0; t < n; t++) if (Math.abs(series[t]) > 1e-12) ape.push(Math.abs(residuals[t] / series[t]) * 100);
  const mape = ape.length ? mean(ape) : null;
  return { fitted, forecast, seasonal: s.slice(n - m), mape, residualSd: sd(residuals.slice(m)) };
}

// ---------------------------------------------------------------- spatial

export interface KdePoint { lat: number; lng: number; weight: number }
export interface KdeGridBox { rows: number; cols: number; bbox: [number, number, number, number] }
export interface KdeResult { density: number[][]; max: number; cellSizeKm: number }

const KM_PER_DEG_LAT = 110.94;

/**
 * 2-D Gaussian KDE on a regular grid. Equirectangular approximation:
 * x_km = (lng - west) * 111.320 * cos(latMid), y_km = (lat - south) * 110.94.
 * Accuracy note: < 0.5% x-scale error across India's 6-37 N latitude span
 * when latMid is the bbox centre; good enough for 35 km-bandwidth hotspots.
 * density[row][col], row 0 = northernmost band, col 0 = westernmost.
 */
export function gaussianKde2d(
  points: KdePoint[],
  opts: { bandwidthKm: number; grid: KdeGridBox }
): KdeResult {
  const { rows, cols, bbox } = opts.grid;
  const [s, w, n, e] = bbox;
  const bw = Math.max(0.5, opts.bandwidthKm);
  const latMid = (s + n) / 2;
  const kmPerDegLng = 111.32 * Math.cos((latMid * Math.PI) / 180);
  const xSpan = (e - w) * kmPerDegLng, ySpan = (n - s) * KM_PER_DEG_LAT;
  const cellX = xSpan / cols, cellY = ySpan / rows;
  const density: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const norm = 1 / (2 * Math.PI * bw * bw);
  const reach = 3 * bw; // truncate kernel at 3 sigma
  for (const p of points) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
    const wt = Number.isFinite(p.weight) ? p.weight : 1;
    const px = (p.lng - w) * kmPerDegLng, py = (p.lat - s) * KM_PER_DEG_LAT;
    const c0 = Math.max(0, Math.floor((px - reach) / cellX));
    const c1 = Math.min(cols - 1, Math.ceil((px + reach) / cellX));
    const r0 = Math.max(0, Math.floor((py - reach) / cellY));
    const r1 = Math.min(rows - 1, Math.ceil((py + reach) / cellY));
    for (let r = r0; r <= r1; r++) {
      const dy = (r + 0.5) * cellY - py;
      for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5) * cellX - px;
        density[r][c] += (wt * norm * Math.exp(-0.5 * (dx * dx + dy * dy) / (bw * bw))) / (cellX * cellY);
      }
    }
  }
  let max = 0;
  for (const row of density) for (const v of row) if (v > max) max = v;
  return { density, max, cellSizeKm: (cellX + cellY) / 2 };
}

export interface MoranPoint { lat: number; lng: number; value: number }
export interface MoranResult { I: number; expectedI: number; zScore: number; n: number; neighbours: number }

/**
 * Moran's I with BINARY weights: each site links to its `neighbours`
 * (default 2) nearest points (kNN, directed, distance in equirect km).
 * expectedI = -1/(n-1); zScore uses a 199-run PERMUTATION null driven by
 * mulberry32(0xC0FFEE) so it is deterministic, not an asymptotic variance
 * approximation. n<5 -> I=0, z=0.
 */
export function moransI(points: MoranPoint[], neighbours = 2): MoranResult {
  const n = points.length;
  const expectedI = n > 1 ? -1 / (n - 1) : 0;
  if (n < 5) return { I: 0, expectedI, zScore: 0, n, neighbours };
  const kmPerDegLng = 111.32 * Math.cos((mean(points.map((p) => p.lat)) * Math.PI) / 180);
  const xs = points.map((p) => p.lng * kmPerDegLng), ys = points.map((p) => p.lat * KM_PER_DEG_LAT);
  // directed binary kNN weight matrix as neighbour index lists
  const nbr: number[][] = [];
  for (let i = 0; i < n; i++) {
    const ds = points
      .map((_, j) => ({ j, d: (xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, neighbours);
    nbr.push(ds.map((o) => o.j));
  }
  let s0 = 0;
  for (const row of nbr) s0 += row.length;
  const mx = mean(points.map((p) => p.value));
  const devs = points.map((p) => p.value - mx);
  const denom = devs.reduce((a, d) => a + d * d, 0);
  if (denom === 0 || s0 === 0) return { I: 0, expectedI, zScore: 0, n, neighbours };
  const computeI = (v: number[]): number => {
    const m = mean(v);
    const dd = v.map((x) => x - m);
    let num = 0;
    for (let i = 0; i < n; i++) for (const j of nbr[i]) num += dd[i] * dd[j];
    const den = dd.reduce((a, d) => a + d * d, 0);
    return den === 0 ? 0 : ((n / s0) * num) / den;
  };
  const I = computeI(devs.map((d) => d + mx));
  // permutation null (deterministic seeded shuffle)
  const rng = mulberry32(0xc0ffee);
  const permI: number[] = [];
  const pool = points.map((p) => p.value);
  for (let r = 0; r < 199; r++) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    permI.push(computeI(pool));
  }
  const z = sd(permI) === 0 ? 0 : (I - mean(permI)) / sd(permI);
  return { I, expectedI, zScore: z, n, neighbours };
}

// ----------------------------------------------------------------- prng etc.

/** mulberry32: fast deterministic 32-bit PRNG in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box-Muller using the supplied rng (never Math.random). */
export function normalSample(rng: () => number): number {
  let u = 0;
  while (u <= 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Marsaglia-Tsang gamma sampler (shape >= 1); shape < 1 uses the boost
 * trick Gamma(a) = Gamma(a+1) * U^(1/a). scale = theta (mean = shape*theta).
 */
export function gammaSample(rng: () => number, shape: number, scale = 1): number {
  if (!(shape > 0) || !(scale > 0)) return 0;
  if (shape < 1) {
    const u = Math.max(rng(), 1e-300);
    return gammaSample(rng, shape + 1, scale) * u ** (1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = normalSample(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.max(rng(), 1e-300);
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}

/**
 * Poisson sampler. Knuth's multiplicative method for lambda <= 30; for
 * lambda > 30 we SPLIT: X = sum of ceil(lambda/30) iid Poisson(lambda/K)
 * (exact by infinite divisibility, deterministic, avoids PTR bugs).
 */
export function poissonSample(rng: () => number, lambda: number): number {
  if (!(lambda > 0)) return 0;
  if (lambda <= 30) {
    const L = Math.exp(-lambda);
    let k = 0, prod = 1;
    do {
      k++;
      prod *= Math.max(rng(), 1e-300);
    } while (prod > L);
    return k - 1;
  }
  const K = Math.ceil(lambda / 30);
  const sub = lambda / K;
  let acc = 0;
  for (let i = 0; i < K; i++) acc += poissonSample(rng, sub);
  return acc;
}
