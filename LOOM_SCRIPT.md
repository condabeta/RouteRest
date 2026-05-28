# 🎥 Loom walkthrough script (3–5 min)

A suggested outline for the demo video.

## 1. Intro (20s)
- "This is RouteRest, a full-stack HOS-compliant trip planner built with Django
  and React."
- Show the landing page; point out the four inputs the brief asked for.

## 2. Live demo (90s)
- Click an example (e.g. *LA → Phoenix → Dallas*, cycle = 8 hrs), hit
  **Generate route & logs**.
- Walk through the results top-to-bottom:
  - **Summary stats**: distance, driving time, on-duty time, # log days, fuel
    stops, 10-hr rests, cycle used.
  - **Route map**: the driving polyline + A/P/D markers + fuel/rest/break pins.
  - **Itinerary**: every stop with times and trip mileage.
  - **Daily log sheets**: switch between Day 1/2/3 tabs, then "Show all days".
    Point out the duty-status line, the per-row totals summing to 24, and the
    city remarks at each duty change. Hit **Print logs**.

## 3. HOS accuracy (60s)
- Pick a long trip and show that:
  - Driving never exceeds 11 hrs before a 10-hr rest appears.
  - A 30-minute break shows up after 8 hrs of driving.
  - A fuel stop lands near every 1,000 miles.
  - If the cycle is near 70, a 34-hr restart is inserted.

## 4. Code tour (90s)
- **Backend** `trips/services/hos_planner.py`: the simulation loop — explain how
  it walks the clock forward and inserts breaks/rests/restarts at the limits.
- `trips/services/geocoding.py` + `routing.py`: free Nominatim + OSRM APIs.
- `trips/views.py`: the `/api/plan/` endpoint tying it together.
- `backend/trips/tests.py`: the unit tests proving the rules hold.
- **Frontend** `components/LogSheet.jsx`: how the SVG grid + duty line are drawn.
- `components/RouteMap.jsx`: the Leaflet map.

## 5. Wrap (20s)
- Mention deployment (Vercel frontend + Render backend) and that all map/routing
  APIs are free and keyless.
