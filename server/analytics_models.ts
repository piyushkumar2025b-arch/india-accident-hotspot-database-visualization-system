/**
 * ============================================================================
 * ADVANCED TRANSPORT MATHEMATICAL & STATISTICAL INTELLIGENCE MODELS
 * 1. Empirical Bayes (EB) Expected Crash Hazard Model (FHWA / MoRTH standard)
 * 2. IRC:SP:88 Equivalent Property Damage Only (EPDO) Hazard Rating
 * 3. Golden Hour Emergency Reachability & Trauma Desert Catchment Analysis
 * 4. Circadian 24h Crash Multiplier Index (Fatigue vs Urban Rush Hour)
 * 5. Blackspot Remedial Budget ROI & Cost-Benefit Ratio (BCR)
 * ============================================================================
 */

import { dbEngine, HotspotRecord } from "./db";
import { TRAUMA_CENTERS, TraumaCenter } from "./data_overlays";

export interface EmpiricalBayesResult {
  locationId: string;
  roadName: string;
  observedCrashes: number;
  expectedAnnualCrashes: number; // Empirical Bayes E
  baselineRate: number; // mu
  dispersionK: number; // k
  weightW: number; // w
  hazardScoreEB: number; // 0 - 100
  hazardRating: "Critical (Grade A)" | "High Risk (Grade B)" | "Moderate (Grade C)" | "Low (Grade D)";
  safetyRatingStars: number; // 1 to 5 stars (1 is most dangerous)
}

export interface EPDORatingResult {
  locationId: string;
  roadName: string;
  epdoScore: number;
  fatalAccidents: number;
  totalDeaths: number;
  totalInjuries: number;
  criticalInjuries: number;
  economicLossCroresINR: number; // In Crores INR (MoRTH official standard)
  ircRemediationPriority: "Immediate Intervention Required" | "Priority Engineering Audit" | "Routine Remediation";
}

export interface GoldenHourResult {
  locationId: string;
  roadName: string;
  hotspotCoords: { lat: number; lng: number };
  nearestTraumaCenter: {
    id: string;
    name: string;
    level: string;
    city: string;
    state: string;
    helpline: string;
    icuBeds: number;
    distanceKm: number;
    estimatedMinutes: number;
  };
  isWithinGoldenHour: boolean; // <= 45 minutes
  traumaDesertCategory: "Critical Trauma Desert (>60m)" | "Moderate Reach (45-60m)" | "Safe Golden Hour (<45m)";
  catchmentIsochronesKm: {
    min15Km: number;
    min30Km: number;
    min45Km: number;
  };
}

export interface CircadianFatigueResult {
  hourOfDay: number; // 0 to 23
  timeWindowLabel: string;
  fatigueCrashMultiplier: number;
  dominantVehicleAtHour: string;
  primaryRiskFactor: string;
  isNightFreightFatiguePeak: boolean;
  isDaytimeCommuterPeak: boolean;
  affectedHotspotsCount: number;
}

export interface BlackspotBudgetROI {
  locationId: string;
  roadName: string;
  estimatedCivilCostLakhsINR: number;
  expectedLivesSaved3Yr: number;
  economicBenefitCroresINR: number;
  benefitCostRatio: number; // BCR = Benefit / Cost
  recommendedInterventions: string[];
}

/**
 * Haversine distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * 1. EMPIRICAL BAYES (EB) BLACKSPOT IDENTIFICATION MODEL
 * Mathematical Formula:
 * E = w * mu + (1 - w) * Y
 * where w = 1 / (1 + k * mu)
 */
export function computeEmpiricalBayesModel(locationId: string): EmpiricalBayesResult | null {
  const hotspots = dbEngine.getHotspots();
  const spot = hotspots.find(h => h.location_id === locationId);
  if (!spot) return null;

  const Y = spot.total_accidents || 1;
  // Baseline crash expectation mu based on road hierarchy
  let mu = 18.5; // National Highway baseline
  let k = 0.45; // Negative binomial dispersion parameter

  if (spot.road_type.toLowerCase().includes("expressway")) {
    mu = 26.0;
    k = 0.55;
  } else if (spot.road_type.toLowerCase().includes("state")) {
    mu = 14.0;
    k = 0.40;
  }

  // Weight w
  const w = Math.round((1 / (1 + k * mu)) * 1000) / 1000;
  // Expected crash frequency E
  const E = Math.round((w * mu + (1 - w) * Y) * 10) / 10;

  // Composite EB hazard score 0 - 100
  // Scaled by expected crash frequency E, fatal incidents, and recorded deaths
  const hazardScoreEB = Math.min(
    99.8,
    Math.max(
      42.0,
      Math.round(((E * 1.8) + (spot.fatal_accidents * 0.45) + (spot.total_deaths * 0.35)) * 10) / 10
    )
  );

  let hazardRating: "Critical (Grade A)" | "High Risk (Grade B)" | "Moderate (Grade C)" | "Low (Grade D)" = "Low (Grade D)";
  let safetyRatingStars = 5;

  if (hazardScoreEB >= 80) {
    hazardRating = "Critical (Grade A)";
    safetyRatingStars = 1;
  } else if (hazardScoreEB >= 65) {
    hazardRating = "High Risk (Grade B)";
    safetyRatingStars = 2;
  } else if (hazardScoreEB >= 50) {
    hazardRating = "Moderate (Grade C)";
    safetyRatingStars = 3;
  } else {
    safetyRatingStars = 4;
  }

  return {
    locationId: spot.location_id,
    roadName: spot.road_name,
    observedCrashes: Y,
    expectedAnnualCrashes: E,
    baselineRate: mu,
    dispersionK: k,
    weightW: w,
    hazardScoreEB,
    hazardRating,
    safetyRatingStars
  };
}

/**
 * 2. IRC:SP:88-2019 EQUIVALENT PROPERTY DAMAGE ONLY (EPDO) SCORE & ECONOMIC LOSS
 * Formula: EPDO = (N_fatal * 12) + (N_grievous * 6) + (N_minor * 3) + (N_non_injury * 1)
 * MoRTH Economic Valuation: ₹1.4 Crore per fatality, ₹45 Lakhs per grievous injury
 */
export function computeEPDORating(locationId: string): EPDORatingResult | null {
  const hotspots = dbEngine.getHotspots();
  const spot = hotspots.find(h => h.location_id === locationId);
  if (!spot) return null;

  const fatal = spot.fatal_accidents || Math.round(spot.total_accidents * 0.4);
  const grievous = spot.total_critical_injuries || Math.round(spot.total_injuries * 0.3);
  const minor = Math.max(0, spot.total_injuries - grievous);
  const nonInjury = Math.max(1, spot.total_accidents - fatal);

  const epdoScore = (fatal * 12) + (grievous * 6) + (minor * 3) + (nonInjury * 1);

  // Economic Loss in Crores INR (MoRTH official parameters)
  const economicLossCroresINR = Math.round(
    ((spot.total_deaths * 1.4) + (spot.total_injuries * 0.45) + (spot.total_accidents * 0.08)) * 10
  ) / 10;

  let ircRemediationPriority: "Immediate Intervention Required" | "Priority Engineering Audit" | "Routine Remediation" = "Routine Remediation";
  if (epdoScore >= 600 || spot.total_deaths >= 40) {
    ircRemediationPriority = "Immediate Intervention Required";
  } else if (epdoScore >= 250) {
    ircRemediationPriority = "Priority Engineering Audit";
  }

  return {
    locationId: spot.location_id,
    roadName: spot.road_name,
    epdoScore,
    fatalAccidents: fatal,
    totalDeaths: spot.total_deaths,
    totalInjuries: spot.total_injuries,
    criticalInjuries: grievous,
    economicLossCroresINR,
    ircRemediationPriority
  };
}

/**
 * 3. "GOLDEN HOUR" TRAUMA REACHABILITY & DESERT ANALYSIS
 * Calculates real-time distance and estimated ambulance transit time
 * to the nearest Apex / Regional Trauma Center.
 */
export function computeGoldenHourReachability(locationId: string): GoldenHourResult | null {
  const hotspots = dbEngine.getHotspots();
  const spot = hotspots.find(h => h.location_id === locationId);
  if (!spot) return null;

  const traumaCenters = TRAUMA_CENTERS;
  let nearestCenter: TraumaCenter = traumaCenters[0];
  let minDistance = Infinity;

  traumaCenters.forEach(tc => {
    const d = calculateHaversineDistanceKm(spot.latitude, spot.longitude, tc.latitude, tc.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearestCenter = tc;
    }
  });

  // Transit time estimation factoring in Indian highway speed & terrain
  // Average ambulance transit speed: 60 km/h on expressway/plain, 35 km/h in ghats
  const isGhat = spot.locality.toLowerCase().includes("ghat") || spot.road_name.toLowerCase().includes("ghat");
  const speedKmh = isGhat ? 38 : 62;
  const estimatedMinutes = Math.round((minDistance / speedKmh) * 60) + 6; // +6 mins dispatch delay

  const isWithinGoldenHour = estimatedMinutes <= 45;
  let traumaDesertCategory: "Critical Trauma Desert (>60m)" | "Moderate Reach (45-60m)" | "Safe Golden Hour (<45m)" = "Safe Golden Hour (<45m)";
  if (estimatedMinutes > 60) {
    traumaDesertCategory = "Critical Trauma Desert (>60m)";
  } else if (estimatedMinutes > 45) {
    traumaDesertCategory = "Moderate Reach (45-60m)";
  }

  return {
    locationId: spot.location_id,
    roadName: spot.road_name,
    hotspotCoords: { lat: spot.latitude, lng: spot.longitude },
    nearestTraumaCenter: {
      id: nearestCenter.id,
      name: nearestCenter.name,
      level: nearestCenter.level,
      city: nearestCenter.city,
      state: nearestCenter.state,
      helpline: nearestCenter.emergency_helpline,
      icuBeds: nearestCenter.icu_beds,
      distanceKm: minDistance,
      estimatedMinutes
    },
    isWithinGoldenHour,
    traumaDesertCategory,
    catchmentIsochronesKm: {
      min15Km: Math.round((15 / 60) * speedKmh * 10) / 10,
      min30Km: Math.round((30 / 60) * speedKmh * 10) / 10,
      min45Km: Math.round((45 / 60) * speedKmh * 10) / 10
    }
  };
}

/**
 * 4. CIRCADIAN 24-HOUR CRASH MULTIPLIER INDEX
 * Time-of-day dynamic filtering for truck driver fatigue and rush-hour pedestrian strikes
 */
export function computeCircadianIndex(hourOfDay: number): CircadianFatigueResult {
  const h = Math.max(0, Math.min(23, Math.floor(hourOfDay)));

  let fatigueCrashMultiplier = 1.0;
  let dominantVehicle = "Cars & 2-Wheelers";
  let primaryRisk = "Nominal Daytime Traffic Flow";
  let isNightFreight = false;
  let isDaytimeCommuter = false;

  // Midnight to dawn (01:00 - 05:00): Severe truck driver fatigue / microsleep
  if (h >= 1 && h <= 5) {
    fatigueCrashMultiplier = 2.85;
    dominantVehicle = "Multi-Axle Heavy Freight Trucks & Intercity Sleeper Buses";
    primaryRisk = "Microsleep, High-Speed Rear-End Collisions, and Lack of Roadside Lighting";
    isNightFreight = true;
  } else if (h >= 8 && h <= 11) {
    fatigueCrashMultiplier = 1.95;
    dominantVehicle = "Two-Wheelers, Auto-Rickshaws & City Buses";
    primaryRisk = "Aggressive Overtaking, Abrupt Median Crossings, and Pedestrian Congestion";
    isDaytimeCommuter = true;
  } else if (h >= 18 && h <= 22) {
    fatigueCrashMultiplier = 2.15;
    dominantVehicle = "Intercity Buses, SUVs, and Returning Freight";
    primaryRisk = "Dusk Glare, High-Speed Cross-Median Drift, and Intoxicated Driving";
  } else {
    fatigueCrashMultiplier = 1.15;
    dominantVehicle = "Private Vehicles & Light Commercial Vans";
    primaryRisk = "Intermittent Overspeeding on Open Carriageway";
  }

  const label = `${String(h).padStart(2, "0")}:00 - ${String((h + 1) % 24).padStart(2, "0")}:00`;
  const hotspots = dbEngine.getHotspots();

  return {
    hourOfDay: h,
    timeWindowLabel: label,
    fatigueCrashMultiplier,
    dominantVehicleAtHour: dominantVehicle,
    primaryRiskFactor: primaryRisk,
    isNightFreightFatiguePeak: isNightFreight,
    isDaytimeCommuterPeak: isDaytimeCommuter,
    affectedHotspotsCount: hotspots.length
  };
}

/**
 * 5. BLACKSPOT REMEDIAL BUDGET ROI & BENEFIT-COST RATIO (BCR)
 * Evaluates MoRTH civil engineering cost vs lives saved
 */
export function computeBlackspotBudgetROI(locationId: string): BlackspotBudgetROI | null {
  const epdo = computeEPDORating(locationId);
  const spot = dbEngine.getHotspots().find(h => h.location_id === locationId);
  if (!epdo || !spot) return null;

  // Estimated civil engineering intervention package (in Lakhs INR)
  // Rumble strips, W-beam crash barriers, solar blinkers, high-mast illumination, grade separator
  let estimatedCivilCostLakhsINR = 45; // baseline package
  const interventions: string[] = [
    "Bar-marking Rumble Strips on Approach (IRC:SP:88)",
    "Retro-reflective Warning Signs & Solar Blinkers",
    "High-Mast LED Median Illumination (150m radius)"
  ];

  if (spot.hotspot_tier === "Critical") {
    estimatedCivilCostLakhsINR = 125;
    interventions.push("W-Beam / Thrie-Beam Crash Barrier Reinforcement");
    interventions.push("High-Friction Anti-Skid Asphalt Resurfacing");
    interventions.push("Grade-Separated Pedestrian / Cattle Underpass (PUP)");
  }

  // Expected lives saved over 3-year post-rectification period (CRF: 40% - 60% reduction)
  const annualFatalities = spot.total_deaths / 4;
  const expectedLivesSaved3Yr = Math.max(2, Math.round(annualFatalities * 3 * 0.52));

  // Economic benefit = lives saved * ₹1.4 Crore
  const economicBenefitCroresINR = Math.round(expectedLivesSaved3Yr * 1.4 * 10) / 10;
  const costCrores = estimatedCivilCostLakhsINR / 100;
  const benefitCostRatio = Math.round((economicBenefitCroresINR / costCrores) * 10) / 10;

  return {
    locationId: spot.location_id,
    roadName: spot.road_name,
    estimatedCivilCostLakhsINR,
    expectedLivesSaved3Yr,
    economicBenefitCroresINR,
    benefitCostRatio,
    recommendedInterventions: interventions
  };
}
