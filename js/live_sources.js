/**
 * ============================================================================
 * LIVE SOURCES MONITOR
 * window.liveSourcesMonitor
 * Live status strip polling /api/sources/status (30s) + /api/live/alerts (60s)
 * only while prediction sidebar is open.
 * ============================================================================
 */

(function () {
  "use strict";

  const STATE = {
    panelOpen: false,
    statusTimer: null,
    alertsTimer: null,
    sources: [],
    alerts: [],
    lastStatusAt: 0,
    lastAlertsAt: 0,
    isRefreshingAll: false
  };

  function formatAge(ms) {
    if (ms == null || isNaN(ms)) return "–";
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.round(min / 60);
    return `${hr}h`;
  }

  function getStatusDot(status) {
    switch (status) {
      case "ok":
        return `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981;" title="Live & Healthy"></span>`;
      case "snapshot":
        return `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#38bdf8;" title="Snapshot Hydrated"></span>`;
      case "stale":
        return `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#f59e0b;" title="Stale Cache"></span>`;
      case "disabled":
        return `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#64748b;" title="Disabled (Requires Key)"></span>`;
      default:
        return `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#ef4444;" title="Error / Degraded"></span>`;
    }
  }

  async function fetchStatus() {
    try {
      const res = await fetch("/api/sources/status");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.sources)) {
        STATE.sources = data.sources;
        STATE.lastStatusAt = Date.now();
        renderStatusStrip();
        updateHudBadge();
      }
    } catch (err) {
      console.warn("[liveSources] Status fetch failed:", err);
    }
  }

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/live/alerts?limit=5");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.alerts)) {
        STATE.alerts = data.alerts;
        STATE.lastAlertsAt = Date.now();
        renderAlertsStrip();
      }
    } catch (err) {
      console.warn("[liveSources] Alerts fetch failed:", err);
    }
  }

  async function refreshSource(id) {
    const btn = document.querySelector(`[data-source-btn="${id}"]`);
    if (btn) btn.textContent = "⏳";
    try {
      const res = await fetch("/api/sources/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, force: false })
      });
      const data = await res.json();
      await fetchStatus();
      return data;
    } catch (err) {
      console.error("[liveSources] Refresh failed for", id, err);
    } finally {
      if (btn) btn.textContent = "↻";
    }
  }

  async function refreshAllSources() {
    if (STATE.isRefreshingAll) return;
    STATE.isRefreshingAll = true;
    const btn = document.getElementById("btnRefreshAllSources");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Refreshing...";
    }
    try {
      // Refresh each registered enabled source safely without long blocking
      const enabledSources = STATE.sources.filter(s => s.config?.enabled && s.status !== "disabled");
      for (const s of enabledSources) {
        const id = s.config?.id || s.id;
        if (id) {
          try {
            await fetch("/api/sources/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, force: false })
            });
          } catch (_) {}
        }
      }
      await fetchStatus();
    } catch (err) {
      console.error("[liveSources] Refresh all failed:", err);
    } finally {
      STATE.isRefreshingAll = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Refresh All";
      }
    }
  }

  function updateHudBadge() {
    const badge = document.getElementById("telemetryFeedsStatus");
    if (!badge) return;
    const okCount = STATE.sources.filter(s => s.status === "ok" || s.status === "snapshot").length;
    const total = STATE.sources.length;
    badge.textContent = `Sources: ${okCount}/${total}`;
    badge.style.display = total > 0 ? "inline-block" : "none";
  }

  function renderStatusStrip() {
    const container = document.getElementById("liveSourcesStrip");
    if (!container) return;

    if (STATE.sources.length === 0) {
      container.innerHTML = `<div style="font-size:0.7rem; color:#64748b;">No ingestion sources registered.</div>`;
      return;
    }

    const rows = STATE.sources.map(s => {
      const dot = getStatusDot(s.status);
      const id = s.config?.id || s.id || "source";
      const name = s.config?.name || s.name || s.id || "Data Source";
      const recs = s.recordCount != null && s.recordCount > 0 ? `${s.recordCount} pts` : "";
      const age = s.provenance?.cacheAgeMs ? formatAge(s.provenance.cacheAgeMs) : (s.status === "disabled" ? "off" : (s.status === "ok" ? "live" : "snap"));

      return `
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.68rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.04);" title="${name} (${s.config?.kind || s.kind || ''}) - ${s.status}">
          <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:170px;">
            ${dot}
            <span style="color:#cbd5e1; font-weight:500;">${name}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-family:monospace; color:#94a3b8; font-size:0.64rem;">
            <span>${recs}</span>
            <span style="color:#64748b;">${age}</span>
            <button data-source-btn="${id}" onclick="window.liveSourcesMonitor.refresh('${id}')" style="background:none; border:none; color:#38bdf8; cursor:pointer; padding:0 3px; font-size:0.75rem;" title="Refresh source">↻</button>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:8px 10px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.68rem; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:0.04em;">
            📡 Real-Data Sources (${STATE.sources.filter(s => s.status === 'ok' || s.status === 'snapshot').length}/${STATE.sources.length})
          </div>
          <button id="btnRefreshAllSources" onclick="window.liveSourcesMonitor.refreshAll()" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; border-radius:3px; font-size:0.6rem; padding:2px 6px; cursor:pointer;" title="Refresh all data feeds">
            Refresh All
          </button>
        </div>
        <div style="max-height:140px; overflow-y:auto;">
          ${rows}
        </div>
      </div>
    `;
  }

  function renderAlertsStrip() {
    const container = document.getElementById("liveAlertsStrip");
    if (!container) return;

    if (!STATE.alerts || STATE.alerts.length === 0) {
      container.innerHTML = "";
      return;
    }

    const items = STATE.alerts.map(a => `
      <div style="padding:4px 6px; margin-bottom:4px; border-radius:4px; background:rgba(239,68,68,0.12); border-left:2px solid #ef4444; font-size:0.66rem; color:#fca5a5;">
        <div style="font-weight:600; color:#fecaca;">${a.roadName || 'High-Risk Corridor'}</div>
        <div>${a.alert || 'Adverse weather hazard active'}</div>
      </div>
    `).join("");

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:0.66rem; font-weight:700; color:#ef4444; margin-bottom:4px; text-transform:uppercase;">
          ⚠️ Live Corridor Hazards (${STATE.alerts.length})
        </div>
        ${items}
      </div>
    `;
  }

  function startPolling() {
    stopPolling();
    fetchStatus();
    fetchAlerts();
    STATE.statusTimer = setInterval(fetchStatus, 30000);
    STATE.alertsTimer = setInterval(fetchAlerts, 60000);
  }

  function stopPolling() {
    if (STATE.statusTimer) clearInterval(STATE.statusTimer);
    if (STATE.alertsTimer) clearInterval(STATE.alertsTimer);
    STATE.statusTimer = null;
    STATE.alertsTimer = null;
  }

  function setPanelOpen(open) {
    STATE.panelOpen = open;
    if (open) {
      startPolling();
    } else {
      stopPolling();
    }
  }

  window.liveSourcesMonitor = {
    setPanelOpen,
    refresh: refreshSource,
    refreshAll: refreshAllSources,
    fetchStatus,
    fetchAlerts,
    renderStatusStrip
  };

  console.log("[liveSourcesMonitor] Initialized with safe source name resolution and async refresh");
})();
