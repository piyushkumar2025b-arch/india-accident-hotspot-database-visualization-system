-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Core Schema DDL
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for idempotency (if rebuilding)
DROP TABLE IF EXISTS accidents CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS states CASCADE;
DROP TABLE IF EXISTS road_types CASCADE;
DROP TABLE IF EXISTS accident_types CASCADE;
DROP TABLE IF EXISTS accident_causes CASCADE;
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Application User Roles & Metadata)
-- References auth.users from Supabase Auth
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Stores user authorization roles linked with Supabase Auth.';
COMMENT ON COLUMN profiles.role IS 'Security role: admin (read/write/manage) or viewer (public read-only).';

-- ----------------------------------------------------------------------------
-- 2. STATES (Master Reference Table for Indian States & Union Territories)
-- ----------------------------------------------------------------------------
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    state_code VARCHAR(10) NOT NULL UNIQUE,
    latitude NUMERIC(9, 6) CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude NUMERIC(9, 6) CHECK (longitude BETWEEN -180.0 AND 180.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE states IS 'Master list of 28 Indian States and 8 Union Territories with official codes.';

-- ----------------------------------------------------------------------------
-- 3. DISTRICTS (Administrative Subdivisions)
-- ----------------------------------------------------------------------------
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_per_state UNIQUE (state_id, name)
);

COMMENT ON TABLE districts IS 'Districts partitioned by their parent state foreign key.';

-- ----------------------------------------------------------------------------
-- 4. ROAD_TYPES (Highway, Expressway, City Road, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE road_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE road_types IS 'Standard classifications: National Highway, State Highway, Expressway, etc.';

-- ----------------------------------------------------------------------------
-- 5. ACCIDENT_TYPES (Collision Type Taxonomy)
-- ----------------------------------------------------------------------------
CREATE TABLE accident_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accident_types IS 'Taxonomy of incident: Head-on collision, Pedestrian, Rollover, etc.';

-- ----------------------------------------------------------------------------
-- 6. ACCIDENT_CAUSES (Causality Factor Taxonomy)
-- ----------------------------------------------------------------------------
CREATE TABLE accident_causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'General',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accident_causes IS 'Official causality categorizations: Overspeeding, Drunk Driving, Poor Road, etc.';

-- ----------------------------------------------------------------------------
-- 7. WEATHER_CONDITIONS (Atmospheric Factors)
-- ----------------------------------------------------------------------------
CREATE TABLE weather_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE weather_conditions IS 'Weather at time of incident: Clear, Rain, Fog, Storm, Haze, etc.';

-- ----------------------------------------------------------------------------
-- 8. LOCATIONS (Geographic Point of Interest & Road Hierarchy)
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE locations IS 'Normalized physical points and corridor stretches where accidents occur.';

-- ----------------------------------------------------------------------------
-- 9. ACCIDENTS (Fact Table: Detailed Incident Records)
-- ----------------------------------------------------------------------------
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

COMMENT ON TABLE accidents IS 'Core transactional facts capturing casualties, causes, and verification metadata.';
