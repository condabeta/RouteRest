"""Free driving directions via the public OSRM demo server.

OSRM (Open Source Routing Machine) provides a free, keyless routing API:
http://project-osrm.org/docs/v5.24.0/api/
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import requests

from .geocoding import GeoPoint

OSRM_URL = "https://router.project-osrm.org/route/v1/driving"

METERS_PER_MILE = 1609.344


class RoutingError(Exception):
    pass


@dataclass
class RouteLeg:
    """A single leg of the route between two waypoints."""

    distance_miles: float
    geometry: list = field(default_factory=list)  # [[lat, lon], ...]
    steps: list = field(default_factory=list)  # turn-by-turn instruction dicts


@dataclass
class Route:
    legs: list  # list[RouteLeg]
    total_distance_miles: float
    geometry: list  # combined [[lat, lon], ...]

    def as_dict(self) -> dict:
        return {
            "total_distance_miles": round(self.total_distance_miles, 1),
            "geometry": self.geometry,
            "legs": [
                {
                    "distance_miles": round(leg.distance_miles, 1),
                    "steps": leg.steps,
                }
                for leg in self.legs
            ],
        }


def _decode_geometry(geojson_geometry: dict) -> list:
    """Convert OSRM GeoJSON [lon, lat] coords to [lat, lon] for Leaflet."""
    coords = geojson_geometry.get("coordinates", [])
    return [[lat, lon] for lon, lat in coords]


# Human-readable phrasing for OSRM maneuver modifiers.
_MODIFIER_DIR = {
    "left": "left",
    "slight left": "slightly left",
    "sharp left": "sharp left",
    "right": "right",
    "slight right": "slightly right",
    "sharp right": "sharp right",
    "straight": "straight",
    "uturn": "around (U-turn)",
}


def _instruction_text(step: dict) -> str:
    """Turn one OSRM step into a plain-English driving instruction."""
    maneuver = step.get("maneuver", {})
    mtype = maneuver.get("type", "")
    modifier = maneuver.get("modifier", "")
    road = step.get("name") or ""

    onto = f" onto {road}" if road else ""
    along = f" on {road}" if road else ""

    if mtype == "depart":
        return (f"Head out{along}").strip()
    if mtype == "arrive":
        return "Arrive at your destination"
    if mtype in ("merge", "on ramp", "off ramp"):
        verb = "Take the ramp" if "ramp" in mtype else "Merge"
        direction = _MODIFIER_DIR.get(modifier)
        dir_txt = f" {direction}" if direction else ""
        return (f"{verb}{dir_txt}{onto}").strip()
    if mtype in ("roundabout", "rotary"):
        exit_no = maneuver.get("exit")
        exit_txt = f", take exit {exit_no}" if exit_no else ""
        return (f"Enter the roundabout{exit_txt}{onto}").strip()
    if mtype == "new name":
        return (f"Continue{along}").strip()
    if mtype == "continue":
        direction = _MODIFIER_DIR.get(modifier)
        dir_txt = (
            f" {direction}" if direction and direction != "straight" else ""
        )
        return (f"Continue{dir_txt}{along}").strip()
    if mtype in ("turn", "end of road", "fork"):
        direction = _MODIFIER_DIR.get(modifier, modifier or "ahead")
        return (f"Turn {direction}{onto}").strip()
    # Best-effort fallback.
    direction = _MODIFIER_DIR.get(modifier)
    dir_txt = f" {direction}" if direction else ""
    return (f"Continue{dir_txt}{along}").strip()


# Maneuvers worth surfacing on their own line; everything else is treated as
# "stay on the road" and folded into the running distance.
_SIGNIFICANT = {
    "turn", "end of road", "fork", "merge", "on ramp", "off ramp",
    "roundabout", "rotary", "depart", "arrive",
}


def _parse_steps(leg: dict) -> list:
    """Build a compact, human-readable turn-by-turn list.

    OSRM emits a maneuver for every road-name change, which on an interstate
    drive can be over a thousand near-meaningless "continue" steps. We keep
    only the significant maneuvers (turns, ramps, merges, depart/arrive) and
    fold the distance of the intervening road into the preceding instruction,
    so each line reads like a real direction: "Merge onto I-10 E — 412 mi".
    """
    out = []
    for step in leg.get("steps", []):
        mtype = step.get("maneuver", {}).get("type", "")
        dist_m = step.get("distance", 0.0)

        # Fold non-significant maneuvers into the previous instruction's
        # remaining distance (you keep driving the same way).
        if mtype not in _SIGNIFICANT:
            if out:
                out[-1]["_m"] += dist_m
            continue

        text = _instruction_text(step)
        if not text:
            continue
        out.append({
            "text": text,
            "road": step.get("name") or "",
            # distance covered AFTER this maneuver, accumulated below
            "_m": dist_m,
        })

    # Finalise: convert accumulated meters to miles, drop the internal field.
    cleaned = []
    for s in out:
        cleaned.append({
            "text": s["text"],
            "road": s["road"],
            "distance_miles": round(s["_m"] / METERS_PER_MILE, 1),
        })
    return cleaned


def get_route(points: list) -> Route:
    """Route through an ordered list of GeoPoints.

    Returns a Route with one RouteLeg per consecutive pair of points.
    """
    if len(points) < 2:
        raise RoutingError("At least two points are required for a route.")

    coord_str = ";".join(f"{p.lon},{p.lat}" for p in points)
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",  # request turn-by-turn maneuvers
        "annotations": "false",
    }
    last_exc = None
    resp = None
    for attempt in range(3):  # retry transient network failures
        try:
            resp = requests.get(f"{OSRM_URL}/{coord_str}", params=params, timeout=30)
            break
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < 2:
                time.sleep(0.6)
    if resp is None:
        raise RoutingError(
            "The routing service is temporarily unreachable. Please try again."
        ) from last_exc

    try:
        data = resp.json()
    except ValueError:
        raise RoutingError(
            "The routing service returned an unexpected response. Please try again."
        )

    # OSRM replies with a JSON `code` even on 4xx (e.g. NoRoute / InvalidQuery).
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(
            "Couldn't find a drivable route between those locations. Make sure "
            "each one is a U.S. city connected by road — pick from the "
            "suggestions as you type (avoid overseas territories like Hawaii or "
            "American Samoa, which aren't reachable by road)."
        )

    route = data["routes"][0]
    full_geometry = _decode_geometry(route["geometry"])

    legs = []
    for leg in route.get("legs", []):
        legs.append(
            RouteLeg(
                distance_miles=leg["distance"] / METERS_PER_MILE,
                steps=_parse_steps(leg),
            )
        )

    total_distance_miles = route["distance"] / METERS_PER_MILE

    return Route(
        legs=legs,
        total_distance_miles=total_distance_miles,
        geometry=full_geometry,
    )
