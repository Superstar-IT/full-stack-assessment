from __future__ import annotations

import datetime
import zoneinfo
from zoneinfo import ZoneInfo

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers
from .hos_engine import Status, run_trip, segs_to_daily
from .services import geocode, geocode_suggestions, osrm_route

DEFAULT_TZ = "America/Chicago"


def _rest_stops_list(segs, start_dt, tz: str) -> list:
    out = []
    z = zoneinfo.ZoneInfo(tz)
    if start_dt.tzinfo is None:
        start = start_dt.replace(tzinfo=z, second=0, microsecond=0)
    else:
        start = start_dt.astimezone(z)
    for s in segs:
        if s.st in (Status.OFF, Status.SB) and s.t1 - s.t0 >= 30:
            tmid = s.t0 + (s.t1 - s.t0) // 2
            d = (start + datetime.timedelta(minutes=tmid)).astimezone(z)
            st_name = {Status.OFF: "Off", Status.SB: "Sleeper"}.get(s.st, "?")
            out.append(
                {
                    "t0_min": s.t0,
                    "t1_min": s.t1,
                    "duration_h": (s.t1 - s.t0) / 60.0,
                    "at_utc": d.astimezone(datetime.timezone.utc).isoformat(),
                    "status": st_name,
                    "label": s.label or st_name,
                }
            )
    return out


class GeocodeSuggestView(APIView):
    """Proxy Nominatim search for browser autocomplete (avoids CORS; use debounced client)."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, *a, **kw):
        q = request.GET.get("q", "")
        try:
            results = geocode_suggestions(q, limit=8)
        except Exception:
            return Response({"results": []})
        return Response({"results": results})


class PlanTripView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *a, **kw):
        ser = serializers.TripIn(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        d = ser.validated_data
        tzs = d.get("time_zone") or DEFAULT_TZ
        try:
            ZoneInfo(tzs)
        except Exception:
            return Response(
                {"time_zone": ["invalid IANA time zone id"]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            g0 = geocode(d["current_location"])
            g1 = geocode(d["pickup_location"])
            g2 = geocode(d["dropoff_location"])
        except ValueError as e:
            return Response({"geocode": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rr = osrm_route(
                [
                    (g0.lat, g0.lon),
                    (g1.lat, g1.lon),
                    (g2.lat, g2.lon),
                ],
                ["current", "pickup", "dropoff"],
            )
        except (ValueError, Exception) as e:
            return Response(
                {"routing": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if len(rr.leg_distances_mi) < 2 or len(rr.leg_durations_min) < 2:
            return Response(
                {"routing": "unexpected leg count from OSRM"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        pre_mi = rr.leg_distances_mi[0]
        pre_m = rr.leg_durations_min[0]
        post_mi = rr.leg_distances_mi[1]
        post_m = rr.leg_durations_min[1]
        cyc = float(d["current_cycle_used_hrs"])
        segs = run_trip(
            cyc, pre_mi, int(round(pre_m)), post_mi, int(round(post_m))
        )
        ts = d.get("trip_start")
        if ts is None:
            n = datetime.datetime.now(ZoneInfo(tzs))
            ts = n.replace(second=0, microsecond=0, minute=0, hour=6)
        daily = segs_to_daily(segs, ts, tzs)
        rbreaks = _rest_stops_list(segs, ts, tzs)
        body = {
            "route": {
                "type": "Feature",
                "properties": {
                    "pre_miles": pre_mi,
                    "post_miles": post_mi,
                },
                "geometry": rr.geometry,
            },
            "locations": {
                "current": {"lat": g0.lat, "lon": g0.lon, "label": g0.display},
                "pickup": {"lat": g1.lat, "lon": g1.lon, "label": g1.display},
                "dropoff": {"lat": g2.lat, "lon": g2.lon, "label": g2.display},
            },
            "legs": {
                "to_pickup_miles": pre_mi,
                "to_pickup_minutes": pre_m,
                "to_drop_miles": post_mi,
                "to_drop_minutes": post_m,
            },
            "total_drive_minutes": int(round(pre_m + post_m)),
            "total_distance_miles": pre_mi + post_mi,
            "eld_segments": [
                {
                    "t0": s.t0,
                    "t1": s.t1,
                    "status": int(s.st),
                    "label": s.label,
                }
                for s in segs
            ],
            "daily_logs": daily,
            "rest_stops": rbreaks,
        }
        return Response(body, status=status.HTTP_200_OK)
