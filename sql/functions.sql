-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Stored Procedures, Functions & Automated Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER FUNCTION: Auto-Derive Month and Year from Accident Date
-- Ensures temporal integrity without relying on untrusted client inputs.
-- ----------------------------------------------------------------------------
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

COMMENT ON FUNCTION derive_accident_month_year IS 'Enforces server-side derivation of month and year from accident_date.';

-- ----------------------------------------------------------------------------
-- 2. TRIGGER FUNCTION: Maintain `updated_at` Timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_timestamp_accidents ON accidents;
CREATE TRIGGER trg_update_timestamp_accidents
    BEFORE UPDATE ON accidents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_timestamp_locations ON locations;
CREATE TRIGGER trg_update_timestamp_locations
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_timestamp_profiles ON profiles;
CREATE TRIGGER trg_update_timestamp_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- 3. FUNCTION: Calculate Accident Hotspot Score
-- Transparent, documented empirical weighting algorithm:
-- Formula:
--   Score = min(100, round(
--     (Total_Accidents * 2.5) +
--     (Fatal_Accidents * 6.0) +
--     (Total_Deaths * 7.0) +
--     (Total_Injuries * 2.0) +
--     (Recency_Bonus * 3.0)
--   ))
-- Where Recency_Bonus = 5 if last accident within 180 days, 3 within 365 days, else 1.
-- ----------------------------------------------------------------------------
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

COMMENT ON FUNCTION calculate_hotspot_score IS 'Empirical multi-factor weighted safety rating normalized from 0 to 100.';

-- ----------------------------------------------------------------------------
-- 4. FUNCTION: Check Potential Duplicate Records
-- Flags potential duplicates based on temporal and geographical proximity
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_potential_duplicate(
    p_accident_date DATE,
    p_location_id UUID,
    p_road_name TEXT DEFAULT NULL,
    p_accident_type_id UUID DEFAULT NULL
)
RETURNS TABLE (
    duplicate_id UUID,
    accident_date DATE,
    road_name VARCHAR,
    severity VARCHAR,
    deaths INTEGER,
    injured INTEGER,
    confidence_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS duplicate_id,
        a.accident_date,
        l.road_name,
        a.severity,
        a.deaths,
        a.injured,
        CASE 
            WHEN a.location_id = p_location_id AND a.accident_date = p_accident_date AND a.accident_type_id = p_accident_type_id THEN 'HIGH'
            WHEN a.location_id = p_location_id AND a.accident_date = p_accident_date THEN 'MEDIUM'
            WHEN a.accident_date = p_accident_date AND LOWER(l.road_name) = LOWER(p_road_name) THEN 'MEDIUM'
            ELSE 'LOW'
        END AS confidence_level
    FROM accidents a
    JOIN locations l ON a.location_id = l.id
    WHERE a.accident_date = p_accident_date
      AND (
          a.location_id = p_location_id
          OR (p_road_name IS NOT NULL AND LOWER(l.road_name) = LOWER(p_road_name))
      )
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_potential_duplicate IS 'Identifies suspected duplicate collisions across shared date and spatial corridors.';

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: Get Aggregate Hotspot Summary
-- Fast single-query payload for public and admin header KPIs
-- ----------------------------------------------------------------------------
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

COMMENT ON FUNCTION get_hotspot_summary IS 'Generates high-performance JSON aggregation payload for KPI telemetry.';

-- ----------------------------------------------------------------------------
-- 6. TRIGGER FUNCTION: Auth Signup Profile Creation
-- Automatically initializes user record in profiles table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        -- Default to admin if first user or admin email pattern, else viewer
        CASE 
            WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            ELSE 'viewer'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Automatically provisions user profiles when a new user registers via Supabase Auth.';
