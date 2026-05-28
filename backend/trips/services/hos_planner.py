"""Hours-of-Service (HOS) planning engine.

Implements the federal property-carrying driver rules used by the
assessment (49 CFR Part 395), assuming a 70-hour / 8-day cycle and no
adverse driving conditions:

  * 11-hour driving limit per shift
  * 14-hour on-duty "driving window" per shift
  * 30-minute break required after 8 cumulative hours of driving
  * 70-hour / 8-day on-duty limit (with optional 34-hour restart)
  * 10 consecutive hours off duty to reset the daily limits

Trip assumptions baked in:
  * Average driving speed of 55 mph
  * 1 hour on duty (not driving) for pickup, 1 hour for drop-off
  * A fuel stop (~30 min on duty) at least every 1,000 miles

The engine walks a virtual clock forward, emitting a flat list of duty
segments. Each segment carries an absolute start/end time, a duty status,
and a human-readable label. The segments are later sliced into 24-hour
calendar days to draw the ELD log sheets.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

# ---- Tunable assumptions ---------------------------------------------------
AVERAGE_SPEED_MPH = 55.0
PICKUP_HOURS = 1.0
DROPOFF_HOURS = 1.0
FUEL_STOP_HOURS = 0.5
MILES_BETWEEN_FUEL = 1000.0

# ---- Regulatory limits (70/8 property-carrying) ---------------------------
MAX_DRIVE_PER_SHIFT = 11.0
MAX_WINDOW_PER_SHIFT = 14.0
DRIVE_BEFORE_BREAK = 8.0
BREAK_DURATION = 0.5
DAILY_RESET_OFF_HOURS = 10.0
CYCLE_LIMIT_HOURS = 70.0
RESTART_HOURS = 34.0

# Duty statuses (match the four rows of the ELD grid).
OFF_DUTY = "off_duty"
SLEEPER = "sleeper_berth"
DRIVING = "driving"
ON_DUTY = "on_duty"

# A tiny tolerance so float rounding never causes a phantom violation.
EPS = 1e-6


@dataclass
class Segment:
    status: str
    start: datetime
    end: datetime
    label: str
    location: str | None = None

    @property
    def hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600.0

    def as_dict(self) -> dict:
        return {
            "status": self.status,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "label": self.label,
            "location": self.location,
            "hours": round(self.hours, 3),
        }


@dataclass
class Stop:
    """A notable point along the route, surfaced on the map and itinerary."""

    kind: str  # start | pickup | dropoff | fuel | rest | break
    label: str
    location: str | None
    arrive: datetime
    depart: datetime
    distance_miles: float  # cumulative trip miles at this stop

    def as_dict(self) -> dict:
        return {
            "kind": self.kind,
            "label": self.label,
            "location": self.location,
            "arrive": self.arrive.isoformat(),
            "depart": self.depart.isoformat(),
            "distance_miles": round(self.distance_miles, 1),
        }


@dataclass
class HOSState:
    clock: datetime
    cycle_used: float            # hours used toward the 70/8 limit
    drive_today: float = 0.0     # hours driven this shift (toward 11)
    window_used: float = 0.0     # hours since shift start (toward 14)
    drive_since_break: float = 0.0  # driving hours since last 30-min break
    segments: list = field(default_factory=list)
    stops: list = field(default_factory=list)
    miles_since_fuel: float = 0.0
    total_miles: float = 0.0


class HOSPlanner:
    def __init__(self, start_time: datetime, cycle_used: float):
        self.state = HOSState(clock=start_time, cycle_used=cycle_used)

    # -- low level helpers --------------------------------------------------
    def _add_segment(self, status: str, hours: float, label: str,
                     location: str | None = None) -> None:
        if hours <= EPS:
            return
        s = self.state
        seg = Segment(
            status=status,
            start=s.clock,
            end=s.clock + timedelta(hours=hours),
            label=label,
            location=location,
        )
        # Merge consecutive identical-status, same-label segments so the log
        # stays clean (e.g. driving split only by limit checks).
        if (
            s.segments
            and s.segments[-1].status == status
            and s.segments[-1].label == label
            and s.segments[-1].end == seg.start
        ):
            s.segments[-1].end = seg.end
        else:
            s.segments.append(seg)
        s.clock = seg.end

    def _take_daily_reset(self, location: str | None) -> None:
        """10 consecutive hours off duty -> reset 11h, 14h and break clocks."""
        s = self.state
        arrive = s.clock
        self._add_segment(
            SLEEPER, DAILY_RESET_OFF_HOURS,
            "10-hour rest (off duty)", location,
        )
        s.drive_today = 0.0
        s.window_used = 0.0
        s.drive_since_break = 0.0
        s.stops.append(Stop(
            kind="rest",
            label="10-hour off-duty rest",
            location=location,
            arrive=arrive,
            depart=s.clock,
            distance_miles=s.total_miles,
        ))

    def _take_restart(self, location: str | None) -> None:
        """34-hour restart -> reset the weekly cycle and the daily clocks."""
        s = self.state
        arrive = s.clock
        self._add_segment(
            OFF_DUTY, RESTART_HOURS,
            "34-hour restart (off duty)", location,
        )
        s.cycle_used = 0.0
        s.drive_today = 0.0
        s.window_used = 0.0
        s.drive_since_break = 0.0
        s.stops.append(Stop(
            kind="rest",
            label="34-hour cycle restart",
            location=location,
            arrive=arrive,
            depart=s.clock,
            distance_miles=s.total_miles,
        ))

    def _take_break(self, location: str | None) -> None:
        """30-minute break (off duty) after 8 cumulative driving hours."""
        s = self.state
        arrive = s.clock
        self._add_segment(
            OFF_DUTY, BREAK_DURATION,
            "30-minute break", location,
        )
        s.drive_since_break = 0.0
        s.window_used += BREAK_DURATION
        s.stops.append(Stop(
            kind="break",
            label="30-minute break",
            location=location,
            arrive=arrive,
            depart=s.clock,
            distance_miles=s.total_miles,
        ))

    # -- on-duty (not driving) work ----------------------------------------
    def _do_on_duty_work(self, hours: float, label: str,
                         location: str | None, kind: str) -> None:
        """Perform on-duty-not-driving work (pickup, drop-off, fueling),
        inserting a rest/restart first if the window or cycle can't fit it."""
        s = self.state
        # If the work won't fit in the remaining window, rest first.
        if s.window_used + hours > MAX_WINDOW_PER_SHIFT + EPS:
            self._take_daily_reset(location)
        # If the work won't fit in the remaining cycle, restart first.
        if s.cycle_used + hours > CYCLE_LIMIT_HOURS + EPS:
            self._take_restart(location)

        arrive = s.clock
        self._add_segment(ON_DUTY, hours, label, location)
        s.window_used += hours
        s.cycle_used += hours
        if kind:
            s.stops.append(Stop(
                kind=kind,
                label=label,
                location=location,
                arrive=arrive,
                depart=s.clock,
                distance_miles=s.total_miles,
            ))

    # -- driving ------------------------------------------------------------
    def _drive_distance(self, miles: float, leg_label: str,
                        dest_location: str | None) -> None:
        """Drive a leg of `miles`, inserting fuel stops, breaks, daily rests
        and 34-hour restarts exactly when the HOS limits require them."""
        s = self.state
        hours_remaining = miles / AVERAGE_SPEED_MPH

        while hours_remaining > EPS:
            # 1. Weekly cycle exhausted -> 34-hour restart.
            if s.cycle_used >= CYCLE_LIMIT_HOURS - EPS:
                self._take_restart(dest_location)
                continue
            # 2. Daily driving or window exhausted -> 10-hour rest.
            if (
                s.drive_today >= MAX_DRIVE_PER_SHIFT - EPS
                or s.window_used >= MAX_WINDOW_PER_SHIFT - EPS
            ):
                self._take_daily_reset(dest_location)
                continue
            # 3. 8 hours of driving since last break -> 30-minute break.
            if s.drive_since_break >= DRIVE_BEFORE_BREAK - EPS:
                self._take_break(dest_location)
                continue

            # How long can we legally drive in one continuous push?
            drivable = min(
                hours_remaining,
                MAX_DRIVE_PER_SHIFT - s.drive_today,
                MAX_WINDOW_PER_SHIFT - s.window_used,
                DRIVE_BEFORE_BREAK - s.drive_since_break,
                CYCLE_LIMIT_HOURS - s.cycle_used,
            )
            # Don't drive past the next fuel stop.
            miles_to_fuel = MILES_BETWEEN_FUEL - s.miles_since_fuel
            hours_to_fuel = miles_to_fuel / AVERAGE_SPEED_MPH
            fuel_now = False
            if hours_to_fuel <= drivable + EPS:
                drivable = hours_to_fuel
                fuel_now = True

            if drivable <= EPS:
                # No progress possible without a stop; loop will insert one.
                continue

            driven_miles = drivable * AVERAGE_SPEED_MPH
            self._add_segment(DRIVING, drivable, leg_label, dest_location)
            s.drive_today += drivable
            s.window_used += drivable
            s.drive_since_break += drivable
            s.cycle_used += drivable
            s.miles_since_fuel += driven_miles
            s.total_miles += driven_miles
            hours_remaining -= drivable

            if fuel_now and hours_remaining > EPS:
                self._fuel_stop(dest_location)

    def _fuel_stop(self, location: str | None) -> None:
        self.state.miles_since_fuel = 0.0
        self._do_on_duty_work(
            FUEL_STOP_HOURS, "Fuel stop", location, kind="fuel",
        )


def _round_segments(segments: list) -> list:
    return [seg.as_dict() for seg in segments]


def _build_daily_logs(segments: list, start_day: datetime) -> list:
    """Slice the flat segment list into 24-hour calendar days for the ELD
    grid. Each day reports its per-status hour totals and the segments
    (clamped to that day) needed to draw the grid lines.

    The timeline is padded with off-duty time before the shift starts and
    after the trip ends so every log sheet totals exactly 24 hours, as the
    FMCSA grid requires."""
    if not segments:
        return []

    day_start = datetime(
        start_day.year, start_day.month, start_day.day,
        tzinfo=start_day.tzinfo,
    )

    # Pad the front (midnight of day 1 -> first segment) and the back
    # (last segment -> following midnight) with off-duty time.
    segments = list(segments)
    first = segments[0]
    if first.start > day_start:
        segments.insert(0, Segment(
            status=OFF_DUTY, start=day_start, end=first.start,
            label="Off duty",
        ))
    last = segments[-1]
    final_midnight = datetime(
        last.end.year, last.end.month, last.end.day,
        tzinfo=last.end.tzinfo,
    ) + timedelta(days=1)
    if final_midnight > last.end:
        segments.append(Segment(
            status=OFF_DUTY, start=last.end, end=final_midnight,
            label="Off duty",
        ))

    last_end = segments[-1].end
    days = []
    cursor = day_start
    while cursor < last_end:
        next_day = cursor + timedelta(days=1)
        day_segments = []
        totals = {OFF_DUTY: 0.0, SLEEPER: 0.0, DRIVING: 0.0, ON_DUTY: 0.0}

        for seg in segments:
            seg_start = max(seg.start, cursor)
            seg_end = min(seg.end, next_day)
            if seg_end <= seg_start:
                continue
            hours = (seg_end - seg_start).total_seconds() / 3600.0
            totals[seg.status] += hours
            day_segments.append({
                "status": seg.status,
                # Fractional hours-from-midnight, used to place grid lines.
                "start_hour": (seg_start - cursor).total_seconds() / 3600.0,
                "end_hour": (seg_end - cursor).total_seconds() / 3600.0,
                "label": seg.label,
                "location": seg.location,
            })

        if day_segments:
            days.append({
                "date": cursor.date().isoformat(),
                "segments": day_segments,
                "totals": {k: round(v, 2) for k, v in totals.items()},
                "total_hours": round(sum(totals.values()), 2),
                "driving_miles": round(
                    totals[DRIVING] * AVERAGE_SPEED_MPH, 1
                ),
            })
        cursor = next_day

    return days


def plan_trip(
    *,
    current,
    pickup,
    dropoff,
    route,
    cycle_used: float,
    start_time: datetime,
) -> dict:
    """Run the full simulation and return a JSON-serialisable plan.

    `current`, `pickup`, `dropoff` are GeoPoints; `route` is a Route whose
    legs are [current->pickup, pickup->dropoff].
    """
    planner = HOSPlanner(start_time=start_time, cycle_used=cycle_used)
    s = planner.state

    # Trip starts: record the origin as an on-duty pre-trip is implied by
    # the first driving segment; we log the start as a stop marker.
    s.stops.append(Stop(
        kind="start",
        label="Trip start",
        location=current.name,
        arrive=s.clock,
        depart=s.clock,
        distance_miles=0.0,
    ))

    leg_to_pickup = route.legs[0].distance_miles
    leg_to_dropoff = route.legs[1].distance_miles

    # 1. Drive to the pickup.
    planner._drive_distance(
        leg_to_pickup, "Driving to pickup", pickup.name,
    )
    # 2. Pickup (1 hour on duty).
    planner._do_on_duty_work(
        PICKUP_HOURS, "Pickup (loading)", pickup.name, kind="pickup",
    )
    # 3. Drive to the drop-off.
    planner._drive_distance(
        leg_to_dropoff, "Driving to drop-off", dropoff.name,
    )
    # 4. Drop-off (1 hour on duty).
    planner._do_on_duty_work(
        DROPOFF_HOURS, "Drop-off (unloading)", dropoff.name, kind="dropoff",
    )

    # End-of-trip marker.
    s.stops.append(Stop(
        kind="dropoff",
        label="Trip complete",
        location=dropoff.name,
        arrive=s.clock,
        depart=s.clock,
        distance_miles=s.total_miles,
    ))

    daily_logs = _build_daily_logs(s.segments, start_time)

    driving_hours = sum(
        seg.hours for seg in s.segments if seg.status == DRIVING
    )
    on_duty_hours = sum(
        seg.hours for seg in s.segments
        if seg.status in (DRIVING, ON_DUTY)
    )
    duration_hours = (s.segments[-1].end - s.segments[0].start).total_seconds() / 3600.0

    return {
        "summary": {
            "total_distance_miles": round(route.total_distance_miles, 1),
            "total_driving_hours": round(driving_hours, 2),
            "total_on_duty_hours": round(on_duty_hours, 2),
            "total_duration_hours": round(duration_hours, 2),
            "number_of_days": len(daily_logs),
            "cycle_used_start": round(cycle_used, 2),
            "cycle_used_end": round(s.cycle_used, 2),
            "start_time": start_time.isoformat(),
            "end_time": s.segments[-1].end.isoformat(),
            "fuel_stops": sum(1 for st in s.stops if st.kind == "fuel"),
            "rest_stops": sum(1 for st in s.stops if st.kind == "rest"),
            "average_speed_mph": AVERAGE_SPEED_MPH,
        },
        "segments": _round_segments(s.segments),
        "stops": [st.as_dict() for st in s.stops],
        "daily_logs": daily_logs,
    }
