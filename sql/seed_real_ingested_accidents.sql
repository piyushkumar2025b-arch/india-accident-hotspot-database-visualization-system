-- ============================================================================
-- SEED REAL INGESTED ACCIDENT INCIDENTS & HOTSPOTS
-- Multi-Source Pan-India Ingestion (NCRB ADSI, TN Police, Bengaluru CAS)
-- Generated on 2026-11-05T06:39:15.579Z
-- ============================================================================
BEGIN;

-- Hotspot: chandigarh - chandigarh Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-chandigarh', 'chandigarh Metropolitan Arterial & Ring Corridor', 'NH-5', 'chandigarh', 'chandigarh High-Density Traffic Transit Zone', 30.7353, 76.7911, 'City Arterial Road / Ring Road', 'state-ch', 'dist-chandigarh')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: delhi - delhi Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-delhi', 'delhi Metropolitan Arterial & Ring Corridor', 'Outer Ring Road', 'delhi', 'delhi High-Density Traffic Transit Zone', 28.66, 77.23, 'City Arterial Road / Ring Road', 'state-dl', 'dist-delhi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: agra - agra Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-agra', 'agra Metropolitan Arterial & Ring Corridor', 'NH-19', 'agra', 'agra High-Density Traffic Transit Zone', 27.18, 78.02, 'City Arterial Road / Ring Road', 'state-up', 'dist-agra')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: ahmedabad - ahmedabad Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-ahmedabad', 'ahmedabad Metropolitan Arterial & Ring Corridor', 'NE-1', 'ahmedabad', 'ahmedabad High-Density Traffic Transit Zone', 23.0225, 72.5714, 'City Arterial Road / Ring Road', 'state-gj', 'dist-ahmedabad')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: amritsar - amritsar Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-amritsar', 'amritsar Metropolitan Arterial & Ring Corridor', 'NH-3', 'amritsar', 'amritsar High-Density Traffic Transit Zone', 31.6167, 74.85, 'City Arterial Road / Ring Road', 'state-pb', 'dist-amritsar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: asansol - asansol Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-asansol', 'asansol Metropolitan Arterial & Ring Corridor', 'NH-19', 'asansol', 'asansol High-Density Traffic Transit Zone', 23.6833, 86.9667, 'City Arterial Road / Ring Road', 'state-wb', 'dist-asansol')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: chhatrapati sambhaji nagar - chhatrapati sambhaji nagar Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-chhatrapati-sambhaji-nagar', 'chhatrapati sambhaji nagar Metropolitan Arterial & Ring Corridor', 'NH-52', 'chhatrapati sambhaji nagar', 'chhatrapati sambhaji nagar High-Density Traffic Transit Zone', 19.88, 75.32, 'City Arterial Road / Ring Road', 'state-mh', 'dist-chhatrapati-sambhaji-nagar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: bengaluru - bengaluru Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-bengaluru', 'bengaluru Metropolitan Arterial & Ring Corridor', 'NH-44', 'bengaluru', 'bengaluru High-Density Traffic Transit Zone', 12.9716, 77.5946, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: bhopal - bhopal Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-bhopal', 'bhopal Metropolitan Arterial & Ring Corridor', 'NH-46', 'bhopal', 'bhopal High-Density Traffic Transit Zone', 23.25, 77.4167, 'City Arterial Road / Ring Road', 'state-mp', 'dist-bhopal')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: chennai - chennai Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-chennai', 'chennai Metropolitan Arterial & Ring Corridor', 'NH-48', 'chennai', 'chennai High-Density Traffic Transit Zone', 13.0825, 80.275, 'City Arterial Road / Ring Road', 'state-tn', 'dist-chennai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: coimbatore - coimbatore Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-coimbatore', 'coimbatore Metropolitan Arterial & Ring Corridor', 'NH-544', 'coimbatore', 'coimbatore High-Density Traffic Transit Zone', 11, 76.9667, 'City Arterial Road / Ring Road', 'state-tn', 'dist-coimbatore')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: dhanbad - dhanbad Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-dhanbad', 'dhanbad Metropolitan Arterial & Ring Corridor', 'NH-19', 'dhanbad', 'dhanbad High-Density Traffic Transit Zone', 23.7928, 86.435, 'City Arterial Road / Ring Road', 'state-jh', 'dist-dhanbad')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: durg bhilainagar - durg bhilainagar Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-durg-bhilainagar', 'durg bhilainagar Metropolitan Arterial & Ring Corridor', 'Ring Road Arterial', 'durg bhilainagar', 'durg bhilainagar High-Density Traffic Transit Zone', 21.2155, 81.3857, 'City Arterial Road / Ring Road', 'state-dl', 'dist-durg-bhilainagar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: faridabad - faridabad Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-faridabad', 'faridabad Metropolitan Arterial & Ring Corridor', 'NH-19', 'faridabad', 'faridabad High-Density Traffic Transit Zone', 28.4333, 77.3167, 'City Arterial Road / Ring Road', 'state-hr', 'dist-faridabad')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: ghaziabad - ghaziabad Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-ghaziabad', 'ghaziabad Metropolitan Arterial & Ring Corridor', 'NH-9', 'ghaziabad', 'ghaziabad High-Density Traffic Transit Zone', 28.6667, 77.4167, 'City Arterial Road / Ring Road', 'state-up', 'dist-ghaziabad')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: gwalior - gwalior Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-gwalior', 'gwalior Metropolitan Arterial & Ring Corridor', 'NH-44', 'gwalior', 'gwalior High-Density Traffic Transit Zone', 26.215, 78.1931, 'City Arterial Road / Ring Road', 'state-mp', 'dist-gwalior')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: hyderabad - hyderabad Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-hyderabad', 'hyderabad Metropolitan Arterial & Ring Corridor', 'ORR-158', 'hyderabad', 'hyderabad High-Density Traffic Transit Zone', 17.3667, 78.4667, 'City Arterial Road / Ring Road', 'state-ts', 'dist-hyderabad')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: indore - indore Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-indore', 'indore Metropolitan Arterial & Ring Corridor', 'NH-52', 'indore', 'indore High-Density Traffic Transit Zone', 22.7206, 75.8472, 'City Arterial Road / Ring Road', 'state-mp', 'dist-indore')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: jabalpur - jabalpur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-jabalpur', 'jabalpur Metropolitan Arterial & Ring Corridor', 'NH-34', 'jabalpur', 'jabalpur High-Density Traffic Transit Zone', 23.1667, 79.9333, 'City Arterial Road / Ring Road', 'state-mp', 'dist-jabalpur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: jaipur - jaipur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-jaipur', 'jaipur Metropolitan Arterial & Ring Corridor', 'NH-48', 'jaipur', 'jaipur High-Density Traffic Transit Zone', 26.9167, 75.8667, 'City Arterial Road / Ring Road', 'state-rj', 'dist-jaipur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: jamshedpur - jamshedpur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-jamshedpur', 'jamshedpur Metropolitan Arterial & Ring Corridor', 'NH-33', 'jamshedpur', 'jamshedpur High-Density Traffic Transit Zone', 22.8, 86.1833, 'City Arterial Road / Ring Road', 'state-jh', 'dist-jamshedpur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: jodhpur - jodhpur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-jodhpur', 'jodhpur Metropolitan Arterial & Ring Corridor', 'NH-62', 'jodhpur', 'jodhpur High-Density Traffic Transit Zone', 26.2918, 73.0168, 'City Arterial Road / Ring Road', 'state-rj', 'dist-jodhpur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kannur - kannur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kannur', 'kannur Metropolitan Arterial & Ring Corridor', 'NH-66', 'kannur', 'kannur High-Density Traffic Transit Zone', 11.8745, 75.3704, 'City Arterial Road / Ring Road', 'state-kl', 'dist-kannur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kanpur - kanpur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kanpur', 'kanpur Metropolitan Arterial & Ring Corridor', 'NH-19', 'kanpur', 'kanpur High-Density Traffic Transit Zone', 26.4499, 80.3319, 'City Arterial Road / Ring Road', 'state-up', 'dist-kanpur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kochi - kochi Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kochi', 'kochi Metropolitan Arterial & Ring Corridor', 'NH-66', 'kochi', 'kochi High-Density Traffic Transit Zone', 9.9667, 76.2833, 'City Arterial Road / Ring Road', 'state-kl', 'dist-kochi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kolkata - kolkata Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kolkata', 'kolkata Metropolitan Arterial & Ring Corridor', 'EM Bypass', 'kolkata', 'kolkata High-Density Traffic Transit Zone', 22.5411, 88.3378, 'City Arterial Road / Ring Road', 'state-wb', 'dist-kolkata')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kollam - kollam Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kollam', 'kollam Metropolitan Arterial & Ring Corridor', 'NH-66', 'kollam', 'kollam High-Density Traffic Transit Zone', 8.8932, 76.6141, 'City Arterial Road / Ring Road', 'state-kl', 'dist-kollam')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kota - kota Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kota', 'kota Metropolitan Arterial & Ring Corridor', 'NH-52', 'kota', 'kota High-Density Traffic Transit Zone', 25.18, 75.83, 'City Arterial Road / Ring Road', 'state-rj', 'dist-kota')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: kozhikode - kozhikode Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-kozhikode', 'kozhikode Metropolitan Arterial & Ring Corridor', 'NH-66', 'kozhikode', 'kozhikode High-Density Traffic Transit Zone', 11.2588, 75.7804, 'City Arterial Road / Ring Road', 'state-kl', 'dist-kozhikode')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: lucknow - lucknow Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-lucknow', 'lucknow Metropolitan Arterial & Ring Corridor', 'Shaheed Path', 'lucknow', 'lucknow High-Density Traffic Transit Zone', 26.847, 80.947, 'City Arterial Road / Ring Road', 'state-up', 'dist-lucknow')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: ludhiana - ludhiana Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-ludhiana', 'ludhiana Metropolitan Arterial & Ring Corridor', 'NH-44', 'ludhiana', 'ludhiana High-Density Traffic Transit Zone', 30.9083, 75.8486, 'City Arterial Road / Ring Road', 'state-pb', 'dist-ludhiana')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: madurai - madurai Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-madurai', 'madurai Metropolitan Arterial & Ring Corridor', 'NH-38', 'madurai', 'madurai High-Density Traffic Transit Zone', 9.9197, 78.1194, 'City Arterial Road / Ring Road', 'state-tn', 'dist-madurai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: malappuram - malappuram Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-malappuram', 'malappuram Metropolitan Arterial & Ring Corridor', 'NH-966', 'malappuram', 'malappuram High-Density Traffic Transit Zone', 11.0503, 76.0711, 'City Arterial Road / Ring Road', 'state-kl', 'dist-malappuram')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: meerut - meerut Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-meerut', 'meerut Metropolitan Arterial & Ring Corridor', 'DME-01', 'meerut', 'meerut High-Density Traffic Transit Zone', 28.99, 77.7, 'City Arterial Road / Ring Road', 'state-up', 'dist-meerut')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: mumbai - mumbai Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-mumbai', 'mumbai Metropolitan Arterial & Ring Corridor', 'WEH-01', 'mumbai', 'mumbai High-Density Traffic Transit Zone', 18.9667, 72.8333, 'City Arterial Road / Ring Road', 'state-mh', 'dist-mumbai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: nagpur - nagpur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-nagpur', 'nagpur Metropolitan Arterial & Ring Corridor', 'NH-44', 'nagpur', 'nagpur High-Density Traffic Transit Zone', 21.1539, 79.0831, 'City Arterial Road / Ring Road', 'state-mh', 'dist-nagpur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: nasik - nasik Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-nasik', 'nasik Metropolitan Arterial & Ring Corridor', 'Ring Road Arterial', 'nasik', 'nasik High-Density Traffic Transit Zone', 19.9975, 73.7898, 'City Arterial Road / Ring Road', 'state-dl', 'dist-nasik')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: patna - patna Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-patna', 'patna Metropolitan Arterial & Ring Corridor', 'NH-31', 'patna', 'patna High-Density Traffic Transit Zone', 25.61, 85.1414, 'City Arterial Road / Ring Road', 'state-br', 'dist-patna')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: prayagraj - prayagraj Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-prayagraj', 'prayagraj Metropolitan Arterial & Ring Corridor', 'Ring Road Arterial', 'prayagraj', 'prayagraj High-Density Traffic Transit Zone', 25.4358, 81.8463, 'City Arterial Road / Ring Road', 'state-dl', 'dist-prayagraj')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: pune - pune Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-pune', 'pune Metropolitan Arterial & Ring Corridor', 'NH-48', 'pune', 'pune High-Density Traffic Transit Zone', 18.5196, 73.8553, 'City Arterial Road / Ring Road', 'state-mh', 'dist-pune')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: raipur - raipur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-raipur', 'raipur Metropolitan Arterial & Ring Corridor', 'NH-53', 'raipur', 'raipur High-Density Traffic Transit Zone', 21.2379, 81.6337, 'City Arterial Road / Ring Road', 'state-cg', 'dist-raipur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: rajkot - rajkot Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-rajkot', 'rajkot Metropolitan Arterial & Ring Corridor', 'NH-27', 'rajkot', 'rajkot High-Density Traffic Transit Zone', 22.2969, 70.7984, 'City Arterial Road / Ring Road', 'state-gj', 'dist-rajkot')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: ranchi - ranchi Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-ranchi', 'ranchi Metropolitan Arterial & Ring Corridor', 'NH-20', 'ranchi', 'ranchi High-Density Traffic Transit Zone', 23.3556, 85.3347, 'City Arterial Road / Ring Road', 'state-jh', 'dist-ranchi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: srinagar - srinagar Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-srinagar', 'srinagar Metropolitan Arterial & Ring Corridor', 'NH-1', 'srinagar', 'srinagar High-Density Traffic Transit Zone', 34.0911, 74.8061, 'City Arterial Road / Ring Road', 'state-jk', 'dist-srinagar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: surat - surat Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-surat', 'surat Metropolitan Arterial & Ring Corridor', 'NH-48', 'surat', 'surat High-Density Traffic Transit Zone', 21.17, 72.83, 'City Arterial Road / Ring Road', 'state-gj', 'dist-surat')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: thiruvananthapuram - thiruvananthapuram Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-thiruvananthapuram', 'thiruvananthapuram Metropolitan Arterial & Ring Corridor', 'NH-66', 'thiruvananthapuram', 'thiruvananthapuram High-Density Traffic Transit Zone', 8.5, 76.8997, 'City Arterial Road / Ring Road', 'state-kl', 'dist-thiruvananthapuram')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: thrissur - thrissur Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-thrissur', 'thrissur Metropolitan Arterial & Ring Corridor', 'NH-544', 'thrissur', 'thrissur High-Density Traffic Transit Zone', 10.5276, 76.2144, 'City Arterial Road / Ring Road', 'state-kl', 'dist-thrissur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: tiruchirappalli - tiruchirappalli Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-tiruchirappalli', 'tiruchirappalli Metropolitan Arterial & Ring Corridor', 'NH-45', 'tiruchirappalli', 'tiruchirappalli High-Density Traffic Transit Zone', 10.7905, 78.7047, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tiruchirappalli')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: vadodara - vadodara Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-vadodara', 'vadodara Metropolitan Arterial & Ring Corridor', 'NH-48', 'vadodara', 'vadodara High-Density Traffic Transit Zone', 22.3, 73.2, 'City Arterial Road / Ring Road', 'state-gj', 'dist-vadodara')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: varanasi - varanasi Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-varanasi', 'varanasi Metropolitan Arterial & Ring Corridor', 'NH-19', 'varanasi', 'varanasi High-Density Traffic Transit Zone', 25.3189, 83.0128, 'City Arterial Road / Ring Road', 'state-up', 'dist-varanasi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: vasai virar - vasai virar Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-vasai-virar', 'vasai virar Metropolitan Arterial & Ring Corridor', 'Ring Road Arterial', 'vasai virar', 'vasai virar High-Density Traffic Transit Zone', 19.4797, 72.8219, 'City Arterial Road / Ring Road', 'state-dl', 'dist-vasai-virar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: vijayawada - vijayawada Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-vijayawada', 'vijayawada Metropolitan Arterial & Ring Corridor', 'NH-16', 'vijayawada', 'vijayawada High-Density Traffic Transit Zone', 16.5062, 80.648, 'City Arterial Road / Ring Road', 'state-ap', 'dist-vijayawada')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: vishakhapatnam - vishakhapatnam Metropolitan Arterial & Ring Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ncrb-city-vishakhapatnam', 'vishakhapatnam Metropolitan Arterial & Ring Corridor', 'Ring Road Arterial', 'vishakhapatnam', 'vishakhapatnam High-Density Traffic Transit Zone', 17.6868, 83.2185, 'City Arterial Road / Ring Road', 'state-dl', 'dist-vishakhapatnam')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Chennai - NH-44 / NH-45 Chennai City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-chennai-city', 'NH-44 / NH-45 Chennai City Inter-District Corridor', 'SH-City Link', 'Chennai', 'Chennai City Police Division Jurisdiction', 13.0827, 80.2707, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-chennai-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Coimbatore - NH-44 / NH-45 Coimbatore City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-coimbatore-city', 'NH-44 / NH-45 Coimbatore City Inter-District Corridor', 'SH-City Link', 'Coimbatore', 'Coimbatore City Police Division Jurisdiction', 11.0168, 76.9558, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-coimbatore-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Madurai - NH-44 / NH-45 Madurai City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-madurai-city', 'NH-44 / NH-45 Madurai City Inter-District Corridor', 'SH-City Link', 'Madurai', 'Madurai City Police Division Jurisdiction', 9.9252, 78.1198, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-madurai-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Salem - NH-44 / NH-45 Salem City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-salem-city', 'NH-44 / NH-45 Salem City Inter-District Corridor', 'SH-City Link', 'Salem', 'Salem City Police Division Jurisdiction', 11.6643, 78.146, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-salem-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tiruchirappalli - NH-44 / NH-45 Tiruchirappalli City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tiruchirappalli-city', 'NH-44 / NH-45 Tiruchirappalli City Inter-District Corridor', 'SH-City Link', 'Tiruchirappalli', 'Tiruchirappalli City Police Division Jurisdiction', 10.7905, 78.7047, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-tiruchirappalli-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tirunelveli  - NH-44 / NH-45 Tirunelveli  City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tirunelveli--city', 'NH-44 / NH-45 Tirunelveli  City Inter-District Corridor', 'SH-City Link', 'Tirunelveli ', 'Tirunelveli  City Police Division Jurisdiction', 8.728427, 77.711292, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-tirunelveli--city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tirupur - NH-44 / NH-45 Tirupur City Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tirupur-city', 'NH-44 / NH-45 Tirupur City Inter-District Corridor', 'SH-City Link', 'Tirupur', 'Tirupur City Police Division Jurisdiction', 11.1085, 77.3411, 'City Arterial Road / Ring Road', 'state-tn', 'dist-tn-tirupur-city')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Ariyalur - NH-44 / NH-45 Ariyalur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-ariyalur', 'NH-44 / NH-45 Ariyalur Inter-District Corridor', 'NH-45', 'Ariyalur', 'Ariyalur Police Division Jurisdiction', 11.14, 79.0786, 'National Highway', 'state-tn', 'dist-tn-ariyalur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Chengalpattu - NH-44 / NH-45 Chengalpattu Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-chengalpattu', 'NH-44 / NH-45 Chengalpattu Inter-District Corridor', 'NH-45', 'Chengalpattu', 'Chengalpattu Police Division Jurisdiction', 12.6841, 79.9836, 'National Highway', 'state-tn', 'dist-tn-chengalpattu')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Coimbatore - NH-44 / NH-45 Coimbatore Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-coimbatore', 'NH-44 / NH-45 Coimbatore Inter-District Corridor', 'NH-45', 'Coimbatore', 'Coimbatore Police Division Jurisdiction', 11.001812, 76.962842, 'National Highway', 'state-tn', 'dist-tn-coimbatore')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Cuddalore - NH-44 / NH-45 Cuddalore Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-cuddalore', 'NH-44 / NH-45 Cuddalore Inter-District Corridor', 'NH-45', 'Cuddalore', 'Cuddalore Police Division Jurisdiction', 11.748, 79.7714, 'National Highway', 'state-tn', 'dist-tn-cuddalore')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Dharmapuri - NH-44 / NH-45 Dharmapuri Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-dharmapuri', 'NH-44 / NH-45 Dharmapuri Inter-District Corridor', 'NH-45', 'Dharmapuri', 'Dharmapuri Police Division Jurisdiction', 12.1211, 78.1582, 'National Highway', 'state-tn', 'dist-tn-dharmapuri')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Dindigul - NH-44 / NH-45 Dindigul Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-dindigul', 'NH-44 / NH-45 Dindigul Inter-District Corridor', 'NH-45', 'Dindigul', 'Dindigul Police Division Jurisdiction', 10.3673, 77.9803, 'National Highway', 'state-tn', 'dist-tn-dindigul')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Erode - NH-44 / NH-45 Erode Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-erode', 'NH-44 / NH-45 Erode Inter-District Corridor', 'NH-45', 'Erode', 'Erode Police Division Jurisdiction', 11.341, 77.7172, 'National Highway', 'state-tn', 'dist-tn-erode')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Kallakurichi - NH-44 / NH-45 Kallakurichi Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-kallakurichi', 'NH-44 / NH-45 Kallakurichi Inter-District Corridor', 'NH-45', 'Kallakurichi', 'Kallakurichi Police Division Jurisdiction', 11.740626, 78.963713, 'National Highway', 'state-tn', 'dist-tn-kallakurichi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Kancheepuram - NH-44 / NH-45 Kancheepuram Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-kancheepuram', 'NH-44 / NH-45 Kancheepuram Inter-District Corridor', 'NH-45', 'Kancheepuram', 'Kancheepuram Police Division Jurisdiction', 12.879605, 79.704276, 'National Highway', 'state-tn', 'dist-tn-kancheepuram')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Kanniyakumari - NH-44 / NH-45 Kanniyakumari Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-kanniyakumari', 'NH-44 / NH-45 Kanniyakumari Inter-District Corridor', 'NH-45', 'Kanniyakumari', 'Kanniyakumari Police Division Jurisdiction', 8.087964, 77.546741, 'National Highway', 'state-tn', 'dist-tn-kanniyakumari')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Karur - NH-44 / NH-45 Karur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-karur', 'NH-44 / NH-45 Karur Inter-District Corridor', 'NH-45', 'Karur', 'Karur Police Division Jurisdiction', 10.9601, 78.0766, 'National Highway', 'state-tn', 'dist-tn-karur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Krishnagiri - NH-44 / NH-45 Krishnagiri Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-krishnagiri', 'NH-44 / NH-45 Krishnagiri Inter-District Corridor', 'NH-45', 'Krishnagiri', 'Krishnagiri Police Division Jurisdiction', 12.5186, 78.2137, 'National Highway', 'state-tn', 'dist-tn-krishnagiri')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Madurai - NH-44 / NH-45 Madurai Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-madurai', 'NH-44 / NH-45 Madurai Inter-District Corridor', 'NH-45', 'Madurai', 'Madurai Police Division Jurisdiction', 9.926115, 78.114098, 'National Highway', 'state-tn', 'dist-tn-madurai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Nagapattinam - NH-44 / NH-45 Nagapattinam Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-nagapattinam', 'NH-44 / NH-45 Nagapattinam Inter-District Corridor', 'NH-45', 'Nagapattinam', 'Nagapattinam Police Division Jurisdiction', 10.7672, 79.8449, 'National Highway', 'state-tn', 'dist-tn-nagapattinam')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Namakkal - NH-44 / NH-45 Namakkal Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-namakkal', 'NH-44 / NH-45 Namakkal Inter-District Corridor', 'NH-45', 'Namakkal', 'Namakkal Police Division Jurisdiction', 11.2189, 78.1674, 'National Highway', 'state-tn', 'dist-tn-namakkal')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Perambalur - NH-44 / NH-45 Perambalur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-perambalur', 'NH-44 / NH-45 Perambalur Inter-District Corridor', 'NH-45', 'Perambalur', 'Perambalur Police Division Jurisdiction', 11.2342, 78.882, 'National Highway', 'state-tn', 'dist-tn-perambalur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Pudukkottai - NH-44 / NH-45 Pudukkottai Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-pudukkottai', 'NH-44 / NH-45 Pudukkottai Inter-District Corridor', 'NH-45', 'Pudukkottai', 'Pudukkottai Police Division Jurisdiction', 10.3797, 78.8208, 'National Highway', 'state-tn', 'dist-tn-pudukkottai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Ramanathapuram - NH-44 / NH-45 Ramanathapuram Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-ramanathapuram', 'NH-44 / NH-45 Ramanathapuram Inter-District Corridor', 'NH-45', 'Ramanathapuram', 'Ramanathapuram Police Division Jurisdiction', 9.3639, 78.8395, 'National Highway', 'state-tn', 'dist-tn-ramanathapuram')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Ranipettai - NH-44 / NH-45 Ranipettai Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-ranipettai', 'NH-44 / NH-45 Ranipettai Inter-District Corridor', 'NH-45', 'Ranipettai', 'Ranipettai Police Division Jurisdiction', 12.929245, 79.332171, 'National Highway', 'state-tn', 'dist-tn-ranipettai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Salem - NH-44 / NH-45 Salem Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-salem', 'NH-44 / NH-45 Salem Inter-District Corridor', 'NH-45', 'Salem', 'Salem Police Division Jurisdiction', 11.5271, 79.8569, 'National Highway', 'state-tn', 'dist-tn-salem')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Sivagangai - NH-44 / NH-45 Sivagangai Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-sivagangai', 'NH-44 / NH-45 Sivagangai Inter-District Corridor', 'NH-45', 'Sivagangai', 'Sivagangai Police Division Jurisdiction', 9.96506, 78.720428, 'National Highway', 'state-tn', 'dist-tn-sivagangai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tenkasi - NH-44 / NH-45 Tenkasi Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tenkasi', 'NH-44 / NH-45 Tenkasi Inter-District Corridor', 'NH-45', 'Tenkasi', 'Tenkasi Police Division Jurisdiction', 8.9594, 77.3161, 'National Highway', 'state-tn', 'dist-tn-tenkasi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Thanjavur - NH-44 / NH-45 Thanjavur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-thanjavur', 'NH-44 / NH-45 Thanjavur Inter-District Corridor', 'NH-45', 'Thanjavur', 'Thanjavur Police Division Jurisdiction', 10.787, 79.1378, 'National Highway', 'state-tn', 'dist-tn-thanjavur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: The Nilgiris - NH-44 / NH-45 The Nilgiris Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-the-nilgiris', 'NH-44 / NH-45 The Nilgiris Inter-District Corridor', 'NH-45', 'The Nilgiris', 'The Nilgiris Police Division Jurisdiction', 11.4, 76.7, 'National Highway', 'state-tn', 'dist-tn-the-nilgiris')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Theni - NH-44 / NH-45 Theni Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-theni', 'NH-44 / NH-45 Theni Inter-District Corridor', 'NH-45', 'Theni', 'Theni Police Division Jurisdiction', 10.0104, 77.4768, 'National Highway', 'state-tn', 'dist-tn-theni')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tiruvallur - NH-44 / NH-45 Tiruvallur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tiruvallur', 'NH-44 / NH-45 Tiruvallur Inter-District Corridor', 'NH-45', 'Tiruvallur', 'Tiruvallur Police Division Jurisdiction', 13.1432, 79.9079, 'National Highway', 'state-tn', 'dist-tn-tiruvallur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Thiruvarur - NH-44 / NH-45 Thiruvarur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-thiruvarur', 'NH-44 / NH-45 Thiruvarur Inter-District Corridor', 'NH-45', 'Thiruvarur', 'Thiruvarur Police Division Jurisdiction', 10.736186, 79.633187, 'National Highway', 'state-tn', 'dist-tn-thiruvarur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Thoothukudi - NH-44 / NH-45 Thoothukudi Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-thoothukudi', 'NH-44 / NH-45 Thoothukudi Inter-District Corridor', 'NH-45', 'Thoothukudi', 'Thoothukudi Police Division Jurisdiction', 8.7642, 78.1348, 'National Highway', 'state-tn', 'dist-tn-thoothukudi')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tiruchirappalli - NH-44 / NH-45 Tiruchirappalli Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tiruchirappalli', 'NH-44 / NH-45 Tiruchirappalli Inter-District Corridor', 'NH-45', 'Tiruchirappalli', 'Tiruchirappalli Police Division Jurisdiction', 10.804973, 78.68703, 'National Highway', 'state-tn', 'dist-tn-tiruchirappalli')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tirunelveli - NH-44 / NH-45 Tirunelveli Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tirunelveli', 'NH-44 / NH-45 Tirunelveli Inter-District Corridor', 'NH-45', 'Tirunelveli', 'Tirunelveli Police Division Jurisdiction', 8.728427, 77.711292, 'National Highway', 'state-tn', 'dist-tn-tirunelveli')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Thirupathur - NH-44 / NH-45 Thirupathur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-thirupathur', 'NH-44 / NH-45 Thirupathur Inter-District Corridor', 'NH-45', 'Thirupathur', 'Thirupathur Police Division Jurisdiction', 10.59635, 79.56857, 'National Highway', 'state-tn', 'dist-tn-thirupathur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Tirupur - NH-44 / NH-45 Tirupur Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-tirupur', 'NH-44 / NH-45 Tirupur Inter-District Corridor', 'NH-45', 'Tirupur', 'Tirupur Police Division Jurisdiction', 11.167188, 77.347267, 'National Highway', 'state-tn', 'dist-tn-tirupur')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Thiruvannamalai - NH-44 / NH-45 Thiruvannamalai Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-thiruvannamalai', 'NH-44 / NH-45 Thiruvannamalai Inter-District Corridor', 'NH-45', 'Thiruvannamalai', 'Thiruvannamalai Police Division Jurisdiction', 9.539867, 77.61979, 'National Highway', 'state-tn', 'dist-tn-thiruvannamalai')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Vellore - NH-44 / NH-45 Vellore Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-vellore', 'NH-44 / NH-45 Vellore Inter-District Corridor', 'NH-45', 'Vellore', 'Vellore Police Division Jurisdiction', 12.9165, 79.1325, 'National Highway', 'state-tn', 'dist-tn-vellore')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Villupuram - NH-44 / NH-45 Villupuram Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-villupuram', 'NH-44 / NH-45 Villupuram Inter-District Corridor', 'NH-45', 'Villupuram', 'Villupuram Police Division Jurisdiction', 11.950684, 79.512141, 'National Highway', 'state-tn', 'dist-tn-villupuram')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Virudhunagar - NH-44 / NH-45 Virudhunagar Inter-District Corridor
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-tn-police-virudhunagar', 'NH-44 / NH-45 Virudhunagar Inter-District Corridor', 'NH-45', 'Virudhunagar', 'Virudhunagar Police Division Jurisdiction', 9.568, 77.9624, 'National Highway', 'state-tn', 'dist-tn-virudhunagar')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Other Transit Artery (Avg Speed 32 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-other', 'Bengaluru Other Transit Artery (Avg Speed 32 km/h)', 'City Arterial', 'Bengaluru', 'Other Ward Traffic Sector', 13.009795, 77.752527, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Kadugodi Transit Artery (Avg Speed 22 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-kadugodi', 'Bengaluru Kadugodi Transit Artery (Avg Speed 22 km/h)', 'City Arterial', 'Bengaluru', 'Kadugodi Ward Traffic Sector', 12.984909, 77.745937, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Hagadur Transit Artery (Avg Speed 23 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-hagadur', 'Bengaluru Hagadur Transit Artery (Avg Speed 23 km/h)', 'City Arterial', 'Bengaluru', 'Hagadur Ward Traffic Sector', 12.964094, 77.742002, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Hudi Transit Artery (Avg Speed 23 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-hudi', 'Bengaluru Hudi Transit Artery (Avg Speed 23 km/h)', 'City Arterial', 'Bengaluru', 'Hudi Ward Traffic Sector', 12.993263, 77.729965, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Dodda Nekkundi Transit Artery (Avg Speed 20 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-dodda-nekkundi', 'Bengaluru Dodda Nekkundi Transit Artery (Avg Speed 20 km/h)', 'City Arterial', 'Bengaluru', 'Dodda Nekkundi Ward Traffic Sector', 12.96337, 77.714698, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Bellanduru Transit Artery (Avg Speed 29 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-bellanduru', 'Bengaluru Bellanduru Transit Artery (Avg Speed 29 km/h)', 'City Arterial', 'Bengaluru', 'Bellanduru Ward Traffic Sector', 12.931606, 77.688116, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Garudachar Playa Transit Artery (Avg Speed 23 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-garudachar-playa', 'Bengaluru Garudachar Playa Transit Artery (Avg Speed 23 km/h)', 'City Arterial', 'Bengaluru', 'Garudachar Playa Ward Traffic Sector', 12.985602, 77.71891, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Varthuru Transit Artery (Avg Speed 22 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-varthuru', 'Bengaluru Varthuru Transit Artery (Avg Speed 22 km/h)', 'City Arterial', 'Bengaluru', 'Varthuru Ward Traffic Sector', 12.94742, 77.729237, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru HAL Airport Transit Artery (Avg Speed 28 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-hal-airport', 'Bengaluru HAL Airport Transit Artery (Avg Speed 28 km/h)', 'City Arterial', 'Bengaluru', 'HAL Airport Ward Traffic Sector', 12.957875, 77.675019, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Marathahalli Transit Artery (Avg Speed 22 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-marathahalli', 'Bengaluru Marathahalli Transit Artery (Avg Speed 22 km/h)', 'City Arterial', 'Bengaluru', 'Marathahalli Ward Traffic Sector', 12.955336, 77.694912, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru A Narayanapura Transit Artery (Avg Speed 16 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-a-narayanapura', 'Bengaluru A Narayanapura Transit Artery (Avg Speed 16 km/h)', 'City Arterial', 'Bengaluru', 'A Narayanapura Ward Traffic Sector', 12.998187, 77.673112, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Devasandra Transit Artery (Avg Speed 21 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-devasandra', 'Bengaluru Devasandra Transit Artery (Avg Speed 21 km/h)', 'City Arterial', 'Bengaluru', 'Devasandra Ward Traffic Sector', 12.996795, 77.691268, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Konena Agrahara Transit Artery (Avg Speed 23 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-konena-agrahara', 'Bengaluru Konena Agrahara Transit Artery (Avg Speed 23 km/h)', 'City Arterial', 'Bengaluru', 'Konena Agrahara Ward Traffic Sector', 12.958997, 77.652404, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Vijnana Nagar Transit Artery (Avg Speed 18 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-vijnana-nagar', 'Bengaluru Vijnana Nagar Transit Artery (Avg Speed 18 km/h)', 'City Arterial', 'Bengaluru', 'Vijnana Nagar Ward Traffic Sector', 12.976203, 77.679149, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Basavanapura Transit Artery (Avg Speed 24 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-basavanapura', 'Bengaluru Basavanapura Transit Artery (Avg Speed 24 km/h)', 'City Arterial', 'Bengaluru', 'Basavanapura Ward Traffic Sector', 13.011289, 77.716448, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru C V Raman Nagar Transit Artery (Avg Speed 19 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-c-v-raman-nagar', 'Bengaluru C V Raman Nagar Transit Artery (Avg Speed 19 km/h)', 'City Arterial', 'Bengaluru', 'C V Raman Nagar Ward Traffic Sector', 12.987576, 77.664424, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Domlur Transit Artery (Avg Speed 25 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-domlur', 'Bengaluru Domlur Transit Artery (Avg Speed 25 km/h)', 'City Arterial', 'Bengaluru', 'Domlur Ward Traffic Sector', 12.967358, 77.638413, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru New Tippasandara Transit Artery (Avg Speed 20 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-new-tippasandara', 'Bengaluru New Tippasandara Transit Artery (Avg Speed 20 km/h)', 'City Arterial', 'Bengaluru', 'New Tippasandara Ward Traffic Sector', 12.97201, 77.652706, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Horamavu Transit Artery (Avg Speed 27 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-horamavu', 'Bengaluru Horamavu Transit Artery (Avg Speed 27 km/h)', 'City Arterial', 'Bengaluru', 'Horamavu Ward Traffic Sector', 13.026459, 77.658666, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Hoysala Nagar Transit Artery (Avg Speed 22 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-hoysala-nagar', 'Bengaluru Hoysala Nagar Transit Artery (Avg Speed 22 km/h)', 'City Arterial', 'Bengaluru', 'Hoysala Nagar Ward Traffic Sector', 12.976052, 77.643029, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru K R Puram Transit Artery (Avg Speed 23 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-k-r-puram', 'Bengaluru K R Puram Transit Artery (Avg Speed 23 km/h)', 'City Arterial', 'Bengaluru', 'K R Puram Ward Traffic Sector', 13.019387, 77.703919, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru HSR Layout Transit Artery (Avg Speed 19 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-hsr-layout', 'Bengaluru HSR Layout Transit Artery (Avg Speed 19 km/h)', 'City Arterial', 'Bengaluru', 'HSR Layout Ward Traffic Sector', 12.917222, 77.655041, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Ramamurthy Nagar Transit Artery (Avg Speed 24 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-ramamurthy-nagar', 'Bengaluru Ramamurthy Nagar Transit Artery (Avg Speed 24 km/h)', 'City Arterial', 'Bengaluru', 'Ramamurthy Nagar Ward Traffic Sector', 13.021446, 77.683267, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- Hotspot: Bengaluru - Bengaluru Banasavadi Transit Artery (Avg Speed 27 km/h)
INSERT INTO locations (id, road_name, road_number, city, locality, latitude, longitude, road_type, state_id, district_id)
VALUES ('loc-ka-cas-banasavadi', 'Bengaluru Banasavadi Transit Artery (Avg Speed 27 km/h)', 'City Arterial', 'Bengaluru', 'Banasavadi Ward Traffic Sector', 13.016038, 77.649072, 'City Arterial Road / Ring Road', 'state-ka', 'dist-bengaluru-urban')
ON CONFLICT (id) DO UPDATE SET road_name = EXCLUDED.road_name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

COMMIT;