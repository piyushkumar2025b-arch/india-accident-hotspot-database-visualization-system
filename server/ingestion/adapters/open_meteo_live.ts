/**
 * ============================================================================
 * OPEN-METEO LIVE TELEMETRY — thin fetch + parse layer (leaf module)
 * Composes the forecast API (temperature, dewpoint, visibility, precip, wind,
 * pressure, weather code) with the air-quality API (PM2.5 / US AQI / ozone).
 *
 * Returns RAW measurements only. The hazard index and saturation deficit are
 * derived in store.ts. Never station truth — always CAMS/ECMWF model grid.
 * ============================================================================
 */

import type { EnvDailyPoint, EnvHourlyPoint } from "../types";

export interface LiveEnvironmentRaw {
  latitude: number;
  longitude: number;
  temperatureC: number | null;
  dewPointC: number | null;
  humidityPct: number | null;
  visibilityM: number | null;
  precipMm: number | null;
  precipProbPct: number | null;
  windKmh: number | null;
  weatherCode: number | null;
  surfacePressureHpa: number | null;
  pm25: number | null;
  usAqi: number | null;
  ozone: number | null;
  daily: EnvDailyPoint[];
  hourly: EnvHourlyPoint[];
  fetchedAt: string;
}

const FORECAST_CURRENT =
  "temperature_2m,dew_point_2m,relative_humidity_2m,visibility,precipitation,weather_code,wind_speed_10m,surface_pressure";
const FORECAST_HOURLY = "visibility,precipitation_probability";
const FORECAST_DAILY = "precipitation_sum,temperature_2m_max,wind_speed_10m_max,visibility_min";
const AQ_CURRENT = "pm2_5,us_aqi,ozone";

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function fetchJson(url: string, timeoutMs: number): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`open-meteo ${res.status} for ${url.slice(0, 64)}`);
  return (await res.json()) as Record<string, unknown>;
}

/** Parse the forecast JSON into current + per-day + per-hour series. */
function parseForecast(json: Record<string, unknown>, lat: number, lng: number): Partial<LiveEnvironmentRaw> {
  const cur = (json.current ?? {}) as Record<string, unknown>;
  const daily = (json.daily ?? {}) as Record<string, unknown[]>;
  const hourly = (json.hourly ?? {}) as Record<string, unknown[]>;

  const out: Partial<LiveEnvironmentRaw> = {
    latitude: lat,
    longitude: lng,
    temperatureC: num(cur.temperature_2m),
    dewPointC: num(cur.dew_point_2m),
    humidityPct: num(cur.relative_humidity_2m),
    visibilityM: num(cur.visibility),
    precipMm: num(cur.precipitation),
    windKmh: num(cur.wind_speed_10m),
    weatherCode: num(cur.weather_code),
    surfacePressureHpa: num(cur.surface_pressure),
  };

  const times = (daily.time ?? []) as string[];
  const envDaily: EnvDailyPoint[] = times.map((date, i) => ({
    date,
    precipMm: num((daily.precipitation_sum ?? [])[i]),
    tMaxC: num((daily.temperature_2m_max ?? [])[i]),
    windMaxKmh: num((daily.wind_speed_10m_max ?? [])[i]),
    // Open-Meteo exposes daily.visibility_min directly (metres).
    visibilityMinM: num((daily.visibility_min ?? [])[i]),
  }));
  out.daily = envDaily;

  const hTimes = (hourly.time ?? []) as string[];
  const envHourly: EnvHourlyPoint[] = hTimes.map((time, i) => ({
    time,
    visibilityM: num((hourly.visibility ?? [])[i]),
    precipProbPct: num((hourly.precipitation_probability ?? [])[i]),
  }));
  out.hourly = envHourly;

  // Current precipitation-probability has no dedicated field; take the current hour.
  const nowIso = String(cur.time ?? "");
  if (nowIso && envHourly.length) {
    const match = envHourly.find((h) => h.time.startsWith(nowIso.slice(0, 13)));
    if (match) out.precipProbPct = match.precipProbPct;
  }
  return out;
}

/**
 * Fetch live environment for one coordinate. Forecast is required; if it fails
 * the call throws. Air quality is best-effort (null PM2.5 on failure).
 */
export async function fetchLiveEnvironment(
  lat: number,
  lng: number,
  opts: { pastDays?: number; forecastDays?: number; timeoutMs?: number } = {}
): Promise<LiveEnvironmentRaw> {
  if (process.env.INGEST_OFFLINE === "1") throw new Error("INGEST_OFFLINE=1");
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const pastDays = opts.pastDays ?? 1;
  const forecastDays = opts.forecastDays ?? 7;

  const fcUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=${FORECAST_CURRENT}&hourly=${FORECAST_HOURLY}&daily=${FORECAST_DAILY}` +
    `&past_days=${pastDays}&forecast_days=${forecastDays}&timezone=Asia%2FKolkata`;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    `&current=${AQ_CURRENT}&timezone=Asia%2FKolkata`;

  const [fcJson, aqJson] = await Promise.all([
    fetchJson(fcUrl, timeoutMs),
    fetchJson(aqUrl, timeoutMs).catch(() => null),
  ]);

  const fc = parseForecast(fcJson, lat, lng);
  const aqCur = ((aqJson?.current ?? {}) as Record<string, unknown>) ?? {};

  return {
    latitude: fc.latitude ?? lat,
    longitude: fc.longitude ?? lng,
    temperatureC: fc.temperatureC ?? null,
    dewPointC: fc.dewPointC ?? null,
    humidityPct: fc.humidityPct ?? null,
    visibilityM: fc.visibilityM ?? null,
    precipMm: fc.precipMm ?? null,
    precipProbPct: fc.precipProbPct ?? null,
    windKmh: fc.windKmh ?? null,
    weatherCode: fc.weatherCode ?? null,
    surfacePressureHpa: fc.surfacePressureHpa ?? null,
    pm25: num(aqCur.pm2_5),
    usAqi: num(aqCur.us_aqi),
    ozone: num(aqCur.ozone),
    daily: fc.daily ?? [],
    hourly: fc.hourly ?? [],
    fetchedAt: new Date().toISOString(),
  };
}
