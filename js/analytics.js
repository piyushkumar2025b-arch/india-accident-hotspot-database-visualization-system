/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Analytics Engine: SVG Bar Charts, Temporal Distributions & Cause Analysis
 * ============================================================================
 */

class AnalyticsEngine {
  constructor() {
    this.container = document.getElementById("analyticsChartArea");
  }

  get client() {
    return window.db?.client;
  }

  /**
   * Renders monthly temporal bar charts inside the analytics drawer
   */
  async renderMonthlyTrends(containerId = "monthlyTrendChart") {
    const el = document.getElementById(containerId);
    if (!el) return;

    try {
      const data = await window.accidentService.getMonthlyTrends();

      if (!data || data.length === 0) {
        el.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; padding:20px 0;">No temporal monthly records available yet.</div>';
        return;
      }

      const maxAccidents = Math.max(...data.map(d => d.total_accidents), 1);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      let barsHtml = '<div style="display:flex; align-items:flex-end; gap:8px; height:140px; padding-top:20px;">';

      data.forEach(item => {
        const heightPct = Math.round((item.total_accidents / maxAccidents) * 100);
        const mName = months[item.month - 1] || item.month;

        barsHtml += `
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
            <span style="font-size:0.65rem; color:#a5b4fc; margin-bottom:4px; font-weight:700;">${item.total_accidents}</span>
            <div style="width:100%; height:${heightPct}%; background:linear-gradient(180deg, #6366f1, #3730a3); border-radius:4px 4px 0 0; position:relative;" title="${mName}: ${item.total_accidents} incidents, ${item.total_deaths} deaths"></div>
            <span style="font-size:0.68rem; color:var(--text-secondary); margin-top:6px;">${mName}</span>
          </div>
        `;
      });

      barsHtml += '</div>';
      el.innerHTML = barsHtml;
    } catch (err) {
      console.warn("Notice rendering monthly trends:", err.message || err);
    }
  }

  /**
   * Renders top accident causes breakdown
   */
  async renderTopCauses(containerId = "causesChartArea") {
    const el = document.getElementById(containerId);
    if (!el) return;

    try {
      const data = await window.accidentService.getTopCauses();

      if (!data || data.length === 0) {
        el.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">No cause statistics available.</div>';
        return;
      }

      let listHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';

      data.forEach(c => {
        const pct = c.percentage_of_total ?? c.percentage ?? 0;
        const total = c.total_accidents ?? c.count ?? 0;
        listHtml += `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
              <span style="font-weight:600; color:var(--text-primary);">${c.cause_name}</span>
              <span style="color:var(--text-muted);">${total} (${pct}%)</span>
            </div>
            <div style="height:6px; background:rgba(55,65,81,0.5); border-radius:3px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:var(--tier-high); border-radius:3px;"></div>
            </div>
          </div>
        `;
      });

      listHtml += '</div>';
      el.innerHTML = listHtml;
    } catch (err) {
      console.warn("Notice rendering causes:", err.message || err);
    }
  }
}

window.AnalyticsEngine = AnalyticsEngine;
window.analyticsEngine = new AnalyticsEngine();
