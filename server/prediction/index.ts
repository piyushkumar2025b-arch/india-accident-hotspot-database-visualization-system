/**
 * ============================================================================
 * PREDICTION & ROUTE-SAFETY INTELLIGENCE ORCHESTRATOR
 * Exports all prediction functions and models
 * ============================================================================
 */

import { dbEngine } from "../db";
import { predictHotspotRisk } from "./hotspot_forecast";
import { getTemporalCalendar } from "./temporal";
import { calculateRouteSafety, LatLng } from "./route_safety";
import { extractLocationFeatures } from "./features";

export {
  predictHotspotRisk,
  getTemporalCalendar,
  calculateRouteSafety,
  extractLocationFeatures
};

export interface RealtimePredictPayload {
  success: boolean;
  timestamp: string;
  heatmap: Array<{ lat: number; lng: number; intensity: number }>;
  activeAlerts: Array<{ locationId: string; alert: string; severity: string }>;
}

/**
 * Get Realtime Risk Heatmap & Active Alerts across real MoRTH blackspots
 */
export async function getRealtimePredictions(): Promise<RealtimePredictPayload> {
  const hotspots = dbEngine.getHotspots();
  const timestamp = new Date().toISOString();

  const heatmap: Array<{ lat: number; lng: number; intensity: number }> = [];
  const activeAlerts: Array<{ locationId: string; alert: string; severity: string }> = [];

  // Take top hotspots to construct realtime heatmap points & alerts
  for (const h of hotspots) {
    if (!h.latitude || !h.longitude) continue;

    // Intensity normalized between 0.2 and 1.0 based on hotspot score
    const intensity = Math.min(1.0, Math.max(0.25, Math.round(((h.hotspot_score || 50) / 100) * 10) / 10));
    heatmap.push({
      lat: Number(h.latitude),
      lng: Number(h.longitude),
      intensity
    });

    // High / Critical hotspots generate alerts
    if (h.hotspot_tier === "Critical" && activeAlerts.length < 8) {
      let alertMsg = `${h.dominant_cause || 'High Accident Hazard'} — ${h.road_name}`;
      if (h.total_deaths >= 40) {
        alertMsg += ` (${h.total_deaths} fatalities recorded)`;
      }
      activeAlerts.push({
        locationId: h.location_id,
        alert: alertMsg,
        severity: "Critical"
      });
    }
  }

  return {
    success: true,
    timestamp,
    heatmap,
    activeAlerts
  };
}
