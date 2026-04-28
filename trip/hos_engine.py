"""
U.S. property-carrying HOS: 11/14, 8/30, 10h, 70/8 + 34h restart.
1h pickup, 1h drop, 30m on-duty fuel/1000 mi, no adverse conditions.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from enum import IntEnum
from typing import List
import zoneinfo


class Status(IntEnum):
    OFF = 1
    SB = 2
    D = 3
    ON = 4


BREAK_8H = 8 * 60
BREAK_30M = 30
MAX_11D = 11 * 60
MAX_14W = 14 * 60
RESET_10H = 10 * 60
CYCLE_70H = 70 * 60
RESET_34H = 34 * 60
FUEL_ON = 30
PICKUP = 60
DROPOFF = 60


@dataclass
class Segment:
    t0: int
    t1: int
    st: Status
    label: str = ""


@dataclass
class Sim:
    t: int = 0
    w0: int = 0
    d_in: int = 0
    d_br: int = 0
    cycle: int = 0


def _add_off(
    s: Sim, n: int, segs: List[Segment], tag: str, st: Status = Status.OFF
) -> None:
    n = int(n)
    if n <= 0:
        return
    segs.append(Segment(s.t, s.t + n, st, tag))
    s.t += n
    if n >= RESET_10H and "10h" in tag:
        s.w0 = s.t
        s.d_in = 0
        s.d_br = 0
    if n >= RESET_34H and "34h" in tag:
        s.w0 = s.t
        s.d_in = 0
        s.d_br = 0


def _harden_before_duty(s: Sim, segs: List[Segment]) -> None:
    if s.cycle + 1 > CYCLE_70H:
        _add_off(s, RESET_34H, segs, "34h off (70/8 reset)")
        s.cycle = 0
    w = s.t - s.w0
    if w >= MAX_14W or s.d_in >= MAX_11D:
        _add_off(s, RESET_10H, segs, "10h off (11/14 window)")
        s.w0 = s.t
        s.d_in = 0
        s.d_br = 0
    if s.d_br >= BREAK_8H:
        _add_off(s, BREAK_30M, segs, "30m off (8h drive)")
        s.d_br = 0


def _one_drive(s: Sim, segs: List[Segment], label: str) -> None:
    _harden_before_duty(s, segs)
    t0, t1 = s.t, s.t + 1
    s.t = t1
    s.d_in += 1
    s.d_br += 1
    s.cycle += 1
    segs.append(Segment(t0, t1, Status.D, label))


def _one_on(s: Sim, segs: List[Segment], label: str) -> None:
    if s.cycle + 1 > CYCLE_70H:
        _add_off(s, RESET_34H, segs, "34h off (70/8 reset)")
        s.cycle = 0
    w = s.t - s.w0
    if w + 1 > MAX_14W:
        _add_off(s, RESET_10H, segs, "10h off (14h on-duty cap)")
        s.w0 = s.t
        s.d_in = 0
        s.d_br = 0
    t0, t1 = s.t, s.t + 1
    s.t = t1
    s.cycle += 1
    segs.append(Segment(t0, t1, Status.ON, label))
    if s.t - s.w0 > MAX_14W:
        _add_off(s, RESET_10H, segs, "10h off (14h on-duty cap)")
        s.w0 = s.t
        s.d_in = 0
        s.d_br = 0


def _merge(segs: List[Segment]) -> List[Segment]:
    if not segs:
        return []
    out: List[Segment] = [segs[0]]
    for a in segs[1:]:
        p = out[-1]
        if a.st == p.st and a.label == p.label and a.t0 == p.t1:
            p.t1 = a.t1
        else:
            out.append(a)
    return [x for x in out if x.t0 < x.t1]


def _drive_leg(
    s: Sim, segs: List[Segment], dmin: int, m_total: float, label: str
) -> None:
    dmin = int(max(0, round(dmin)))
    if dmin <= 0:
        return
    n = int(m_total // 1000.0) if m_total and m_total > 0 else 0
    for i in range(1, dmin + 1):
        prev = (i - 1) * m_total / dmin if m_total and dmin else 0.0
        now = i * m_total / dmin if m_total and dmin else 0.0
        if n and m_total:
            for k in range(1, n + 1):
                thr = k * 1000.0
                if prev < thr - 1e-6 <= now + 1e-6:
                    for _ in range(FUEL_ON):
                        _one_on(s, segs, "Fueling (on duty)")
        _one_drive(s, segs, label)


def run_trip(
    current_cycle_h: float,
    pre_miles: float,
    pre_d_min: int,
    post_miles: float,
    post_d_min: int,
) -> List[Segment]:
    s = Sim()
    s.cycle = int(
        round(max(0.0, min(70.0, float(current_cycle_h))) * 60.0)
    )
    segs: List[Segment] = []

    _drive_leg(
        s, segs, pre_d_min, pre_miles, "Driving to pickup"
    )
    for _ in range(PICKUP):
        _one_on(s, segs, "Pickup / check-in (on duty)")
    _drive_leg(
        s, segs, post_d_min, post_miles, "Driving to drop"
    )
    for _ in range(DROPOFF):
        _one_on(s, segs, "Dropoff (on duty)")

    return _merge(segs)


def segs_to_daily(
    segs: List[Segment], trip_start: datetime, tz: str
) -> List[dict]:
    z = zoneinfo.ZoneInfo(tz)
    if trip_start.tzinfo is None:
        start = trip_start.replace(tzinfo=z, second=0, microsecond=0)
    else:
        start = trip_start.astimezone(z).replace(second=0, microsecond=0)

    if not segs:
        return []
    t_end = segs[-1].t1
    d0 = (start + timedelta(minutes=0)).date()
    d1 = (start + timedelta(minutes=t_end)).date()

    out: List[dict] = []
    cur = d0
    while cur <= d1:
        mid = datetime.combine(cur, time(0, 0, tzinfo=z))
        t_day0 = int((mid - start).total_seconds() // 60)
        t_day1 = t_day0 + 24 * 60
        segs_d = []
        for seg in segs:
            a = max(seg.t0, t_day0)
            b = min(seg.t1, t_day1)
            if a < b:
                a_loc, b_loc = a - t_day0, b - t_day0
                st_name = {
                    Status.OFF: "OFF",
                    Status.SB: "SB",
                    Status.D: "D",
                    Status.ON: "ON",
                }.get(seg.st, "?")
                segs_d.append(
                    {
                        "a": a_loc,
                        "b": b_loc,
                        "st": int(seg.st),
                        "st_name": st_name,
                        "label": seg.label,
                    }
                )
        out.append(
            {
                "date": cur.isoformat(),
                "segments": segs_d,
            }
        )
        cur = cur + timedelta(days=1)
    return out
