/**
 * ============================================================================
 * SAFETY PREDICTIONS FRONTEND MODULE
 * Renamed from "Safety AI & Math" → "Safety Predictions"
 * Full Table-Driven MODELS Registry with 15 prediction & math models:
 *  - 3 Core Prediction Engines
 *  - 5 Advanced Transport Mathematical Models
 *  - 4 Live Telemetry Models
 *  - 3 National & Statistical Models
 * Clean, user-friendly UI layout with intuitive cards & universal map support.
 * ============================================================================
 */

(function () {
  "use strict";

  // State Management
  const state = {
    isOpen: false,
    currentModel: "hotspot",
    hotspots: [],
    selectedHotspotId: "",
    selectedDate: new Date().toISOString().split("T")[0],
    selectedMonth: new Date().getMonth() + 1,
    selectedCircadianHour: new Date().getHours(),
    originLat: 12.9716, // Bengaluru
    originLng: 77.5946,
    destLat: 13.0827,   // Chennai
    destLng: 80.2707,
    routeResult: null,
    activeHeatLayer: null,
    activeKdeLayer: null,
    activeRoutePolyline: null,
    activeRouteMarkers: [],
    activeIsochroneLayers: []
  };

  function getMapController() {
    return window.mapCtrl || window.mapController || null;
  }

  function getMapInstance() {
    const ctrl = getMapController();
    if (ctrl && ctrl.leafletMap) return ctrl.leafletMap;
    return null;
  }

  function flyToLocation(lat, lng, zoom = 13) {
    const ctrl = getMapController();
    if (ctrl && typeof ctrl.flyToCoords === "function") {
      ctrl.flyToCoords(lat, lng, zoom);
      return;
    }
    if (ctrl && ctrl.googleMap) {
      ctrl.googleMap.panTo({ lat: Number(lat), lng: Number(lng) });
      ctrl.googleMap.setZoom(zoom);
      return;
    }
    const map = getMapInstance();
    if (map && map.flyTo) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }

  // ============================================================================
  // TABLE-DRIVEN MODELS REGISTRY
  // ============================================================================
  const MODELS = {
    // Group 1: Core Prediction Engines
    hotspot: {
      group: "core",
      name: "Daily Hotspot Forecast (Poisson Risk)",
      desc: "24-hour crash frequency and composite risk tier based on real conditions.",
      btnText: "Calculate Daily Forecast",
      controls: { hotspot: true, date: true },
      fetchUrl: (locId) => `/api/predict/hotspot/${encodeURIComponent(locId)}?date=${document.getElementById("predDateInput")?.value || state.selectedDate}`,
      render: (data) => renderHotspotResult(data)
    },
    route: {
      group: "core",
      name: "Corridor Route Safety Score (Dijkstra)",
      desc: "Find safe journey paths avoiding hazardous highway blackspots.",
      btnText: "Calculate Route Safety",
      controls: { route: true },
      async execute() {
        const originVal = (document.getElementById("predOriginPreset")?.value || "12.9716,77.5946").split(",");
        const destVal = (document.getElementById("predDestPreset")?.value || "13.0827,80.2707").split(",");
        const origin = { lat: parseFloat(originVal[0]), lng: parseFloat(originVal[1]) };
        const destination = { lat: parseFloat(destVal[0]), lng: parseFloat(destVal[1]) };

        const res = await fetch("/api/predict/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination, date: state.selectedDate })
        });
        const data = await res.json();
        renderRouteResult(data, origin, destination);
      }
    },
    calendar: {
      group: "core",
      name: "Calendar Temporal Trends ('This Day, This Year')",
      desc: "Seasonal historical risk cycles by calendar month.",
      btnText: "Analyze Calendar Trends",
      controls: { hotspot: true, month: true },
      fetchUrl: (locId) => `/api/predict/calendar?locationId=${encodeURIComponent(locId)}&month=${document.getElementById("predMonthSelect")?.value || 8}`,
      render: (data) => renderCalendarResult(data)
    },

    // Group 2: Advanced Transport Mathematical Models
    eb: {
      group: "transport_math",
      name: "Empirical Bayes (EB) Expected Crash Hazard",
      desc: "Statistical regression-to-mean correction for crash expectation.",
      btnText: "Compute Empirical Bayes (EB)",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/analytics/eb-model/${encodeURIComponent(locId)}`,
      render: (data) => renderEmpiricalBayesResult(data)
    },
    epdo: {
      group: "transport_math",
      name: "IRC:SP:88 EPDO Hazard Score & Economic Loss (₹ Cr)",
      desc: "Equivalent Property Damage Only formula per Indian Road Congress standards.",
      btnText: "Calculate EPDO & Economic Loss",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/analytics/epdo/${encodeURIComponent(locId)}`,
      render: (data) => renderEPDOResult(data)
    },
    goldenhour: {
      group: "transport_math",
      name: "Golden Hour Trauma Center Catchment Isochrone",
      desc: "Evaluate 30m / 60m ambulance reachability to apex hospitals.",
      btnText: "Analyze Trauma Reachability",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/analytics/golden-hour/${encodeURIComponent(locId)}`,
      async render(data, locId) {
        renderGoldenHourResult(data);
        await triggerGoldenHourIsochrone(locId);
      }
    },
    circadian: {
      group: "transport_math",
      name: "Circadian 24h Fatigue Index Timeline",
      desc: "Evaluate diurnal night freight fatigue peaks vs urban morning commuter flow.",
      btnText: "Evaluate Circadian Fatigue",
      controls: { hotspot: true, circadian: true },
      fetchUrl: () => `/api/analytics/circadian/${state.selectedCircadianHour}`,
      render: (data) => renderCircadianResult(data)
    },
    roi: {
      group: "transport_math",
      name: "Blackspot Remediation Budget ROI & BCR Ratio",
      desc: "Benefit-Cost Ratio of civil engineering remedial packages.",
      btnText: "Compute Civil Budget BCR",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/analytics/budget-roi/${encodeURIComponent(locId)}`,
      render: (data) => renderBudgetROIResult(data)
    },

    // Group 3: Live Telemetry Models
    live_probability: {
      group: "live_telemetry",
      name: "Live 24h Collision Probability (Poisson/NB2)",
      desc: "Computes odds of ≥1 or ≥2 crashes incorporating live weather hazard multipliers.",
      btnText: "Calculate Real-Time Crash Odds",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/predict/probability/${encodeURIComponent(locId)}`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderProbability(data) : renderGenericJson(data);
      }
    },
    live_trend: {
      group: "live_telemetry",
      name: "30-Day Environmental Hazard Trend (EWMA + OLS)",
      desc: "Tracks weather hazard progression (fog, precipitation, heat) over time.",
      btnText: "Analyze Weather Trend",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/predict/trend/${encodeURIComponent(locId)}`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderTrend(data) : renderGenericJson(data);
      }
    },
    live_intensity_curve: {
      group: "live_telemetry",
      name: "24h Circadian × Weather Intensity Profile",
      desc: "Hour-by-hour crash intensity curve combining fatigue and diurnal hazard.",
      btnText: "Generate 24h Intensity Profile",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/predict/intensity-curve/${encodeURIComponent(locId)}`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderIntensityCurve(data) : renderGenericJson(data);
      }
    },
    live_trauma_survival: {
      group: "live_telemetry",
      name: "Trauma Survival Probability S(t)=e^(−t/τ)",
      desc: "Exponential survival probability curve based on exact emergency transit time.",
      btnText: "Calculate Survival Odds",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/predict/survival/${encodeURIComponent(locId)}`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderSurvival(data) : renderGenericJson(data);
      }
    },

    // Group 4: National & Statistical Models
    stat_spatial_clustering: {
      group: "national_stats",
      name: "Spatial Autocorrelation (Moran's I Clustering)",
      desc: "Measures whether high-risk blackspots cluster geographically across India.",
      btnText: "Calculate Nationwide Moran's I",
      controls: {},
      fetchUrl: () => `/api/predict/clustering`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderClustering(data) : renderGenericJson(data);
      }
    },
    stat_extreme_return: {
      group: "national_stats",
      name: "Gumbel Extreme National Fatality Return Levels",
      desc: "Statistical return periods (2y, 5y, 10y, 50y) for catastrophic fatality years.",
      btnText: "Calculate Gumbel Return Levels",
      controls: {},
      fetchUrl: () => `/api/predict/extremes`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderExtremes(data) : renderGenericJson(data);
      }
    },
    stat_national_burden: {
      group: "national_stats",
      name: "South Asia Cross-Country Fatality Benchmark",
      desc: "Compares India's mortality rate per 100,000 against regional peers (World Bank).",
      btnText: "Compare Regional Peer Burden",
      controls: {},
      fetchUrl: () => `/api/national/baseline`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderNationalBurden(data) : renderGenericJson(data);
      }
    },
    stat_severity_posterior: {
      group: "national_stats",
      name: "Beta-Binomial Fatality Severity Posterior",
      desc: "Estimates the true probability that the next collision will be fatal.",
      btnText: "Compute Fatality Posterior",
      controls: { hotspot: true },
      fetchUrl: (locId) => `/api/predict/severity/${encodeURIComponent(locId)}`,
      render: (data) => {
        const r = window.predictionRenderers;
        return r ? r.renderSeverity(data) : renderGenericJson(data);
      }
    },
    stat_monte_carlo: {
      group: "national_stats",
      name: "Monte Carlo 1,000-Run Journey Simulation",
      desc: "Deterministic stochastic simulation of trip incident risks (P10/P50/P90).",
      btnText: "Simulate 1,000 Journeys",
      controls: { hotspot: true },
      async execute() {
        const locId = document.getElementById("predLocationSelect")?.value || state.selectedHotspotId;
        const res = await fetch("/api/predict/monte-carlo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId: locId, runs: 1000, seed: 42 })
        });
        const data = await res.json();
        const r = window.predictionRenderers;
        const html = r ? r.renderMonteCarlo(data) : renderGenericJson(data);
        const container = document.getElementById("predResultPanel");
        if (container) {
          container.innerHTML = html;
          container.style.display = "block";
        }
      }
    }
  };

  function renderGenericJson(data) {
    return `<div class="pred-result-card"><pre style="font-size:0.65rem; color:#cbd5e1; overflow:auto;">${JSON.stringify(data, null, 2)}</pre></div>`;
  }

  async function initPredictionEngine() {
    createSidebarDom();
    setupEventListeners();
    await loadReferenceHotspots();
    await loadRealtimeHeatmap();
    patchMapPopupForPrediction();
  }

  function createSidebarDom() {
    let container = document.getElementById("prediction-sidebar");
    if (!container) {
      container = document.createElement("div");
      container.id = "prediction-sidebar";
      document.body.appendChild(container);
    }

    const navActions = document.querySelector(".nav-actions");
    if (navActions && !document.getElementById("btnTogglePredictionSidebar")) {
      const toggleBtn = document.createElement("button");
      toggleBtn.id = "btnTogglePredictionSidebar";
      toggleBtn.className = "nav-header-btn nav-btn-indigo";
      toggleBtn.title = "Toggle Road Safety Predictions & Advanced Transport Math";
      toggleBtn.style.cssText = "background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; font-weight: 600; border: none; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);";
      toggleBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span>⚡ Safety Predictions</span>
      `;
      toggleBtn.addEventListener("click", () => toggleSidebar(true));
      navActions.insertBefore(toggleBtn, navActions.firstChild);
    }

    container.innerHTML = `
      <style>
        #prediction-sidebar-panel {
          position: fixed;
          top: 60px;
          right: 0;
          bottom: 30px;
          width: 385px;
          max-width: 94vw;
          background: rgba(15, 23, 42, 0.97);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-left: 1px solid rgba(59, 130, 246, 0.35);
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.65);
          z-index: 999;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #f8fafc;
          font-family: var(--font-main, 'Inter', sans-serif);
        }
        #prediction-sidebar-panel.open {
          transform: translateX(0);
        }
        .pred-header {
          padding: 12px 16px;
          background: rgba(30, 41, 59, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pred-title {
          font-size: 0.92rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #38bdf8;
        }
        .pred-close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.4rem;
          cursor: pointer;
          line-height: 1;
        }
        .pred-close-btn:hover {
          color: #fff;
        }
        .pred-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pred-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pred-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pred-select, .pred-input {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #fff;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          outline: none;
        }
        .pred-select:focus, .pred-input:focus {
          border-color: #38bdf8;
        }
        .pred-calc-btn {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35);
        }
        .pred-calc-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .pred-calc-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pred-quick-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .pred-action-btn {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pred-action-btn:hover {
          background: rgba(51, 65, 85, 0.9);
          border-color: #38bdf8;
        }
        .pred-result-card {
          background: rgba(30, 41, 59, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin-top: 4px;
        }
        .pred-factor-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 0.72rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .pred-gauge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.75rem;
        }
        .gauge-critical { background: rgba(239, 68, 68, 0.25); color: #f87171; border: 1px solid #ef4444; }
        .gauge-high { background: rgba(249, 115, 22, 0.25); color: #fb923c; border: 1px solid #f97316; }
        .gauge-moderate { background: rgba(234, 179, 8, 0.25); color: #facc15; border: 1px solid #eab308; }
        .gauge-low { background: rgba(16, 185, 129, 0.25); color: #34d399; border: 1px solid #10b981; }
      </style>

      <div id="prediction-sidebar-panel">
        <div class="pred-header">
          <div class="pred-title">
            <span>⚡</span>
            <span>Safety Predictions</span>
          </div>
          <button class="pred-close-btn" id="btnPredClose" title="Close Panel">&times;</button>
        </div>

        <div class="pred-body">
          <!-- Real-Time Ingestion Status Strip -->
          <div id="liveSourcesStrip"></div>
          <div id="liveAlertsStrip"></div>

          <!-- Real-Time Heatmap Quick Switch -->
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="pred-action-btn" id="btnToggleRealtimeRadar" style="width:100%; color:#34d399; border-color:#059669; font-weight:600;">
              🔥 Toggle Realtime Risk Heatmap
            </button>
          </div>

          <!-- Dropdown: Prediction / Math Model Type with 4 optgroups -->
          <div class="pred-field-group">
            <label class="pred-label">Analysis & Mathematical Model</label>
            <select class="pred-select" id="predModelSelect">
              <optgroup label="Core Prediction Engines">
                <option value="hotspot" selected>Daily Hotspot Forecast (Poisson Risk)</option>
                <option value="route">Corridor Route Safety Score (Dijkstra)</option>
                <option value="calendar">Calendar Temporal Trends ('This Day, This Year')</option>
              </optgroup>
              <optgroup label="Advanced Transport Mathematical Models">
                <option value="eb">Empirical Bayes (EB) Expected Crash Hazard</option>
                <option value="epdo">IRC:SP:88 EPDO Hazard Score & Economic Loss (₹ Cr)</option>
                <option value="goldenhour">Golden Hour Trauma Center Catchment Isochrone</option>
                <option value="circadian">Circadian 24h Fatigue Index Timeline</option>
                <option value="roi">Blackspot Remediation Budget ROI & BCR Ratio</option>
              </optgroup>
              <optgroup label="Live Telemetry Models">
                <option value="live_probability">Live 24h Collision Probability (Poisson/NB2)</option>
                <option value="live_trend">30-Day Environmental Hazard Trend (EWMA + OLS)</option>
                <option value="live_intensity_curve">24h Circadian × Weather Intensity Profile</option>
                <option value="live_trauma_survival">Critical Trauma Survival Probability S(t)</option>
              </optgroup>
              <optgroup label="National & Statistical Models">
                <option value="stat_spatial_clustering">Spatial Autocorrelation (Moran's I Clustering)</option>
                <option value="stat_extreme_return">Gumbel Extreme National Fatality Return Levels</option>
                <option value="stat_national_burden">South Asia Cross-Country Fatality Benchmark</option>
                <option value="stat_severity_posterior">Beta-Binomial Fatality Severity Posterior</option>
                <option value="stat_monte_carlo">Monte Carlo 1,000-Run Journey Simulation</option>
              </optgroup>
            </select>
            <div id="predModelDesc" style="font-size:0.68rem; color:#94a3b8; margin-top:2px; line-height:1.3;">
              24-hour crash frequency and composite risk tier based on real conditions.
            </div>
          </div>

          <!-- Hotspot Selection (Common to location-based models) -->
          <div id="predHotspotControls">
            <div class="pred-field-group">
              <label class="pred-label">Target Corridor / Blackspot</label>
              <select class="pred-select" id="predLocationSelect">
                <option value="">Loading nationwide locations...</option>
              </select>
            </div>

            <!-- Date Picker for Hotspot Forecast -->
            <div class="pred-field-group" id="predDateFieldGroup">
              <label class="pred-label">Target Date</label>
              <input type="date" class="pred-input" id="predDateInput" value="${state.selectedDate}">
            </div>

            <!-- Month Picker for Calendar -->
            <div class="pred-field-group" id="predMonthFieldGroup" style="display:none;">
              <label class="pred-label">Calendar Month</label>
              <select class="pred-select" id="predMonthSelect">
                <option value="1">January (Smog / Winter Peak)</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May (Heatwave Tyre Burst)</option>
                <option value="6">June</option>
                <option value="7">July (Monsoon Peak)</option>
                <option value="8" selected>August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December (Fog Hazard)</option>
              </select>
            </div>

            <!-- 24-Hour Slider for Circadian Fatigue Analysis -->
            <div class="pred-field-group" id="predCircadianFieldGroup" style="display:none;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="pred-label">Time of Day (24h Circadian Clock)</label>
                <strong id="predCircadianHourDisplay" style="color:#38bdf8; font-size:0.8rem;">03:00 AM (Night Peak)</strong>
              </div>
              <input type="range" min="0" max="23" value="${state.selectedCircadianHour}" class="pred-input" id="predCircadianSlider" style="cursor:pointer; padding:0; height:6px;">
              <small style="color:#94a3b8; font-size:0.68rem;">Drag slider to observe night freight fatigue vs daytime commuter collision shifts.</small>
            </div>
          </div>

          <!-- Route Safety Origin/Destination Controls -->
          <div id="predRouteControls" style="display:none; flex-direction:column; gap:10px;">
            <div class="pred-field-group">
              <label class="pred-label">Origin (City / Hub)</label>
              <select class="pred-select" id="predOriginPreset">
                <option value="12.9716,77.5946">Bengaluru (Karnataka)</option>
                <option value="13.0827,80.2707">Chennai (Tamil Nadu)</option>
                <option value="19.0760,72.8777">Mumbai (Maharashtra)</option>
                <option value="18.5204,73.8567">Pune (Maharashtra)</option>
                <option value="28.6139,77.2090">Delhi (NCR)</option>
                <option value="27.1767,78.0081">Agra (Uttar Pradesh)</option>
                <option value="17.3850,78.4867">Hyderabad (Telangana)</option>
                <option value="22.5726,88.3639">Kolkata (West Bengal)</option>
              </select>
            </div>

            <div class="pred-field-group">
              <label class="pred-label">Destination</label>
              <select class="pred-select" id="predDestPreset">
                <option value="13.0827,80.2707" selected>Chennai (Tamil Nadu)</option>
                <option value="12.9716,77.5946">Bengaluru (Karnataka)</option>
                <option value="18.5204,73.8567">Pune (Maharashtra)</option>
                <option value="19.0760,72.8777">Mumbai (Maharashtra)</option>
                <option value="27.1767,78.0081">Agra (Uttar Pradesh)</option>
                <option value="28.6139,77.2090">Delhi (NCR)</option>
                <option value="17.3850,78.4867">Hyderabad (Telangana)</option>
              </select>
            </div>
          </div>

          <!-- Calculate Action Button -->
          <button class="pred-calc-btn" id="btnPredCalculate">
            <span id="predBtnSpinner" style="display:none;">⏳</span>
            <span id="predBtnText">Calculate Daily Forecast</span>
          </button>

          <!-- Quick Street-Level 360 & Isochrone Actions -->
          <div class="pred-quick-actions" id="predQuickActions" style="display:none;">
            <button class="pred-action-btn" id="btnLaunchStreetView">
              🌐 Street 360° Explorer
            </button>
            <button class="pred-action-btn" id="btnPlotGoldenIsochrone">
              🚑 Draw Golden Hour
            </button>
          </div>

          <!-- Dynamic Results Panel -->
          <div id="predResultPanel" style="display:none;"></div>
        </div>
      </div>
    `;
  }

  function toggleSidebar(forceState) {
    state.isOpen = forceState !== undefined ? forceState : !state.isOpen;
    const panel = document.getElementById("prediction-sidebar-panel");
    if (panel) {
      if (state.isOpen) {
        panel.classList.add("open");
      } else {
        panel.classList.remove("open");
      }
    }
    if (window.liveSourcesMonitor && typeof window.liveSourcesMonitor.setPanelOpen === "function") {
      window.liveSourcesMonitor.setPanelOpen(state.isOpen);
    }
  }

  function setupEventListeners() {
    const btnClose = document.getElementById("btnPredClose");
    if (btnClose) btnClose.addEventListener("click", () => toggleSidebar(false));

    const modelSelect = document.getElementById("predModelSelect");
    const hotspotControls = document.getElementById("predHotspotControls");
    const routeControls = document.getElementById("predRouteControls");
    const dateGroup = document.getElementById("predDateFieldGroup");
    const monthGroup = document.getElementById("predMonthFieldGroup");
    const circadianGroup = document.getElementById("predCircadianFieldGroup");
    const circadianSlider = document.getElementById("predCircadianSlider");
    const circadianHourDisplay = document.getElementById("predCircadianHourDisplay");
    const modelDesc = document.getElementById("predModelDesc");

    if (modelSelect) {
      modelSelect.addEventListener("change", (e) => {
        state.currentModel = e.target.value;
        const meta = MODELS[state.currentModel] || MODELS.hotspot;
        const ctrl = meta.controls || {};

        if (hotspotControls) hotspotControls.style.display = ctrl.hotspot ? "block" : "none";
        if (routeControls) routeControls.style.display = ctrl.route ? "flex" : "none";
        if (dateGroup) dateGroup.style.display = ctrl.date ? "flex" : "none";
        if (monthGroup) monthGroup.style.display = ctrl.month ? "flex" : "none";
        if (circadianGroup) circadianGroup.style.display = ctrl.circadian ? "flex" : "none";

        const qActions = document.getElementById("predQuickActions");
        if (qActions) qActions.style.display = ctrl.hotspot ? "grid" : "none";

        const btnText = document.getElementById("predBtnText");
        if (btnText) btnText.textContent = meta.btnText || "Run Analysis";

        if (modelDesc) modelDesc.textContent = meta.desc || "";
      });
    }

    if (circadianSlider && circadianHourDisplay) {
      circadianSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        state.selectedCircadianHour = val;
        const ampm = val >= 12 ? "PM" : "AM";
        const h12 = val % 12 === 0 ? 12 : val % 12;
        const peakDesc = (val >= 1 && val <= 5) ? "(Night Freight Fatigue Peak)" : (val >= 8 && val <= 11) ? "(Morning Urban Rush Hour)" : "";
        circadianHourDisplay.textContent = `${h12}:00 ${ampm} ${peakDesc}`;
      });
    }

    const btnCalc = document.getElementById("btnPredCalculate");
    if (btnCalc) {
      btnCalc.addEventListener("click", handleCalculate);
    }

    const btnStreetView = document.getElementById("btnLaunchStreetView");
    if (btnStreetView) {
      btnStreetView.addEventListener("click", () => {
        const locId = document.getElementById("predLocationSelect")?.value || state.selectedHotspotId;
        const spot = state.hotspots.find(h => h.location_id === locId);
        if (spot && spot.latitude && spot.longitude) {
          const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${spot.latitude},${spot.longitude}&heading=0&pitch=0&fov=80`;
          window.open(url, "_blank");
        } else {
          alert("Please select a valid hotspot location first.");
        }
      });
    }

    const btnPlotIsochrone = document.getElementById("btnPlotGoldenIsochrone");
    if (btnPlotIsochrone) {
      btnPlotIsochrone.addEventListener("click", async () => {
        const locId = document.getElementById("predLocationSelect")?.value || state.selectedHotspotId;
        await triggerGoldenHourIsochrone(locId);
      });
    }

    const btnToggleRadar = document.getElementById("btnToggleRealtimeRadar");
    if (btnToggleRadar) {
      btnToggleRadar.addEventListener("click", () => {
        const map = getMapInstance();
        if (!map || !state.activeHeatLayer) return;
        if (map.hasLayer(state.activeHeatLayer)) {
          map.removeLayer(state.activeHeatLayer);
          btnToggleRadar.textContent = "🔥 Show Realtime Heatmap";
        } else {
          map.addLayer(state.activeHeatLayer);
          btnToggleRadar.textContent = "❌ Hide Realtime Heatmap";
        }
      });
    }
  }

  async function loadReferenceHotspots() {
    try {
      const res = await fetch("/api/hotspots");
      if (res.ok) {
        state.hotspots = await res.json();
        const select = document.getElementById("predLocationSelect");
        if (select) {
          select.innerHTML = "";
          state.hotspots.forEach((h) => {
            const opt = document.createElement("option");
            opt.value = h.location_id;
            opt.textContent = `${h.state_code || 'IN'} • ${h.road_number || ''} ${h.road_name.slice(0, 36)}`;
            select.appendChild(opt);
          });
          if (state.hotspots.length > 0) {
            state.selectedHotspotId = state.hotspots[0].location_id;
            const qActions = document.getElementById("predQuickActions");
            if (qActions) qActions.style.display = "grid";
          }
        }
      }
    } catch (err) {
      console.warn("Failed to populate hotspots for prediction selector:", err);
    }
  }

  async function handleCalculate() {
    const btn = document.getElementById("btnPredCalculate");
    const spinner = document.getElementById("predBtnSpinner");
    const resultPanel = document.getElementById("predResultPanel");

    btn.disabled = true;
    if (spinner) spinner.style.display = "inline-block";

    try {
      const modelDef = MODELS[state.currentModel] || MODELS.hotspot;
      const locId = document.getElementById("predLocationSelect")?.value || state.selectedHotspotId;

      if (typeof modelDef.execute === "function") {
        await modelDef.execute();
      } else if (typeof modelDef.fetchUrl === "function") {
        const url = modelDef.fetchUrl(locId);
        const res = await fetch(url);
        const data = await res.json();
        if (typeof modelDef.render === "function") {
          const rendered = await modelDef.render(data, locId);
          if (typeof rendered === "string") {
            resultPanel.innerHTML = rendered;
          }
        }
      }
      resultPanel.style.display = "block";
    } catch (err) {
      resultPanel.style.display = "block";
      resultPanel.innerHTML = `<div style="color:#ef4444; font-size:0.8rem;">Computation failed: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      if (spinner) spinner.style.display = "none";
    }
  }

  // Legacy Renderer Implementations (Preserved for 100% baseline test integrity)
  function renderHotspotResult(data) {
    const container = document.getElementById("predResultPanel");
    if (!data.success) {
      container.innerHTML = `<div style="color:#ef4444;">${data.message || 'Forecast calculation error'}</div>`;
      return;
    }
    const tierClass =
      data.riskTier === "Critical" ? "gauge-critical" :
      data.riskTier === "High" ? "gauge-high" :
      data.riskTier === "Moderate" ? "gauge-moderate" : "gauge-low";

    const factorsHtml = (data.factors || []).map(f => `
      <div class="pred-factor-row">
        <span style="color:#94a3b8;">${f.name} (w: ${f.weight})</span>
        <strong style="color:#f8fafc;">${f.value}</strong>
      </div>
    `).join("");

    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#38bdf8; font-size:0.85rem;">Daily Forecast (${data.date})</strong>
          <span class="pred-gauge ${tierClass}">${data.riskTier} (${data.riskScore}/100)</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:flex; justify-content:space-around; text-align:center;">
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Predicted 24h</div>
            <div style="font-weight:700; color:#f8fafc; font-size:1.05rem;">${data.predictedAccidents24h}</div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Confidence</div>
            <div style="font-weight:700; color:#10b981; font-size:1.05rem;">${Math.round(data.confidence * 100)}%</div>
          </div>
        </div>
        <div>
          <span style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700;">Contributing Factors</span>
          <div style="margin-top:4px;">${factorsHtml}</div>
        </div>
        <div style="font-size:0.68rem; color:#64748b; font-style:italic; text-align:right;">Model: ${data.model}</div>
      </div>
    `;

    const spot = state.hotspots.find(h => h.location_id === data.locationId);
    if (spot) flyToLocation(spot.latitude, spot.longitude);
  }

  function renderCalendarResult(data) {
    const container = document.getElementById("predResultPanel");
    if (!data.success) {
      container.innerHTML = `<div style="color:#ef4444;">${data.message || 'Calendar generation error'}</div>`;
      return;
    }
    const daysRows = (data.days || []).slice(0, 15).map(d => {
      const color = d.riskLevel === "Critical" ? "#ef4444" : d.riskLevel === "High" ? "#f97316" : d.riskLevel === "Moderate" ? "#eab308" : "#10b981";
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 0; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.05);">
          <span>${d.date}</span>
          <span>Avg: <strong>${d.historicalAvg}</strong></span>
          <span style="color:${color}; font-weight:700;">${d.riskLevel}</span>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px;">
        <strong style="color:#38bdf8;">Calendar Risk (Month ${data.month}/${data.year})</strong>
        <div style="font-size:0.74rem; color:#94a3b8;">Peak Historical Risk Day: <strong style="color:#ef4444;">${data.peakDay || 'N/A'}</strong></div>
        <div style="max-height:160px; overflow-y:auto; padding-right:4px;">${daysRows}</div>
        <div style="font-size:0.68rem; color:#64748b; text-align:right;">Model: ${data.model}</div>
      </div>
    `;
  }

  function renderEmpiricalBayesResult(data) {
    const container = document.getElementById("predResultPanel");
    const stars = "★".repeat(data.safetyRatingStars) + "☆".repeat(5 - data.safetyRatingStars);
    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid #8b5cf6;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#a78bfa;">Empirical Bayes (EB) Hazard</strong>
          <span style="color:#fbbf24; font-size:0.9rem; letter-spacing:1px;">${stars}</span>
        </div>
        <div style="font-size:0.75rem; color:#cbd5e1;">${data.roadName}</div>
        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:grid; grid-template-columns:1fr 1fr; gap:6px; text-align:center;">
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Expected Crashes (E)</div>
            <div style="font-weight:700; color:#38bdf8; font-size:1.05rem;">${data.expectedAnnualCrashes}/yr</div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">EB Hazard Score</div>
            <div style="font-weight:700; color:#ef4444; font-size:1.05rem;">${data.hazardScoreEB}/100</div>
          </div>
        </div>
        <div class="pred-factor-row">
          <span style="color:#94a3b8;">Classification Rating</span>
          <strong style="color:#f87171;">${data.hazardRating}</strong>
        </div>
        <div class="pred-factor-row">
          <span style="color:#94a3b8;">Statistical Weight (w)</span>
          <span style="color:#f8fafc;">${data.weightW} (k=${data.dispersionK})</span>
        </div>
        <div style="font-size:0.65rem; color:#64748b; text-align:right;">FHWA/MoRTH Empirical Bayes Formulation</div>
      </div>
    `;
  }

  function renderEPDOResult(data) {
    const container = document.getElementById("predResultPanel");
    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid #ec4899;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#f472b6;">IRC:SP:88 EPDO Rating</strong>
          <span style="padding:2px 8px; border-radius:4px; background:rgba(236,72,153,0.2); color:#f472b6; font-weight:700; font-size:0.75rem;">Score: ${data.epdoScore}</span>
        </div>
        <div style="font-size:0.75rem; color:#cbd5e1;">${data.roadName}</div>
        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; text-align:center;">
          <div style="font-size:0.68rem; color:#94a3b8;">Estimated Socio-Economic Loss (MoRTH)</div>
          <div style="font-weight:800; color:#ef4444; font-size:1.15rem;">₹ ${data.economicLossCroresINR} Crores</div>
        </div>
        <div class="pred-factor-row">
          <span style="color:#94a3b8;">Remediation Priority</span>
          <strong style="color:#f87171;">${data.ircRemediationPriority}</strong>
        </div>
        <div class="pred-factor-row">
          <span style="color:#94a3b8;">Casualty Weights</span>
          <span style="color:#f8fafc;">Fatal: ${data.totalDeaths} | Injured: ${data.totalInjuries}</span>
        </div>
        <div style="font-size:0.65rem; color:#64748b; text-align:right;">IRC:SP:88-2019 Road Safety Audit Standard</div>
      </div>
    `;
  }

  function renderGoldenHourResult(data) {
    const container = document.getElementById("predResultPanel");
    const isSafe = data.isWithinGoldenHour;
    const catColor = isSafe ? "#10b981" : "#ef4444";
    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid ${catColor};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#38bdf8;">Golden Hour Reachability</strong>
          <span style="padding:2px 8px; border-radius:4px; background:${catColor}20; color:${catColor}; font-weight:700; font-size:0.72rem;">${data.traumaDesertCategory}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:grid; grid-template-columns:1fr 1fr; gap:6px; text-align:center;">
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Transit Time</div>
            <div style="font-weight:800; color:${catColor}; font-size:1.1rem;">${data.nearestTraumaCenter.estimatedMinutes} mins</div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Distance</div>
            <div style="font-weight:800; color:#f8fafc; font-size:1.1rem;">${data.nearestTraumaCenter.distanceKm} km</div>
          </div>
        </div>
        <div style="font-size:0.74rem;">
          <div style="color:#94a3b8; font-size:0.68rem;">Nearest Apex Center:</div>
          <strong style="color:#f8fafc;">${data.nearestTraumaCenter.name}</strong>
          <div style="color:#38bdf8; font-size:0.7rem; margin-top:2px;">📞 Emergency Helpline: ${data.nearestTraumaCenter.helpline}</div>
        </div>
        <div style="font-size:0.65rem; color:#64748b; text-align:right;">Ambulance Isochrone Catchment Active on Map</div>
      </div>
    `;
  }

  function renderCircadianResult(data) {
    const container = document.getElementById("predResultPanel");
    const multColor = data.isNightFreightFatiguePeak ? "#ef4444" : data.isDaytimeCommuterPeak ? "#f59e0b" : "#38bdf8";
    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid ${multColor};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#38bdf8;">Circadian Time Window: ${data.timeWindowLabel}</strong>
          <span style="padding:2px 8px; border-radius:4px; background:${multColor}20; color:${multColor}; font-weight:700; font-size:0.75rem;">Risk ${data.fatigueCrashMultiplier}x</span>
        </div>
        <div class="pred-factor-row">
          <span style="color:#94a3b8;">Dominant Fleet</span>
          <strong style="color:#f8fafc; text-align:right; max-width:65%; font-size:0.7rem;">${data.dominantVehicleAtHour}</strong>
        </div>
        <div style="font-size:0.72rem; color:#cbd5e1; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px;">
          <strong style="color:${multColor};">Primary Hazard:</strong> ${data.primaryRiskFactor}
        </div>
        <div style="font-size:0.65rem; color:#64748b; text-align:right;">24h Diurnal Crash Probability Multiplier</div>
      </div>
    `;
  }

  function renderBudgetROIResult(data) {
    const container = document.getElementById("predResultPanel");
    const interventionsHtml = data.recommendedInterventions.map(i => `<li style="margin-bottom:2px;">${i}</li>`).join("");
    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid #10b981;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#34d399;">Remediation BCR & Budget ROI</strong>
          <span style="padding:2px 8px; border-radius:4px; background:rgba(16,185,129,0.2); color:#34d399; font-weight:800; font-size:0.8rem;">BCR: ${data.benefitCostRatio} : 1</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; display:grid; grid-template-columns:1fr 1fr; gap:6px; text-align:center;">
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Intervention Cost</div>
            <div style="font-weight:700; color:#f8fafc; font-size:1.05rem;">₹ ${data.estimatedCivilCostLakhsINR} Lakhs</div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:#94a3b8;">Expected Lives Saved</div>
            <div style="font-weight:700; color:#10b981; font-size:1.05rem;">${data.expectedLivesSaved3Yr} Lives (3yr)</div>
          </div>
        </div>
        <div>
          <span style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700;">IRC Civil Remedial Package</span>
          <ul style="font-size:0.7rem; color:#cbd5e1; padding-left:14px; margin-top:4px;">${interventionsHtml}</ul>
        </div>
        <div style="font-size:0.65rem; color:#64748b; text-align:right;">Benefit-Cost Ratio = Economic Return / Civil Works Cost</div>
      </div>
    `;
  }

  function renderRouteResult(data, origin, destination) {
    const container = document.getElementById("predResultPanel");
    if (!data.success) {
      container.innerHTML = `<div style="color:#ef4444;">${data.message || 'Route safety error'}</div>`;
      return;
    }
    const isSafeColor = data.safetyScore > 70 ? "#10b981" : data.safetyScore > 40 ? "#f59e0b" : "#ef4444";
    const statusText = data.isSafe ? "SAFE CORRIDOR" : "HAZARDOUS TRANSIT";

    const dangerListHtml = (data.dangerousSegments || []).map(seg => `
      <div style="background:rgba(239,68,68,0.1); border-left:3px solid #ef4444; padding:5px 8px; border-radius:4px; margin-top:5px; font-size:0.72rem;">
        <div style="display:flex; justify-content:space-between;">
          <strong style="color:#f87171;">Risk ${seg.risk}/100</strong>
          <span style="color:#94a3b8;">${Number(seg.lat).toFixed(2)}, ${Number(seg.lng).toFixed(2)}</span>
        </div>
        <div style="color:#fecaca; margin-top:2px;">${seg.reason}</div>
      </div>
    `).join("");

    container.innerHTML = `
      <div class="pred-result-card" style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:#38bdf8;">Route Safety Assessment</strong>
          <span style="padding:2px 8px; border-radius:9999px; background:${isSafeColor}25; color:${isSafeColor}; border:1px solid ${isSafeColor}; font-weight:700; font-size:0.75rem;">
            ${statusText} (${data.safetyScore}/100)
          </span>
        </div>
        <div style="font-size:0.72rem; color:#cbd5e1;">Distance: <strong>${data.totalDistanceKm} km</strong> | Traversed Nodes: <strong>${data.path ? data.path.length : 0}</strong></div>
        ${dangerListHtml ? `<div style="margin-top:4px;"><strong style="color:#ef4444; font-size:0.7rem; text-transform:uppercase;">Flagged High Hazard Nodes:</strong>${dangerListHtml}</div>` : ''}
        <div style="font-size:0.68rem; color:#64748b; text-align:right;">Graph Router: ${data.routingEngine}</div>
      </div>
    `;

    plotRouteOnMap(data.path, origin, destination);
  }

  function plotRouteOnMap(pathNodes, origin, destination) {
    const ctrl = getMapController();
    const map = getMapInstance();

    if (state.activeRoutePolyline && map) map.removeLayer(state.activeRoutePolyline);
    state.activeRouteMarkers.forEach(m => {
      if (m.setMap) m.setMap(null);
      else if (map) map.removeLayer(m);
    });
    state.activeRouteMarkers = [];

    if (!pathNodes || pathNodes.length === 0) return;

    if (ctrl && ctrl.googleMap && window.google?.maps) {
      const gPath = pathNodes.map(n => ({ lat: n.lat, lng: n.lng }));
      const gPoly = new google.maps.Polyline({
        path: gPath,
        geodesic: true,
        strokeColor: "#38bdf8",
        strokeOpacity: 0.85,
        strokeWeight: 5
      });
      gPoly.setMap(ctrl.googleMap);
      state.activeRouteMarkers.push(gPoly);

      const bounds = new google.maps.LatLngBounds();
      gPath.forEach(pt => bounds.extend(pt));
      ctrl.googleMap.fitBounds(bounds);
      return;
    }

    if (map && typeof L !== "undefined") {
      const latLngs = pathNodes.map(n => [n.lat, n.lng]);
      state.activeRoutePolyline = L.polyline(latLngs, {
        color: "#38bdf8",
        weight: 5,
        opacity: 0.85,
        dashArray: "8, 6"
      }).addTo(map);

      const mOrigin = L.circleMarker([origin.lat, origin.lng], { radius: 7, color: "#10b981", fillColor: "#10b981", fillOpacity: 0.9 }).addTo(map).bindPopup("<b>Route Origin</b>");
      const mDest = L.circleMarker([destination.lat, destination.lng], { radius: 7, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map).bindPopup("<b>Route Destination</b>");
      state.activeRouteMarkers.push(mOrigin, mDest);

      map.fitBounds(state.activeRoutePolyline.getBounds(), { padding: [50, 50] });
    }
  }

  async function triggerGoldenHourIsochrone(locId) {
    const ctrl = getMapController();
    const map = getMapInstance();

    state.activeIsochroneLayers.forEach(l => {
      if (l.setMap) l.setMap(null);
      else if (map) map.removeLayer(l);
    });
    state.activeIsochroneLayers = [];

    try {
      const res = await fetch(`/api/analytics/golden-hour/${encodeURIComponent(locId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const coords = data.hotspotCoords;
      const trauma = data.nearestTraumaCenter;

      flyToLocation(coords.lat, coords.lng, 10);

      // Support Google Maps engine
      if (ctrl && ctrl.googleMap && window.google?.maps) {
        const c30 = new google.maps.Circle({
          strokeColor: "#10b981",
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: "#10b981",
          fillOpacity: 0.12,
          map: ctrl.googleMap,
          center: { lat: coords.lat, lng: coords.lng },
          radius: 25000
        });

        const c60 = new google.maps.Circle({
          strokeColor: "#f59e0b",
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: "#f59e0b",
          fillOpacity: 0.06,
          map: ctrl.googleMap,
          center: { lat: coords.lat, lng: coords.lng },
          radius: 50000
        });

        const marker = new google.maps.Marker({
          position: { lat: trauma.lat, lng: trauma.lng },
          map: ctrl.googleMap,
          title: `${trauma.name} (${trauma.estimatedMinutes} mins)`
        });

        state.activeIsochroneLayers.push(c30, c60, marker);
        return;
      }

      // Support Leaflet engine
      if (map && typeof L !== "undefined") {
        const c30 = L.circle([coords.lat, coords.lng], {
          radius: 25000,
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "4, 4"
        }).addTo(map).bindPopup("<b>30-Minute Ambulance Catchment</b>");

        const c60 = L.circle([coords.lat, coords.lng], {
          radius: 50000,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: "6, 6"
        }).addTo(map).bindPopup("<b>60-Minute Golden Hour Perimeter</b>");

        const traumaMarker = L.marker([trauma.lat, trauma.lng], {
          icon: L.divIcon({
            className: "trauma-hospital-icon",
            html: `<div style="background:#ef4444; color:#fff; font-weight:800; font-size:12px; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #ef4444; border:2px solid #fff;">H</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup(`<b>${trauma.name}</b><br>Level: ${trauma.level}<br>Transit: ${trauma.estimatedMinutes} mins`);

        state.activeIsochroneLayers.push(c30, c60, traumaMarker);
      }
    } catch (err) {
      console.warn("Isochrone draw error:", err);
    }
  }

  async function loadRealtimeHeatmap() {
    try {
      const res = await fetch("/api/predict/realtime");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.heatmapPoints)) return;

      const map = getMapInstance();
      if (!map) return;

      if (state.activeHeatLayer) {
        map.removeLayer(state.activeHeatLayer);
      }

      if (typeof L !== "undefined" && typeof L.heatLayer === "function") {
        state.activeHeatLayer = L.heatLayer(data.heatmapPoints, {
          radius: 22,
          blur: 15,
          maxZoom: 14,
          max: 1.0,
          gradient: {
            0.2: "#38bdf8",
            0.4: "#34d399",
            0.6: "#fbbf24",
            0.8: "#f97316",
            1.0: "#ef4444"
          }
        });
        state.activeHeatLayer.addTo(map);
      }
    } catch (err) {
      console.warn("Realtime prediction heatmap load error:", err);
    }
  }

  function patchMapPopupForPrediction() {
    const checkMap = setInterval(() => {
      const map = getMapInstance();
      if (map) {
        clearInterval(checkMap);
        map.on("popupopen", async (e) => {
          const popup = e.popup;
          const contentNode = popup.getElement();
          if (!contentNode) return;

          const weatherBox = contentNode.querySelector('[id^="live-weather-box-"]');
          if (weatherBox) {
            const locId = weatherBox.id.replace("live-weather-box-", "");
            let predBox = contentNode.querySelector(".prediction-popup-addon");
            if (!predBox) {
              predBox = document.createElement("div");
              predBox.className = "prediction-popup-addon";
              predBox.style.cssText = "margin-top: 8px; padding: 8px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; font-size: 0.72rem;";
              predBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; color:#38bdf8;">⚡ Safety Predictions</span>
                  <span style="color:#94a3b8; font-size:0.65rem;">Calculating...</span>
                </div>
              `;
              weatherBox.parentElement.parentElement.appendChild(predBox);

              try {
                const [pRes, ebRes, ghRes] = await Promise.all([
                  fetch(`/api/predict/hotspot/${encodeURIComponent(locId)}`),
                  fetch(`/api/analytics/eb-model/${encodeURIComponent(locId)}`),
                  fetch(`/api/analytics/golden-hour/${encodeURIComponent(locId)}`)
                ]);

                if (pRes.ok && ebRes.ok && ghRes.ok) {
                  const pData = await pRes.json();
                  const ebData = await ebRes.json();
                  const ghData = await ghRes.json();

                  const tierColor = pData.riskTier === "Critical" ? "#ef4444" : pData.riskTier === "High" ? "#f97316" : "#10b981";
                  const ghColor = ghData.isWithinGoldenHour ? "#10b981" : "#ef4444";

                  predBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-weight:700; color:#38bdf8;">⚡ Safety Predictions</span>
                      <span style="font-weight:700; color:${tierColor};">${pData.riskTier} (Score ${pData.riskScore})</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; color:#cbd5e1; font-size:0.7rem; margin-bottom:4px;">
                      <span>Expected Crashes: <strong>${ebData.expectedAnnualCrashes}/yr</strong></span>
                      <span>Trauma Transit: <strong style="color:${ghColor};">${ghData.nearestTraumaCenter.estimatedMinutes}m</strong></span>
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                      <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ghData.hotspotCoords.lat},${ghData.hotspotCoords.lng}" target="_blank" style="flex:1; text-align:center; background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:3px 6px; border-radius:4px; font-weight:600; text-decoration:none; font-size:0.68rem;">
                        🌐 360° View
                      </a>
                      <button onclick="window.predictionEngine.triggerGoldenHourIsochrone('${locId}')" style="flex:1; background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4); padding:3px 6px; border-radius:4px; font-weight:600; font-size:0.68rem; cursor:pointer;">
                        🚑 Isochrone
                      </button>
                    </div>
                  `;
                }
              } catch (_) {
                predBox.remove();
              }
            }
          }
        });
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPredictionEngine);
  } else {
    initPredictionEngine();
  }

  window.predictionEngine = {
    state,
    MODELS,
    toggleSidebar,
    loadRealtimeHeatmap,
    triggerGoldenHourIsochrone,
    flyToLocation
  };
})();
