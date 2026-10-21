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
