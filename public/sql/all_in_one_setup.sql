-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Master All-In-One Setup Script (DDL + Reference Data + Functions + Views + Indexes + RLS + Demo Seed)
-- ============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for idempotency
DROP VIEW IF EXISTS hotspot_statistics CASCADE;
DROP VIEW IF EXISTS accident_statistics_by_state CASCADE;
DROP VIEW IF EXISTS accident_statistics_by_district CASCADE;
DROP VIEW IF EXISTS monthly_accident_statistics CASCADE;
DROP VIEW IF EXISTS cause_statistics CASCADE;
DROP VIEW IF EXISTS road_type_statistics CASCADE;
DROP VIEW IF EXISTS recent_accidents_feed CASCADE;

DROP TABLE IF EXISTS accidents CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS states CASCADE;
DROP TABLE IF EXISTS road_types CASCADE;
DROP TABLE IF EXISTS accident_types CASCADE;
DROP TABLE IF EXISTS accident_causes CASCADE;
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. DDL Tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    state_code VARCHAR(10) NOT NULL UNIQUE,
    latitude NUMERIC(9, 6) CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude NUMERIC(9, 6) CHECK (longitude BETWEEN -180.0 AND 180.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_per_state UNIQUE (state_id, name)
);

CREATE TABLE road_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accident_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accident_causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'General',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weather_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    city VARCHAR(100),
    locality VARCHAR(150),
    road_name VARCHAR(150) NOT NULL,
    road_number VARCHAR(50),
    road_type_id UUID NOT NULL REFERENCES road_types(id) ON DELETE RESTRICT,
    latitude NUMERIC(9, 6) NOT NULL CHECK (latitude BETWEEN -90.000000 AND 90.000000),
    longitude NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180.000000 AND 180.000000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    accident_date DATE NOT NULL,
    accident_time TIME,
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL CHECK (year BETWEEN 1990 AND 2100),
    accident_type_id UUID NOT NULL REFERENCES accident_types(id) ON DELETE RESTRICT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Minor', 'Moderate', 'Severe', 'Fatal')),
    deaths INTEGER NOT NULL DEFAULT 0 CHECK (deaths >= 0),
    injured INTEGER NOT NULL DEFAULT 0 CHECK (injured >= 0),
    critical_injuries INTEGER NOT NULL DEFAULT 0 CHECK (critical_injuries >= 0),
    vehicles_involved INTEGER NOT NULL DEFAULT 1 CHECK (vehicles_involved >= 0),
    responsible_vehicle VARCHAR(100) DEFAULT 'Unknown',
    weather_condition_id UUID REFERENCES weather_conditions(id) ON DELETE SET NULL,
    road_condition VARCHAR(100) DEFAULT 'Normal',
    cause_id UUID NOT NULL REFERENCES accident_causes(id) ON DELETE RESTRICT,
    description TEXT,
    source_name VARCHAR(200) NOT NULL DEFAULT 'Manual Entry',
    source_url TEXT,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Pending', 'Verified', 'Flagged', 'Rejected')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_critical_not_exceed_injured CHECK (critical_injuries <= injured)
);

-- 3. Functions & Triggers
CREATE OR REPLACE FUNCTION derive_accident_month_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accident_date IS NOT NULL THEN
        NEW.month := EXTRACT(MONTH FROM NEW.accident_date)::SMALLINT;
        NEW.year  := EXTRACT(YEAR FROM NEW.accident_date)::SMALLINT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_derive_accident_month_year ON accidents;
CREATE TRIGGER trg_derive_accident_month_year
    BEFORE INSERT OR UPDATE OF accident_date ON accidents
    FOR EACH ROW
    EXECUTE FUNCTION derive_accident_month_year();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_timestamp_accidents BEFORE UPDATE ON accidents FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_timestamp_locations BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE FUNCTION calculate_hotspot_score(
    p_total_accidents BIGINT,
    p_fatal_accidents BIGINT,
    p_deaths BIGINT,
    p_injured BIGINT,
    p_last_accident_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_recency_score NUMERIC := 1.0;
    v_calculated_score NUMERIC := 0.0;
    v_days_elapsed INTEGER;
BEGIN
    IF p_last_accident_date IS NOT NULL THEN
        v_days_elapsed := CURRENT_DATE - p_last_accident_date;
        IF v_days_elapsed <= 180 THEN
            v_recency_score := 5.0;
        ELSIF v_days_elapsed <= 365 THEN
            v_recency_score := 3.0;
        ELSE
            v_recency_score := 1.0;
        END IF;
    END IF;

    v_calculated_score := (COALESCE(p_total_accidents, 0) * 2.5) +
                          (COALESCE(p_fatal_accidents, 0) * 6.0) +
                          (COALESCE(p_deaths, 0) * 7.0) +
                          (COALESCE(p_injured, 0) * 2.0) +
                          (v_recency_score * 3.0);

    IF v_calculated_score > 100 THEN
        v_calculated_score := 100.0;
    END IF;

    RETURN ROUND(v_calculated_score, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_hotspot_summary()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_accidents', COUNT(*),
        'total_deaths', COALESCE(SUM(deaths), 0),
        'total_injured', COALESCE(SUM(injured), 0),
        'total_critical_injuries', COALESCE(SUM(critical_injuries), 0),
        'fatal_accidents', COUNT(*) FILTER (WHERE deaths > 0),
        'total_locations', (SELECT COUNT(*) FROM locations),
        'total_states_covered', (SELECT COUNT(DISTINCT state_id) FROM locations),
        'most_affected_state', (
            SELECT s.name 
            FROM accidents a 
            JOIN locations l ON a.location_id = l.id
            JOIN states s ON l.state_id = s.id
            GROUP BY s.name
            ORDER BY COUNT(a.id) DESC
            LIMIT 1
        ),
        'most_common_cause', (
            SELECT c.name 
            FROM accidents a 
            JOIN accident_causes c ON a.cause_id = c.id
            GROUP BY c.name
            ORDER BY COUNT(a.id) DESC
            LIMIT 1
        )
    ) INTO v_result
    FROM accidents;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Analytical Views
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
        (
            SELECT ac.name FROM accidents sub_a JOIN accident_causes ac ON sub_a.cause_id = ac.id
            WHERE sub_a.location_id = a.location_id GROUP BY ac.name ORDER BY COUNT(sub_a.id) DESC LIMIT 1
        ) AS dominant_cause,
        (
            SELECT at.name FROM accidents sub_a JOIN accident_types at ON sub_a.accident_type_id = at.id
            WHERE sub_a.location_id = a.location_id GROUP BY at.name ORDER BY COUNT(sub_a.id) DESC LIMIT 1
        ) AS dominant_type,
        (
            SELECT sub_a.month FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id GROUP BY sub_a.month ORDER BY COUNT(sub_a.id) DESC LIMIT 1
        ) AS most_dangerous_month_num,
        (
            SELECT sub_a.source_name FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id ORDER BY sub_a.accident_date DESC LIMIT 1
        ) AS primary_source,
        (
            SELECT sub_a.responsible_vehicle FROM accidents sub_a
            WHERE sub_a.location_id = a.location_id AND sub_a.responsible_vehicle IS NOT NULL AND sub_a.responsible_vehicle != 'Unknown'
            GROUP BY sub_a.responsible_vehicle ORDER BY COUNT(sub_a.id) DESC LIMIT 1
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
        WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March' WHEN 4 THEN 'April'
        WHEN 5 THEN 'May' WHEN 6 THEN 'June' WHEN 7 THEN 'July' WHEN 8 THEN 'August'
        WHEN 9 THEN 'September' WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December'
        ELSE 'N/A'
    END AS highest_risk_month,
    calculate_hotspot_score(la.total_accidents, la.fatal_accidents, la.total_deaths, la.total_injuries, la.last_accident_date) AS hotspot_score,
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

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_accidents_location_id ON accidents(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_state_id ON locations(state_id);
CREATE INDEX IF NOT EXISTS idx_locations_district_id ON locations(district_id);
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_accidents_accident_date ON accidents(accident_date DESC);
CREATE INDEX IF NOT EXISTS idx_accidents_year_month ON accidents(year, month);
CREATE INDEX IF NOT EXISTS idx_accidents_severity ON accidents(severity);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- 6. Row Level Security (RLS)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read road_types" ON road_types FOR SELECT USING (true);
CREATE POLICY "Public read accident_types" ON accident_types FOR SELECT USING (true);
CREATE POLICY "Public read accident_causes" ON accident_causes FOR SELECT USING (true);
CREATE POLICY "Public read weather_conditions" ON weather_conditions FOR SELECT USING (true);
CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Public read accidents" ON accidents FOR SELECT USING (true);

CREATE POLICY "Admin write states" ON states FOR ALL USING (is_admin());
CREATE POLICY "Admin write districts" ON districts FOR ALL USING (is_admin());
CREATE POLICY "Admin write road_types" ON road_types FOR ALL USING (is_admin());
CREATE POLICY "Admin write accident_types" ON accident_types FOR ALL USING (is_admin());
CREATE POLICY "Admin write accident_causes" ON accident_causes FOR ALL USING (is_admin());
CREATE POLICY "Admin write weather_conditions" ON weather_conditions FOR ALL USING (is_admin());
CREATE POLICY "Admin write locations" ON locations FOR ALL USING (is_admin());
CREATE POLICY "Admin write accidents" ON accidents FOR ALL USING (is_admin());
CREATE POLICY "Users read profiles" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update profiles" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
