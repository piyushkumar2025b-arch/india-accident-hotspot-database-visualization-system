/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * CSV Batch Importer: Validation Engine, Coordinate Guard & Supabase Ingestion
 * ============================================================================
 */

class CsvImportManager {
  constructor() {
    this.parsedRows = [];
    this.validRows = [];
    this.invalidRows = [];
    this.bindEvents();
  }

  get client() {
    return window.db?.client;
  }

  bindEvents() {
    const fileInput = document.getElementById("csvFileInput");
    const dropzone = document.getElementById("csvDropzone");
    const btnExecuteImport = document.getElementById("btnExecuteImport");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    if (btnExecuteImport) {
      btnExecuteImport.addEventListener("click", () => this.executeBatchImport());
    }
  }

  async handleFile(file) {
    if (!file.name.endsWith(".csv")) {
      alert("Invalid file format. Please upload a standard comma-separated .csv file.");
      return;
    }

    const text = await file.text();
    this.parseAndValidate(text);
  }

  parseCSVText(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return { headers: [], rows: [] };

    // Simple CSV parser handling quotes
    const parseLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => parseLine(line));
    return { headers, rows };
  }

  async parseAndValidate(csvText) {
    const { headers, rows } = this.parseCSVText(csvText);

    // Expected required headers
    const requiredHeaders = ["accident_date", "state_name", "district_name", "road_name", "latitude", "longitude", "severity", "deaths", "injured"];
    const missing = requiredHeaders.filter(h => !headers.includes(h));

    if (missing.length > 0) {
      alert(`Invalid CSV Schema. Missing mandatory headers: ${missing.join(", ")}`);
      return;
    }

    await window.accidentService.loadReferenceData();

    this.validRows = [];
    this.invalidRows = [];

    // Map each row against constraints
    rows.forEach((rowValues, idx) => {
      const row = {};
      headers.forEach((h, i) => {
        row[h] = rowValues[i] || "";
      });

      const errors = [];

      // 1. Date Validation
      if (!row.accident_date || isNaN(Date.parse(row.accident_date))) {
        errors.push("Invalid accident_date format (expected YYYY-MM-DD)");
      }

      // 2. State & District Matching
      const matchedState = window.accidentService.statesCache.find(
        s => s.name.toLowerCase() === (row.state_name || "").toLowerCase()
      );
      if (!matchedState) {
        errors.push(`Unknown state '${row.state_name}'`);
      } else {
        row._state_id = matchedState.id;
      }

      // 3. Coordinate validation
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push("Latitude must be between -90 and 90");
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push("Longitude must be between -180 and 180");
      }

      // 4. Numeric casualty constraints
      const deaths = parseInt(row.deaths, 10);
      const injured = parseInt(row.injured, 10);
      const critical = parseInt(row.critical_injuries || 0, 10);

      if (isNaN(deaths) || deaths < 0) errors.push("Deaths must be >= 0");
      if (isNaN(injured) || injured < 0) errors.push("Injured must be >= 0");
      if (critical > injured) errors.push("Critical injuries cannot exceed total injured");

      // 5. Taxonomy matching
      const matchedRoad = window.accidentService.roadTypesCache.find(
        r => r.name.toLowerCase() === (row.road_type || "national highway").toLowerCase()
      );
      row._road_type_id = matchedRoad ? matchedRoad.id : window.accidentService.roadTypesCache[0]?.id;

      const matchedType = window.accidentService.accidentTypesCache.find(
        t => t.name.toLowerCase() === (row.accident_type || "head-on collision").toLowerCase()
      );
      row._accident_type_id = matchedType ? matchedType.id : window.accidentService.accidentTypesCache[0]?.id;

      const matchedCause = window.accidentService.causesCache.find(
        c => c.name.toLowerCase() === (row.cause || "overspeeding").toLowerCase()
      );
      row._cause_id = matchedCause ? matchedCause.id : window.accidentService.causesCache[0]?.id;

      if (errors.length === 0) {
        this.validRows.push(row);
      } else {
        this.invalidRows.push({ row, errors, rowIndex: idx + 2 });
      }
    });

    this.renderPreview();
  }

  renderPreview() {
    const previewContainer = document.getElementById("csvPreviewCard");
    const previewBody = document.getElementById("csvPreviewBody");
    const summaryText = document.getElementById("csvPreviewSummary");
    const executeBtn = document.getElementById("btnExecuteImport");

    if (!previewContainer) return;

    previewContainer.classList.add("active");
    summaryText.innerHTML = `
      <strong style="color:var(--success);">${this.validRows.length} Valid Rows</strong> | 
      <strong style="color:var(--tier-critical);">${this.invalidRows.length} Invalid Rows</strong>
    `;

    executeBtn.disabled = this.validRows.length === 0;

    let html = "";

    // Render first 5 valid rows
    this.validRows.slice(0, 5).forEach((r, i) => {
      html += `
        <tr class="row-valid">
          <td><span class="badge badge-verified">Valid</span></td>
          <td>${r.accident_date}</td>
          <td>${r.road_name}</td>
          <td>${r.state_name}</td>
          <td>${r.severity || 'Moderate'}</td>
          <td>${r.deaths}</td>
          <td>${r.injured}</td>
          <td>-</td>
        </tr>
      `;
    });

    // Render invalid rows with error badges
    this.invalidRows.forEach(inv => {
      html += `
        <tr class="row-invalid">
          <td><span class="badge badge-critical">Row ${inv.rowIndex}</span></td>
          <td>${inv.row.accident_date || 'N/A'}</td>
          <td>${inv.row.road_name || 'N/A'}</td>
          <td>${inv.row.state_name || 'N/A'}</td>
          <td>${inv.row.severity || 'N/A'}</td>
          <td>${inv.row.deaths || '0'}</td>
          <td>${inv.row.injured || '0'}</td>
          <td><span class="invalid-cell-reason">${inv.errors.join("; ")}</span></td>
        </tr>
      `;
    });

    previewBody.innerHTML = html;
  }

  async executeBatchImport() {
    if (this.validRows.length === 0) return;

    const btn = document.getElementById("btnExecuteImport");
    btn.disabled = true;
    btn.textContent = `Importing ${this.validRows.length} records...`;

    // 1. First attempt Full-Stack REST API batch endpoint
    try {
      const payloadRows = this.validRows.map(row => ({
        accident_date: row.accident_date,
        accident_time: row.accident_time || null,
        state_id: row._state_id,
        state_name: row.state_name,
        district_name: row.district_name || "District",
        city: row.city || null,
        locality: row.locality || null,
        road_name: row.road_name,
        road_number: row.road_number || null,
        road_type_id: row._road_type_id,
        road_type: row.road_type || "National Highway",
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accident_type_id: row._accident_type_id,
        accident_type_name: row.accident_type || "Collision",
        severity: row.severity || "Moderate",
        deaths: parseInt(row.deaths, 10) || 0,
        injured: parseInt(row.injured, 10) || 0,
        critical_injuries: parseInt(row.critical_injuries, 10) || 0,
        vehicles_involved: parseInt(row.vehicles_involved, 10) || 1,
        cause_id: row._cause_id,
        cause_name: row.cause || "Overspeeding",
        description: row.description || "Imported via CSV Data Studio",
        source_name: row.source_name || "CSV Batch Import",
        source_url: row.source_url || null,
        verification_status: "Verified"
      }));

      const res = await fetch("/api/accidents/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Batch Import Completed Successfully!\nImported: ${result.importedCount} records.\nTotal in Database: ${result.totalInDb}\nSupabase Status: ${result.supabaseSyncMessage || "Active"}`);
        window.location.reload();
        return;
      }
    } catch (apiErr) {
      console.warn("REST batch import notice, falling back to direct client if connected:", apiErr);
    }

    if (!this.client) {
      alert("Notice: Could not connect to batch import API or Supabase. Check network connectivity.");
      btn.disabled = false;
      btn.textContent = "Start Batch Import";
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      for (const row of this.validRows) {
        // 1. Get or create district
        let districtId = null;
        const { data: dData } = await this.client
          .from("districts")
          .select("id")
          .eq("state_id", row._state_id)
          .ilike("name", row.district_name)
          .maybeSingle();

        if (dData) {
          districtId = dData.id;
        } else {
          const { data: newD } = await this.client
            .from("districts")
            .insert({ state_id: row._state_id, name: row.district_name || "Central District" })
            .select("id")
            .single();
          districtId = newD?.id;
        }

        if (!districtId) continue;

        // 2. Insert Location
        const { data: locData, error: locErr } = await this.client
          .from("locations")
          .insert({
            state_id: row._state_id,
            district_id: districtId,
            city: row.city || null,
            locality: row.locality || null,
            road_name: row.road_name,
            road_number: row.road_number || null,
            road_type_id: row._road_type_id,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude)
          })
          .select("id")
          .single();

        if (locErr || !locData) {
          failCount++;
          continue;
        }

        // 3. Insert Accident Fact
        const { error: accErr } = await this.client
          .from("accidents")
          .insert({
            location_id: locData.id,
            accident_date: row.accident_date,
            accident_time: row.accident_time || null,
            accident_type_id: row._accident_type_id,
            severity: row.severity || "Moderate",
            deaths: parseInt(row.deaths, 10) || 0,
            injured: parseInt(row.injured, 10) || 0,
            critical_injuries: parseInt(row.critical_injuries, 10) || 0,
            vehicles_involved: parseInt(row.vehicles_involved, 10) || 1,
            cause_id: row._cause_id,
            description: row.description || "Imported via CSV Data Studio",
            source_name: row.source_name || "CSV Batch Import",
            source_url: row.source_url || null,
            verification_status: "Verified"
          });

        if (accErr) {
          failCount++;
        } else {
          successCount++;
        }
      }

      alert(`Batch Import Completed!\nSuccessfully inserted: ${successCount}\nFailed: ${failCount}`);
      window.location.reload();
    } catch (err) {
      alert("Error during batch import: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Start Batch Import";
    }
  }
}

window.CsvImportManager = CsvImportManager;
