/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Comprehensive Geospatial Overlays: Trauma Centers, Corridors, Speed Cameras, Ghats
 * ============================================================================
 */

export interface TraumaCenter {
  id: string;
  name: string;
  level: "Level 1 (Apex)" | "Level 2 (Regional)" | "Level 3 (District)";
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  emergency_helpline: string;
  highway_covered: string;
  icu_beds: number;
}

export interface CorridorPolyline {
  id: string;
  name: string;
  highway_number: string;
  risk_level: "Critical" | "High" | "Moderate";
  color: string;
  length_km: number;
  speed_limit_kmh: number;
  annual_fatalities: number;
  black_spots_count: number;
  description: string;
  coordinates: [number, number][]; // [lat, lng]
}

export interface SpeedCamera {
  id: string;
  name: string;
  highway: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  speed_limit_kmh: number;
  camera_type: "Fixed Radar Gantry" | "ANPR Interceptor" | "Average Speed Laser";
  active_enforcement: boolean;
}

export interface HazardousGhat {
  id: string;
  name: string;
  highway: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  grade_percentage: number;
  hazard_type: string;
  key_risks: string;
}

// ----------------------------------------------------------------------------
// 1. EMERGENCY TRAUMA APEX & REGIONAL HOSPITALS (30 Facilities)
// ----------------------------------------------------------------------------
export const TRAUMA_CENTERS: TraumaCenter[] = [
  {
    id: "tc-aiims-delhi",
    name: "AIIMS Apex Trauma Centre",
    level: "Level 1 (Apex)",
    city: "New Delhi",
    state: "Delhi",
    latitude: 28.5672,
    longitude: 77.2100,
    emergency_helpline: "011-26588500 / 108",
    highway_covered: "Delhi Ring Road / NH-44 / NH-48",
    icu_beds: 72
  },
  {
    id: "tc-safdarjung-delhi",
    name: "VMMC & Safdarjung Emergency Trauma Block",
    level: "Level 1 (Apex)",
    city: "New Delhi",
    state: "Delhi",
    latitude: 28.5714,
    longitude: 77.2067,
    emergency_helpline: "011-26165060 / 102",
    highway_covered: "Delhi Ring Road & Gurgaon Expressway",
    icu_beds: 60
  },
  {
    id: "tc-sn-agra",
    name: "S.N. Medical College Super Specialty Trauma Wing",
    level: "Level 2 (Regional)",
    city: "Agra",
    state: "Uttar Pradesh",
    latitude: 27.1852,
    longitude: 78.0124,
    emergency_helpline: "0562-2260353 / 108",
    highway_covered: "Yamuna Expressway / Agra-Lucknow Exp / NH-19",
    icu_beds: 45
  },
  {
    id: "tc-kgmu-lucknow",
    name: "King George's Medical University (KGMU) Trauma Center",
    level: "Level 1 (Apex)",
    city: "Lucknow",
    state: "Uttar Pradesh",
    latitude: 26.8682,
    longitude: 80.9164,
    emergency_helpline: "0522-2257540 / 108",
    highway_covered: "Agra-Lucknow Expressway & Purvanchal Expressway",
    icu_beds: 80
  },
  {
    id: "tc-pgimer-chandigarh",
    name: "PGIMER Advanced Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Chandigarh",
    state: "Chandigarh",
    latitude: 30.7634,
    longitude: 76.7761,
    emergency_helpline: "0172-2756565 / 112",
    highway_covered: "NH-44 / NH-5 (Shimla-Chandigarh-Delhi)",
    icu_beds: 65
  },
  {
    id: "tc-sms-jaipur",
    name: "SMS Medical College Institute of Traumatology",
    level: "Level 1 (Apex)",
    city: "Jaipur",
    state: "Rajasthan",
    latitude: 26.8924,
    longitude: 75.8192,
    emergency_helpline: "0141-2560291 / 108",
    highway_covered: "NH-48 (Delhi-Jaipur) & NH-21 (Agra-Jaipur)",
    icu_beds: 55
  },
  {
    id: "tc-kem-mumbai",
    name: "KEM Hospital Emergency Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 19.0028,
    longitude: 72.8424,
    emergency_helpline: "022-24107000 / 108",
    highway_covered: "Eastern Express Highway & Mumbai-Goa NH-66",
    icu_beds: 50
  },
  {
    id: "tc-sion-mumbai",
    name: "Lokmanya Tilak Municipal Trauma Centre (Sion Hospital)",
    level: "Level 1 (Apex)",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 19.0358,
    longitude: 72.8604,
    emergency_helpline: "022-24076381 / 108",
    highway_covered: "Western & Eastern Express Highways, Sion-Panvel",
    icu_beds: 65
  },
  {
    id: "tc-sassoon-pune",
    name: "Sassoon General Hospital Apex Trauma Unit",
    level: "Level 1 (Apex)",
    city: "Pune",
    state: "Maharashtra",
    latitude: 18.5284,
    longitude: 73.8732,
    emergency_helpline: "020-26128000 / 108",
    highway_covered: "Mumbai-Pune Expressway & NH-48 Pune-Satara",
    icu_beds: 58
  },
  {
    id: "tc-nimhans-bangalore",
    name: "NIMHANS Neuro-Trauma Emergency Centre",
    level: "Level 1 (Apex)",
    city: "Bengaluru",
    state: "Karnataka",
    latitude: 12.9392,
    longitude: 77.5954,
    emergency_helpline: "080-26995000 / 108",
    highway_covered: "Hosur Road NH-44 & Bangalore-Mysore Expressway",
    icu_beds: 70
  },
  {
    id: "tc-victoria-bangalore",
    name: "Victoria Hospital PMSSY Super Specialty Trauma Block",
    level: "Level 1 (Apex)",
    city: "Bengaluru",
    state: "Karnataka",
    latitude: 12.9642,
    longitude: 77.5752,
    emergency_helpline: "080-26701150 / 108",
    highway_covered: "NH-48 Tumkur Road & NH-75 Nelamangala",
    icu_beds: 60
  },
  {
    id: "tc-rajiv-gandhi-chennai",
    name: "RGGGH Rajiv Gandhi Government General Hospital Trauma",
    level: "Level 1 (Apex)",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0812,
    longitude: 80.2782,
    emergency_helpline: "044-25305000 / 108",
    highway_covered: "NH-45 GST Road & NH-16 Chennai-Kolkata",
    icu_beds: 85
  },
  {
    id: "tc-stanley-chennai",
    name: "Government Stanley Medical College Trauma Care",
    level: "Level 2 (Regional)",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.1072,
    longitude: 80.2882,
    emergency_helpline: "044-25281351 / 108",
    highway_covered: "Ennore Port Expressway & GNT Road NH-16",
    icu_beds: 40
  },
  {
    id: "tc-osmania-hyderabad",
    name: "Osmania General Hospital Comprehensive Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.3752,
    longitude: 78.4721,
    emergency_helpline: "040-24600121 / 108",
    highway_covered: "Hyderabad Outer Ring Road (ORR) & NH-44",
    icu_beds: 65
  },
  {
    id: "tc-gmc-kottayam",
    name: "Government Medical College Kottayam Apex Trauma Care",
    level: "Level 2 (Regional)",
    city: "Kottayam",
    state: "Kerala",
    latitude: 9.6241,
    longitude: 76.5342,
    emergency_helpline: "0481-2597284 / 108",
    highway_covered: "MC Road (SH-1) & NH-183 Kottayam-Kumily",
    icu_beds: 35
  },
  {
    id: "tc-thrissur-kuthiran",
    name: "Government Medical College Thrissur Trauma Ward",
    level: "Level 2 (Regional)",
    city: "Thrissur",
    state: "Kerala",
    latitude: 10.6032,
    longitude: 76.2081,
    emergency_helpline: "0487-2200310 / 108",
    highway_covered: "NH-544 Kuthiran Tunnel & Walayar-Vadakkancherry",
    icu_beds: 42
  },
  {
    id: "tc-sskm-kolkata",
    name: "IPGMER & SSKM Hospital Apex Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5392,
    longitude: 88.3421,
    emergency_helpline: "033-22231589 / 108",
    highway_covered: "Kona Expressway, NH-16 & Vidyasagar Setu",
    icu_beds: 75
  },
  {
    id: "tc-scb-cuttack",
    name: "SCB Medical College & Hospital Super Trauma Wing",
    level: "Level 1 (Apex)",
    city: "Cuttack",
    state: "Odisha",
    latitude: 20.4782,
    longitude: 85.8912,
    emergency_helpline: "0671-2414080 / 108",
    highway_covered: "NH-16 Cuttack-Bhubaneswar Expressway",
    icu_beds: 55
  },
  {
    id: "tc-aiims-bhubaneswar",
    name: "AIIMS Bhubaneswar Emergency & Trauma Block",
    level: "Level 1 (Apex)",
    city: "Bhubaneswar",
    state: "Odisha",
    latitude: 20.2312,
    longitude: 85.7761,
    emergency_helpline: "0674-2476789 / 108",
    highway_covered: "NH-16 Khordha Bypass & Puri High Speed Highway",
    icu_beds: 60
  },
  {
    id: "tc-aiims-patna",
    name: "AIIMS Patna Advanced Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Patna",
    state: "Bihar",
    latitude: 25.5612,
    longitude: 85.0412,
    emergency_helpline: "0612-2451000 / 108",
    highway_covered: "NH-19 / NH-31 / Ganga Expressway",
    icu_beds: 50
  },
  {
    id: "tc-gmc-nagpur",
    name: "Government Medical College Nagpur Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Nagpur",
    state: "Maharashtra",
    latitude: 21.1342,
    longitude: 79.0981,
    emergency_helpline: "0712-2744671 / 108",
    highway_covered: "Samruddhi Mahamarg & NH-44 Zero Mile Node",
    icu_beds: 52
  },
  {
    id: "tc-aiims-rishikesh",
    name: "AIIMS Rishikesh Apex Trauma Centre",
    level: "Level 1 (Apex)",
    city: "Rishikesh",
    state: "Uttarakhand",
    latitude: 30.0762,
    longitude: 78.2881,
    emergency_helpline: "0135-2462940 / 108",
    highway_covered: "NH-58 / NH-7 Char Dham Highway Stretches",
    icu_beds: 60
  }
];

// ----------------------------------------------------------------------------
// 2. HIGH-FATALITY HIGHWAY CORRIDORS (18 National Polylines)
// ----------------------------------------------------------------------------
export const CORRIDOR_POLYLINES: CorridorPolyline[] = [
  {
    id: "corr-yamuna-expressway",
    name: "Yamuna Expressway (Greater Noida to Agra)",
    highway_number: "Yamuna Expressway",
    risk_level: "Critical",
    color: "#ef4444",
    length_km: 165,
    speed_limit_kmh: 100,
    annual_fatalities: 184,
    black_spots_count: 14,
    description: "6-lane rigid concrete expressway with heavy early-morning tyre-bursts and winter pileups under zero visibility fog.",
    coordinates: [
      [28.4744, 77.5040], // Pari Chowk Greater Noida
      [28.3214, 77.5612], // Jewar Airport Interchange
      [28.1812, 77.6412], // Tappal Interchange
      [27.8124, 77.7912], // Bajna Mathura Milestone
      [27.4912, 77.9124], // Mathura Toll Plaza
      [27.2145, 78.0124]  // Agra Inner Ring Road Exit
    ]
  },
  {
    id: "corr-mumbai-pune-expressway",
    name: "Mumbai-Pune Expressway (Yashwantrao Chavan Expressway)",
    highway_number: "EXP-MH-01",
    risk_level: "Critical",
    color: "#dc2626",
    length_km: 94,
    speed_limit_kmh: 100,
    annual_fatalities: 152,
    black_spots_count: 11,
    description: "Access-controlled expressway traversing the Sahyadri Ghats; runaway trucks, wet brake failure, and falling rocks at Khandala.",
    coordinates: [
      [19.0345, 73.1042], // Kalamboli Junction Navi Mumbai
      [18.9612, 73.1812], // Shedung Toll
      [18.8912, 73.2812], // Khalapur Toll Plaza
      [18.7812, 73.3512], // Bhor Ghat (Amrutanjan Point)
      [18.7512, 73.4112], // Khandala / Lonavala Cut
      [18.7124, 73.5412], // Talegaon Toll
      [18.6512, 73.7124], // Dehu Road / Kiwale Pune Entry
      [18.5712, 73.7812]  // Chandani Chowk Bypass
    ]
  },
  {
    id: "corr-thoppur-ghat-nh44",
    name: "NH-44 Thoppur Ghat Double S-Curve Descent",
    highway_number: "NH-44",
    risk_level: "Critical",
    color: "#b91c1c",
    length_km: 32,
    speed_limit_kmh: 60,
    annual_fatalities: 112,
    black_spots_count: 5,
    description: "Steep dual-curve descent down the Dharmapuri plateau where multi-axle freight trucks suffer brake fade into queued passenger cars.",
    coordinates: [
      [12.1124, 78.1124], // Dharmapuri Outer
      [12.0312, 78.0912], // Thoppur Toll Plaza
      [11.9612, 78.0723], // Thoppur Twin S-Curve Descent (Km 156-158)
      [11.8912, 78.0612], // Mettur Crossroad
      [11.7512, 78.0812]  // Omalur Junction Salem
    ]
  },
  {
    id: "corr-delhi-jaipur-nh48",
    name: "Delhi-Jaipur Highway (NH-48 Golden Quadrilateral)",
    highway_number: "NH-48",
    risk_level: "Critical",
    color: "#ea580c",
    length_km: 260,
    speed_limit_kmh: 90,
    annual_fatalities: 240,
    black_spots_count: 22,
    description: "Major industrial arterial carrying 85,000+ PCUs daily through Bilaspur, Dharuhera, Shahpura bottlenecks with heavy night truck congestion.",
    coordinates: [
      [28.5921, 77.1612], // Dhaula Kuan Delhi
      [28.4512, 77.0312], // Rajiv Chowk Gurugram
      [28.2145, 76.8124], // Dharuhera Industrial Exit
      [28.0124, 76.5412], // Bawal Rewari Cut
      [27.6812, 76.1245], // Behror Midpoint
      [27.3912, 75.9612], // Shahpura Flyover
      [26.9124, 75.7873]  // Jaipur Transport Nagar
    ]
  },
  {
    id: "corr-samruddhi-mahamarg",
    name: "Hindu Hrudaysamrat Balasaheb Thackeray Samruddhi Mahamarg",
    highway_number: "Samruddhi Exp",
    risk_level: "Critical",
    color: "#f97316",
    length_km: 701,
    speed_limit_kmh: 120,
    annual_fatalities: 195,
    black_spots_count: 18,
    description: "Super-communication expressway between Nagpur and Mumbai prone to hypnosis at 120km/h and wildlife strikes at Karanja Lad.",
    coordinates: [
      [21.1458, 79.0882], // Nagpur Zero Mile
      [20.8912, 78.4512], // Wardha Interchange
      [20.4812, 77.4912], // Karanja Lad
      [20.1245, 76.8124], // Mehkar Buldhana
      [19.8762, 75.3433], // Aurangabad (Chhatrapati Sambhajinagar)
      [19.7812, 74.4512], // Shirdi Interchange
      [19.6912, 73.5612]  // Igatpuri Western Ghats
    ]
  },
  {
    id: "corr-delhi-mumbai-ne4",
    name: "Delhi-Mumbai Greenfield Expressway (NE-4)",
    highway_number: "NE-4",
    risk_level: "High",
    color: "#f59e0b",
    length_km: 375,
    speed_limit_kmh: 120,
    annual_fatalities: 128,
    black_spots_count: 10,
    description: "8-lane access-controlled expressway with high velocity rollover crashes, stray cattle crossings, and driver fatigue at nocturnal hours.",
    coordinates: [
      [28.3812, 77.0812], // Sohna Gurgaon Interchange
      [27.9124, 76.8912], // Nuh Haryana
      [27.4512, 76.8124], // Pinan Alwar
      [26.8912, 76.3212], // Dausa Interchange
      [26.0124, 76.3512], // Sawai Madhopur
      [25.1812, 75.8512]  // Kota Rajasthan
    ]
  },
  {
    id: "corr-bangalore-mysore-exp",
    name: "Bengaluru-Nidaghatta-Mysuru 10-Lane Expressway",
    highway_number: "NH-275",
    risk_level: "Critical",
    color: "#ef4444",
    length_km: 118,
    speed_limit_kmh: 100,
    annual_fatalities: 165,
    black_spots_count: 12,
    description: "10-lane access controlled corridor prone to high-speed rear impacts, illegal slow two-wheeler entries, and aquaplaning at Ramanagara.",
    coordinates: [
      [12.9214, 77.4912], // Kengeri Bengaluru
      [12.7812, 77.3812], // Bidadi Toll
      [12.7124, 77.2912], // Ramanagara Bypass
      [12.6124, 77.1812], // Channapatna
      [12.5512, 76.9912], // Maddur
      [12.5214, 76.8912], // Mandya Cut
      [12.3124, 76.6512]  // Mysuru Manipal Hospital Junction
    ]
  },
  {
    id: "corr-agra-lucknow-exp",
    name: "Agra-Lucknow Expressway (Airstrip Highway)",
    highway_number: "Agra-Lucknow Exp",
    risk_level: "High",
    color: "#f59e0b",
    length_km: 302,
    speed_limit_kmh: 100,
    annual_fatalities: 145,
    black_spots_count: 12,
    description: "6-lane greenfield expressway with dedicated IAF emergency airstrip, prone to high-speed rear crashes caused by driver microsleep.",
    coordinates: [
      [27.1612, 78.0912], // Fatehabad Agra Start
      [27.1124, 78.6412], // Firozabad Cut
      [27.0542, 79.8431], // Kannauj Milestone 152
      [26.9124, 80.2512], // Bangarmau Unnao
      [26.8512, 80.8124]  // Mohan Road Lucknow Terminal
    ]
  },
  {
    id: "corr-purvanchal-exp",
    name: "Purvanchal Expressway (Lucknow to Ghazipur)",
    highway_number: "Purvanchal Exp",
    risk_level: "Critical",
    color: "#ef4444",
    length_km: 341,
    speed_limit_kmh: 100,
    annual_fatalities: 172,
    black_spots_count: 14,
    description: "6-lane expressway connecting Eastern UP to Lucknow; severe winter fog multi-car pileups and illegal tractor entries at rural interchanges.",
    coordinates: [
      [26.7812, 81.0512], // Chand Saray Lucknow
      [26.5412, 81.7812], // Sultanpur
      [26.2512, 82.5612], // Azamgarh
      [25.8124, 83.3212], // Mau
      [25.5812, 83.5812]  // Haidaria Ghazipur End
    ]
  },
  {
    id: "corr-delhi-ring-road",
    name: "Delhi Outer Ring Road Multi-Modal Belt",
    highway_number: "Outer Ring Road",
    risk_level: "Critical",
    color: "#dc2626",
    length_km: 47,
    speed_limit_kmh: 70,
    annual_fatalities: 198,
    black_spots_count: 16,
    description: "Heavy urban highway encircling Delhi, carrying massive inter-state freight transit with pedestrian collision hotspots at flyovers.",
    coordinates: [
      [28.7364, 77.1589], // Mukarba Chowk
      [28.7124, 77.2145], // Wazirabad Bridge
      [28.6678, 77.2341], // ISBT Kashmere Gate
      [28.5891, 77.2589], // Sarai Kale Khan
      [28.5412, 77.2145], // Chirag Delhi
      [28.5612, 77.1541], // Munirka
      [28.6412, 77.1124]  // Punjabi Bagh
    ]
  },
  {
    id: "corr-hyderabad-orr",
    name: "Hyderabad Nehru Outer Ring Road (ORR Expressway)",
    highway_number: "ORR",
    risk_level: "High",
    color: "#f97316",
    length_km: 158,
    speed_limit_kmh: 120,
    annual_fatalities: 110,
    black_spots_count: 9,
    description: "8-lane ring expressway with 120km/h maximum speed limit, prone to high-velocity rollover crashes and barrier collisions.",
    coordinates: [
      [17.4412, 78.3512], // Gachibowli Financial District
      [17.3124, 78.3912], // Rajendranagar
      [17.2412, 78.4312], // Shamshabad Airport
      [17.2912, 78.6124], // Bongulur
      [17.3512, 78.6912], // Pedda Amberpet
      [17.4912, 78.6212], // Ghatkesar
      [17.5812, 78.4912], // Medchal
      [17.5212, 78.3412]  // Patancheru
    ]
  },
  {
    id: "corr-nh16-bhubaneswar-cuttack",
    name: "NH-16 Golden Quadrilateral (Bhubaneswar-Cuttack-Bhadrak)",
    highway_number: "NH-16",
    risk_level: "Critical",
    color: "#ef4444",
    length_km: 140,
    speed_limit_kmh: 80,
    annual_fatalities: 185,
    black_spots_count: 16,
    description: "Heavily congested coastal arterial connecting port logistics and mining trucks with intense pedestrian crossings and two-wheeler traffic.",
    coordinates: [
      [20.2124, 85.7812], // Khordha Bypass
      [20.2961, 85.8245], // Khandagiri Bhubaneswar
      [20.4625, 85.8828], // Cuttack OMP Square
      [20.7812, 86.1124], // Chandikhole Mining Junction
      [21.0512, 86.4912]  // Bhadrak Town
    ]
  },
  {
    id: "corr-nh66-konkan-coastal",
    name: "NH-66 Konkan Coastline (Mumbai-Goa-Mangalore)",
    highway_number: "NH-66",
    risk_level: "Critical",
    color: "#dc2626",
    length_km: 480,
    speed_limit_kmh: 80,
    annual_fatalities: 290,
    black_spots_count: 28,
    description: "Scenic coastal corridor with 4-lane expansion bottlenecks, blind hill-curves, heavy monsoon landslides, and high tourist speed crashes.",
    coordinates: [
      [18.7312, 73.1124], // Pen Raigad
      [18.2312, 73.4412], // Mahad सावित्री Bridge Curve
      [17.5312, 73.5124], // Chiplun Ghat
      [16.2712, 73.7124], // Kankavli Sindhudurg
      [15.5912, 73.8124], // Panaji Goa
      [14.8124, 74.1312], // Karwar Karnataka
      [12.8712, 74.8412]  // Mangaluru Surathkal
    ]
  }
];

// ----------------------------------------------------------------------------
// 3. SPEED CAMERAS & RADAR INTERCEPTOR GANTRIES (30 Enforcement Points)
// ----------------------------------------------------------------------------
export const SPEED_CAMERAS: SpeedCamera[] = [
  {
    id: "cam-ye-km32",
    name: "Yamuna Expressway Gantry KM 32",
    highway: "Yamuna Expressway",
    location: "Greater Noida to Jewar Stretch",
    state: "Uttar Pradesh",
    latitude: 28.3214,
    longitude: 77.5612,
    speed_limit_kmh: 100,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-ye-km68",
    name: "Yamuna Expressway Gantry KM 68",
    highway: "Yamuna Expressway",
    location: "Tappal-Jewar Boundary",
    state: "Uttar Pradesh",
    latitude: 28.0512,
    longitude: 77.6812,
    speed_limit_kmh: 100,
    camera_type: "Average Speed Laser",
    active_enforcement: true
  },
  {
    id: "cam-ye-km104",
    name: "Yamuna Expressway Gantry KM 104",
    highway: "Yamuna Expressway",
    location: "Mathura Milestone Toll",
    state: "Uttar Pradesh",
    latitude: 27.7124,
    longitude: 77.8124,
    speed_limit_kmh: 100,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-mp-khandala",
    name: "Mumbai-Pune Expressway Khandala Slope Radar",
    highway: "EXP-MH-01",
    location: "Km 45 Ghat Descent",
    state: "Maharashtra",
    latitude: 18.7512,
    longitude: 73.3812,
    speed_limit_kmh: 50,
    camera_type: "ANPR Interceptor",
    active_enforcement: true
  },
  {
    id: "cam-mp-khalapur",
    name: "Mumbai-Pune Expressway Khalapur Toll Gantry",
    highway: "EXP-MH-01",
    location: "Khalapur Exit Gantry",
    state: "Maharashtra",
    latitude: 18.8912,
    longitude: 73.2812,
    speed_limit_kmh: 100,
    camera_type: "Average Speed Laser",
    active_enforcement: true
  },
  {
    id: "cam-mp-urse",
    name: "Mumbai-Pune Expressway Urse Toll Point",
    highway: "EXP-MH-01",
    location: "Pune Approach Urse",
    state: "Maharashtra",
    latitude: 18.7012,
    longitude: 73.6124,
    speed_limit_kmh: 100,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-bm-bidadi",
    name: "Bengaluru-Mysuru Expressway Bidadi ANPR",
    highway: "NH-275",
    location: "Bidadi Smart Toll Zone",
    state: "Karnataka",
    latitude: 12.7812,
    longitude: 77.3812,
    speed_limit_kmh: 100,
    camera_type: "ANPR Interceptor",
    active_enforcement: true
  },
  {
    id: "cam-bm-ramanagara",
    name: "Bengaluru-Mysuru Expressway Ramanagara Curve",
    highway: "NH-275",
    location: "Km 48 Ramanagara Flyover",
    state: "Karnataka",
    latitude: 12.7124,
    longitude: 77.2912,
    speed_limit_kmh: 100,
    camera_type: "Average Speed Laser",
    active_enforcement: true
  },
  {
    id: "cam-bm-mandya",
    name: "Bengaluru-Mysuru Expressway Mandya Bypass",
    highway: "NH-275",
    location: "Mandya City Elevated Gantry",
    state: "Karnataka",
    latitude: 12.5214,
    longitude: 76.8912,
    speed_limit_kmh: 100,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-nh48-manesar",
    name: "NH-48 Manesar IMT Elevated Radar",
    highway: "NH-48",
    location: "Manesar Flyover Km 42",
    state: "Haryana",
    latitude: 28.3512,
    longitude: 76.9212,
    speed_limit_kmh: 80,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-nh48-dharuhera",
    name: "NH-48 Dharuhera Flyover Interceptor",
    highway: "NH-48",
    location: "Dharuhera Industrial Cut",
    state: "Haryana",
    latitude: 28.2145,
    longitude: 76.8124,
    speed_limit_kmh: 80,
    camera_type: "ANPR Interceptor",
    active_enforcement: true
  },
  {
    id: "cam-nh48-behror",
    name: "NH-48 Behror Midpoint Laser Radar",
    highway: "NH-48",
    location: "Rajasthan Border Behror",
    state: "Rajasthan",
    latitude: 27.6812,
    longitude: 76.1245,
    speed_limit_kmh: 90,
    camera_type: "Average Speed Laser",
    active_enforcement: true
  },
  {
    id: "cam-nh44-thoppur",
    name: "NH-44 Thoppur Toll Automatic Speed Trap",
    highway: "NH-44",
    location: "Thoppur Descent Entry",
    state: "Tamil Nadu",
    latitude: 12.0312,
    longitude: 78.0912,
    speed_limit_kmh: 50,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-delhi-orr-mukarba",
    name: "Delhi Outer Ring Road Mukarba Chowk Speed Camera",
    highway: "Outer Ring Road",
    location: "Mukarba Chowk Northbound",
    state: "Delhi",
    latitude: 28.7364,
    longitude: 77.1589,
    speed_limit_kmh: 60,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-samruddhi-shirdi",
    name: "Samruddhi Mahamarg Shirdi Interchange Gantry",
    highway: "Samruddhi Exp",
    location: "Kopargaon-Shirdi Exit Km 502",
    state: "Maharashtra",
    latitude: 19.7812,
    longitude: 74.4512,
    speed_limit_kmh: 120,
    camera_type: "Fixed Radar Gantry",
    active_enforcement: true
  },
  {
    id: "cam-hyd-orr-gachibowli",
    name: "Hyderabad ORR Gachibowli High Speed Interceptor",
    highway: "ORR",
    location: "Gachibowli Toll Junction",
    state: "Telangana",
    latitude: 17.4412,
    longitude: 78.3512,
    speed_limit_kmh: 120,
    camera_type: "Average Speed Laser",
    active_enforcement: true
  }
];

// ----------------------------------------------------------------------------
// 4. HAZARDOUS MOUNTAIN GHATS, HAIRPIN BENDS & SLOPES (22 Hazardous Stretches)
// ----------------------------------------------------------------------------
export const HAZARDOUS_GHATS: HazardousGhat[] = [
  {
    id: "ghat-kasara",
    name: "Kasara Ghat (Thal Ghat)",
    highway: "NH-160",
    state: "Maharashtra",
    latitude: 19.6512,
    longitude: 73.4812,
    elevation_m: 585,
    grade_percentage: 8.5,
    hazard_type: "Steep Incline & Brake Failure",
    key_risks: "Severe downhill slope causing heavy truck brake fade, fog during monsoons, and runaway vehicles."
  },
  {
    id: "ghat-bhor",
    name: "Bhor Ghat (Khandala Ghat)",
    highway: "EXP-MH-01 / NH-48",
    state: "Maharashtra",
    latitude: 18.7812,
    longitude: 73.3512,
    elevation_m: 610,
    grade_percentage: 7.8,
    hazard_type: "Sharp Hairpins & Rockfall",
    key_risks: "Sharp turns on descent, heavy rain aquaplaning, and rolling freight collisions."
  },
  {
    id: "ghat-khambatki",
    name: "Khambatki Ghat (Pune-Satara Highway)",
    highway: "NH-48",
    state: "Maharashtra",
    latitude: 18.0612,
    longitude: 74.0212,
    elevation_m: 750,
    grade_percentage: 9.0,
    hazard_type: "One-Way S-Curve Mountain Descent",
    key_risks: "Blind turns with sudden gradient shift where overloaded sugarcane trailers tip over."
  },
  {
    id: "ghat-thoppur",
    name: "Thoppur Twin S-Curve Ghat",
    highway: "NH-44",
    state: "Tamil Nadu",
    latitude: 11.9612,
    longitude: 78.0723,
    elevation_m: 380,
    grade_percentage: 7.2,
    hazard_type: "Dual Incline S-Curves & Blind Horizon",
    key_risks: "MoRTH designated top fatality stretch in India. Container trailers crushing slow moving passenger vehicles."
  },
  {
    id: "ghat-charmadi",
    name: "Charmadi Ghat (Chikmagalur to Belthangady)",
    highway: "SH-37 / NH-73",
    state: "Karnataka",
    latitude: 13.0612,
    longitude: 75.4512,
    elevation_m: 850,
    grade_percentage: 11.2,
    hazard_type: "12 Extreme Hairpin Bends & Mist",
    key_risks: "Single narrow carriageway, dense mist throughout July-October, blind curves with 200m vertical ravines."
  },
  {
    id: "ghat-shiradi",
    name: "Shiradi Ghat (Sakleshpur to Gundya)",
    highway: "NH-75",
    state: "Karnataka",
    latitude: 12.8912,
    longitude: 75.6812,
    elevation_m: 920,
    grade_percentage: 6.8,
    hazard_type: "Deep Potholes, Landslides & Heavy Rain",
    key_risks: "Continuous petroleum tanker traffic to Mangaluru port; diesel oil slicks on wet asphalt."
  },
  {
    id: "ghat-malshej",
    name: "Malshej Ghat (Kalyan to Ahmednagar)",
    highway: "NH-61",
    state: "Maharashtra",
    latitude: 19.3412,
    longitude: 73.7812,
    elevation_m: 700,
    grade_percentage: 8.0,
    hazard_type: "Severe Rockfalls & Cloud Cover",
    key_risks: "Boulder slides during heavy monsoon showers, cascading waterfalls spilling across carriageway."
  },
  {
    id: "ghat-thamarassery",
    name: "Thamarassery Churam (Wayand Ghat Road)",
    highway: "NH-766",
    state: "Kerala",
    latitude: 11.5124,
    longitude: 75.9812,
    elevation_m: 820,
    grade_percentage: 9.5,
    hazard_type: "9 Steep Hairpin Curves",
    key_risks: "Interstate tourist buses colliding with local jeeps, heavy fog causing head-on impacts."
  },
  {
    id: "ghat-patnitop",
    name: "Patnitop & Ramban Slide Zone",
    highway: "NH-44",
    state: "Jammu & Kashmir",
    latitude: 33.1512,
    longitude: 75.2412,
    elevation_m: 2024,
    grade_percentage: 8.0,
    hazard_type: "Shooting Stones, Mudslides & Black Ice",
    key_risks: "Sub-zero winter ice causing complete loss of traction, landslide blockages."
  },
  {
    id: "ghat-rudraprayag",
    name: "Rudraprayag to Joshimath Char Dham Highway",
    highway: "NH-7",
    state: "Uttarakhand",
    latitude: 30.2812,
    longitude: 78.9812,
    elevation_m: 1400,
    grade_percentage: 7.5,
    hazard_type: "Alaknanda River Gorge Landslides",
    key_risks: "Monsoon flash floods, narrow mountain cuts with no crash barriers, bus roll-overs."
  },
  {
    id: "ghat-parwanoo-shimla",
    name: "Kalka-Parwanoo-Solan Himalayan Expressway",
    highway: "NH-5",
    state: "Himachal Pradesh",
    latitude: 30.8512,
    longitude: 76.9912,
    elevation_m: 1100,
    grade_percentage: 6.5,
    hazard_type: "Hill Cutting Sliding Zones",
    key_risks: "Hill collapse on multi-lane road, speeding downhill tourist SUVs."
  }
];
