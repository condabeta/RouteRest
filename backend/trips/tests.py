"""Tests for the HOS planning engine — these run offline (no network)."""
from datetime import datetime, time, timezone

from django.test import TestCase

from trips.services.geocoding import GeoPoint
from trips.services.routing import Route, RouteLeg
from trips.services.hos_planner import (
    AVERAGE_SPEED_MPH,
    CYCLE_LIMIT_HOURS,
    DRIVING,
    MAX_DRIVE_PER_SHIFT,
    MAX_WINDOW_PER_SHIFT,
    ON_DUTY,
    plan_trip,
)

START = datetime.combine(
    datetime(2026, 5, 28).date(), time(8), tzinfo=timezone.utc
)


def make_plan(leg1_miles, leg2_miles, cycle_used=0.0):
    current = GeoPoint("A", "A", 40.0, -75.0)
    pickup = GeoPoint("B", "B", 41.0, -75.0)
    dropoff = GeoPoint("C", "C", 42.0, -75.0)
    route = Route(
        legs=[
            RouteLeg(distance_miles=leg1_miles),
            RouteLeg(distance_miles=leg2_miles),
        ],
        total_distance_miles=leg1_miles + leg2_miles,
        geometry=[],
    )
    return plan_trip(
        current=current,
        pickup=pickup,
        dropoff=dropoff,
        route=route,
        cycle_used=cycle_used,
        start_time=START,
    )


class HOSPlannerTests(TestCase):
    def _drive_hours(self, plan):
        return sum(
            s["hours"] for s in plan["segments"] if s["status"] == DRIVING
        )

    def test_short_trip_single_day(self):
        # 100 + 50 miles -> ~2.7h driving + 2h pickup/dropoff = one day.
        plan = make_plan(100, 50)
        self.assertEqual(plan["summary"]["number_of_days"], 1)
        # No rest stops needed on a short trip.
        self.assertEqual(plan["summary"]["rest_stops"], 0)
        # Driving hours match distance / speed.
        self.assertAlmostEqual(
            self._drive_hours(plan), 150 / AVERAGE_SPEED_MPH, places=2
        )

    def test_driving_never_exceeds_11h_per_shift(self):
        # Long trip; verify no shift exceeds the 11-hour driving limit.
        plan = make_plan(1500, 1500)
        shift_drive = 0.0
        for seg in plan["segments"]:
            if seg["status"] == DRIVING:
                shift_drive += seg["hours"]
            elif "10-hour" in seg["label"] or "34-hour" in seg["label"]:
                self.assertLessEqual(
                    round(shift_drive, 3), MAX_DRIVE_PER_SHIFT + 1e-3
                )
                shift_drive = 0.0
        self.assertLessEqual(round(shift_drive, 3), MAX_DRIVE_PER_SHIFT + 1e-3)

    def test_fuel_stops_every_1000_miles(self):
        # 2400 total miles -> at least 2 fuel stops.
        plan = make_plan(1200, 1200)
        self.assertGreaterEqual(plan["summary"]["fuel_stops"], 2)

    def test_30_minute_break_inserted(self):
        # ~9h of continuous driving forces a 30-minute break.
        plan = make_plan(500, 0.0)
        labels = [s["label"] for s in plan["segments"]]
        self.assertIn("30-minute break", labels)

    def test_cycle_limit_triggers_restart(self):
        # Start with 68h used; a multi-day trip must trigger a 34h restart.
        plan = make_plan(1500, 1500, cycle_used=68)
        labels = [s["label"] for s in plan["segments"]]
        self.assertIn("34-hour restart (off duty)", labels)

    def test_pickup_and_dropoff_on_duty_hours(self):
        plan = make_plan(100, 100)
        on_duty_labels = [
            s for s in plan["segments"] if s["status"] == ON_DUTY
        ]
        labels = [s["label"] for s in on_duty_labels]
        self.assertIn("Pickup (loading)", labels)
        self.assertIn("Drop-off (unloading)", labels)

    def test_daily_totals_equal_24h(self):
        # With off-duty padding, every ELD log sheet must total 24 hours.
        plan = make_plan(1500, 1500)
        for day in plan["daily_logs"]:
            self.assertAlmostEqual(day["total_hours"], 24.0, places=1)

    def test_short_trip_day_totals_24h(self):
        plan = make_plan(100, 50)
        self.assertAlmostEqual(
            plan["daily_logs"][0]["total_hours"], 24.0, places=1
        )

    def test_window_not_exceeded_with_driving(self):
        # Driving must never occur past the 14-hour window in a shift.
        plan = make_plan(2000, 0)
        window = 0.0
        for seg in plan["segments"]:
            if "10-hour" in seg["label"] or "34-hour" in seg["label"]:
                window = 0.0
            else:
                window += seg["hours"]
                if seg["status"] == DRIVING:
                    self.assertLessEqual(
                        round(window, 3), MAX_WINDOW_PER_SHIFT + 1e-3
                    )
