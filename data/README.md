# Data Provenance & Methodology Specification

## 1. Overview
The **India Accident Hotspot Database & Visualization System** is an academic database management system (DBMS) designed for spatial analysis, temporal trend discovery, and risk scoring of traffic incident records.

> **Data Honesty Disclosure**:
> The coverage of this database reflects records documented in official government open datasets, state police casualty logs, and validated administrative entries. It is a research and engineering visualization system; records represent captured datasets and are not claimed to represent every unrecorded incident in India.

---

## 2. Recognized Public Data Sources & Citations

1. **Ministry of Road Transport & Highways (MoRTH), Government of India**
   - *Publication*: "Road Accidents in India" Annual Reports (2020–2024 editions)
   - *Public Portal*: [https://morth.nic.in](https://morth.nic.in)
   - *Description*: National macro-level statistical breakdowns, road-type distribution (National Highway, State Highway, Expressways), top black-spot lists, and cause-of-accident classifications.

2. **Open Government Data (OGD) Platform India**
   - *Public Portal*: [https://data.gov.in](https://data.gov.in)
   - *Catalogs*: National Crime Records Bureau (NCRB) Accidental Deaths & Suicides in India (ADSI) reports.

3. **National Highways Authority of India (NHAI)**
   - *Corridor Safety Audits & Black Spot Identification*: [https://nhai.gov.in](https://nhai.gov.in)
   - *Specific Corridor Studies*: High-risk stretches on NH-44, NH-48, NH-16, and national access-controlled expressways.

4. **Metropolitan Traffic Police & State Highway Police Public Portals**
   - Delhi Police Road Safety Cell (`delhipolice.gov.in`)
   - Bengaluru Traffic Police (`btp.gov.in`)
   - Maharashtra State Road Development Corporation (MSRDC - `msrdc.in`)

---

## 3. CSV Import Format & Validation Rules

When administrators import batch records via the Admin Panel, the CSV file must adhere to the following schema:

| Column Name | Data Type | Constraints / Allowed Values | Description |
|---|---|---|---|
| `accident_date` | `YYYY-MM-DD` | Required, valid past/current date | Date of occurrence |
| `accident_time` | `HH:MM:SS` | Optional, 24-hour time | Time of incident |
| `state_name` | String | Must match existing state in `states` table | State / UT name |
| `district_name` | String | Must exist under the specified state | District name |
| `city` | String | Optional | Nearest city or municipal area |
| `locality` | String | Optional | Landmark, milestone, or village |
| `road_name` | String | Required | Road corridor name (e.g. Hosur Road) |
| `road_number` | String | Optional | Highway identifier (e.g. NH-44, YE-01) |
| `road_type` | String | National Highway, State Highway, Expressway, City Arterial Road / Ring Road, Rural Road / Village Road, Other | Corresponds to `road_types` |
| `latitude` | Decimal | `-90.000000` to `90.000000` (India is ~6.0 to 38.0) | WGS 84 Latitude |
| `longitude` | Decimal | `-180.000000` to `180.000000` (India is ~68.0 to 98.0) | WGS 84 Longitude |
| `accident_type` | String | Must match taxonomy in `accident_types` | Collision typology |
| `severity` | String | `Minor`, `Moderate`, `Severe`, `Fatal` | Severity classification |
| `deaths` | Integer | `>= 0` | Fatality count |
| `injured` | Integer | `>= 0` | Total casualty injury count |
| `critical_injuries`| Integer | `>= 0`, must be `<= injured` | ICU / life-threatening injury count |
| `vehicles_involved`| Integer | `>= 1` | Total vehicular units involved |
| `weather_condition`| String | Clear, Rain / Heavy Downpour, Dense Fog, Smog / Haze, High Winds, Extreme Heat | Atmospheric status |
| `road_condition` | String | Optional (e.g. Dry, Wet, Potholes) | Physical road state |
| `cause` | String | Must match taxonomy in `accident_causes` | Primary causality factor |
| `description` | String | Optional | Case narrative or investigation synopsis |
| `source_name` | String | Required | Citation / publishing agency |
| `source_url` | String | Optional URL | Web verification reference |

---

## 4. Calculated Accident Hotspot Score Methodology

The hotspot scoring algorithm evaluates clustered records at a given road point using an empirical weighted formula:

$$\text{Calculated Score} = \min\left(100, \text{round}\left(N_{\text{acc}} \times 2.5 + N_{\text{fatal}} \times 6.0 + D_{\text{total}} \times 7.0 + I_{\text{total}} \times 2.0 + R_{\text{bonus}} \times 3.0\right)\right)$$

Where:
- $N_{\text{acc}}$: Total recorded accidents at the location
- $N_{\text{fatal}}$: Count of accidents with $\ge 1$ death
- $D_{\text{total}}$: Sum of total deaths
- $I_{\text{total}}$: Sum of total injuries
- $R_{\text{bonus}}$: Recency factor (5 if last accident within 180 days, 3 within 365 days, else 1)

### Risk Tiers
- **Critical Risk**: Score $75.0 - 100.0$ (Immediate engineering audit required)
- **High Risk**: Score $50.0 - 74.9$ (Frequent severe incidents)
- **Moderate Risk**: Score $25.0 - 49.9$ (Occasional casualties)
- **Low Risk**: Score $0.0 - 24.9$ (Minor collisions, zero or low casualties)
