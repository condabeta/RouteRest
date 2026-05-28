"""Free geocoding via OpenStreetMap's Nominatim service.

Nominatim is free and requires no API key, only a descriptive User-Agent
per its usage policy: https://operations.osmfoundation.org/policies/nominatim/
"""
from __future__ import annotations

from dataclasses import dataclass

import requests
from django.conf import settings

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


class GeocodingError(Exception):
    pass


@dataclass
class GeoPoint:
    query: str
    name: str
    lat: float
    lon: float

    def as_dict(self) -> dict:
        return {
            "query": self.query,
            "name": self.name,
            "lat": self.lat,
            "lon": self.lon,
        }


def geocode(query: str) -> GeoPoint:
    """Resolve a free-text place into a GeoPoint, or raise GeocodingError."""
    query = (query or "").strip()
    if not query:
        raise GeocodingError("Location is empty.")

    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "json",
                "limit": 1,
                "addressdetails": 0,
            },
            headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise GeocodingError(f"Geocoding service unavailable: {exc}") from exc

    if not data:
        raise GeocodingError(f"Could not find a location for '{query}'.")

    top = data[0]
    return GeoPoint(
        query=query,
        name=top.get("display_name", query),
        lat=float(top["lat"]),
        lon=float(top["lon"]),
    )
