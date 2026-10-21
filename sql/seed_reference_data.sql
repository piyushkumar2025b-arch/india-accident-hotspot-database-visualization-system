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
