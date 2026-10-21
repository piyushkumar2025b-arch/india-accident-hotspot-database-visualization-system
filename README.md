# 🗺️ India Accident Hotspot Database & Visualization System

> A production-grade, database-driven geospatial analytics platform for mapping, filtering, and analyzing high-risk road accident corridors across India. Built with **React + Express + PostgreSQL (Supabase)** and **Leaflet GIS**, with Row Level Security, real-time telemetry, and an administrator portal for full CRUD management.

---

## 📖 About the Project

Every year, thousands of lives are lost on Indian highways, expressways, and urban corridors. Identifying *where* and *why* accidents cluster is the first step toward preventing them.

The **India Accident Hotspot System** turns raw accident data into actionable intelligence. It ingests, normalizes, and visualizes accident black-spots on an interactive map, exposes powerful filtering and analytics, and equips administrators with a secure portal to manage records, import CSV datasets, and monitor telemetry — all backed by a hardened PostgreSQL schema with Row Level Security (RLS).

Whether you're a transport planner, researcher, developer, or public-safety officer, this system gives you a clear, evidence-based view of India's most dangerous road corridors.

---

## ✨ Key Features

| Feature | What it does |
|---------|--------------|
| **🗺️ Interactive GIS Map** | Leaflet-powered map of India showing accident hotspots as clustered markers with rich popups (location, highway corridor, casualties, risk tier, dominant cause). |
| **🔍 Live Filtering** | Filter hotspots by state, district (cascading), risk tier, month, year, road type, cause, and free-text search — all in real time. |
| **📊 Analytics Dashboard** | KPI telemetry (accidents, deaths, injuries), monthly casualty trends, and root-cause distribution charts. |
| **🔐 Administrator Portal** | Secure login (Supabase Auth), role-based access (admin), full CRUD over accident records, and a map-based location picker. |
| **📥 CSV Ingestion** | Drag-and-drop CSV import with schema validation, coordinate range checks, casualty verification, and batch import with error logging. |
| **🛡️ Database-Grade Design** | Normalized 3NF PostgreSQL schema, automated RLS policies, indexes, views, and seed functions — production-ready DBMS foundation. |
| **🌐 Open Data Integration** | OpenStreetMap Nominatim geocoding and Open-Meteo live weather telemetry proxy. |
| **⚡ Local-First Dev** | Runs entirely on `localhost:3000` via a single `npm run dev` command — no cloud setup required to get started. |


---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATION LAYER                       │
│  index.html  (Public Map)      login.html  (Admin Login)            │
│  admin.html  (Admin Portal)                                          │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTP / REST
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER  (server.ts)                  │
│  /api/hotspots · /api/reference-data · /api/analytics/*             │
│  /api/telemetry · /api/auth/demo-admin · /api/supabase/*            │
└────────────────────┬────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐       ┌──────────────────┐
│  PGlite DB    │       │  Supabase /      │
│  (local engine│       │  PostgreSQL      │
│   + real data)│       │  (RLS + Auth)    │
└───────────────┘       └──────────────────┘
```

### Tech Stack

**Frontend**
- React 19 · Vite · Tailwind CSS · Lucide React · Framer Motion
- Leaflet GIS (geospatial visualization) · Vanilla JS modules for map, filters, analytics, auth, and CSV import

**Backend**
- Node.js · Express · TypeScript · tsx (dev server)
- PGlite (embedded PostgreSQL-compatible engine) · dotenv

**Database / Auth**
- Supabase (PostgreSQL + Auth + Realtime)
- Row Level Security (RLS) · Normalized 3NF schema · Indexes · Views · Seed functions

**External APIs**
- Google Maps Platform (Maps JavaScript API)
- OpenStreetMap Nominatim (geocoding)
- Open-Meteo (live weather telemetry)
- Google Gemini AI (optional AI features)

---

## 🚀 Quick Start (Localhost)

Prerequisites: **Node.js 18+** and **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy the example and fill in your keys (Google Maps, Supabase).
# A working .env is already provided for local demo use.
cp .env.example .env

# 3. Launch the development server
npm run dev
```

The app will be live at **`http://localhost:3000`**:

- **Public Map:** `http://localhost:3000/` (`index.html`)
- **Admin Login:** `http://localhost:3000/login.html`
- **Admin Portal:** `http://localhost:3000/admin.html`
- **Health Check:** `http://localhost:3000/api/health`

> The dev server (`npm run dev`) runs Express with Vite HMR middleware — the frontend hot-reloads as you edit, and the API is served from the same port.

### Production Build

```bash
npm run build     # Build client (Vite) + bundle server (esbuild)
npm start         # Run the production server (node dist/server.cjs)
```

---

## 🔧 Configuration

Create a `.env` file at the project root (see `.env.example` for the template):

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project REST URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase public anon key (browser-safe) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional service-role key for admin bypass | No |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform API key | Yes (for maps) |
| `APP_URL` | Public URL of the app (e.g. `http://localhost:3000`) | No |
| `GEMINI_API_KEY` | Google Gemini API key (optional AI features) | No |
| `PORT` | Server port (default `3000`) | No |

Find your Supabase credentials in **Supabase Dashboard → Project Settings → API**.  
Find your Google Maps key in **Google Cloud Console → APIs & Services → Credentials**.

---

## 🗄️ Database Setup (SQL)

The `sql/` folder contains the full PostgreSQL schema for deployment to Supabase:

1. `sql/schema.sql` — Core tables (locations, accidents, states, districts, etc.)
2. `sql/seed_reference_data.sql` — States, districts, road types, causes, weather
3. `sql/seed_sample_accidents.sql` — Sample accident records (labeled demo data)
4. `sql/views.sql` — Analytics views
5. `sql/indexes.sql` — Performance indexes
6. `sql/rls.sql` — Row Level Security policies
7. `sql/functions.sql` — Database functions
8. `sql/enable_realtime_and_views.sql` — Realtime + view setup
9. `sql/all_in_one_setup.sql` — Complete combined setup script

Run these in order against your Supabase project via the **SQL Editor**.

---

## 👥 User Guide

### Public User — Interactive Map (`index.html`)
1. Open the map and pan/zoom across India.
2. Click any hotspot marker to open a detailed popup:
   - Exact location & highway corridor
   - District and state
   - Total accidents, deaths, and injuries
   - Highest-risk month & dominant cause
   - Road classification & hotspot risk score/badge
3. Use the live filters (state → district → tier → month/year → search) to narrow results.
4. Pull up the **Bottom Insights Drawer** for ranked dangerous corridors and monthly trend graphs.
5. Open the **DBMS Specification Modal** from the nav to inspect the 3NF schema, scoring formula, and RLS architecture.

### Administrator — Portal (`admin.html`)
1. Log in via `login.html` (Supabase email/password, admin role required).
2. Dashboard: view real-time KPI cards (accidents, fatalities, injuries, corridor points).
3. CRUD Studio: paginated records, search incidents, edit or delete reports with confirmation safeguards.
4. Map-based location picker: search any town/highway via OpenStreetMap Nominatim or click the mini-map to auto-populate lat/lng.
5. CSV Pipeline: drag-and-drop a dataset, validate headers, verify coordinates/casualties, and batch import into Supabase.

---

## 📁 Project Structure

```
india-accident-hotspot-system/
├── index.html             # Public map application
├── login.html             # Admin login page
├── admin.html             # Admin portal
├── .env.example           # Environment variable template
├── package.json           # Scripts & dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite build config
├── server.ts              # Express API + Vite dev middleware entrypoint
├── server/                # Backend modules
│   ├── db.ts              # In-memory PGlite database engine
│   ├── real_data.ts       # Verified MoRTH black-spot data
│   ├── data_*.ts          # Regional corridor datasets
│   ├── external_fetcher.ts# Live external data fetcher
│   └── supabase_bridge.ts # Supabase connectivity bridge
├── js/                    # Frontend modules (map, filters, analytics, auth, import, config...)
├── css/                   # Stylesheets (map, style, admin)
├── data/                  # Static data assets & sample CSVs
├── sql/                   # PostgreSQL schema, seeds, RLS, views, indexes
├── src/                   # React source (App.tsx, main.tsx, index.css)
├── dist/                  # Production build output
└── public/                # Public static assets
```

---

## 📜 Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx server.ts` | Start dev server with Vite HMR on `:3000` |
| `build` | `vite build && esbuild server.ts` | Build client + bundle server for production |
| `start` | `node dist/server.cjs` | Run production server |
| `preview` | `vite preview` | Preview production client build |
| `clean` | `rm -rf dist server.js` | Remove build artifacts |
| `lint` | `tsc --noEmit` | Type-check the project |

---

## 🤝 Contributing

Contributions are welcome! Whether it's fixing a bug, improving the map UI, adding new analytics, or expanding the accident dataset:

1. Fork the repo and create your feature branch (`git checkout -b feature/your-idea`).
2. Make your changes and run `npm run lint` to type-check.
3. Commit with a clear message (`git commit -m "feat: add ..."`).
4. Push and open a pull request.

Please keep data honesty in mind: any sample or demo records must be clearly labeled as such.

---

## 📄 License

This project is released as a DBMS academic/portfolio project. See the repository for license details.

---

## 🙏 Acknowledgments

- **Ministry of Road Transport & Highways (MoRTH)** — Road Accidents in India publications
- **National Highways Authority of India (NHAI)** — Black-spot engineering audits
- **OpenStreetMap / Nominatim** — Open geocoding
- **Open-Meteo** — Live weather data
- **Supabase** — PostgreSQL + Auth platform
- **Leaflet** — Open-source JavaScript mapping library

---

<div align="center">
  <b>Built for safer Indian roads 🇮🇳</b><br>
  India Accident Hotspot Database & Visualization System
</div>
