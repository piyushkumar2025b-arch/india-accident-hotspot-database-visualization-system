-- ============================================================================
-- INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
-- Database: PostgreSQL (Supabase)
-- Component: Row Level Security (RLS) & Role-Based Access Control
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTION: Check if Current Authenticated User is Administrator
-- Uses SECURITY DEFINER to bypass recursion when checking the profiles table.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin IS 'Returns true if current auth.uid() possesses the admin role in profiles table.';

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Users can view their own profile; admins can view all profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR is_admin());

-- Users can update their own non-role fields; admins can update everything
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id OR is_admin());

-- ----------------------------------------------------------------------------
-- 4. REFERENCE TABLES POLICIES (States, Districts, Taxonomies)
-- Read: Public (Anon + Authenticated)
-- Write: Admins only
-- ----------------------------------------------------------------------------

-- STATES
DROP POLICY IF EXISTS "States are viewable by all" ON states;
DROP POLICY IF EXISTS "Admins can insert states" ON states;
DROP POLICY IF EXISTS "Admins can update states" ON states;
DROP POLICY IF EXISTS "Admins can delete states" ON states;

CREATE POLICY "States are viewable by all"
    ON states FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert states"
    ON states FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update states"
    ON states FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete states"
    ON states FOR DELETE
    USING (is_admin());

-- DISTRICTS
DROP POLICY IF EXISTS "Districts are viewable by all" ON districts;
DROP POLICY IF EXISTS "Admins can insert districts" ON districts;
DROP POLICY IF EXISTS "Admins can update districts" ON districts;
DROP POLICY IF EXISTS "Admins can delete districts" ON districts;

CREATE POLICY "Districts are viewable by all"
    ON districts FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert districts"
    ON districts FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update districts"
    ON districts FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete districts"
    ON districts FOR DELETE
    USING (is_admin());

-- ROAD_TYPES
DROP POLICY IF EXISTS "Road types are viewable by all" ON road_types;
DROP POLICY IF EXISTS "Admins can insert road_types" ON road_types;
DROP POLICY IF EXISTS "Admins can update road_types" ON road_types;
DROP POLICY IF EXISTS "Admins can delete road_types" ON road_types;

CREATE POLICY "Road types are viewable by all"
    ON road_types FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert road_types"
    ON road_types FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update road_types"
    ON road_types FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete road_types"
    ON road_types FOR DELETE
    USING (is_admin());

-- ACCIDENT_TYPES
DROP POLICY IF EXISTS "Accident types viewable by all" ON accident_types;
DROP POLICY IF EXISTS "Admins can modify accident_types" ON accident_types;

CREATE POLICY "Accident types viewable by all"
    ON accident_types FOR SELECT
    USING (true);

CREATE POLICY "Admins can modify accident_types"
    ON accident_types FOR ALL
    USING (is_admin());

-- ACCIDENT_CAUSES
DROP POLICY IF EXISTS "Accident causes viewable by all" ON accident_causes;
DROP POLICY IF EXISTS "Admins can modify accident_causes" ON accident_causes;

CREATE POLICY "Accident causes viewable by all"
    ON accident_causes FOR SELECT
    USING (true);

CREATE POLICY "Admins can modify accident_causes"
    ON accident_causes FOR ALL
    USING (is_admin());

-- WEATHER_CONDITIONS
DROP POLICY IF EXISTS "Weather conditions viewable by all" ON weather_conditions;
DROP POLICY IF EXISTS "Admins can modify weather_conditions" ON weather_conditions;

CREATE POLICY "Weather conditions viewable by all"
    ON weather_conditions FOR SELECT
    USING (true);

CREATE POLICY "Admins can modify weather_conditions"
    ON weather_conditions FOR ALL
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5. LOCATIONS POLICIES
-- Read: Public (Anon + Authenticated)
-- Write: Admins only
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Locations are viewable by all" ON locations;
DROP POLICY IF EXISTS "Admins can insert locations" ON locations;
DROP POLICY IF EXISTS "Admins can update locations" ON locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON locations;

CREATE POLICY "Locations are viewable by all"
    ON locations FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert locations"
    ON locations FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update locations"
    ON locations FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete locations"
    ON locations FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 6. ACCIDENTS POLICIES (Fact Table)
-- Read: Public (Anon + Authenticated) can view verified/active accidents
-- Write: Admins only for INSERT, UPDATE, DELETE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Accidents are viewable by all" ON accidents;
DROP POLICY IF EXISTS "Admins can insert accidents" ON accidents;
DROP POLICY IF EXISTS "Admins can update accidents" ON accidents;
DROP POLICY IF EXISTS "Admins can delete accidents" ON accidents;

CREATE POLICY "Accidents are viewable by all"
    ON accidents FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert accidents"
    ON accidents FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update accidents"
    ON accidents FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete accidents"
    ON accidents FOR DELETE
    USING (is_admin());
