# 🎥 RouteRest — Full Loom Script (≈ 4 minutes)

Read the **SAY** lines out loud; do the **[DO]** actions on screen.
Before recording: open the **live site** (https://route-rest.vercel.app/) in one
browser tab, and your **code editor** in another window. Take a breath, then start.

---

## 0. Before you hit record (setup checklist)
- [ ] Live site loaded and working (plan one trip first so the backend is warm).
- [ ] Editor open to the project.
- [ ] Close noisy tabs / notifications.

---

## 1. Intro — 25 sec
**[DO]** Show the live site (the "Plan a Trip" screen).

**SAY:**
> "Hi! This is **RouteRest**, a full-stack app I built with **Django and React**
> that helps U.S. truck drivers plan a trip that stays within the federal
> **Hours-of-Service** rules.
> You give it four things — your current location, pickup, drop-off, and how many
> on-duty hours you've already used — and it returns a **mapped route with all the
> required stops**, plus **fully drawn daily ELD log sheets**."

---

## 2. Live demo — 90 sec
**[DO]** Type in the form (use the autocomplete and pick the suggestions):
- Current: **Los Angeles, California**
- Pickup: **Phoenix, Arizona**
- Drop-off: **Dallas, Texas**
- Cycle used: **8**

**SAY (while typing):**
> "I'll plan a trip from **Los Angeles**, picking up in **Phoenix**, dropping off
> in **Dallas**, and I'll say I've already used **8 hours** of my cycle.
> The location box autocompletes real U.S. cities."

**[DO]** Click **Generate route & logs**. Wait for results.

**SAY:**
> "It geocodes the cities, gets a real driving route, and runs the
> Hours-of-Service simulation."

**[DO]** Point at the **Route Map**.

**SAY:**
> "Here's the route on the map. The colored pins are my start, pickup, and
> drop-off, and the smaller dots are the stops the app scheduled for me —
> **fuel stops, 30-minute breaks, and 10-hour rests**."

**[DO]** Point at the **HOS Compliance** card.

**SAY:**
> "This panel is my favorite part — it **re-checks the generated plan** and
> confirms every limit was respected: the 11-hour driving limit, the 14-hour
> window, the 30-minute break, fuel every thousand miles, and the 70-hour cycle.
> All green."

**[DO]** Point at **Trip Summary**, then scroll to **Itinerary & Stops**.

**SAY:**
> "On the left is the trip summary — total distance, driving time, number of log
> days. And here's the full itinerary, every stop with its time and mileage."

**[DO]** Scroll to **Daily Log Sheets**. Click through the **Day 1 / Day 2 / Day 3** tabs, then **Show all days**.

**SAY:**
> "And these are the daily log sheets, drawn in the official FMCSA format —
> the duty-status graph, the totals on the right, the carrier and shipping
> fields, and remarks. Because this trip takes a few days, it automatically
> creates **one sheet per day**."

---

## 3. How it stays legal (plain English) — 45 sec
**[DO]** Keep a log sheet on screen and trace the line with your cursor.

**SAY:**
> "Quickly, the rules it follows: a driver can drive up to **11 hours**, then
> must take **10 hours off** — you can see that drive-then-rest pattern on the
> graph. Their total **on-duty time can't pass 70 hours over 8 days**; when it
> does, the app schedules a **34-hour restart** to reset the cycle. It also adds
> a fuel stop at least every **1,000 miles**, and an hour each for pickup and
> drop-off."

**SAY (important disclaimer):**
> "Per the assignment, this assumes a property-carrying driver on the 70-hour
> 8-day cycle with no adverse conditions, at an average 55 mph. It follows the
> major FMCSA limits — it's a solid planning aid, not a legal compliance tool."

---

## 4. Quick code tour — 60 sec
**[DO]** Switch to your editor. Open `backend/trips/services/hos_planner.py`.

**SAY:**
> "On the backend, this is the Hours-of-Service engine. It walks a virtual clock
> forward through the trip and inserts a break, a rest, or a 34-hour restart the
> moment a limit would be crossed, then slices the timeline into 24-hour days for
> the log sheets."

**[DO]** Briefly open `trips/services/routing.py` and `geocoding.py`.

**SAY:**
> "Routing and geocoding use free, keyless APIs — OSRM and OpenStreetMap — with
> retry handling so a temporary blip doesn't break the request."

**[DO]** Open `frontend/src/components/LogSheet.jsx`.

**SAY:**
> "On the frontend, the log sheet is drawn as an SVG — the grid, the duty-status
> line, totals, and the FMCSA fields. The rest of the React app is the form, the
> Leaflet map, and the results."

**[DO]** Optional: open `backend/trips/tests.py`.

**SAY (optional):**
> "And the HOS rules are covered by unit tests."

---

## 5. Wrap — 20 sec
**[DO]** Back to the live site.

**SAY:**
> "It's deployed live — the React frontend on **Vercel**, the Django backend on
> **PythonAnywhere** — and the code's on GitHub. Thanks for watching!"

---

### Tips for a clean take
- Plan **one trip before recording** so the backend is awake (no cold-start wait).
- If you fumble, pause 2 seconds and repeat the line — easy to trim later.
- Keep it under 5 minutes; ~4 is perfect.
