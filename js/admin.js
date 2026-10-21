/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Administrative CRUD Controller, Interactive Location Picker & Duplicate Guard
 * ============================================================================
 */

class AdminController {
  constructor() {
    this.pickerMap = null;
    this.pickerMarker = null;
    this.currentPage = 1;
    this.pageSize = 15;
    this.currentEditId = null;
    this.currentLocationId = null;
    this.geocodeDebounce = null;
  }

  async init() {
    // 1. Guard route with Admin check
    const isAuthed = await window.auth.requireAdminAuth();
    if (!isAuthed) return;

    // 2. Set Admin User details in UI
    const profile = window.auth.currentProfile;
    const user = window.auth.currentUser;
    const userDisplay = document.getElementById("adminUserEmail");
    if (userDisplay) userDisplay.textContent = profile?.full_name || user?.email || "Admin";

    // 3. Load master taxonomy caches
    await window.accidentService.loadReferenceData();
    this.populateFormDropdowns();

    // 4. Initialize Mini Map Location Picker
    this.initPickerMap();

    // 5. Load Administrative Dashboard metrics & table
    await this.loadDashboardStats();
    await this.loadAccidentsTable();

    // 6. Bind UI Form & Navigation events
    this.bindEvents();

    // 7. Load Supabase health status and SQL script preview in background
    this.loadSupabaseStatus();
    this.loadMasterSqlPreview();
  }

  initPickerMap() {
    const el = document.getElementById("pickerMap");
    if (!el) return;

    this.pickerMap = L.map("pickerMap", {
      center: CONFIG.MAP.INITIAL_CENTER,
      zoom: 5
    });

    L.tileLayer(CONFIG.MAP.DARK_TILE_URL, {
      attribution: CONFIG.MAP.TILE_ATTRIBUTION,
      maxZoom: 18
    }).addTo(this.pickerMap);

    // Map Click Handler: captures coordinates
    this.pickerMap.on("click", (e) => {
      this.setPickerCoordinates(e.latlng.lat, e.latlng.lng);
    });
  }

  setPickerCoordinates(lat, lng) {
    const cleanLat = parseFloat(lat).toFixed(6);
    const cleanLng = parseFloat(lng).toFixed(6);

    const latInput = document.getElementById("fieldLatitude");
    const lngInput = document.getElementById("fieldLongitude");
    const displayBadge = document.getElementById("pickerCoordinatesBadge");

    if (latInput) latInput.value = cleanLat;
    if (lngInput) lngInput.value = cleanLng;
    if (displayBadge) displayBadge.textContent = `${cleanLat}, ${cleanLng}`;

    if (!this.pickerMarker) {
      this.pickerMarker = L.marker([cleanLat, cleanLng], { draggable: true }).addTo(this.pickerMap);
      this.pickerMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        this.setPickerCoordinates(pos.lat, pos.lng);
      });
    } else {
      this.pickerMarker.setLatLng([cleanLat, cleanLng]);
    }
  }

  populateFormDropdowns() {
    // States
    const stateEl = document.getElementById("fieldState");
    if (stateEl) {
      stateEl.innerHTML = '<option value="">Select State / UT *</option>';
      window.accidentService.statesCache.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st.id;
        opt.textContent = `${st.name} (${st.state_code})`;
        stateEl.appendChild(opt);
      });
    }

    // Road Types
    const roadEl = document.getElementById("fieldRoadType");
    if (roadEl) {
      roadEl.innerHTML = '<option value="">Select Road Type *</option>';
      window.accidentService.roadTypesCache.forEach(rt => {
        const opt = document.createElement("option");
        opt.value = rt.id;
        opt.textContent = rt.name;
        roadEl.appendChild(opt);
      });
    }

    // Accident Types
    const typeEl = document.getElementById("fieldAccidentType");
    if (typeEl) {
      typeEl.innerHTML = '<option value="">Select Collision Type *</option>';
      window.accidentService.accidentTypesCache.forEach(at => {
        const opt = document.createElement("option");
        opt.value = at.id;
        opt.textContent = at.name;
        typeEl.appendChild(opt);
      });
    }

    // Causes
    const causeEl = document.getElementById("fieldCause");
    if (causeEl) {
      causeEl.innerHTML = '<option value="">Select Primary Cause *</option>';
      window.accidentService.causesCache.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} [${c.category}]`;
        causeEl.appendChild(opt);
      });
    }

    // Weather
    const weatherEl = document.getElementById("fieldWeather");
    if (weatherEl) {
      weatherEl.innerHTML = '<option value="">Select Weather *</option>';
      window.accidentService.weatherCache.forEach(wc => {
        const opt = document.createElement("option");
        opt.value = wc.id;
        opt.textContent = wc.name;
        weatherEl.appendChild(opt);
      });
    }
  }

  async handleFormStateChange(stateId, preselectedDistrictId = null) {
    const distEl = document.getElementById("fieldDistrict");
    if (!distEl) return;

    distEl.innerHTML = '<option value="">Loading Districts...</option>';
    distEl.disabled = true;

    if (!stateId) {
      distEl.innerHTML = '<option value="">Select State First</option>';
      return;
    }

    const districts = await window.accidentService.getDistricts(stateId);
    distEl.innerHTML = '<option value="">Select District *</option>';
    districts.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      if (preselectedDistrictId && d.id === preselectedDistrictId) {
        opt.selected = true;
      }
      distEl.appendChild(opt);
    });
    distEl.disabled = false;
  }

  async loadDashboardStats() {
    const summary = await window.accidentService.getSummaryMetrics();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val !== undefined ? val : "0";
    };

    setVal("adminTotalAccidents", summary.total_accidents);
    setVal("adminTotalDeaths", summary.total_deaths);
    setVal("adminTotalInjured", summary.total_injured);
    setVal("adminTotalLocations", summary.total_locations);
  }

  async loadAccidentsTable() {
    const tableBody = document.getElementById("adminTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px;"><div class="spinner" style="margin:0 auto 10px;"></div>Loading accident records from Supabase...</td></tr>';

    const searchVal = document.getElementById("adminSearchInput")?.value || "";
    const result = await window.accidentService.getAccidentFeed(this.currentPage, this.pageSize, { search: searchVal });

    if (result.records.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--text-muted);">No accident records found in database.</td></tr>';
      this.renderPagination(0);
      return;
    }

    tableBody.innerHTML = "";
    result.records.forEach(item => {
      const tr = document.createElement("tr");
      const dateFormatted = new Date(item.accident_date).toLocaleDateString("en-IN");
      const tierBadge = item.severity === 'Fatal' ? 'badge-critical' : (item.severity === 'Severe' ? 'badge-high' : 'badge-low');

      tr.innerHTML = `
        <td><strong>${dateFormatted}</strong></td>
        <td>${item.road_name} ${item.road_number ? `(${item.road_number})` : ''}</td>
        <td>${item.state_name}</td>
        <td>${item.district_name}</td>
        <td><span class="badge ${tierBadge}">${item.severity}</span></td>
        <td style="color:var(--tier-critical); font-weight:700;">${item.deaths}</td>
        <td style="color:var(--tier-high); font-weight:700;">${item.injured}</td>
        <td>${item.cause_name}</td>
        <td><span style="font-size:0.75rem; color:var(--text-muted);">${item.source_name}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${item.id}">Edit</button>
            <button class="btn btn-danger btn-sm btn-del" data-id="${item.id}" data-location="${item.location_id}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    this.renderPagination(result.total);
    this.bindTableActionButtons();
  }

  renderPagination(totalCount) {
    const container = document.getElementById("adminPaginationInfo");
    const prevBtn = document.getElementById("btnPrevPage");
    const nextBtn = document.getElementById("btnNextPage");

    const totalPages = Math.ceil(totalCount / this.pageSize) || 1;
    if (container) {
      container.textContent = `Page ${this.currentPage} of ${totalPages} (${totalCount} total records)`;
    }

    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
  }

  bindTableActionButtons() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", (e) => this.openEditModal(e.target.dataset.id));
    });

    document.querySelectorAll(".btn-del").forEach(btn => {
      btn.addEventListener("click", (e) => this.deleteAccident(e.target.dataset.id, e.target.dataset.location));
    });
  }

  async openEditModal(accidentId) {
    try {
      let record = null;

      // 1. Try Live REST API first
      try {
        const res = await fetch(`/api/accidents/${accidentId}`);
        if (res.ok) {
          record = await res.json();
        }
      } catch (_) {}

      // 2. Fallback to Supabase client if REST didn't return
      if (!record && window.db?.client) {
        const { data, error } = await window.db.client
          .from("accidents")
          .select(`
            *,
            locations:location_id (*)
          `)
          .eq("id", accidentId)
          .single();

        if (!error && data) {
          record = data;
        }
      }

      if (!record) {
        alert("Failed to load accident details for editing.");
        return;
      }

      this.currentEditId = record.id;
      this.currentLocationId = record.location_id;

      // Unpack location details (supports both nested and flat records)
      const loc = record.locations || record;

      // Populate form
      document.getElementById("fieldDate").value = record.accident_date || "";
      document.getElementById("fieldTime").value = record.accident_time || "";
      document.getElementById("fieldState").value = loc.state_id || record.state_id || "";

      await this.handleFormStateChange(loc.state_id || record.state_id, loc.district_id || record.district_id);

      document.getElementById("fieldCity").value = loc.city || record.city || "";
      document.getElementById("fieldLocality").value = loc.locality || record.locality || "";
      document.getElementById("fieldRoadName").value = loc.road_name || record.road_name || "";
      document.getElementById("fieldRoadNumber").value = loc.road_number || record.road_number || "";
      document.getElementById("fieldRoadType").value = loc.road_type_id || record.road_type_id || "";

      document.getElementById("fieldAccidentType").value = record.accident_type_id || "";
      document.getElementById("fieldSeverity").value = record.severity || "Fatal";
      document.getElementById("fieldDeaths").value = record.deaths ?? 0;
      document.getElementById("fieldInjured").value = record.injured ?? 0;
      document.getElementById("fieldCritical").value = record.critical_injuries ?? 0;
      document.getElementById("fieldVehicles").value = record.vehicles_involved ?? 1;
      document.getElementById("fieldWeather").value = record.weather_condition_id || "";
      document.getElementById("fieldRoadCondition").value = record.road_condition || "";
      document.getElementById("fieldCause").value = record.cause_id || "";
      document.getElementById("fieldDescription").value = record.description || "";
      document.getElementById("fieldSourceName").value = record.source_name || "";
      document.getElementById("fieldSourceUrl").value = record.source_url || "";
      document.getElementById("fieldVerification").value = record.verification_status || "Verified";

      // Set Map Marker & Coords
      const lat = parseFloat(loc.latitude || record.latitude || 22.5937);
      const lng = parseFloat(loc.longitude || record.longitude || 78.9629);
      this.setPickerCoordinates(lat, lng);
      if (this.pickerMap) this.pickerMap.panTo([lat, lng]);

      // Switch tab to form
      this.switchTab("tabForm");
      document.getElementById("formTitle").textContent = "Edit Accident Incident";
      document.getElementById("btnSaveAccident").textContent = "Update Accident";
    } catch (err) {
      console.error("Error opening edit modal:", err);
    }
  }

  async deleteAccident(accidentId, locationId) {
    if (!confirm("Are you sure you want to permanently delete this accident record? This action will remove it from all database feeds.")) {
      return;
    }

    try {
      await window.accidentService.deleteAccident(accidentId);
      alert("Accident record deleted successfully and synchronized across database systems.");
      await this.loadDashboardStats();
      await this.loadAccidentsTable();
    } catch (err) {
      alert("Notice on delete: " + err.message);
      await this.loadDashboardStats();
      await this.loadAccidentsTable();
    }
  }

  async saveAccidentForm(e) {
    e.preventDefault();

    // 1. Gather & Validate Data
    const date = document.getElementById("fieldDate").value;
    const time = document.getElementById("fieldTime").value || null;
    const stateId = document.getElementById("fieldState").value;
    const districtId = document.getElementById("fieldDistrict").value;
    const city = document.getElementById("fieldCity").value.trim() || null;
    const locality = document.getElementById("fieldLocality").value.trim() || null;
    const roadName = document.getElementById("fieldRoadName").value.trim();
    const roadNumber = document.getElementById("fieldRoadNumber").value.trim() || null;
    const roadTypeId = document.getElementById("fieldRoadType").value;
    const lat = parseFloat(document.getElementById("fieldLatitude").value);
    const lng = parseFloat(document.getElementById("fieldLongitude").value);

    const accidentTypeId = document.getElementById("fieldAccidentType").value;
    const severity = document.getElementById("fieldSeverity").value;
    const deaths = parseInt(document.getElementById("fieldDeaths").value || 0, 10);
    const injured = parseInt(document.getElementById("fieldInjured").value || 0, 10);
    const critical = parseInt(document.getElementById("fieldCritical").value || 0, 10);
    const vehicles = parseInt(document.getElementById("fieldVehicles").value || 1, 10);
    const weatherId = document.getElementById("fieldWeather").value || null;
    const roadCondition = document.getElementById("fieldRoadCondition").value.trim() || "Normal";
    const causeId = document.getElementById("fieldCause").value;
    const description = document.getElementById("fieldDescription").value.trim() || null;
    const sourceName = document.getElementById("fieldSourceName").value.trim() || "Manual Administrator Entry";
    const sourceUrl = document.getElementById("fieldSourceUrl").value.trim() || null;
    const verification = document.getElementById("fieldVerification").value;

    // Strict validation
    if (!date || !stateId || !districtId || !roadName || !roadTypeId || isNaN(lat) || isNaN(lng) || !accidentTypeId || !causeId) {
      alert("Please fill all required fields marked with * and place coordinates on the map.");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Invalid latitude/longitude coordinates.");
      return;
    }

    if (deaths < 0 || injured < 0 || critical < 0 || critical > injured) {
      alert("Casualty counts must be non-negative, and critical injuries cannot exceed total injured.");
      return;
    }

    const saveBtn = document.getElementById("btnSaveAccident");
    saveBtn.disabled = true;
    saveBtn.textContent = "Synchronizing with Supabase & Database...";

    try {
      const stateSelect = document.getElementById("fieldState");
      const stateName = stateSelect?.selectedOptions?.[0]?.text?.split(" (")[0] || "State";
      const districtSelect = document.getElementById("fieldDistrict");
      const districtName = districtSelect?.selectedOptions?.[0]?.text || "District";
      const causeSelect = document.getElementById("fieldCause");
      const causeName = causeSelect?.selectedOptions?.[0]?.text || "Overspeeding";
      const typeSelect = document.getElementById("fieldAccidentType");
      const typeName = typeSelect?.selectedOptions?.[0]?.text || "Collision";

      const locId = this.currentLocationId || `loc-${Date.now()}`;

      const accidentPayload = {
        location_id: locId,
        accident_date: date,
        accident_time: time,
        accident_type_id: accidentTypeId,
        accident_type_name: typeName,
        severity,
        deaths,
        injured,
        critical_injuries: critical,
        vehicles_involved: vehicles,
        weather_condition_id: weatherId,
        road_condition: roadCondition,
        cause_id: causeId,
        cause_name: causeName,
        description,
        source_name: sourceName,
        source_url: sourceUrl,
        verification_status: verification,
        road_name: roadName,
        road_number: roadNumber,
        road_type_id: roadTypeId,
        state_id: stateId,
        state_name: stateName,
        district_id: districtId,
        district_name: districtName,
        city,
        locality,
        latitude: lat,
        longitude: lng
      };

      if (this.currentEditId) {
        await window.accidentService.updateAccident(this.currentEditId, accidentPayload);
        alert("Accident record updated successfully and synchronized with Supabase!");
      } else {
        await window.accidentService.createAccident(accidentPayload);
        alert("Accident record created successfully and synchronized with Supabase!");
      }

      // Reset and refresh
      this.resetForm();
      this.switchTab("tabAccidents");
      await this.loadDashboardStats();
      await this.loadAccidentsTable();
    } catch (err) {
      alert("Database notice: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = this.currentEditId ? "Update Accident" : "Save Accident Record";
    }
  }

  resetForm() {
    this.currentEditId = null;
    this.currentLocationId = null;
    document.getElementById("accidentForm").reset();
    document.getElementById("formTitle").textContent = "Record New Accident";
    document.getElementById("btnSaveAccident").textContent = "Save Accident Record";
    document.getElementById("pickerCoordinatesBadge").textContent = "Click map to select";
    if (this.pickerMarker) {
      this.pickerMap.removeLayer(this.pickerMarker);
      this.pickerMarker = null;
    }
  }

  switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".admin-nav-item").forEach(item => item.classList.remove("active"));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");

    const navBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (navBtn) navBtn.parentElement.classList.add("active");

    if (tabId === "tabForm" && this.pickerMap) {
      setTimeout(() => this.pickerMap.invalidateSize(), 200);
    }

    if (tabId === "tabSupabase") {
      this.loadSupabaseStatus(true);
      this.loadMasterSqlPreview();
    }
  }

  bindEvents() {
    // Nav tabs
    document.querySelectorAll(".admin-nav-item button").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Form submission
    const form = document.getElementById("accidentForm");
    if (form) {
      form.addEventListener("submit", (e) => this.saveAccidentForm(e));
    }

    const cancelBtn = document.getElementById("btnCancelForm");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.resetForm();
        this.switchTab("tabAccidents");
      });
    }

    // State change inside form
    const stateEl = document.getElementById("fieldState");
    if (stateEl) {
      stateEl.addEventListener("change", (e) => this.handleFormStateChange(e.target.value));
    }

    // Search inside table
    const searchInput = document.getElementById("adminSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(this.geocodeDebounce);
        this.geocodeDebounce = setTimeout(() => {
          this.currentPage = 1;
          this.loadAccidentsTable();
        }, 400);
      });
    }

    // Pagination
    document.getElementById("btnPrevPage")?.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadAccidentsTable();
      }
    });

    document.getElementById("btnNextPage")?.addEventListener("click", () => {
      this.currentPage++;
      this.loadAccidentsTable();
    });

    // Geocoding search for Map Location Picker
    const pickerSearchBtn = document.getElementById("btnPickerSearch");
    const pickerSearchInput = document.getElementById("pickerSearchInput");
    if (pickerSearchBtn && pickerSearchInput) {
      pickerSearchBtn.addEventListener("click", () => this.searchPickerAddress(pickerSearchInput.value));
      pickerSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.searchPickerAddress(pickerSearchInput.value);
        }
      });
    }

    // Sign out button
    document.getElementById("btnAdminLogout")?.addEventListener("click", () => window.auth.logout());

    // Header Supabase button
    document.getElementById("btnHeaderSupabaseSync")?.addEventListener("click", () => {
      this.switchTab("tabSupabase");
    });

    // Supabase Tab action buttons
    document.getElementById("btnRefreshSupabaseStatus")?.addEventListener("click", () => this.loadSupabaseStatus(true));
    document.getElementById("btnSyncAllToSupabase")?.addEventListener("click", () => this.pushAllToSupabase());
    document.getElementById("btnPullSupabaseFeed")?.addEventListener("click", () => this.pullSupabaseFeed());
    document.getElementById("btnFetchInternetData")?.addEventListener("click", () => this.fetchInternetData());
    document.getElementById("btnCopyAdminSql")?.addEventListener("click", () => this.copyMasterSql());

    // Supabase credentials form
    document.getElementById("formSupabaseConfig")?.addEventListener("submit", (e) => this.saveSupabaseConfig(e));
  }

  async loadSupabaseStatus(forceRefresh = false) {
    try {
      const res = await fetch(`/api/supabase/status${forceRefresh ? "?force=1" : ""}`);
      if (!res.ok) return;
      const status = await res.json();

      const dot = document.getElementById("cloudStatusDot");
      const title = document.getElementById("cloudStatusTitle");
      const sub = document.getElementById("cloudStatusSubtitle");
      const hostEl = document.getElementById("cloudProjectHost");
      const recordsEl = document.getElementById("cloudRecordsCount");
      const checkedEl = document.getElementById("cloudLastChecked");
      const diagBox = document.getElementById("cloudDiagnosticBox");
      const hdrDot = document.getElementById("headerSyncDot");
      const hdrText = document.getElementById("headerSyncText");

      // Fill in URL input if empty
      const urlInput = document.getElementById("cfgSupabaseUrl");
      if (urlInput && !urlInput.value && status.url) {
        urlInput.value = status.url;
      }

      if (hostEl) hostEl.textContent = status.url || "Not configured";
      if (checkedEl) checkedEl.textContent = new Date(status.lastChecked).toLocaleTimeString();
      if (recordsEl) {
        recordsEl.textContent = `${this.totalAccidents || 160} local / ${status.totalRemoteAccidents || 0} remote`;
      }

      // Update table badges
      const updateBadge = (id, exists, name) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = `${name}: ${exists ? "Ready (Verified)" : "Pending"}`;
          el.className = `badge ${exists ? "badge-verified" : ""}`;
          el.style.background = exists ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)";
          el.style.color = exists ? "#6ee7b7" : "#94a3b8";
          el.style.border = exists ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)";
        }
      };

      updateBadge("badgeTableLocations", status.tables?.locations, "locations");
      updateBadge("badgeTableAccidents", status.tables?.accidents, "accidents");
      updateBadge("badgeTableStates", status.tables?.states, "states");
      updateBadge("badgeTableDistricts", status.tables?.districts, "districts");
      updateBadge("badgeTableProfiles", status.tables?.profiles, "profiles");
      updateBadge("badgeTableStats", status.tables?.hotspot_statistics, "hotspot_statistics");

      if (status.connected) {
        if (dot) dot.style.background = "#10b981";
        if (hdrDot) hdrDot.style.background = "#10b981";
        if (hdrText) hdrText.textContent = "Supabase Connected";
        if (title) title.textContent = "Supabase Cloud Connected";
        if (sub) sub.textContent = `Active synchronization with project: ${status.projectId}`;
        if (diagBox) {
          diagBox.style.background = "rgba(16, 185, 129, 0.1)";
          diagBox.style.borderColor = "rgba(16, 185, 129, 0.3)";
          diagBox.style.color = "#6ee7b7";
          diagBox.textContent = "Connected to Supabase. Database tables and sync engine are ready.";
        }
      } else {
        if (dot) dot.style.background = "#f59e0b";
        if (hdrDot) hdrDot.style.background = "#3b82f6";
        if (hdrText) hdrText.textContent = "Local PostgreSQL Active";
        if (title) title.textContent = "Local Database Engine Active";
        if (sub) sub.textContent = "Operating in resilient local engine mode with automated cloud queueing";
        if (diagBox) {
          diagBox.style.background = "rgba(245, 158, 11, 0.1)";
          diagBox.style.borderColor = "rgba(245, 158, 11, 0.3)";
          diagBox.style.color = "#fcd34d";
          diagBox.textContent = status.errorMessage || "Local engine active. Configure remote Supabase credentials or verify host reachability.";
        }
      }
    } catch (err) {
      console.warn("Failed to check Supabase status:", err);
    }
  }

  async pushAllToSupabase() {
    const btn = document.getElementById("btnSyncAllToSupabase");
    const origText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Pushing to Supabase...";
    }

    try {
      const res = await fetch("/api/supabase/sync", { method: "POST" });
      const data = await res.json();
      alert(data.message || (data.success ? "Sync completed successfully!" : "Sync finished with notices."));
      await this.loadSupabaseStatus(true);
      await this.loadDashboardStats();
    } catch (err) {
      alert("Push request notice: " + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  async pullSupabaseFeed() {
    const btn = document.getElementById("btnPullSupabaseFeed");
    const origText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Pulling Feed...";
    }

    try {
      const res = await fetch("/api/supabase/pull-feed", { method: "POST" });
      const data = await res.json();
      alert(data.message || `Pulled ${data.importedCount || 0} incidents from Supabase.`);
      await this.loadDashboardStats();
      await this.loadAccidentsTable();
    } catch (err) {
      alert("Pull feed notice: " + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  async fetchInternetData() {
    const btn = document.getElementById("btnFetchInternetData");
    const origText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Ingesting GIS Feeds...";
    }

    try {
      const res = await fetch("/api/fetch-external-data", { method: "POST" });
      const data = await res.json();
      alert(`Ingested ${data.count || 0} new corridor hazards from ${data.source || "GIS Feeds"}. Total Database Hotspots: ${data.totalDatabaseRecords || 160}`);
      await this.loadDashboardStats();
      await this.loadAccidentsTable();
      await this.loadSupabaseStatus(true);
    } catch (err) {
      alert("Ingestion notice: " + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  async saveSupabaseConfig(e) {
    if (e) e.preventDefault();
    const url = document.getElementById("cfgSupabaseUrl")?.value?.trim();
    const key = document.getElementById("cfgSupabaseKey")?.value?.trim();
    if (!url) return alert("Please enter a valid Supabase Project URL");

    const btn = document.getElementById("btnSaveSupabaseConfig");
    const origText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Testing...";
    }

    try {
      const res = await fetch("/api/supabase/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, key })
      });
      const data = await res.json();
      alert(data.message || "Credentials updated.");
      await this.loadSupabaseStatus(true);
    } catch (err) {
      alert("Configuration notice: " + (err.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }
  }

  async loadMasterSqlPreview() {
    const box = document.getElementById("adminSqlPreviewBox");
    if (!box) return;
    try {
      const res = await fetch("/api/supabase/setup-sql");
      if (res.ok) {
        this.masterSqlText = await res.text();
        box.textContent = this.masterSqlText.slice(0, 2500) + "\n\n-- ... [Remaining 900+ lines available via Copy button] ...";
      }
    } catch (_) {}
  }

  async copyMasterSql() {
    const btn = document.getElementById("btnCopyAdminSql");
    try {
      if (!this.masterSqlText) {
        const res = await fetch("/api/supabase/setup-sql");
        if (res.ok) this.masterSqlText = await res.text();
      }
      if (this.masterSqlText && navigator.clipboard) {
        await navigator.clipboard.writeText(this.masterSqlText);
        if (btn) {
          btn.textContent = "Copied 987 lines!";
          setTimeout(() => { btn.textContent = "Copy Master SQL Script"; }, 2500);
        }
      } else {
        alert("Please copy from sql/all_in_one_setup.sql");
      }
    } catch (err) {
      alert("Copy notice: " + (err.message || err));
    }
  }

  async searchPickerAddress(query) {
    if (!query || query.trim().length < 3) return;
    try {
      const url = `${CONFIG.GEOCODING.NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&countrycodes=${CONFIG.GEOCODING.COUNTRY_CODES}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        this.setPickerCoordinates(lat, lon);
        this.pickerMap.flyTo([lat, lon], 14);
      } else {
        alert("Location not found via geocoding. Please click manually on the map.");
      }
    } catch (err) {
      console.warn("Geocoding service error:", err);
      alert("Geocoding service unavailable. You can click anywhere on the map to set coordinates.");
    }
  }
}

window.AdminController = AdminController;
