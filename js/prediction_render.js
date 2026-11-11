/**
 * ============================================================================
 * PREDICTION RENDERERS & TRUST PRESENTATION ENGINE
 * window.predictionRenderers
 * Reusable card templates, inline SVG charts, and Trust Tier chips
 * Built with safe number handling so no undefined.toFixed() errors can ever occur.
 * ============================================================================
 */

(function () {
  "use strict";

  const TRUST_BADGES = {
    measured: {
      label: "REAL / MEASURED",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.4)",
      desc: "Direct physical observation or official government record"
    },
    model_derived: {
      label: "MODEL DERIVED",
      color: "#38bdf8",
      bg: "rgba(56, 189, 248, 0.15)",
      border: "rgba(56, 189, 248, 0.4)",
      desc: "Deterministic mathematical model or global numerical simulation"
    },
    registry_aggregate: {
      label: "REGISTRY AGGREGATE",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.4)",
      desc: "Statistical summary aggregate from national or multilateral registry"
    },
    simulated: {
      label: "SIMULATED",
      color: "#ec4899",
      bg: "rgba(236, 72, 153, 0.15)",
      border: "rgba(236, 72, 153, 0.4)",
      desc: "Synthetic or Monte Carlo stochastic simulation"
    }
  };

  function num(val, fallback = 0) {
    if (val === null || val === undefined || isNaN(Number(val))) return fallback;
    return Number(val);
  }

  function fmt(val, decimals = 1, fallback = "0.0") {
    if (val === null || val === undefined || isNaN(Number(val))) return fallback;
    return Number(val).toFixed(decimals);
  }

  function trustChip(tier, customNote) {
    const t = TRUST_BADGES[tier] || TRUST_BADGES.model_derived;
    return `
      <div style="display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:12px; background:${t.bg}; border:1px solid ${t.border}; font-size:0.65rem; font-weight:700; color:${t.color}; letter-spacing:0.04em;" title="${t.desc}${customNote ? ' — ' + customNote : ''}">
        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${t.color};"></span>
        <span>${t.label}</span>
      </div>
    `;
  }

  function renderAssumptions(assumptions) {
    if (!assumptions || assumptions.length === 0) return "";
    return `
      <div style="margin-top:10px; padding:8px 10px; background:rgba(15,23,42,0.6); border-left:2px solid #64748b; font-size:0.68rem; color:#94a3b8; border-radius:3px;">
        <div style="font-weight:600; color:#cbd5e1; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em; font-size:0.62rem;">Model Assumptions</div>
        <ul style="margin:0; padding-left:14px;">
          ${assumptions.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderProvenanceFooter(prov) {
    if (!prov) return "";
    const ageSec = Math.round((prov.cacheAgeMs || 0) / 1000);
    const ageStr = ageSec > 60 ? `${Math.round(ageSec / 60)}m ago` : `${ageSec}s ago`;
    return `
      <div style="margin-top:10px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.1); font-size:0.65rem; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
        <span title="${prov.endpoint || ''}">Src: ${prov.publisher || 'Internal'} · ${prov.dataset || ''}</span>
        <span>${prov.fromSnapshot ? 'Snapshot' : 'Cache ' + ageStr}</span>
      </div>
    `;
  }

  // --- SVG Chart Helpers ---
  function sparklineSvg(values, width = 280, height = 40, stroke = "#38bdf8") {
    if (!values || !Array.isArray(values) || values.length < 2) return "";
    const cleanVals = values.map(v => num(v, 0));
    const min = Math.min(...cleanVals);
    const max = Math.max(...cleanVals);
    const range = (max - min) || 1;
    const pts = cleanVals.map((v, i) => {
      const x = (i / (cleanVals.length - 1)) * (width - 10) + 5;
      const y = height - 5 - ((v - min) / range) * (height - 10);
      return `${fmt(x, 1)},${fmt(y, 1)}`;
    }).join(" ");

    return `
      <svg width="${width}" height="${height}" style="overflow:visible; display:block;">
        <polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts}" />
      </svg>
    `;
  }

  function barChartSvg(items, width = 300, barHeight = 14) {
    if (!items || !Array.isArray(items) || items.length === 0) return "";
    const maxVal = Math.max(...items.map(d => num(d.value, 0)), 1);
    const totalHeight = items.length * (barHeight + 6);
    const rows = items.map((it, idx) => {
      const y = idx * (barHeight + 6);
      const val = num(it.value, 0);
      const w = Math.max(2, (val / maxVal) * (width - 120));
      const col = it.color || "#38bdf8";
      return `
        <text x="0" y="${y + barHeight - 3}" fill="#94a3b8" font-size="10" font-family="monospace">${it.label || ''}</text>
        <rect x="75" y="${y}" width="${fmt(w, 1)}" height="${barHeight}" rx="3" fill="${col}" opacity="0.85" />
        <text x="${75 + w + 6}" y="${y + barHeight - 3}" fill="#e2e8f0" font-size="10" font-weight="600">${it.display || fmt(val, 1)}</text>
      `;
    }).join("");

    return `
      <svg width="${width}" height="${totalHeight}" style="display:block; margin:6px 0;">
        ${rows}
      </svg>
    `;
  }

  window.predictionRenderers = {
    trustChip,
    renderAssumptions,
    renderProvenanceFooter,
    sparklineSvg,
    barChartSvg,

    // 1. Crash Probability
    renderProbability(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Prediction error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const p1 = (num(data.tail?.gte1) * 100).toFixed(1);
      const p2 = (num(data.tail?.gte2) * 100).toFixed(1);
      const lambdaDaily = num(data.lambdaPerDay ?? data.lambdaPoisson);
      const interArrival = num(data.interArrivalDays, 1 / Math.max(lambdaDaily, 0.001));
      const hazardMult = num(data.hazardMultiplier, 1.0);

      const bars = [
        { label: "P(X ≥ 1)", value: num(data.tail?.gte1), display: `${p1}%`, color: "#f59e0b" },
        { label: "P(X ≥ 2)", value: num(data.tail?.gte2), display: `${p2}%`, color: "#ef4444" }
      ];

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">24-Hour Collision Probability</div>
            ${trustChip(data.trustTier || "model_derived")}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase;">Daily Intensity (λ)</div>
              <div style="font-size:1.15rem; font-weight:700; color:#f8fafc;">${fmt(lambdaDaily, 3)} <span style="font-size:0.7rem; font-weight:400; color:#64748b;">/ day</span></div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:0.65rem; color:#94a3b8; text-transform:uppercase;">Mean Days Between</div>
              <div style="font-size:1.15rem; font-weight:700; color:#38bdf8;">${fmt(interArrival, 1)} <span style="font-size:0.7rem; font-weight:400; color:#64748b;">days</span></div>
            </div>
          </div>

          ${barChartSvg(bars, 290, 16)}

          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:8px;">
            Distribution: <strong>Poisson & Negative Binomial (NB2)</strong><br/>
            Live Environmental Factor: <strong>${fmt(hazardMult, 2)}×</strong>
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 2. Trend & Change Point
    renderTrend(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Trend error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const dirCol = data.direction === "increasing" ? "#ef4444" : data.direction === "decreasing" ? "#10b981" : "#94a3b8";
      const series = data.latestEwmaSeries || data.series || [0.25, 0.28, 0.26, 0.3, 0.29];
      const spark = sparklineSvg(series, 290, 42, dirCol);
      const slope = num(data.slopePerDay);
      const ewma = num(data.ewmaLatest ?? data.ewmaCurrent);
      const r2 = num(data.r2 ?? data.rSquared);
      const ciLo = data.ci95Slope?.lo != null ? `${(num(data.ci95Slope.lo) * 100).toFixed(2)}%` : "–";
      const ciHi = data.ci95Slope?.hi != null ? `${(num(data.ci95Slope.hi) * 100).toFixed(2)}%` : "–";

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Environmental Hazard Trend</div>
            ${trustChip(data.trustTier || "model_derived")}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
            <span style="font-size:0.75rem; color:#94a3b8;">Direction (OLS Slope)</span>
            <span style="font-weight:700; color:${dirCol}; text-transform:uppercase; font-size:0.8rem;">${data.direction || 'Stable'} (${(slope * 100).toFixed(2)}%/d)</span>
          </div>

          <div style="background:rgba(15,23,42,0.8); padding:6px; border-radius:6px; margin:6px 0;">
            ${spark}
            <div style="display:flex; justify-content:space-between; font-size:0.6rem; color:#64748b; margin-top:2px;">
              <span>Past Days</span>
              <span>Today (EWMA: ${fmt(ewma, 2)})</span>
            </div>
          </div>

          <div style="font-size:0.72rem; color:#94a3b8;">
            95% Slope CI: [${ciLo}, ${ciHi}]<br/>
            Goodness of fit (R²): <strong style="color:#e2e8f0;">${fmt(r2, 3)}</strong>
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 3. Severity Posterior
    renderSeverity(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Severity posterior error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const pFatPct = (num(data.pNextCrashFatal ?? data.posteriorMeanJeffreys) * 100).toFixed(1);
      const wilsonLo = (num(data.wilson?.lo) * 100).toFixed(1);
      const wilsonHi = (num(data.wilson?.hi) * 100).toFixed(1);

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Beta-Binomial Fatality Posterior</div>
            ${trustChip(data.trustTier || "registry_aggregate")}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:0.65rem; color:#94a3b8;">P(Next Crash Fatal)</div>
              <div style="font-size:1.3rem; font-weight:700; color:#ec4899;">${pFatPct}%</div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:0.65rem; color:#94a3b8;">Wilson 95% CI</div>
              <div style="font-size:0.9rem; font-weight:600; color:#f8fafc; margin-top:4px;">${wilsonLo}% – ${wilsonHi}%</div>
            </div>
          </div>

          <div style="font-size:0.72rem; color:#cbd5e1;">
            Observed Corridor Crashes: <strong>${data.observed?.total || 0}</strong> (Fatal: <strong>${data.observed?.fatal || 0}</strong>)<br/>
            Jeffreys Uninformative Prior: Beta(0.5, 0.5)
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 4. Spatial Clustering (Moran's I)
    renderClustering(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Clustering error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const moranVal = num(data.moransI);
      const isClustered = moranVal > 0;
      const col = isClustered ? "#38bdf8" : "#94a3b8";

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Spatial Autocorrelation (Moran's I)</div>
            ${trustChip(data.trustTier || "model_derived")}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Observed Moran's I</div>
              <div style="font-size:1.3rem; font-weight:700; color:${col};">${fmt(moranVal, 3)}</div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Z-Score (Significance)</div>
              <div style="font-size:1.3rem; font-weight:700; color:#f8fafc;">${fmt(data.zScore, 2)}</div>
            </div>
          </div>

          <div style="font-size:0.75rem; color:#e2e8f0; margin-bottom:6px;">
            Pattern: <strong style="color:${col}; text-transform:capitalize;">${data.interpretation || 'Clustered'}</strong> (p-val: ${data.pApprox || '< 0.05'})
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 5. Golden Hour Trauma Survival
    renderSurvival(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Survival calculation error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const survProb = num(data.survivalAtArrival);
      const survPct = (survProb * 100).toFixed(1);
      const survCol = survProb > 0.7 ? "#10b981" : survProb > 0.4 ? "#f59e0b" : "#ef4444";
      const transitMin = num(data.arrivalMinutes, 30);

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Trauma Golden-Hour Survival</div>
            ${trustChip(data.trustTier || "model_derived")}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Transit Time</div>
              <div style="font-size:1.2rem; font-weight:700; color:#f8fafc;">${fmt(transitMin, 0)} <span style="font-size:0.7rem; color:#64748b;">min</span></div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:8px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Critical Survival S(t)</div>
              <div style="font-size:1.2rem; font-weight:700; color:${survCol};">${survPct}%</div>
            </div>
          </div>

          <div style="font-size:0.72rem; color:#cbd5e1;">
            Preventable Casualty Loss: <strong style="color:#ef4444;">${fmt(data.preventableLossPct, 1)}%</strong><br/>
            Model Decay Half-life: τ = ${data.tauMinutes || 60} min (exponential triage decay)
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 6. Monte Carlo Trip Risk
    renderMonteCarlo(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Monte Carlo error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const bars = [
        { label: "P10 (Best)", value: num(data.percentiles?.p10), display: `${num(data.percentiles?.p10)}`, color: "#10b981" },
        { label: "P50 (Median)", value: num(data.percentiles?.p50), display: `${num(data.percentiles?.p50)}`, color: "#38bdf8" },
        { label: "P90 (Adverse)", value: num(data.percentiles?.p90), display: `${num(data.percentiles?.p90)}`, color: "#ef4444" }
      ];

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Monte Carlo Trip Simulation</div>
            ${trustChip(data.trustTier || "simulated")}
          </div>

          <div style="margin-bottom:8px;">
            ${barChartSvg(bars, 290, 15)}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            <div style="background:rgba(15,23,42,0.7); padding:6px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Runs Executed</div>
              <div style="font-weight:700; color:#f8fafc;">${(num(data.runs) || 1000).toLocaleString()}</div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:6px; border-radius:6px;">
              <div style="font-size:0.65rem; color:#94a3b8;">Trip P(≥1 Crash)</div>
              <div style="font-weight:700; color:#ec4899;">${((num(data.pAtLeast1) || 0) * 100).toFixed(2)}%</div>
            </div>
          </div>

          <div style="font-size:0.7rem; color:#64748b;">
            Deterministic Seed: ${data.seed || 42} (mulberry32 PRNG)
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 7. National Burden & Cross-Country Comparison
    renderNationalBurden(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">National burden error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const bars = (data.bars || []).map(p => ({
        label: p.iso3 || 'UNK',
        value: num(p.value),
        display: `${fmt(p.value, 1)} /100k`,
        color: p.iso3 === "IND" ? "#ec4899" : "#38bdf8"
      }));

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">South Asia Mortality Burden</div>
            ${trustChip(data.trustTier || "registry_aggregate")}
          </div>

          <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:6px;">
            Road Deaths per 100,000 Population (World Bank / WHO)
          </div>

          ${barChartSvg(bars, 290, 15)}

          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:8px;">
            India Historical CAGR: <strong>${fmt(data.indiaCagrPct, 2)}%</strong> / yr (${data.cagrWindow || ''})<br/>
            Best Regional Peer: <strong>${data.bestPeer?.iso3 || 'PAK'} (${fmt(data.bestPeer?.value, 1)} /100k)</strong>
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 8. 24-Hour Intensity Curve
    renderIntensityCurve(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Intensity curve error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const intensities = (data.curve || []).map(h => num(h.lambda));
      const spark = sparklineSvg(intensities, 290, 40, "#ec4899");
      const peakHours = (data.peakHours || []).map(h => `${h}:00`).join(", ");

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Circadian × Weather Intensity</div>
            ${trustChip(data.trustTier || "model_derived")}
          </div>

          <div style="background:rgba(15,23,42,0.8); padding:6px; border-radius:6px; margin:6px 0;">
            ${spark}
            <div style="display:flex; justify-content:space-between; font-size:0.6rem; color:#64748b; margin-top:2px;">
              <span>00:00 (Night)</span>
              <span>12:00 (Noon)</span>
              <span>23:00</span>
            </div>
          </div>

          <div style="font-size:0.72rem; color:#cbd5e1;">
            Peak Crash Windows: <strong style="color:#f59e0b;">${peakHours || '08:00, 17:00, 18:00'}</strong><br/>
            Daily Baseline Intensity: <strong>${fmt(data.lambdaDaily, 4)} /day</strong>
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    },

    // 9. Extreme Return Levels (Gumbel)
    renderExtremes(data) {
      if (!data || !data.success) {
        return `<div style="color:#ef4444; font-size:0.8rem;">Return levels error: ${data?.error || data?.message || 'Unknown'}</div>`;
      }
      const bars = (data.table || []).map(r => ({
        label: `${r.returnPeriodYears}y Return`,
        value: num(r.returnLevel),
        display: `${Math.round(num(r.returnLevel)).toLocaleString()}`,
        color: "#ec4899"
      }));

      return `
        <div class="pred-result-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Gumbel Extreme Return Levels</div>
            ${trustChip(data.trustTier || "registry_aggregate")}
          </div>

          <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:6px;">
            Expected National Annual Deaths at Return Periods
          </div>

          ${barChartSvg(bars, 290, 15)}

          <div style="font-size:0.72rem; color:#cbd5e1; margin-top:8px;">
            Gumbel Location (μ): <strong>${fmt(data.gumbel?.mu, 0)}</strong> · Scale (β): <strong>${fmt(data.gumbel?.beta, 0)}</strong>
          </div>

          ${renderAssumptions(data.assumptions)}
          ${renderProvenanceFooter(data.provenance)}
        </div>
      `;
    }
  };

  console.log("[predictionRenderers] Initialized with defensive numeric formatting and Trust Tier chips");
})();
