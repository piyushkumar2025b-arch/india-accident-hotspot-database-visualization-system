-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: High-Performance Database Indexes & Optimization
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FOREIGN KEY & RELATIONSHIP PERFORMANCE INDEXES
-- PostgreSQL does not automatically create indexes on foreign key columns.
-- These indexes prevent sequential scans during relational JOIN operations.
-- ----------------------------------------------------------------------------

-- Location references
CREATE INDEX IF NOT EXISTS idx_accidents_location_id 
ON accidents(location_id);
COMMENT ON INDEX idx_accidents_location_id IS 'Accelerates JOINs between accidents and locations, essential for spatial hotspot grouping.';

-- State & District hierarchy
CREATE INDEX IF NOT EXISTS idx_locations_state_id 
ON locations(state_id);
COMMENT ON INDEX idx_locations_state_id IS 'Optimizes state-level spatial filtering and aggregation.';

CREATE INDEX IF NOT EXISTS idx_locations_district_id 
ON locations(district_id);
COMMENT ON INDEX idx_locations_district_id IS 'Speeds up district-level lookups and cascading administrative filters.';

CREATE INDEX IF NOT EXISTS idx_districts_state_id 
ON districts(state_id);
COMMENT ON INDEX idx_districts_state_id IS 'Accelerates cascading district dropdown population when a state is selected.';

-- Taxonomy classifications
CREATE INDEX IF NOT EXISTS idx_accidents_accident_type_id 
ON accidents(accident_type_id);

CREATE INDEX IF NOT EXISTS idx_accidents_cause_id 
ON accidents(cause_id);

CREATE INDEX IF NOT EXISTS idx_accidents_weather_condition_id 
ON accidents(weather_condition_id);

CREATE INDEX IF NOT EXISTS idx_locations_road_type_id 
ON locations(road_type_id);

-- ----------------------------------------------------------------------------
-- 2. TEMPORAL & RANGE INDEXES
-- Speeds up date slicing, time-series analysis, and annual safety audits.
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_accidents_accident_date 
ON accidents(accident_date DESC);
COMMENT ON INDEX idx_accidents_accident_date IS 'Supports fast ORDER BY accident_date DESC and BETWEEN date queries.';

-- Composite index for derived temporal grouping
CREATE INDEX IF NOT EXISTS idx_accidents_year_month 
ON accidents(year, month);
COMMENT ON INDEX idx_accidents_year_month IS 'Optimizes multi-column GROUP BY year, month for seasonal trend analytics.';

-- ----------------------------------------------------------------------------
-- 3. ATTRIBUTE FILTERING & SEVERITY INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_accidents_severity 
ON accidents(severity);
COMMENT ON INDEX idx_accidents_severity IS 'Enables quick index scans for Fatal and Severe incident filtering.';

CREATE INDEX IF NOT EXISTS idx_accidents_verification_status 
ON accidents(verification_status);
COMMENT ON INDEX idx_accidents_verification_status IS 'Allows public views to instantly filter for Verified entries.';

-- ----------------------------------------------------------------------------
-- 4. GEOSPATIAL & ROAD SEARCH INDEXES
-- Supports fast map viewport queries and text searching
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_locations_coordinates 
ON locations(latitude, longitude);
COMMENT ON INDEX idx_locations_coordinates IS 'Composite index supporting bounding box filtering for Leaflet viewport queries.';

CREATE INDEX IF NOT EXISTS idx_locations_road_number 
ON locations(road_number);
COMMENT ON INDEX idx_locations_road_number IS 'Speeds up highway number lookups (e.g. NH-44, NH-48).';

CREATE INDEX IF NOT EXISTS idx_locations_city 
ON locations(LOWER(city));
COMMENT ON INDEX idx_locations_city IS 'Supports case-insensitive city lookups in search bars.';

-- ----------------------------------------------------------------------------
-- 5. COMPOSITE INDEXES FOR POPULAR DASHBOARD QUERIES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accidents_date_severity 
ON accidents(accident_date DESC, severity);
COMMENT ON INDEX idx_accidents_date_severity IS 'Composite index covering temporal range searches filtered by severity.';
