"""Free geocoding via OpenStreetMap's Nominatim service.

Nominatim is free and requires no API key, only a descriptive User-Agent
per its usage policy: https://operations.osmfoundation.org/policies/nominatim/
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import requests
from django.conf import settings

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


class GeocodingError(Exception):
    pass


def _get_with_retry(url, *, params=None, headers=None, timeout=15, retries=2):
    """GET that retries transient network failures (free APIs can blip)."""
    last_exc = None
    for attempt in range(retries + 1):
        try:
            return requests.get(
                url, params=params, headers=headers, timeout=timeout
            )
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(0.6)
    raise last_exc


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
        resp = _get_with_retry(
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
        raise GeocodingError(
            "The geocoding service is temporarily unavailable. Please try again."
        ) from exc

    if not data:
        raise GeocodingError(f"Could not find a location for '{query}'.")

    top = data[0]
    return GeoPoint(
        query=query,
        name=top.get("display_name", query),
        lat=float(top["lat"]),
        lon=float(top["lon"]),
    )


def search_suggestions(query: str, limit: int = 6) -> list:
    """Return up to `limit` U.S. place suggestions for an autocomplete UI.

    Each suggestion is a dict with a clean `value` (e.g. "Phoenix, Arizona"),
    a `primary`/`secondary` label split for nice rendering, and coordinates.
    """
    query = (query or "").strip()
    if len(query) < 2:
        return []

    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "json",
                "addressdetails": 1,
                "limit": limit,
                "countrycodes": "us",  # U.S.-only per the HOS ruleset
                "dedupe": 1,
            },
            headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
            timeout=12,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException:
        return []

    suggestions = []
    seen = set()
    for item in data:
        addr = item.get("address", {})
        primary = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("hamlet")
            or addr.get("county")
            or addr.get("neighbourhood")
            or item.get("display_name", "").split(",")[0]
        )
        state = addr.get("state")
        secondary_parts = []
        # Show county only when it adds info beyond the primary name.
        county = addr.get("county")
        if county and county != primary:
            secondary_parts.append(county)
        if state:
            secondary_parts.append(state)
        secondary = ", ".join(secondary_parts) if secondary_parts else "United States"

        value = ", ".join(p for p in [primary, state] if p) or item.get(
            "display_name", ""
        )

        key = value.lower()
        if key in seen:
            continue
        seen.add(key)

        suggestions.append(
            {
                "value": value,
                "primary": primary,
                "secondary": secondary,
                "lat": float(item["lat"]),
                "lon": float(item["lon"]),
            }
        )

    return suggestions
