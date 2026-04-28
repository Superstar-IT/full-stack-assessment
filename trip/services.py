"""Geocoding (Nominatim) and routing (OSRM public demo)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Tuple

import httpx

USER_AGENT = "ELD-Trip-Assessment/1.0 (contact: dev@local)"


@dataclass
class GeoResult:
    lat: float
    lon: float
    display: str


def geocode_suggestions(query: str, limit: int = 8) -> List[dict]:
    """Return Nominatim search hits for autocomplete (respect OSM usage policy; debounce client-side)."""
    q = (query or "").strip()
    if len(q) < 3:
        return []
    lim = max(1, min(limit, 10))
    url = "https://nominatim.openstreetmap.org/search"
    with httpx.Client(timeout=15.0) as c:
        r = c.get(
            url,
            params={
                "q": q,
                "format": "json",
                "limit": lim,
                "addressdetails": "0",
            },
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
        )
    r.raise_for_status()
    j = r.json()
    out: List[dict] = []
    for it in j:
        out.append(
            {
                "display_name": (it.get("display_name") or "")[:300],
                "lat": float(it["lat"]),
                "lon": float(it["lon"]),
            }
        )
    return out


def geocode(query: str) -> GeoResult:
    q = (query or "").strip()
    if not q:
        raise ValueError("empty address")
    url = "https://nominatim.openstreetmap.org/search"
    with httpx.Client(timeout=30.0) as c:
        r = c.get(
            url,
            params={"q": q, "format": "json", "limit": 1},
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
        )
    r.raise_for_status()
    j = r.json()
    if not j:
        raise ValueError(f"no results for: {q!r}")
    it = j[0]
    return GeoResult(
        float(it["lat"]),
        float(it["lon"]),
        it.get("display_name", q)[:200],
    )


@dataclass
class RouteResult:
    geometry: dict
    leg_distances_mi: List[float]
    leg_durations_min: List[float]
    waypoints: List[Tuple[float, float, str]]  # lat, lon, label


def osrm_route(latlons: List[Tuple[float, float]], labels: List[str]) -> RouteResult:
    """
    latlons: [(lat, lon), ...] in order. OSRM wants lon,lat in URL.
    """
    if len(latlons) < 2 or len(latlons) != len(labels):
        raise ValueError("need matching waypoints/labels (>=2)")
    coords = ";".join(f"{b},{a}" for a, b in latlons)
    url = f"https://router.project-osrm.org/route/v1/driving/{coords}"
    with httpx.Client(timeout=60.0) as c:
        r = c.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
        )
    r.raise_for_status()
    data: Any = r.json()
    if data.get("code") != "Ok" or "routes" not in data or not data["routes"]:
        raise ValueError("OSRM: no route")
    rt = data["routes"][0]
    geom = rt.get("geometry") or {}
    lgs: List[Tuple[float, float]] = []
    if "legs" in rt:
        for lg in rt["legs"]:
            m = float(lg.get("distance", 0) or 0)
            s = float(lg.get("duration", 0) or 0)
            lgs.append((m, s / 60.0))
    if not lgs:
        lgs = [(0.0, 0.0) for _ in range(len(latlons) - 1)]
    dmi = [a[0] * 0.000621371 for a in lgs]  # meters to miles
    dmin = [a[1] for a in lgs]  # minutes
    wps: List[Tuple[float, float, str]] = []
    for (a, b), t in zip(latlons, labels):
        wps.append((a, b, t))
    return RouteResult(geometry=geom, leg_distances_mi=dmi, leg_durations_min=dmin, waypoints=wps)
