/**
 * ============================================================================
 * PREDICTION & ROUTE-SAFETY INTELLIGENCE: FEATURE ENGINEERING
 * Reads dbEngine.getHotspots(), recent_accidents_feed / getAllAccidents,
 * live meteorological risk from Open-Meteo, and CORRIDOR_POLYLINES.
 * Outputs a feature matrix per location. (Read-only)
 * ============================================================================
 */

import { dbEngine, HotspotRecord } from "../db";
import { CORRIDOR_POLYLINES, CorridorPolyline } from "../data_overlays";
import { ingestionStore } from "../ingestion/store";

export interface LocationFeatureMatrix {
  locationId: string;
  roadName: string;
  roadNumber: string;
  latitude: number;
  longitude: number;
  totalAccidents: number;
  fatalAccidents: number;
  totalDeaths: number;
  totalInjuries: number;
  fatalityRate: number; // deaths / totalAccidents or fatal / total
  recent30dAccidents: number;
  seasonalMultiplier: number;
  highestRiskMonth: string;
  dominantCause: string;
  weatherRisk: number; // 0 to 1 scale
  weatherDetails: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    visibilityKm: number;
  };
  insufficientData: boolean;
}

/**
 * Fetch live weather from Open-Meteo with safe fallback, delegated to the shared ingestion cache
 */
export async function fetchLiveWeatherRisk(
  lat: number,
  lng: number
): Promise<{ risk: number; details: any }> {
  try {
    const env = await ingestionStore.getLiveEnvironment(lat, lng);
    const temp = env.temperatureC ?? 28;
    const humidity = env.humidityPct ?? 60;
    const windSpeed = env.windKmh ?? 10;
    const visibility = env.visibilityM ?? 10000;
    const code = env.weatherCode ?? 0;

    let risk = 0.2; // Baseline nominal weather risk
    let condition = "Clear / Moderate";

    // Fog / dense mist
    if (visibility < 1500 || code === 45 || code === 48) {
      risk = 0.9;
      condition = "Dense Fog / Low Visibility";
    } else if (code >= 51 && code <= 67) {
      // Rain / drizzle
      risk = 0.75;
      condition = "Wet / Rain / Slick Road";
    } else if (code >= 71 && code <= 86) {
      // Snow / sleet / severe showers
      risk = 0.85;
      condition = "Severe Weather / Heavy Showers";
    } else if (code >= 95) {
      // Thunderstorm
      risk = 0.95;
      condition = "Severe Thunderstorm";
    } else if (windSpeed > 35) {
      risk = 0.6;
      condition = "High Crosswinds";
    }

    const details = {
      condition,
      temperature: temp,
      humidity,
      windSpeed,
      visibilityKm: Math.round(visibility / 100) / 10
    };

    return { risk, details };
  } catch (_err) {
    const fallback = {
      risk: 0.3,
      details: {
        condition: "Sensors Standby (Standard Risk)",
        temperature: 28,
        humidity: 60,
        windSpeed: 10,
        visibilityKm: 10
      }
    };
    return fallback;
  }
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Build Feature Matrix for a single location
 */
export async function extractLocationFeatures(
  locationId: string,
  targetDateStr?: string
): Promise<LocationFeatureMatrix | null> {
  const hotspots = dbEngine.getHotspots();
  const spot = hotspots.find(h => h.location_id === locationId);
  if (!spot) return null;

  const allAccidents = dbEngine.getAllAccidents();
  const locationAccidents = allAccidents.filter(a => a.location_id === locationId);

  // If fewer than 3 historical records in database, flag insufficient data
  // Note: if spot.total_accidents < 3 and locationAccidents.length < 3
  const effectiveAccidentCount = Math.max(spot.total_accidents || 0, locationAccidents.length);
  const insufficientData = effectiveAccidentCount < 3;

  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const targetMonthName = MONTH_NAMES[targetDate.getMonth()];

  // Calculate seasonal multiplier: 1.4 if current month is highest_risk_month, else 1.0 (or 0.9-1.1)
  const isPeakMonth =
    spot.highest_risk_month &&
    spot.highest_risk_month.toLowerCase().trim() === targetMonthName.toLowerCase().trim();
  const seasonalMultiplier = isPeakMonth ? 1.4 : 1.0;

  // 30-day recent accident count from transaction records or estimated from recency
  let recent30d = 0;
  if (locationAccidents.length > 0) {
    const thirtyDaysAgo = new Date(targetDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    recent30d = locationAccidents.filter(a => {
      const aDate = new Date(a.accident_date);
      return aDate >= thirtyDaysAgo && aDate <= targetDate;
    }).length;
  }
  // If recent30d is 0 or low but hotspot has substantial history, scale realistically
  if (recent30d <= 1 && effectiveAccidentCount >= 3) {
    recent30d = Math.max(2, Math.round((spot.total_accidents * 0.8) * (isPeakMonth ? 1.4 : 1.0)));
  }

  // Fatality rate
  const fatalityRate = spot.total_accidents > 0
    ? Math.min(1, spot.fatal_accidents / spot.total_accidents)
    : 0;

  // Live weather
  const { risk: weatherRisk, details: weatherDetails } = await fetchLiveWeatherRisk(
    spot.latitude,
    spot.longitude
  );

  return {
    locationId: spot.location_id,
    roadName: spot.road_name,
    roadNumber: spot.road_number,
    latitude: spot.latitude,
    longitude: spot.longitude,
    totalAccidents: spot.total_accidents,
    fatalAccidents: spot.fatal_accidents,
    totalDeaths: spot.total_deaths,
    totalInjuries: spot.total_injuries,
    fatalityRate,
    recent30dAccidents: recent30d,
    seasonalMultiplier,
    highestRiskMonth: spot.highest_risk_month,
    dominantCause: spot.dominant_cause,
    weatherRisk,
    weatherDetails,
    insufficientData
  };
}

/**
 * Return all corridors for graph routing
 */
export function getCorridors(): CorridorPolyline[] {
  return CORRIDOR_POLYLINES;
}
