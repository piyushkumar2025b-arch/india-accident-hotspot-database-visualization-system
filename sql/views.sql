-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Analytical Views for High-Performance Aggregations
-- ============================================================================

-- Clean drop of existing views
DROP VIEW IF EXISTS hotspot_statistics CASCADE;
DROP VIEW IF EXISTS accident_statistics_by_state CASCADE;
DROP VIEW IF EXISTS accident_statistics_by_district CASCADE;
DROP VIEW IF EXISTS monthly_accident_statistics CASCADE;
DROP VIEW IF EXISTS cause_statistics CASCADE;
DROP VIEW IF EXISTS road_type_statistics CASCADE;
DROP VIEW IF EXISTS recent_accidents_feed CASCADE;

-- ----------------------------------------------------------------------------
-- 1. VIEW: HOTSPOT_STATISTICS
-- Aggregates spatial locations into risk hotspots with calculated scoring
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW hotspot_statistics AS
WITH location_aggregates AS (
    SELECT 
        a.location_id,
        COUNT(a.id) AS total_accidents,
        COUNT(a.id) FILTER (WHERE a.deaths > 0) AS fatal_accidents,
        COALESCE(SUM(a.deaths), 0) AS total_deaths,
        COALESCE(SUM(a.injured), 0) AS total_injuries,
        COALESCE(SUM(a.critical_injuries), 0) AS total_critical_injuries,
        MAX(a.accident_date) AS last_accident_date,
        -- Dominant accident cause
        (
            SELECT ac.name
            FROM accidents sub_a
            JOIN accident_causes ac ON sub_a.cause_id = ac.id
            WHERE sub_a.location_id = a.location_id
            GROUP BY ac.name
            ORDER BY COUNT(sub_a.id) DESC
            LIMIT 1
        ) AS dominant_cause,
        -- Dominant accident collision type
        (
            SELECT at.name
            FROM accidents sub_a
            JOIN accident_types at ON sub_a.accident_type_id = at.id
            WHERE sub_a.location_id = a.location_id
            GROUP BY at.name
            ORDER BY COUNT(sub_a.id) DESC
            LIMIT 1
        ) AS dominant_type,
        -- Most dangerous month
        (
            SELECT sub_a.month
            FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id
            GROUP BY sub_a.month
            ORDER BY COUNT(sub_a.id) DESC
            LIMIT 1
        ) AS most_dangerous_month_num,
        -- Primary authoritative data source
        (
            SELECT sub_a.source_name
            FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id
            ORDER BY sub_a.accident_date DESC
            LIMIT 1
        ) AS primary_source,
        -- Dominant impacting vehicle category
        (
            SELECT sub_a.responsible_vehicle
            FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id
              AND sub_a.responsible_vehicle IS NOT NULL
              AND sub_a.responsible_vehicle != 'Unknown'
            GROUP BY sub_a.responsible_vehicle
            ORDER BY COUNT(sub_a.id) DESC
            LIMIT 1
        ) AS dominant_vehicle
    FROM accidents a
    GROUP BY a.location_id
)
SELECT 
    l.id AS location_id,
    l.road_name,
    l.road_number,
    l.city,
    l.locality,
    l.latitude,
    l.longitude,
    rt.name AS road_type,
    s.id AS state_id,
    s.name AS state_name,
    s.state_code,
    d.id AS district_id,
    d.name AS district_name,
    COALESCE(la.total_accidents, 0) AS total_accidents,
    COALESCE(la.fatal_accidents, 0) AS fatal_accidents,
    COALESCE(la.total_deaths, 0) AS total_deaths,
    COALESCE(la.total_injuries, 0) AS total_injuries,
    COALESCE(la.total_critical_injuries, 0) AS total_critical_injuries,
    la.last_accident_date,
    COALESCE(la.dominant_cause, 'N/A') AS dominant_cause,
    COALESCE(la.dominant_type, 'N/A') AS dominant_type,
    CASE la.most_dangerous_month_num
        WHEN 1 THEN 'January'
        WHEN 2 THEN 'February'
        WHEN 3 THEN 'March'
        WHEN 4 THEN 'April'
        WHEN 5 THEN 'May'
        WHEN 6 THEN 'June'
        WHEN 7 THEN 'July'
        WHEN 8 THEN 'August'
        WHEN 9 THEN 'September'
        WHEN 10 THEN 'October'
        WHEN 11 THEN 'November'
        WHEN 12 THEN 'December'
        ELSE 'N/A'
    END AS highest_risk_month,
    calculate_hotspot_score(
        la.total_accidents,
        la.fatal_accidents,
        la.total_deaths,
        la.total_injuries,
        la.last_accident_date
    ) AS hotspot_score,
    CASE 
        WHEN calculate_hotspot_score(la.total_accidents, la.fatal_accidents, la.total_deaths, la.total_injuries, la.last_accident_date) >= 75.0 THEN 'Critical'
        WHEN calculate_hotspot_score(la.total_accidents, la.fatal_accidents, la.total_deaths, la.total_injuries, la.last_accident_date) >= 50.0 THEN 'High'
        WHEN calculate_hotspot_score(la.total_accidents, la.fatal_accidents, la.total_deaths, la.total_injuries, la.last_accident_date) >= 25.0 THEN 'Moderate'
        ELSE 'Low'
    END AS hotspot_tier,
    COALESCE(la.primary_source, 'Official Open Dataset') AS primary_source,
    COALESCE(la.dominant_vehicle, 'Multiple Types') AS dominant_vehicle
FROM locations l
JOIN states s ON l.state_id = s.id
JOIN districts d ON l.district_id = d.id
JOIN road_types rt ON l.road_type_id = rt.id
LEFT JOIN location_aggregates la ON l.id = la.location_id
WHERE la.total_accidents > 0;

COMMENT ON VIEW hotspot_statistics IS 'Spatial hotspot summary view with risk tiering, casualty aggregates, and dominant causes.';

-- ----------------------------------------------------------------------------
-- 2. VIEW: ACCIDENT_STATISTICS_BY_STATE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW accident_statistics_by_state AS
SELECT 
    s.id AS state_id,
    s.name AS state_name,
    s.state_code,
    s.latitude,
    s.longitude,
    COUNT(a.id) AS total_accidents,
    COUNT(a.id) FILTER (WHERE a.deaths > 0) AS fatal_accidents,
    COALESCE(SUM(a.deaths), 0) AS total_deaths,
    COALESCE(SUM(a.injured), 0) AS total_injuries,
    COALESCE(SUM(a.critical_injuries), 0) AS total_critical_injuries
FROM states s
LEFT JOIN locations l ON s.id = l.state_id
LEFT JOIN accidents a ON l.id = a.location_id
GROUP BY s.id, s.name, s.state_code, s.latitude, s.longitude
ORDER BY total_accidents DESC;

COMMENT ON VIEW accident_statistics_by_state IS 'State-level aggregation for geospatial distribution and ranking.';

-- ----------------------------------------------------------------------------
-- 3. VIEW: ACCIDENT_STATISTICS_BY_DISTRICT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW accident_statistics_by_district AS
SELECT 
    d.id AS district_id,
    d.name AS district_name,
    s.id AS state_id,
    s.name AS state_name,
    COUNT(a.id) AS total_accidents,
    COUNT(a.id) FILTER (WHERE a.deaths > 0) AS fatal_accidents,
    COALESCE(SUM(a.deaths), 0) AS total_deaths,
    COALESCE(SUM(a.injured), 0) AS total_injuries
FROM districts d
JOIN states s ON d.state_id = s.id
LEFT JOIN locations l ON d.id = l.district_id
LEFT JOIN accidents a ON l.id = a.location_id
GROUP BY d.id, d.name, s.id, s.name
HAVING COUNT(a.id) > 0
ORDER BY total_accidents DESC;

-- ----------------------------------------------------------------------------
-- 4. VIEW: MONTHLY_ACCIDENT_STATISTICS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW monthly_accident_statistics AS
SELECT 
    a.year,
    a.month,
    TO_CHAR(TO_DATE(a.month::text, 'MM'), 'Month') AS month_name,
    COUNT(a.id) AS total_accidents,
    COUNT(a.id) FILTER (WHERE a.deaths > 0) AS fatal_accidents,
    COALESCE(SUM(a.deaths), 0) AS total_deaths,
    COALESCE(SUM(a.injured), 0) AS total_injuries
FROM accidents a
GROUP BY a.year, a.month
ORDER BY a.year DESC, a.month ASC;

COMMENT ON VIEW monthly_accident_statistics IS 'Temporal monthly trends to identify seasonal surges.';

-- ----------------------------------------------------------------------------
-- 5. VIEW: CAUSE_STATISTICS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW cause_statistics AS
SELECT 
    c.id AS cause_id,
    c.name AS cause_name,
    c.category,
    COUNT(a.id) AS total_accidents,
    COALESCE(SUM(a.deaths), 0) AS total_deaths,
    COALESCE(SUM(a.injured), 0) AS total_injuries,
    ROUND(COUNT(a.id)::NUMERIC * 100.0 / NULLIF((SELECT COUNT(*) FROM accidents), 0), 2) AS percentage_of_total
FROM accident_causes c
LEFT JOIN accidents a ON c.id = a.cause_id
GROUP BY c.id, c.name, c.category
ORDER BY total_accidents DESC;

-- ----------------------------------------------------------------------------
-- 6. VIEW: ROAD_TYPE_STATISTICS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW road_type_statistics AS
SELECT 
    rt.id AS road_type_id,
    rt.code AS road_type_code,
    rt.name AS road_type_name,
    COUNT(a.id) AS total_accidents,
    COALESCE(SUM(a.deaths), 0) AS total_deaths,
    COALESCE(SUM(a.injured), 0) AS total_injuries
FROM road_types rt
LEFT JOIN locations l ON rt.id = l.road_type_id
LEFT JOIN accidents a ON l.id = a.location_id
GROUP BY rt.id, rt.code, rt.name
ORDER BY total_accidents DESC;

-- ----------------------------------------------------------------------------
-- 7. VIEW: RECENT_ACCIDENTS_FEED
-- Clean flattened representation for administrative overview and public table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW recent_accidents_feed AS
SELECT 
    a.id,
    a.accident_date,
    a.accident_time,
    a.month,
    a.year,
    a.severity,
    a.deaths,
    a.injured,
    a.critical_injuries,
    a.vehicles_involved,
    a.responsible_vehicle,
    a.road_condition,
    a.description,
    a.source_name,
    a.source_url,
    a.verification_status,
    a.created_at,
    -- Joined Location Attributes
    l.id AS location_id,
    l.road_name,
    l.road_number,
    l.city,
    l.locality,
    l.latitude,
    l.longitude,
    rt.name AS road_type_name,
    s.id AS state_id,
    s.name AS state_name,
    s.state_code,
    d.id AS district_id,
    d.name AS district_name,
    -- Joined Taxonomies
    at.id AS accident_type_id,
    at.name AS accident_type_name,
    ac.id AS cause_id,
    ac.name AS cause_name,
    wc.name AS weather_name
FROM accidents a
JOIN locations l ON a.location_id = l.id
JOIN states s ON l.state_id = s.id
JOIN districts d ON l.district_id = d.id
JOIN road_types rt ON l.road_type_id = rt.id
JOIN accident_types at ON a.accident_type_id = at.id
JOIN accident_causes ac ON a.cause_id = ac.id
LEFT JOIN weather_conditions wc ON a.weather_condition_id = wc.id
ORDER BY a.accident_date DESC, a.created_at DESC;

COMMENT ON VIEW recent_accidents_feed IS 'Denormalized view optimized for fast tabular listing and administrative CRUD inspection.';
