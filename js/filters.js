/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Filters & Search Handler: Cascading Dropdowns & Debounced Input
 * ============================================================================
 */

class FilterManager {
  constructor(options = {}) {
    this.onFilterChange = options.onFilterChange || (() => {});
    this.debounceTimer = null;
    this.currentFilters = {
      stateId: "",
      districtId: "",
      tier: "",
      severity: "",
      year: "",
      month: "",
      roadTypeId: "",
      causeId: "",
      source: "",
      search: ""
    };
    this.bindEvents();
    window.filterManager = this;
  }

  async initDropdowns() {
    await window.accidentService.loadReferenceData();
    this.populateStates();
    this.populateTaxonomies();
  }

  populateStates() {
    const stateSelect = document.getElementById("filterState");
    if (!stateSelect) return;

    stateSelect.innerHTML = '<option value="">All States / UTs</option>';
    window.accidentService.statesCache.forEach(st => {
      const opt = document.createElement("option");
      opt.value = st.id;
      opt.textContent = `${st.name} (${st.state_code})`;
      stateSelect.appendChild(opt);
    });
  }

  populateTaxonomies() {
    // Populate Road Types
    const roadSelect = document.getElementById("filterRoadType");
    if (roadSelect) {
      roadSelect.innerHTML = '<option value="">All Road Types</option>';
      window.accidentService.roadTypesCache.forEach(rt => {
        const opt = document.createElement("option");
        opt.value = rt.name;
        opt.textContent = rt.name;
        roadSelect.appendChild(opt);
      });
    }

    // Populate Causes
    const causeSelect = document.getElementById("filterCause");
    if (causeSelect) {
      causeSelect.innerHTML = '<option value="">All Primary Causes</option>';
      window.accidentService.causesCache.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        causeSelect.appendChild(opt);
      });
    }
  }

  async handleStateChange(stateId) {
    this.currentFilters.stateId = stateId;
    this.currentFilters.districtId = "";

    const districtSelect = document.getElementById("filterDistrict");
    if (districtSelect) {
      districtSelect.innerHTML = '<option value="">Loading Districts...</option>';
      districtSelect.disabled = true;

      if (stateId) {
        const districts = await window.accidentService.getDistricts(stateId);
        districtSelect.innerHTML = '<option value="">All Districts</option>';
        districts.forEach(d => {
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.textContent = d.name;
          districtSelect.appendChild(opt);
        });
        districtSelect.disabled = false;
      } else {
        districtSelect.innerHTML = '<option value="">Select State First</option>';
        districtSelect.disabled = true;
      }
    }

    this.notifyChange();
  }

  bindEvents() {
    // State Selection
    const stateEl = document.getElementById("filterState");
    if (stateEl) {
      stateEl.addEventListener("change", (e) => this.handleStateChange(e.target.value));
    }

    // District Selection
    const distEl = document.getElementById("filterDistrict");
    if (distEl) {
      distEl.addEventListener("change", (e) => {
        this.currentFilters.districtId = e.target.value;
        this.notifyChange();
      });
    }

    // Hotspot Risk Tier
    const tierEl = document.getElementById("filterTier");
    if (tierEl) {
      tierEl.addEventListener("change", (e) => {
        this.currentFilters.tier = e.target.value;
        this.currentFilters.severity = e.target.value;
        this.notifyChange();
      });
    }

    // Severity Filter (if separate dropdown exists)
    const severityEl = document.getElementById("filterSeverity");
    if (severityEl) {
      severityEl.addEventListener("change", (e) => {
        this.currentFilters.severity = e.target.value;
        if (!this.currentFilters.tier) this.currentFilters.tier = e.target.value;
        this.notifyChange();
      });
    }

    // Month & Year
    const monthEl = document.getElementById("filterMonth");
    if (monthEl) {
      monthEl.addEventListener("change", (e) => {
        this.currentFilters.month = e.target.value;
        this.notifyChange();
      });
    }

    const yearEl = document.getElementById("filterYear");
    if (yearEl) {
      yearEl.addEventListener("change", (e) => {
        this.currentFilters.year = e.target.value;
        this.notifyChange();
      });
    }

    // Source Filter
    const sourceEl = document.getElementById("filterSource");
    if (sourceEl) {
      sourceEl.addEventListener("change", (e) => {
        this.currentFilters.source = e.target.value;
        this.notifyChange();
      });
    }

    // Road Classification Filter
    const roadTypeEl = document.getElementById("filterRoadType");
    if (roadTypeEl) {
      roadTypeEl.addEventListener("change", (e) => {
        this.currentFilters.roadType = e.target.value;
        this.notifyChange();
      });
    }

    // Casualty Threshold Filter
    const minFatalitiesEl = document.getElementById("filterMinFatalities");
    if (minFatalitiesEl) {
      minFatalitiesEl.addEventListener("change", (e) => {
        this.currentFilters.minFatalities = e.target.value;
        this.notifyChange();
      });
    }

    // Primary Cause Filter
    const causeEl = document.getElementById("filterCause");
    if (causeEl) {
      causeEl.addEventListener("change", (e) => {
        this.currentFilters.causeId = e.target.value;
        this.notifyChange();
      });
    }

    // Debounced Search Input (with Direct GPS Coordinate Jump)
    const searchEl = document.getElementById("filterSearch");
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        clearTimeout(this.debounceTimer);
        const val = e.target.value.trim();
        
        // Check for direct GPS coordinate paste: e.g. "28.7364, 77.1624" or "11.9612 78.0723"
        const coordMatch = val.match(/^([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)$/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
            if (window.mapCtrl) {
              window.mapCtrl.zoomToExactCoordinates(lat, lng, 16.5);
            }
          }
        }

        this.debounceTimer = setTimeout(() => {
          this.currentFilters.search = val;
          this.notifyChange();
        }, CONFIG.GEOCODING.DEBOUNCE_MS || 500);
      });
    }

    // Reset Filters Button
    const resetBtn = document.getElementById("btnResetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetFilters());
    }

    // Clear Search Input Button
    const clearSearchBtn = document.getElementById("btnClearSearch");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        const searchEl = document.getElementById("filterSearch");
        if (searchEl) {
          searchEl.value = "";
          this.currentFilters.search = "";
          this.notifyChange();
        }
      });
    }
  }

  resetFilters() {
    this.currentFilters = {
      stateId: "",
      districtId: "",
      tier: "",
      severity: "",
      year: "",
      month: "",
      roadTypeId: "",
      roadType: "",
      minFatalities: "",
      causeId: "",
      source: "",
      search: ""
    };

    // Reset DOM Elements
    const elements = [
      "filterState", "filterDistrict", "filterTier", "filterSeverity", "filterMonth", 
      "filterYear", "filterRoadType", "filterMinFatalities", "filterCause", "filterSource", "filterSearch"
    ];

    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const distEl = document.getElementById("filterDistrict");
    if (distEl) {
      distEl.innerHTML = '<option value="">Select State First</option>';
      distEl.disabled = true;
    }

    this.notifyChange();
  }

  updateFilterUI() {
    let count = 0;
    if (this.currentFilters.stateId) count++;
    if (this.currentFilters.districtId) count++;
    if (this.currentFilters.tier || this.currentFilters.severity) count++;
    if (this.currentFilters.year) count++;
    if (this.currentFilters.month) count++;
    if (this.currentFilters.source) count++;
    if (this.currentFilters.roadType) count++;
    if (this.currentFilters.causeId) count++;
    if (this.currentFilters.minFatalities) count++;
    if (this.currentFilters.search && this.currentFilters.search.trim()) count++;

    const badge = document.getElementById("activeFilterBadge");
    if (badge) badge.textContent = count;

    const toggleBtn = document.getElementById("btnToggleFilters");
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", count > 0);
    }

    const resetBtn = document.getElementById("btnResetFilters");
    if (resetBtn) {
      resetBtn.classList.toggle("has-filters", count > 0);
    }

    const searchInput = document.getElementById("filterSearch");
    const clearSearchBtn = document.getElementById("btnClearSearch");
    if (clearSearchBtn && searchInput) {
      clearSearchBtn.style.display = searchInput.value.trim() ? "block" : "none";
    }

    const summaryText = document.getElementById("filterSummaryText");
    if (summaryText) {
      summaryText.textContent = count > 0 ? `${count} active filter${count > 1 ? 's applied' : ' applied'}` : "Showing all corridors";
    }

    this.renderActiveFilterChips();
  }

  /**
   * Automatically generates and displays interactive filter chips directly on the map
   */
  renderActiveFilterChips() {
    const container = document.getElementById("mapActiveFiltersContainer");
    const chipsList = document.getElementById("activeFiltersChipsList");
    if (!container || !chipsList) return;

    const chips = [];

    // 1. Search Query
    if (this.currentFilters.search && this.currentFilters.search.trim()) {
      chips.push({
        key: "search",
        label: `🔍 "${this.currentFilters.search.trim()}"`,
        title: "Search keyword"
      });
    }

    // 2. State
    if (this.currentFilters.stateId) {
      const stateObj = window.accidentService?.statesCache?.find(s => s.id === this.currentFilters.stateId);
      const name = stateObj ? stateObj.name : "State";
      chips.push({
        key: "stateId",
        label: `📍 State: <strong>${name}</strong>`,
        title: "State filter"
      });
    }

    // 3. District
    if (this.currentFilters.districtId) {
      const distEl = document.getElementById("filterDistrict");
      const distName = distEl?.options[distEl.selectedIndex]?.text || "District";
      chips.push({
        key: "districtId",
        label: `🏛️ Dist: <strong>${distName}</strong>`,
        title: "District filter"
      });
    }

    // 4. Hotspot Risk Tier
    if (this.currentFilters.tier || this.currentFilters.severity) {
      const tierVal = this.currentFilters.tier || this.currentFilters.severity;
      chips.push({
        key: "tier",
        label: `🚨 Tier: <strong>${tierVal}</strong>`,
        title: "Risk Severity Tier"
      });
    }

    // 5. Road Classification
    if (this.currentFilters.roadType) {
      chips.push({
        key: "roadType",
        label: `🛣️ Road: <strong>${this.currentFilters.roadType}</strong>`,
        title: "Road classification"
      });
    }

    // 6. Casualty Threshold
    if (this.currentFilters.minFatalities) {
      chips.push({
        key: "minFatalities",
        label: `💀 Deaths: <strong>≥ ${this.currentFilters.minFatalities}</strong>`,
        title: "Minimum casualty threshold"
      });
    }

    // 7. Year
    if (this.currentFilters.year) {
      chips.push({
        key: "year",
        label: `📅 Year: <strong>${this.currentFilters.year}</strong>`,
        title: "Incident year"
      });
    }

    // 8. Month
    if (this.currentFilters.month) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(this.currentFilters.month, 10) - 1;
      const mName = monthNames[mIdx] || `Month ${this.currentFilters.month}`;
      chips.push({
        key: "month",
        label: `🗓️ Month: <strong>${mName}</strong>`,
        title: "Incident month"
      });
    }

    // 9. Source
    if (this.currentFilters.source) {
      chips.push({
        key: "source",
        label: `🏛️ Source: <strong>${this.currentFilters.source}</strong>`,
        title: "Data source"
      });
    }

    // 10. Primary Cause
    if (this.currentFilters.causeId) {
      const causeObj = window.accidentService?.causesCache?.find(c => c.id === this.currentFilters.causeId);
      const cName = causeObj ? causeObj.name : "Cause";
      chips.push({
        key: "causeId",
        label: `⚠️ Cause: <strong>${cName}</strong>`,
        title: "Accident cause"
      });
    }

    if (chips.length === 0) {
      container.style.display = "none";
      chipsList.innerHTML = "";
      return;
    }

    container.style.display = "flex";
    chipsList.innerHTML = "";

    // Add Supabase DB filter pushdown badge
    const dbBadge = document.createElement("span");
    dbBadge.className = "chip-supabase-badge";
    dbBadge.innerHTML = `<span>⚡</span> <span>Supabase DB Filter</span>`;
    chipsList.appendChild(dbBadge);

    // Render individual filter chips
    chips.forEach(chip => {
      const chipEl = document.createElement("span");
      chipEl.className = "active-filter-chip";
      chipEl.title = chip.title;
      chipEl.innerHTML = `
        <span>${chip.label}</span>
        <button type="button" class="chip-remove-btn" title="Remove this filter" data-filter-key="${chip.key}">&times;</button>
      `;

      chipEl.querySelector(".chip-remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeSingleFilter(chip.key);
      });

      chipsList.appendChild(chipEl);
    });

    // Add Clear All button
    const clearAllBtn = document.createElement("button");
    clearAllBtn.type = "button";
    clearAllBtn.className = "chip-clear-all";
    clearAllBtn.textContent = "Clear All";
    clearAllBtn.title = "Reset all active filters";
    clearAllBtn.addEventListener("click", () => this.resetFilters());
    chipsList.appendChild(clearAllBtn);
  }

  /**
   * Removes a single filter when user clicks (X) on an on-map chip
   */
  removeSingleFilter(key) {
    if (key === "search") {
      const el = document.getElementById("filterSearch");
      if (el) el.value = "";
      this.currentFilters.search = "";
    } else if (key === "stateId") {
      const el = document.getElementById("filterState");
      if (el) el.value = "";
      this.currentFilters.stateId = "";
      this.currentFilters.districtId = "";
      const distEl = document.getElementById("filterDistrict");
      if (distEl) {
        distEl.innerHTML = '<option value="">Select State First</option>';
        distEl.disabled = true;
      }
    } else if (key === "districtId") {
      const el = document.getElementById("filterDistrict");
      if (el) el.value = "";
      this.currentFilters.districtId = "";
    } else if (key === "tier") {
      const el = document.getElementById("filterTier");
      if (el) el.value = "";
      const sevEl = document.getElementById("filterSeverity");
      if (sevEl) sevEl.value = "";
      this.currentFilters.tier = "";
      this.currentFilters.severity = "";
    } else if (key === "roadType") {
      const el = document.getElementById("filterRoadType");
      if (el) el.value = "";
      this.currentFilters.roadType = "";
    } else if (key === "minFatalities") {
      const el = document.getElementById("filterMinFatalities");
      if (el) el.value = "";
      this.currentFilters.minFatalities = "";
    } else if (key === "year") {
      const el = document.getElementById("filterYear");
      if (el) el.value = "";
      this.currentFilters.year = "";
    } else if (key === "month") {
      const el = document.getElementById("filterMonth");
      if (el) el.value = "";
      this.currentFilters.month = "";
    } else if (key === "source") {
      const el = document.getElementById("filterSource");
      if (el) el.value = "";
      this.currentFilters.source = "";
    } else if (key === "causeId") {
      const el = document.getElementById("filterCause");
      if (el) el.value = "";
      this.currentFilters.causeId = "";
    }

    this.notifyChange();
  }

  notifyChange() {
    this.updateFilterUI();
    this.onFilterChange({ ...this.currentFilters });
  }
}

window.FilterManager = FilterManager;
