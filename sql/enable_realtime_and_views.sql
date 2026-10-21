-- ============================================================================
-- INDIA ACCIDENT HOTSPOT GIS - SUPABASE REALTIME & ANALYTICS ACTIVATION SCRIPT
-- Run this script in your Supabase Project -> SQL Editor -> Click 'Run'
-- ============================================================================

-- 1. ENABLE REALTIME PUBLICATION FOR ACCIDENTS & LOCATIONS
-- Allows the web application to receive live database changes instantly via WebSockets
DO $$
BEGIN
    -- Enable publication for accidents table if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'accidents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE accidents;
    END IF;

    -- Enable publication for locations table if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE locations;
    END IF;
END $$;

-- 2. SET REPLICA IDENTITY FULL
-- Guarantees that Supabase Realtime payloads contain full previous and updated record attributes
ALTER TABLE accidents REPLICA IDENTITY FULL;
ALTER TABLE locations REPLICA IDENTITY FULL;

-- 3. ENABLE ROW LEVEL SECURITY (RLS) POLICIES FOR SECURE VISUALIZATION
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;

-- Idempotent read & write policies for public anon key
DROP POLICY IF EXISTS "Public Read States" ON states;
CREATE POLICY "Public Read States" ON states FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Districts" ON districts;
CREATE POLICY "Public Read Districts" ON districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Road Types" ON road_types;
CREATE POLICY "Public Read Road Types" ON road_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Accident Types" ON accident_types;
CREATE POLICY "Public Read Accident Types" ON accident_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Accident Causes" ON accident_causes;
CREATE POLICY "Public Read Accident Causes" ON accident_causes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Locations" ON locations;
CREATE POLICY "Public Read Locations" ON locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Locations" ON locations;
CREATE POLICY "Public Insert Locations" ON locations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Locations" ON locations;
CREATE POLICY "Public Update Locations" ON locations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Accidents" ON accidents;
CREATE POLICY "Public Read Accidents" ON accidents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Accidents" ON accidents;
CREATE POLICY "Public Insert Accidents" ON accidents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Accidents" ON accidents;
CREATE POLICY "Public Update Accidents" ON accidents FOR UPDATE USING (true);

-- 4. SMART AUTO-FILL TRIGGER FOR ACCIDENTS (Auto-derives month, year, type, cause)
CREATE OR REPLACE FUNCTION trg_set_accident_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accident_date IS NOT NULL THEN
        IF NEW.month IS NULL THEN
            NEW.month := EXTRACT(MONTH FROM NEW.accident_date)::SMALLINT;
        END IF;
        IF NEW.year IS NULL THEN
            NEW.year := EXTRACT(YEAR FROM NEW.accident_date)::SMALLINT;
        END IF;
    ELSE
        IF NEW.month IS NULL THEN
            NEW.month := EXTRACT(MONTH FROM CURRENT_DATE)::SMALLINT;
        END IF;
        IF NEW.year IS NULL THEN
            NEW.year := EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT;
        END IF;
        IF NEW.accident_date IS NULL THEN
            NEW.accident_date := CURRENT_DATE;
        END IF;
    END IF;

    IF NEW.accident_type_id IS NULL THEN
        SELECT id INTO NEW.accident_type_id FROM accident_types LIMIT 1;
    END IF;
    IF NEW.cause_id IS NULL THEN
        SELECT id INTO NEW.cause_id FROM accident_causes LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accidents_auto_defaults ON accidents;
CREATE TRIGGER trg_accidents_auto_defaults
BEFORE INSERT ON accidents
FOR EACH ROW
EXECUTE FUNCTION trg_set_accident_defaults();

-- 5. CREATE MoRTH HOTSPOT SCORING FUNCTION
CREATE OR REPLACE FUNCTION calculate_hotspot_score(
    p_fatal_count INTEGER,
    p_severe_count INTEGER,
    p_minor_count INTEGER
) RETURNS NUMERIC AS $$
DECLARE
    v_raw_score NUMERIC;
    v_normalized NUMERIC;
BEGIN
    v_raw_score := (COALESCE(p_fatal_count, 0) * 5.0) +
                   (COALESCE(p_severe_count, 0) * 3.0) +
                   (COALESCE(p_minor_count, 0) * 1.0);
    -- Normalize against standard benchmark ceiling of 50 weighted points
    v_normalized := LEAST(100.0, ROUND((v_raw_score / 50.0) * 100.0, 2));
    RETURN v_normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. CREATE MASTER HOTSPOT STATISTICS VIEW
CREATE OR REPLACE VIEW hotspot_statistics AS
SELECT 
    l.id AS location_id,
    l.road_name,
    l.road_number,
    l.city,
    l.locality,
    l.latitude,
    l.longitude,
    s.id AS state_id,
    s.name AS state_name,
    s.state_code,
    d.id AS district_id,
    d.name AS district_name,
    rt.name AS road_type,
    COUNT(a.id)::INTEGER AS total_accidents,
    COALESCE(SUM(a.deaths), 0)::INTEGER AS total_deaths,
    COALESCE(SUM(a.injured), 0)::INTEGER AS total_injuries,
    COALESCE(SUM(a.critical_injuries), 0)::INTEGER AS total_critical_injuries,
    COUNT(CASE WHEN a.severity = 'Fatal' OR a.deaths > 0 THEN 1 END)::INTEGER AS fatal_accidents,
    COUNT(CASE WHEN a.severity = 'Severe' OR (a.deaths = 0 AND a.critical_injuries > 0) THEN 1 END)::INTEGER AS severe_accidents,
    COUNT(CASE WHEN a.severity = 'Minor' THEN 1 END)::INTEGER AS minor_accidents,
    calculate_hotspot_score(
        COUNT(CASE WHEN a.severity = 'Fatal' OR a.deaths > 0 THEN 1 END)::INTEGER,
        COUNT(CASE WHEN a.severity = 'Severe' OR (a.deaths = 0 AND a.critical_injuries > 0) THEN 1 END)::INTEGER,
        COUNT(CASE WHEN a.severity = 'Minor' THEN 1 END)::INTEGER
    ) AS hotspot_score,
    CASE 
        WHEN calculate_hotspot_score(
            COUNT(CASE WHEN a.severity = 'Fatal' OR a.deaths > 0 THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Severe' OR (a.deaths = 0 AND a.critical_injuries > 0) THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Minor' THEN 1 END)::INTEGER
        ) >= 75.0 THEN 'Critical'
        WHEN calculate_hotspot_score(
            COUNT(CASE WHEN a.severity = 'Fatal' OR a.deaths > 0 THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Severe' OR (a.deaths = 0 AND a.critical_injuries > 0) THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Minor' THEN 1 END)::INTEGER
        ) >= 50.0 THEN 'High'
        WHEN calculate_hotspot_score(
            COUNT(CASE WHEN a.severity = 'Fatal' OR a.deaths > 0 THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Severe' OR (a.deaths = 0 AND a.critical_injuries > 0) THEN 1 END)::INTEGER,
            COUNT(CASE WHEN a.severity = 'Minor' THEN 1 END)::INTEGER
        ) >= 25.0 THEN 'Moderate'
        ELSE 'Low'
    END AS hotspot_tier,
    MAX(a.accident_date) AS last_accident_date,
    COALESCE(MAX(a.source_name), 'MoRTH National GIS Database') AS primary_source
FROM locations l
JOIN states s ON l.state_id = s.id
JOIN districts d ON l.district_id = d.id
JOIN road_types rt ON l.road_type_id = rt.id
LEFT JOIN accidents a ON l.id = a.location_id
GROUP BY l.id, l.road_name, l.road_number, l.city, l.locality, l.latitude, l.longitude,
         s.id, s.name, s.state_code, d.id, d.name, rt.name;

-- 6. MONTHLY AND REGIONAL STATISTICAL VIEWS
CREATE OR REPLACE VIEW monthly_accident_trends AS
SELECT 
    year,
    month,
    COUNT(id) AS total_accidents,
    SUM(deaths) AS total_fatalities,
    SUM(injured) AS total_injuries
FROM accidents
GROUP BY year, month
ORDER BY year DESC, month DESC;

-- 7. SUPABASE-SIDE RPC FILTERING STORED PROCEDURE
-- Demonstrates server-side filtering pushed directly into PostgreSQL
CREATE OR REPLACE FUNCTION filter_hotspots_rpc(
    p_state_id UUID DEFAULT NULL,
    p_district_id UUID DEFAULT NULL,
    p_tier VARCHAR DEFAULT NULL,
    p_road_type VARCHAR DEFAULT NULL,
    p_min_deaths INTEGER DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    location_id UUID,
    road_name VARCHAR,
    road_number VARCHAR,
    city VARCHAR,
    locality VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    state_id UUID,
    state_name VARCHAR,
    state_code VARCHAR,
    district_id UUID,
    district_name VARCHAR,
    road_type VARCHAR,
    total_accidents INTEGER,
    total_deaths INTEGER,
    total_injuries INTEGER,
    total_critical_injuries INTEGER,
    fatal_accidents INTEGER,
    severe_accidents INTEGER,
    minor_accidents INTEGER,
    hotspot_score NUMERIC,
    hotspot_tier VARCHAR,
    last_accident_date DATE,
    primary_source VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT hs.*
    FROM hotspot_statistics hs
    WHERE (p_state_id IS NULL OR hs.state_id = p_state_id)
      AND (p_district_id IS NULL OR hs.district_id = p_district_id)
      AND (p_tier IS NULL OR p_tier = '' OR hs.hotspot_tier = p_tier)
      AND (p_road_type IS NULL OR p_road_type = '' OR hs.road_type ILIKE '%' || p_road_type || '%')
      AND (p_min_deaths IS NULL OR hs.total_deaths >= p_min_deaths)
      AND (p_search IS NULL OR p_search = '' OR 
           hs.road_name ILIKE '%' || p_search || '%' OR
           hs.city ILIKE '%' || p_search || '%' OR
           hs.locality ILIKE '%' || p_search || '%' OR
           hs.road_number ILIKE '%' || p_search || '%')
    ORDER BY hs.hotspot_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verification Check Output
SELECT 
    'Supabase Realtime, Views & RPC Filter Function Active!' AS status,
    (SELECT COUNT(*) FROM locations) AS total_locations,
    (SELECT COUNT(*) FROM accidents) AS total_accidents;
