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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_location_coords UNIQUE (latitude, longitude)
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

-- Allow anonymous / authenticated API upserts for ingestion if needed
CREATE POLICY "Public insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert accidents" ON accidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update accidents" ON accidents FOR UPDATE USING (true);
CREATE POLICY "Public delete accidents" ON accidents FOR DELETE USING (true);

CREATE POLICY "Users read profiles" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update profiles" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- 7. Automated User Profile Provisioning Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        -- Automatically assign admin role for dashboard administration
        'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Seed Reference Data (Master Classifications & Geography)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED ROAD TYPES
-- ----------------------------------------------------------------------------
INSERT INTO road_types (code, name, description) VALUES
('NH', 'National Highway', 'Primary arterial roads linking major ports, state capitals, and industrial hubs across India.'),
('SH', 'State Highway', 'Arterial roads linking district headquarters and important cities within a state.'),
('EXP', 'Expressway', 'High-speed, controlled-access multi-lane divided corridors.'),
('CITY', 'City Arterial Road / Ring Road', 'Major internal urban thoroughfares, bypasses, and inner/outer ring roads.'),
('RURAL', 'Rural Road / Village Road', 'Secondary connecting roadways linking rural villages to market centers.'),
('OTHER', 'Other / Unclassified', 'Private, service, or municipal roads not classified under primary categories.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 2. SEED ACCIDENT TYPES (Taxonomy)
-- ----------------------------------------------------------------------------
INSERT INTO accident_types (name, description) VALUES
('Head-on Collision', 'Vehicles traveling in opposite directions colliding front-to-front.'),
('Rear-end Collision', 'Vehicle crashing into the vehicle directly ahead.'),
('Side Impact / T-Bone', 'Vehicle striking the side of another vehicle, typical at intersections.'),
('Hit and Run / Pedestrian', 'Collision involving a pedestrian or non-motorized traveler.'),
('Rollover / Overturning', 'Vehicle turning over on its side or roof due to loss of control or embankment.'),
('Skidding / Run-off-road', 'Vehicle skidding off the carriageway into a ditch, tree, or median.'),
('Motorcycle / Two-Wheeler Crash', 'Collision specifically involving two-wheelers, with high injury vulnerability.'),
('Multi-Vehicle Pileup', 'Chain-reaction collision involving three or more vehicles, often in low visibility.'),
('Animal Crossing Collision', 'Vehicle impact with stray cattle or wildlife crossing highways.'),
('Other / Miscellaneous', 'Other unclassified collision scenarios.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 3. SEED ACCIDENT CAUSES
-- ----------------------------------------------------------------------------
INSERT INTO accident_causes (name, category, description) VALUES
('Overspeeding', 'Human Error', 'Exceeding statutory speed limits or driving too fast for road conditions.'),
('Drunk Driving / Intoxication', 'Human Error', 'Operating a motor vehicle under the influence of alcohol or narcotics.'),
('Wrong-side Driving', 'Traffic Violation', 'Driving against the designated flow of traffic on divided roads or ramps.'),
('Driver Fatigue / Falling Asleep', 'Human Factor', 'Loss of alertness due to continuous long-distance driving without breaks.'),
('Distracted Driving (Mobile Phone)', 'Human Error', 'Use of mobile device or in-cabin distraction while navigating.'),
('Red Light / Signal Jumping', 'Traffic Violation', 'Failing to stop at traffic signals at junctions.'),
('Poor Road Surface / Potholes', 'Infrastructure', 'Severe surface deterioration, crater potholes, or unpaved patches.'),
('Mechanical Failure / Tyre Burst', 'Vehicle Factor', 'Sudden tyre blowout, brake malfunction, or steering failure.'),
('Dense Fog / Poor Visibility', 'Environmental', 'Low ambient visibility caused by winter fog, smog, or heavy downpours.'),
('Unmarked Speed Breaker / Diversion', 'Infrastructure', 'Absence of retro-reflective paint or hazard warning signs on road obstacles.'),
('Unknown / Under Investigation', 'General', 'Cause not conclusively determined by investigating police agency.'),
('Other', 'General', 'Other specific factor documented in initial casualty report.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 4. SEED WEATHER CONDITIONS
-- ----------------------------------------------------------------------------
INSERT INTO weather_conditions (name, description) VALUES
('Clear', 'Normal daylight or illuminated clear skies with optimal visibility.'),
('Rain / Heavy Downpour', 'Precipitation reducing tyre traction and braking efficiency.'),
('Dense Fog', 'Atmospheric winter fog cutting visibility below 100 meters.'),
('Smog / Haze', 'Industrial smoke and particulate matter causing visual impairment.'),
('High Winds / Dust Storm', 'Severe gusts compromising high-profile vehicle stability.'),
('Extreme Heat', 'High pavement temperatures increasing risk of tyre blowouts.'),
('Unknown', 'Weather condition not formally recorded in initial first information report.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 5. SEED STATES & UNION TERRITORIES (All 36 Entities)
-- ----------------------------------------------------------------------------
INSERT INTO states (name, state_code, latitude, longitude) VALUES
('Andhra Pradesh', 'AP', 15.912900, 79.739987),
('Arunachal Pradesh', 'AR', 28.217999, 94.727753),
('Assam', 'AS', 26.200604, 92.937574),
('Bihar', 'BR', 25.096074, 85.313119),
('Chhattisgarh', 'CG', 21.278657, 81.866144),
('Goa', 'GA', 15.299326, 74.123996),
('Gujarat', 'GJ', 22.258652, 71.192380),
('Haryana', 'HR', 29.058776, 76.085601),
('Himachal Pradesh', 'HP', 31.104829, 77.173424),
('Jharkhand', 'JH', 23.610181, 85.279935),
('Karnataka', 'KA', 15.317277, 75.713888),
('Kerala', 'KL', 10.850516, 76.271080),
('Madhya Pradesh', 'MP', 22.973423, 78.656894),
('Maharashtra', 'MH', 19.751480, 75.713888),
('Manipur', 'MN', 24.663717, 93.906269),
('Meghalaya', 'ML', 25.467031, 91.366216),
('Mizoram', 'MZ', 23.164543, 92.937574),
('Nagaland', 'NL', 26.158435, 94.562443),
('Odisha', 'OD', 20.951666, 85.098524),
('Punjab', 'PB', 31.147131, 75.341218),
('Rajasthan', 'RJ', 27.023804, 74.217933),
('Sikkim', 'SK', 27.532972, 88.512218),
('Tamil Nadu', 'TN', 11.127123, 78.656894),
('Telangana', 'TS', 18.112437, 79.019300),
('Tripura', 'TR', 23.940841, 91.988153),
('Uttar Pradesh', 'UP', 26.846709, 80.946159),
('Uttarakhand', 'UK', 30.066753, 79.019300),
('West Bengal', 'WB', 22.986757, 87.854976),
('Andaman and Nicobar Islands', 'AN', 11.740087, 92.658640),
('Chandigarh', 'CH', 30.733315, 76.779418),
('Dadra and Nagar Haveli and Daman and Diu', 'DN', 20.180862, 73.016912),
('Delhi', 'DL', 28.704059, 77.102490),
('Jammu and Kashmir', 'JK', 33.778175, 76.576171),
('Ladakh', 'LA', 34.152588, 77.577053),
('Lakshadweep', 'LD', 10.566667, 72.636944),
('Puducherry', 'PY', 11.941592, 79.808313)
ON CONFLICT (name) DO UPDATE SET 
    state_code = EXCLUDED.state_code,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- ----------------------------------------------------------------------------
-- 6. SEED KEY DISTRICTS (Representative samples across key states)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_state_id UUID;
BEGIN
    -- Delhi
    SELECT id INTO v_state_id FROM states WHERE state_code = 'DL';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Central Delhi'),
        (v_state_id, 'South Delhi'),
        (v_state_id, 'North Delhi'),
        (v_state_id, 'South West Delhi'),
        (v_state_id, 'North West Delhi'),
        (v_state_id, 'East Delhi'),
        (v_state_id, 'West Delhi'),
        (v_state_id, 'New Delhi')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Maharashtra
    SELECT id INTO v_state_id FROM states WHERE state_code = 'MH';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Mumbai Suburban'),
        (v_state_id, 'Mumbai City'),
        (v_state_id, 'Pune'),
        (v_state_id, 'Thane'),
        (v_state_id, 'Nagpur'),
        (v_state_id, 'Nashik'),
        (v_state_id, 'Aurangabad'),
        (v_state_id, 'Solapur'),
        (v_state_id, 'Raigad')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Karnataka
    SELECT id INTO v_state_id FROM states WHERE state_code = 'KA';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Bengaluru Urban'),
        (v_state_id, 'Bengaluru Rural'),
        (v_state_id, 'Mysuru'),
        (v_state_id, 'Tumakuru'),
        (v_state_id, 'Belagavi'),
        (v_state_id, 'Dakshina Kannada'),
        (v_state_id, 'Hubballi-Dharwad')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Uttar Pradesh
    SELECT id INTO v_state_id FROM states WHERE state_code = 'UP';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Gautam Buddha Nagar (Noida)'),
        (v_state_id, 'Ghaziabad'),
        (v_state_id, 'Agra'),
        (v_state_id, 'Mathura'),
        (v_state_id, 'Lucknow'),
        (v_state_id, 'Kanpur Nagar'),
        (v_state_id, 'Varanasi'),
        (v_state_id, 'Prayagraj')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Tamil Nadu
    SELECT id INTO v_state_id FROM states WHERE state_code = 'TN';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Chennai'),
        (v_state_id, 'Coimbatore'),
        (v_state_id, 'Madurai'),
        (v_state_id, 'Salem'),
        (v_state_id, 'Tiruchirappalli'),
        (v_state_id, 'Kanchipuram'),
        (v_state_id, 'Chengalpattu')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Telangana
    SELECT id INTO v_state_id FROM states WHERE state_code = 'TS';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Hyderabad'),
        (v_state_id, 'Ranga Reddy'),
        (v_state_id, 'Medchal-Malkajgiri'),
        (v_state_id, 'Warangal'),
        (v_state_id, 'Nalgonda')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Haryana
    SELECT id INTO v_state_id FROM states WHERE state_code = 'HR';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Gurugram'),
        (v_state_id, 'Faridabad'),
        (v_state_id, 'Sonipat'),
        (v_state_id, 'Panipat'),
        (v_state_id, 'Karnal'),
        (v_state_id, 'Ambala')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Rajasthan
    SELECT id INTO v_state_id FROM states WHERE state_code = 'RJ';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Jaipur'),
        (v_state_id, 'Jodhpur'),
        (v_state_id, 'Udaipur'),
        (v_state_id, 'Kota'),
        (v_state_id, 'Ajmer'),
        (v_state_id, 'Alwar')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- Gujarat
    SELECT id INTO v_state_id FROM states WHERE state_code = 'GJ';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Ahmedabad'),
        (v_state_id, 'Surat'),
        (v_state_id, 'Vadodara'),
        (v_state_id, 'Rajkot'),
        (v_state_id, 'Gandhinagar')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;

    -- West Bengal
    SELECT id INTO v_state_id FROM states WHERE state_code = 'WB';
    IF v_state_id IS NOT NULL THEN
        INSERT INTO districts (state_id, name) VALUES
        (v_state_id, 'Kolkata'),
        (v_state_id, 'North 24 Parganas'),
        (v_state_id, 'South 24 Parganas'),
        (v_state_id, 'Howrah'),
        (v_state_id, 'Hooghly')
        ON CONFLICT (state_id, name) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Realistic Benchmark Seed Data for Testing & Demonstration
-- NOTE: ALL RECORDS ARE EXPLICITLY LABELED AS DEMO DATA
-- Corresponds to published MoRTH (Ministry of Road Transport & Highways)
-- Highway Black-Spot corridors and safety research profiles.
-- ============================================================================

DO $$
DECLARE
    -- States
    v_state_dl UUID;
    v_state_mh UUID;
    v_state_ka UUID;
    v_state_up UUID;
    v_state_ts UUID;
    v_state_hr UUID;
    v_state_rj UUID;
    v_state_tn UUID;
    v_state_gj UUID;

    -- Districts
    v_dist_delhi_north UUID;
    v_dist_delhi_south UUID;
    v_dist_pune UUID;
    v_dist_raigad UUID;
    v_dist_mumbai_sub UUID;
    v_dist_bengaluru_urban UUID;
    v_dist_tumakuru UUID;
    v_dist_noida UUID;
    v_dist_agra UUID;
    v_dist_mathura UUID;
    v_dist_hyderabad UUID;
    v_dist_gurugram UUID;
    v_dist_jaipur UUID;
    v_dist_chennai UUID;
    v_dist_kanchipuram UUID;
    v_dist_ahmedabad UUID;

    -- Road Types
    v_rt_exp UUID;
    v_rt_nh UUID;
    v_rt_sh UUID;
    v_rt_city UUID;

    -- Accident Types
    v_at_headon UUID;
    v_at_rearend UUID;
    v_at_side UUID;
    v_at_pedestrian UUID;
    v_at_rollover UUID;
    v_at_twowheeler UUID;
    v_at_pileup UUID;

    -- Causes
    v_ac_overspeed UUID;
    v_ac_drunk UUID;
    v_ac_wrongside UUID;
    v_ac_fatigue UUID;
    v_ac_distracted UUID;
    v_ac_potholes UUID;
    v_ac_tyreburst UUID;
    v_ac_fog UUID;

    -- Weather
    v_wc_clear UUID;
    v_wc_rain UUID;
    v_wc_fog UUID;

    -- Locations
    v_loc_yamuna_mathura UUID;
    v_loc_yamuna_agra UUID;
    v_loc_mumbai_pune_khandala UUID;
    v_loc_mumbai_pune_panvel UUID;
    v_loc_nh44_bangalore_hosur UUID;
    v_loc_nh44_hyderabad_shamshabad UUID;
    v_loc_nh48_gurugram_kherki UUID;
    v_loc_nh48_jaipur_bypass UUID;
    v_loc_delhi_mukarba UUID;
    v_loc_delhi_aiims UUID;
    v_loc_chennai_omr UUID;
    v_loc_ahmedabad_sg UUID;

BEGIN
    -- Fetch States
    SELECT id INTO v_state_dl FROM states WHERE state_code = 'DL';
    SELECT id INTO v_state_mh FROM states WHERE state_code = 'MH';
    SELECT id INTO v_state_ka FROM states WHERE state_code = 'KA';
    SELECT id INTO v_state_up FROM states WHERE state_code = 'UP';
    SELECT id INTO v_state_ts FROM states WHERE state_code = 'TS';
    SELECT id INTO v_state_hr FROM states WHERE state_code = 'HR';
    SELECT id INTO v_state_rj FROM states WHERE state_code = 'RJ';
    SELECT id INTO v_state_tn FROM states WHERE state_code = 'TN';
    SELECT id INTO v_state_gj FROM states WHERE state_code = 'GJ';

    -- Fetch Districts
    SELECT id INTO v_dist_delhi_north FROM districts WHERE name = 'North Delhi' AND state_id = v_state_dl;
    SELECT id INTO v_dist_delhi_south FROM districts WHERE name = 'South Delhi' AND state_id = v_state_dl;
    SELECT id INTO v_dist_pune FROM districts WHERE name = 'Pune' AND state_id = v_state_mh;
    SELECT id INTO v_dist_raigad FROM districts WHERE name = 'Raigad' AND state_id = v_state_mh;
    SELECT id INTO v_dist_mumbai_sub FROM districts WHERE name = 'Mumbai Suburban' AND state_id = v_state_mh;
    SELECT id INTO v_dist_bengaluru_urban FROM districts WHERE name = 'Bengaluru Urban' AND state_id = v_state_ka;
    SELECT id INTO v_dist_tumakuru FROM districts WHERE name = 'Tumakuru' AND state_id = v_state_ka;
    SELECT id INTO v_dist_noida FROM districts WHERE name = 'Gautam Buddha Nagar (Noida)' AND state_id = v_state_up;
    SELECT id INTO v_dist_agra FROM districts WHERE name = 'Agra' AND state_id = v_state_up;
    SELECT id INTO v_dist_mathura FROM districts WHERE name = 'Mathura' AND state_id = v_state_up;
    SELECT id INTO v_dist_hyderabad FROM districts WHERE name = 'Hyderabad' AND state_id = v_state_ts;
    SELECT id INTO v_dist_gurugram FROM districts WHERE name = 'Gurugram' AND state_id = v_state_hr;
    SELECT id INTO v_dist_jaipur FROM districts WHERE name = 'Jaipur' AND state_id = v_state_rj;
    SELECT id INTO v_dist_chennai FROM districts WHERE name = 'Chennai' AND state_id = v_state_tn;
    SELECT id INTO v_dist_kanchipuram FROM districts WHERE name = 'Kanchipuram' AND state_id = v_state_tn;
    SELECT id INTO v_dist_ahmedabad FROM districts WHERE name = 'Ahmedabad' AND state_id = v_state_gj;

    -- Fetch Road Types
    SELECT id INTO v_rt_exp FROM road_types WHERE code = 'EXP';
    SELECT id INTO v_rt_nh FROM road_types WHERE code = 'NH';
    SELECT id INTO v_rt_sh FROM road_types WHERE code = 'SH';
    SELECT id INTO v_rt_city FROM road_types WHERE code = 'CITY';

    -- Fetch Accident Types
    SELECT id INTO v_at_headon FROM accident_types WHERE name = 'Head-on Collision';
    SELECT id INTO v_at_rearend FROM accident_types WHERE name = 'Rear-end Collision';
    SELECT id INTO v_at_side FROM accident_types WHERE name = 'Side Impact / T-Bone';
    SELECT id INTO v_at_pedestrian FROM accident_types WHERE name = 'Hit and Run / Pedestrian';
    SELECT id INTO v_at_rollover FROM accident_types WHERE name = 'Rollover / Overturning';
    SELECT id INTO v_at_twowheeler FROM accident_types WHERE name = 'Motorcycle / Two-Wheeler Crash';
    SELECT id INTO v_at_pileup FROM accident_types WHERE name = 'Multi-Vehicle Pileup';

    -- Fetch Causes
    SELECT id INTO v_ac_overspeed FROM accident_causes WHERE name = 'Overspeeding';
    SELECT id INTO v_ac_drunk FROM accident_causes WHERE name = 'Drunk Driving / Intoxication';
    SELECT id INTO v_ac_wrongside FROM accident_causes WHERE name = 'Wrong-side Driving';
    SELECT id INTO v_ac_fatigue FROM accident_causes WHERE name = 'Driver Fatigue / Falling Asleep';
    SELECT id INTO v_ac_distracted FROM accident_causes WHERE name = 'Distracted Driving (Mobile Phone)';
    SELECT id INTO v_ac_potholes FROM accident_causes WHERE name = 'Poor Road Surface / Potholes';
    SELECT id INTO v_ac_tyreburst FROM accident_causes WHERE name = 'Mechanical Failure / Tyre Burst';
    SELECT id INTO v_ac_fog FROM accident_causes WHERE name = 'Dense Fog / Poor Visibility';

    -- Fetch Weather
    SELECT id INTO v_wc_clear FROM weather_conditions WHERE name = 'Clear';
    SELECT id INTO v_wc_rain FROM weather_conditions WHERE name = 'Rain / Heavy Downpour';
    SELECT id INTO v_wc_fog FROM weather_conditions WHERE name = 'Dense Fog';

    -- ------------------------------------------------------------------------
    -- INSERT LOCATIONS (Major Known Indian Highway Points & Urban Corridors)
    -- ------------------------------------------------------------------------

    -- 1. Yamuna Expressway - Mathura Mile 88 (High Risk Zone)
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_up, v_dist_mathura, 'Mathura', 'Milestone 88', 'Yamuna Expressway', 'YE-01', v_rt_exp, 27.605688, 77.625482)
    RETURNING id INTO v_loc_yamuna_mathura;

    -- 2. Yamuna Expressway - Agra Toll Plaza
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_up, v_dist_agra, 'Agra', 'Agra Entry Interchange', 'Yamuna Expressway', 'YE-01', v_rt_exp, 27.228945, 78.077651)
    RETURNING id INTO v_loc_yamuna_agra;

    -- 3. Mumbai-Pune Expressway - Bhor Ghat / Khandala
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_mh, v_dist_pune, 'Lonavala', 'Khandala Ghat Section', 'Yashwantrao Chavan Expressway', 'EXP-MH', v_rt_exp, 18.761234, 73.376511)
    RETURNING id INTO v_loc_mumbai_pune_khandala;

    -- 4. Mumbai-Pune Expressway - Panvel Junction
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_mh, v_dist_raigad, 'Panvel', 'Kalamboli Expressway Starting Point', 'Yashwantrao Chavan Expressway', 'EXP-MH', v_rt_exp, 19.015243, 73.109821)
    RETURNING id INTO v_loc_mumbai_pune_panvel;

    -- 5. NH-44 - Bengaluru to Hosur Border / Electronic City
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_ka, v_dist_bengaluru_urban, 'Bengaluru', 'Bommasandra / Electronic City Elevated Exit', 'Hosur Road', 'NH-44', v_rt_nh, 12.825633, 77.683419)
    RETURNING id INTO v_loc_nh44_bangalore_hosur;

    -- 6. NH-44 - Hyderabad Shamshabad Airport Highway Corridor
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_ts, v_dist_hyderabad, 'Hyderabad', 'Shamshabad Junction', 'Bengaluru Highway', 'NH-44', v_rt_nh, 17.251432, 78.432619)
    RETURNING id INTO v_loc_nh44_hyderabad_shamshabad;

    -- 7. NH-48 - Gurugram Kherki Daula
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_hr, v_dist_gurugram, 'Gurugram', 'Kherki Daula Flyover Ramp', 'Delhi-Jaipur Highway', 'NH-48', v_rt_nh, 28.398621, 76.984511)
    RETURNING id INTO v_loc_nh48_gurugram_kherki;

    -- 8. NH-48 - Jaipur Bypass
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_rj, v_dist_jaipur, 'Jaipur', 'Chandwaji Intersection', 'Delhi-Jaipur Highway', 'NH-48', v_rt_nh, 27.205412, 75.932145)
    RETURNING id INTO v_loc_nh48_jaipur_bypass;

    -- 9. Delhi - Mukarba Chowk (Outer Ring Road Intersection)
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_dl, v_dist_delhi_north, 'Delhi', 'Mukarba Chowk Flyover Underpass', 'Outer Ring Road / GT Karnal Road', 'NH-44', v_rt_city, 28.736521, 77.162415)
    RETURNING id INTO v_loc_delhi_mukarba;

    -- 10. Delhi - AIIMS Ring Road Junction
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_dl, v_dist_delhi_south, 'Delhi', 'AIIMS Ring Road Flyover Descend', 'Mahatma Gandhi Ring Road', 'ORR-DL', v_rt_city, 28.567812, 77.210432)
    RETURNING id INTO v_loc_delhi_aiims;

    -- 11. Chennai - Old Mahabalipuram Road (IT Corridor)
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_tn, v_dist_chennai, 'Chennai', 'Sholinganallur Junction', 'Old Mahabalipuram Road', 'SH-49A', v_rt_sh, 12.901243, 80.228741)
    RETURNING id INTO v_loc_chennai_omr;

    -- 12. Ahmedabad - SG Highway
    INSERT INTO locations (id, state_id, district_id, city, locality, road_name, road_number, road_type_id, latitude, longitude)
    VALUES (gen_random_uuid(), v_state_gj, v_dist_ahmedabad, 'Ahmedabad', 'Iskcon Cross Road', 'Sarkhej-Gandhinagar Highway', 'SH-133', v_rt_sh, 23.028912, 72.506721)
    RETURNING id INTO v_loc_ahmedabad_sg;

    -- ------------------------------------------------------------------------
    -- INSERT ACCIDENTS (Fact Records with Empirical Characteristics)
    -- All records tagged 'DEMO DATA — NOT REAL' for academic demonstration.
    -- ------------------------------------------------------------------------

    -- Yamuna Expressway Milestone 88 (High Fatality Cluster)
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_yamuna_mathura, '2026-01-14', '04:30:00', v_at_pileup, 'Fatal', 4, 12, 3, 5, 'Truck / Heavy Freight / Lorry', v_wc_fog, 'Wet / Frost', v_ac_fog, 'DEMO DATA — Multi-vehicle pileup during dense morning winter fog on expressway corridor.', 'MoRTH - Road Accidents in India Report', 'https://morth.nic.in', 'Verified'),
    (v_loc_yamuna_mathura, '2026-03-22', '14:15:00', v_at_rollover, 'Fatal', 2, 4, 1, 1, 'Car / Taxi / SUV', v_wc_clear, 'Dry / Concrete', v_ac_tyreburst, 'DEMO DATA — High-speed SUV tyre blowout on concrete pavement resulting in vehicle overturn.', 'MoRTH - Road Accidents in India Report', 'https://morth.nic.in', 'Verified'),
    (v_loc_yamuna_mathura, '2026-05-18', '23:45:00', v_at_rearend, 'Severe', 0, 5, 2, 2, 'Car / Taxi / SUV', v_wc_clear, 'Dry', v_ac_overspeed, 'DEMO DATA — Fast sedan rammed rear of stationary cargo truck without tail warning lamps.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified'),
    (v_loc_yamuna_mathura, '2026-07-08', '02:30:00', v_at_rearend, 'Fatal', 3, 6, 2, 2, 'Bus (State / Private)', v_wc_rain, 'Slippery', v_ac_fatigue, 'DEMO DATA — Sleeper bus rear-ended container vehicle due to driver micro-sleep.', 'MoRTH - Road Accidents in India Report', 'https://morth.nic.in', 'Verified');

    -- Mumbai-Pune Expressway Khandala (Hazardous Ghat Gradient)
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_mumbai_pune_khandala, '2026-02-11', '16:40:00', v_at_rollover, 'Fatal', 3, 7, 2, 2, 'Truck / Heavy Freight / Lorry', v_wc_clear, 'Steep Gradient', v_ac_tyreburst, 'DEMO DATA — Tanker brake failure on descending grade leading to rollover against median guardrail.', 'MoRTH - Black Spots on National Highways', 'https://morth.nic.in', 'Verified'),
    (v_loc_mumbai_pune_khandala, '2026-04-03', '19:20:00', v_at_pileup, 'Severe', 0, 9, 3, 4, 'Car / Taxi / SUV', v_wc_clear, 'Dry', v_ac_overspeed, 'DEMO DATA — High-speed collision at blind curve resulting in multi-car pileup.', 'MoRTH - Black Spots on National Highways', 'https://morth.nic.in', 'Verified'),
    (v_loc_mumbai_pune_khandala, '2026-06-25', '11:15:00', v_at_rearend, 'Fatal', 2, 3, 1, 2, 'Truck / Heavy Freight / Lorry', v_wc_rain, 'Wet / Monsoon', v_ac_overspeed, 'DEMO DATA — Heavy monsoon downpour caused aquaplaning of commercial vehicle.', 'NCRB - Accidental Deaths & Suicides in India (ADSI)', 'https://ncrb.gov.in', 'Verified'),
    (v_loc_mumbai_pune_khandala, '2026-08-14', '22:10:00', v_at_side, 'Moderate', 0, 4, 0, 2, 'Car / Taxi / SUV', v_wc_rain, 'Wet', v_ac_wrongside, 'DEMO DATA — Illegal lane change on hairpin descent section.', 'MoRTH - Black Spots on National Highways', 'https://morth.nic.in', 'Verified');

    -- Bengaluru Electronic City Flyover / Hosur Road NH-44
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_nh44_bangalore_hosur, '2026-01-28', '23:30:00', v_at_twowheeler, 'Fatal', 2, 1, 0, 2, 'Two-Wheeler (Motorcycle/Scooter)', v_wc_clear, 'Smooth Asphalt', v_ac_drunk, 'DEMO DATA — Midnight motorcycle collision against concrete median barrier.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified'),
    (v_loc_nh44_bangalore_hosur, '2026-03-12', '08:45:00', v_at_rearend, 'Moderate', 0, 3, 0, 3, 'Car / Taxi / SUV', v_wc_clear, 'Dry', v_ac_distracted, 'DEMO DATA — Sudden braking at toll approach caused minor 3-vehicle shunts.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified'),
    (v_loc_nh44_bangalore_hosur, '2026-05-30', '18:15:00', v_at_pedestrian, 'Fatal', 1, 2, 1, 1, 'Truck / Heavy Freight / Lorry', v_wc_clear, 'Dry', v_ac_overspeed, 'DEMO DATA — Pedestrian struck while attempting unauthorized expressway crossing under overpass.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified');

    -- Delhi Mukarba Chowk (Urban Ring Corridor)
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_delhi_mukarba, '2026-01-05', '06:10:00', v_at_rearend, 'Fatal', 2, 8, 3, 3, 'Bus (State / Private)', v_wc_fog, 'Chilly Foggy', v_ac_fog, 'DEMO DATA — Commuter bus rear impact into commercial lorry near Mukarba flyover ramp.', 'MoRTH - Road Accidents in India Report', 'https://morth.nic.in', 'Verified'),
    (v_loc_delhi_mukarba, '2026-04-19', '14:00:00', v_at_side, 'Moderate', 0, 3, 0, 2, 'Auto Rickshaw / E-Rickshaw', v_wc_clear, 'Dry', v_ac_wrongside, 'DEMO DATA — Auto rickshaw wrong-way ramp entry colliding with city bus.', 'MoRTH - Black Spots on National Highways', 'https://morth.nic.in', 'Verified'),
    (v_loc_delhi_mukarba, '2026-07-22', '21:40:00', v_at_twowheeler, 'Fatal', 1, 1, 0, 2, 'Two-Wheeler (Motorcycle/Scooter)', v_wc_rain, 'Potholes / Waterlogged', v_ac_potholes, 'DEMO DATA — Two-wheeler skidded over submerged pothole during monsoon storm.', 'NCRB - Accidental Deaths & Suicides in India (ADSI)', 'https://ncrb.gov.in', 'Verified');

    -- Gurugram Kherki Daula NH-48
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_nh48_gurugram_kherki, '2026-02-19', '01:50:00', v_at_rollover, 'Fatal', 2, 3, 1, 1, 'Car / Taxi / SUV', v_wc_clear, 'Dry', v_ac_overspeed, 'DEMO DATA — Speeding luxury vehicle lost traction on curve past toll plaza.', 'NCRB - Accidental Deaths & Suicides in India (ADSI)', 'https://ncrb.gov.in', 'Verified'),
    (v_loc_nh48_gurugram_kherki, '2026-06-11', '07:30:00', v_at_side, 'Moderate', 0, 4, 1, 2, 'Truck / Heavy Freight / Lorry', v_wc_clear, 'Dry', v_ac_distracted, 'DEMO DATA — Merging truck clipped passenger cab changing lanes without signal.', 'MoRTH - Black Spots on National Highways', 'https://morth.nic.in', 'Verified');

    -- Hyderabad Shamshabad NH-44
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_nh44_hyderabad_shamshabad, '2026-03-05', '03:15:00', v_at_rearend, 'Fatal', 3, 5, 2, 2, 'Truck / Heavy Freight / Lorry', v_wc_clear, 'Dry 6-Lane', v_ac_fatigue, 'DEMO DATA — Inter-state transport van collided with stationary dumper truck on shoulder.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified'),
    (v_loc_nh44_hyderabad_shamshabad, '2026-06-30', '17:45:00', v_at_twowheeler, 'Severe', 0, 2, 2, 2, 'Two-Wheeler (Motorcycle/Scooter)', v_wc_clear, 'Dry', v_ac_overspeed, 'DEMO DATA — Two-wheeler collision at service road merger point.', 'data.gov.in - Open Government Data (OGD)', 'https://data.gov.in', 'Verified');

    -- Chennai OMR Sholinganallur
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_chennai_omr, '2026-04-15', '22:15:00', v_at_twowheeler, 'Fatal', 1, 1, 0, 2, 'Two-Wheeler (Motorcycle/Scooter)', v_wc_clear, 'Urban Divided', v_ac_overspeed, 'DEMO DATA — Night speeding motorcycle collided with median divider.', 'NCRB - Accidental Deaths & Suicides in India (ADSI)', 'https://ncrb.gov.in', 'Verified');

    -- Ahmedabad SG Highway Iskcon
    INSERT INTO accidents (location_id, accident_date, accident_time, accident_type_id, severity, deaths, injured, critical_injuries, vehicles_involved, responsible_vehicle, weather_condition_id, road_condition, cause_id, description, source_name, source_url, verification_status)
    VALUES 
    (v_loc_ahmedabad_sg, '2026-05-12', '01:10:00', v_at_headon, 'Fatal', 2, 4, 1, 2, 'Car / Taxi / SUV', v_wc_clear, 'Wide Arterial', v_ac_drunk, 'DEMO DATA — High speed collision at intersection during late night hours.', 'NCRB - Accidental Deaths & Suicides in India (ADSI)', 'https://ncrb.gov.in', 'Verified');

END $$;
