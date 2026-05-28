# 🚛 RouteRest — HOS-Compliant Trip Planner & ELD Log Generator

A full-stack application that takes trip details as input and produces:

1. **A route map** with all required stops (pickup, drop-off, fueling, 30-minute
   breaks, and 10-hour rest periods) using free map APIs.
2. **Filled-out daily ELD log sheets** drawn to the FMCSA *Driver's Daily Log*
   format — one sheet per calendar day, automatically generating multiple sheets
   for longer trips.

Built with **Django REST Framework** (backend) and **React + Vite + Leaflet**
(frontend).

| | |
|---|---|
| **Live app** | _add your Vercel URL here_ |
| **Backend API** | _add your Render URL here_ |
| **Loom walkthrough** | _add your Loom URL here_ |

---

## ✨ Features

- **Four inputs**: current location, pickup, drop-off, current cycle hours used.
- **Interactive route map** (Leaflet + OpenStreetMap) with colored markers for
  origin/pickup/drop-off and intermediate fuel/rest/break stops, plus the full
  driving polyline.
- **Hours-of-Service simulation engine** implementing the federal
  property-carrying rules (49 CFR Part 395) for a 70hr/8day driver.
- **Auto-drawn ELD log sheets** — an SVG re-creation of the official grid with
  the four duty rows, the duty-status step line, per-row totals, and rotated
  city remarks at each duty change. Each sheet totals exactly 24 hours.
- **Itinerary timeline** listing every stop with arrival times and distances.
- **Print-ready** logs (`Print logs` button hides the UI chrome).
- Clean, responsive, professional UI.

---

## 🧠 Hours-of-Service rules implemented

Assumptions per the brief: property-carrying driver, **70 hrs / 8 days**, no
adverse driving conditions, fueling at least every **1,000 miles**, and **1 hour**
each for pickup and drop-off.

| Rule | Implementation |
|------|----------------|
| **11-hour driving limit** | Max 11 hrs driving per shift before a 10-hr reset. |
| **14-hour driving window** | No driving after 14 hrs from shift start. |
| **30-minute break** | Required after 8 cumulative hours of driving. |
| **70hr / 8-day limit** | Tracks the running cycle; starting hours are an input. |
| **34-hour restart** | Automatically inserted when the 70-hr cycle is exhausted. |
| **10-hour reset** | Inserted when the 11-hr or 14-hr limit is hit. |
| **Fuel stops** | ~30 min on-duty stop at least every 1,000 miles. |
| **Pickup / Drop-off** | 1 hour on-duty (not driving) each. |

Average driving speed is assumed to be **55 mph**. The engine walks a virtual
clock forward, emitting duty segments that are then sliced into 24-hour calendar
days for the log sheets.

The engine is covered by unit tests (`backend/trips/tests.py`) that assert no
shift exceeds 11 driving / 14 window hours, breaks and fuel stops appear when
required, the cycle limit triggers a restart, and every log day totals 24 hours.

---

## 🏗 Architecture

```
RouteRest/
├── backend/                 # Django + DRF API
│   ├── eld_backend/         # project settings / urls / wsgi
│   └── trips/
│       ├── models.py        # Trip model (inputs + cached plan JSON)
│       ├── serializers.py   # input validation
│       ├── views.py         # POST /api/plan/  ·  GET /api/trips/<id>/
│       ├── tests.py         # HOS engine unit tests (offline)
│       └── services/
│           ├── geocoding.py # Nominatim (free, keyless)
│           ├── routing.py   # OSRM (free, keyless)
│           └── hos_planner.py  # the HOS simulation engine
└── frontend/                # React + Vite
    └── src/
        ├── api.js
        ├── components/
        │   ├── TripForm.jsx
        │   ├── RouteMap.jsx       # Leaflet map
        │   ├── TripSummary.jsx
        │   ├── StopsTimeline.jsx
        │   ├── LogSheet.jsx       # SVG ELD grid
        │   └── LogSheets.jsx
        └── App.jsx
```

### Free APIs used (no keys required)
- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap)
- **Routing**: [OSRM](http://project-osrm.org/) public demo server
- **Map tiles**: OpenStreetMap / CARTO

---

## 🔌 API

### `POST /api/plan/`
```jsonc
// request
{
  "current_location": "Los Angeles, CA",
  "pickup_location": "Phoenix, AZ",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 10
}
```
```jsonc
// response (truncated)
{
  "id": 1,
  "plan": {
    "summary": { "total_distance_miles": 1438.1, "total_driving_hours": 26.15,
                 "number_of_days": 3, "fuel_stops": 1, "rest_stops": 2, ... },
    "route":   { "total_distance_miles": 1438.1, "geometry": [[lat,lon], ...] },
    "locations": { "current": {...}, "pickup": {...}, "dropoff": {...} },
    "stops":   [ { "kind": "fuel", "label": "...", "distance_miles": 1000, ... } ],
    "segments":[ { "status": "driving", "start": "...", "end": "...", ... } ],
    "daily_logs": [ { "date": "2026-05-28", "totals": {...}, "segments": [...] } ]
  }
}
```

### `GET /api/trips/<id>/`
Returns a previously-planned trip (the plan is cached on the row).

---

## 🚀 Local development

### Backend
```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate     macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py test          # runs the HOS engine unit tests
python manage.py runserver     # http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # http://127.0.0.1:5173
```
The frontend talks to `http://127.0.0.1:8000` by default. To point it at a
deployed backend, set `VITE_API_URL` (see `frontend/.env.example`).

---

## ☁️ Deployment

### Frontend → Vercel
1. Import the repo in Vercel, set **Root Directory** to `frontend`.
2. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Add env var `VITE_API_URL` = your backend URL.

### Backend → Render (free tier)
1. New **Web Service** from the repo, **Root Directory** `backend`.
2. Build command `./build.sh`, start command
   `gunicorn eld_backend.wsgi:application`.
3. Set env vars `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=*`,
   `CORS_ALLOW_ALL=True` (or `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`).

A `render.yaml` blueprint is included for one-click setup.

---

## 📝 Notes & assumptions
- Trips start the duty day at **08:00** home-terminal time on the current date.
- The 70hr/8day cycle is assumed; the "current cycle used" input seeds it.
- Distances/durations come from OSRM; HOS driving time uses a 55 mph average.
- This is a planning aid and a demonstration — not legal HOS advice.
