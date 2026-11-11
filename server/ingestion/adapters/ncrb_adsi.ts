/**
 * ============================================================================
 * REAL-DATA INGESTION ADAPTER: NCRB ADSI TABLE 1A.2
 * Official National Crime Records Bureau — Accidental Deaths & Suicides in India
 * Traffic Accidents by State, Union Territory, and 53 Million-Plus Cities.
 * Trust Tier: registry_aggregate (Official Government Compendium)
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { parseCsvRows } from "../csv_util";
import type { AdapterFn, DataPoint, Provenance } from "../types";

export interface AdsiTrafficRecord {
  slNo: number;
  entityName: string;
  isCity: boolean;
  roadAccidents: {
    cases: number;
    injured: number;
    died: number;
  };
  railwayAccidents: {
    cases: number;
    injured: number;
    died: number;
  };
  totalTrafficAccidents: {
    cases: number;
    injured: number;
    died: number;
  };
}

export const ncrbAdsiAdapter: AdapterFn = async (cfg) => {
  const filePath = path.resolve(process.cwd(), "data", "ncrb_adsi_traffic_accidents.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error(`NCRB ADSI file not found at: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsvRows(rawContent);

  const points: DataPoint[] = [];
  const records: AdsiTrafficRecord[] = [];

  // Row 0 is header: Sl. No.,State/UT/City,Road Accidents - Cases,Road Accidents - Injured,Road Accidents - Died,...
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    const slStr = (row[0] || "").trim();
    const entity = (row[1] || "").trim();
    if (!entity || entity.toLowerCase().includes("total") || slStr.toLowerCase().includes("total")) {
      continue;
    }

    const slNo = parseInt(slStr, 10);
    const isCity = !isNaN(slNo) && slNo > 36;

    const roadCases = parseInt(row[2] || "0", 10) || 0;
    const roadInjured = parseInt(row[3] || "0", 10) || 0;
    const roadDied = parseInt(row[4] || "0", 10) || 0;

    const railCases = parseInt(row[5] || "0", 10) || 0;
    const railInjured = parseInt(row[6] || "0", 10) || 0;
    const railDied = parseInt(row[7] || "0", 10) || 0;

    const totalCases = parseInt(row[11] || "0", 10) || roadCases + railCases;
    const totalInjured = parseInt(row[12] || "0", 10) || roadInjured + railInjured;
    const totalDied = parseInt(row[13] || "0", 10) || roadDied + railDied;

    records.push({
      slNo: isNaN(slNo) ? i : slNo,
      entityName: entity,
      isCity,
      roadAccidents: { cases: roadCases, injured: roadInjured, died: roadDied },
      railwayAccidents: { cases: railCases, injured: railInjured, died: railDied },
      totalTrafficAccidents: { cases: totalCases, injured: totalInjured, died: totalDied }
    });

    // Emits official road accident fatalities DataPoint
    points.push({
      period: "2022",
      value: roadDied,
      unit: "road fatalities",
      entity,
      meta: {
        slNo: isNaN(slNo) ? i : slNo,
        isCity,
        roadCases,
        roadInjured,
        roadDied,
        totalCases,
        totalInjured,
        totalDied
      }
    });
  }

  const provenance: Provenance = {
    sourceId: cfg.id,
    publisher: "National Crime Records Bureau (NCRB), Ministry of Home Affairs, GoI",
    dataset: "ADSI Table 1A.2: Traffic Accidents by State, Union Territory & Million-Plus Cities",
    endpoint: "local:data/ncrb_adsi_traffic_accidents.csv",
    retrievedAt: new Date().toISOString(),
    coverageFrom: "2022",
    coverageTo: "2022",
    license: "Government Open Data License — India (GODL)",
    method: "Official police-recorded ADSI annual compendium compilation",
    trustTier: "registry_aggregate",
    cacheAgeMs: 0,
    fromSnapshot: false
  };

  return {
    points,
    provenance,
    extra: {
      totalEntities: records.length,
      statesCount: records.filter(r => !r.isCity).length,
      citiesCount: records.filter(r => r.isCity).length,
      records
    }
  };
};
