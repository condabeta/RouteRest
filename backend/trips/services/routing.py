"""Free driving directions via the public OSRM demo server.

OSRM (Open Source Routing Machine) provides a free, keyless routing API:
http://project-osrm.org/docs/v5.24.0/api/
"""
from __future__ import annotations

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
                {"distance_miles": round(leg.distance_miles, 1)}
                for leg in self.legs
            ],
        }


def _decode_geometry(geojson_geometry: dict) -> list:
    """Convert OSRM GeoJSON [lon, lat] coords to [lat, lon] for Leaflet."""
    coords = geojson_geometry.get("coordinates", [])
    return [[lat, lon] for lon, lat in coords]


def get_route(points: list) -> Route:
    """Route through an ordered list of GeoPoints.

    Returns a Route with one RouteLeg per consecutive pair of points.
    """
    if len(points) < 2:
        raise RoutingError("At least two points are required for a route.")

    coord_str = ";".join(f"{p.lon},{p.lat}" for p in points)
    try:
        resp = requests.get(
            f"{OSRM_URL}/{coord_str}",
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "false",
                "annotations": "false",
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise RoutingError(f"Routing service unavailable: {exc}") from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(
            "Could not compute a driving route between the given locations."
        )

    route = data["routes"][0]
    full_geometry = _decode_geometry(route["geometry"])

    legs = []
    for leg in route.get("legs", []):
        legs.append(
            RouteLeg(distance_miles=leg["distance"] / METERS_PER_MILE)
        )

    total_distance_miles = route["distance"] / METERS_PER_MILE

    return Route(
        legs=legs,
        total_distance_miles=total_distance_miles,
        geometry=full_geometry,
    )
