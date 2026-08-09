"""Post-backfill integrity check over public/data/daily.

Answers the only question that matters about this archive: is every number it
shows either something PGCB actually published, or explicitly absent?

Checks, in order of how badly a failure would mislead a reader:
  * every file still parses and keeps the shape the site's Zod schema expects
  * no day claims a maximum generation below its own peak, or a minimum above
    its maximum — the signature of the next-day forecast leaking back in
  * extremes are either both numbers or both null, never half a pair
  * the fields this repair never touched are unchanged against git HEAD

Usage:
  python scripts/verify_daily_archive.py
"""
from __future__ import annotations

import collections
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"

REQUIRED_STATS = (
    "date", "dayPeakGen", "eveningPeakGen", "dayPeakDemand", "eveningPeakDemand",
    "minGen", "maxGen", "totalEnergyGen", "totalEnergyUnserved", "totalEnergyDemand",
    "maxTemp", "totalGasSuppliedPower", "avgProductionCost", "totalDailyCost",
)
# Every figure read straight from the source report, and therefore absent on
# layouts that do not publish it, rather than estimated.
# `totalEnergyGen` joined these once it was clear PGCB leaves the cell empty on
# some days — 42 of early 2018 had published "0.0 MKWh" for a day that plainly
# generated, which is the same defect as an estimate dressed as a measurement,
# only in the other direction.
NULLABLE = {"minGen", "maxGen", "dayPeakDemand", "totalEnergyGen",
            "totalEnergyUnserved", "totalEnergyDemand", "maxTemp"}
# Never implicated by the maxGen defect, so they must survive the backfill byte
# for byte. Any drift here means the repair reached further than intended.
# generationData is deliberately in scope (its cost columns move from a
# hardcoded tariff to PGCB's published Taka), so it is not listed here. These
# four were never implicated and must survive byte for byte.
UNTOUCHED = ("gasProductionData", "gasDistributionData",
             "regionalDemandData", "borderImportsData")


def git_show(path: str) -> dict | None:
    try:
        out = subprocess.run(["git", "show", f"HEAD:{path}"], cwd=REPO,
                             capture_output=True, timeout=30)
        if out.returncode != 0:
            return None
        return json.loads(out.stdout.decode("utf-8"))
    except Exception:  # noqa: BLE001
        return None


def main() -> None:
    errors: list[str] = []
    stats = collections.Counter()
    files = sorted(DAILY.glob("*.json"))

    for fp in files:
        day = fp.stem
        try:
            doc = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{day}: unparseable ({exc})")
            continue
        stats["days"] += 1

        s = doc.get("systemStats")
        if not isinstance(s, dict):
            errors.append(f"{day}: systemStats missing")
            continue
        for k in REQUIRED_STATS:
            if k not in s:
                errors.append(f"{day}: systemStats.{k} missing")
            elif s[k] is None and k not in NULLABLE:
                errors.append(f"{day}: systemStats.{k} is null but must be a number")
            elif s[k] is not None and k != "date" and not isinstance(s[k], (int, float)):
                errors.append(f"{day}: systemStats.{k} is not a number")

        mn, mx = s.get("minGen"), s.get("maxGen")
        if (mn is None) != (mx is None):
            errors.append(f"{day}: half a pair — minGen={mn!r} maxGen={mx!r}")
        if mn is None:
            stats["extremes null"] += 1
        else:
            stats["extremes present"] += 1
            peak = max(float(s.get("dayPeakGen") or 0), float(s.get("eveningPeakGen") or 0))
            tol = max(50.0, peak * 0.01)
            if peak and float(mx) < peak - tol:
                errors.append(f"{day}: maxGen {mx} below the day's own peak {peak}")
            if float(mn) > float(mx):
                errors.append(f"{day}: minGen {mn} exceeds maxGen {mx}")

        hourly = doc.get("hourlyLoadData")
        if hourly is not None:
            if not isinstance(hourly, list):
                errors.append(f"{day}: hourlyLoadData must be an array")
            elif not hourly:
                # A report with no load-curve sheet draws no curve at all.
                stats["curve absent (not published)"] += 1
            elif len(hourly) < 20:
                errors.append(f"{day}: hourlyLoadData has {len(hourly)} rows, expected 24-25 or none")
            else:
                distinct = len({round(float(h.get("generation") or 0), 3) for h in hourly})
                stats["curve real" if distinct > 3 else "curve flat/placeholder"] += 1
                # Shedding and demand come from one of three places and the
                # count says which:
                #
                #   P4 (2025+) and Daily Gen (2014-2018) state both for every
                #   hour they publish, so those days carry them on every row.
                #
                #   YesterdayGen (2018-2024) states shedding from 01:00 to
                #   24:00, one hour short of the load curve it is merged into —
                #   so the day's 00:00 point keeps a null, and 23 of 24 is the
                #   correct shape there, not a partial fill.
                #
                #   Days with none of those sheets have only what P1 prints for
                #   the evening peak: exactly one hour.
                #
                # What stays worth rejecting is the shape in between — a handful
                # of hours filled and the rest blank, which is what a spread
                # estimate looks like, and how 18:00-23:00 came to be back-filled
                # with total shedding x 0.8 and charted as though measured.
                shed_hours = [h for h in hourly if h.get("loadShed") is not None]
                if len(shed_hours) in (0, 1):
                    stats["shedding: evening peak only"] += 1
                elif len(shed_hours) >= len(hourly) - 1:
                    stats["shedding: every published hour"] += 1
                else:
                    errors.append(
                        f"{day}: load shedding present on {len(shed_hours)} of {len(hourly)} hours. "
                        "It should be on one hour (from P1), or on every hour the source publishes "
                        "(all of them, or all but 00:00 where the source starts at 01:00)"
                    )

    print(f"{stats['days']} day(s) checked")
    for k, v in sorted(stats.items()):
        if k != "days":
            print(f"  {v:6d} | {k}")

    print("\nComparing untouched sections against git HEAD…")
    changed_untouched = []
    for fp in files:
        rel = fp.relative_to(REPO).as_posix()
        head = git_show(rel)
        if head is None:
            continue
        cur = json.loads(fp.read_text(encoding="utf-8"))
        for key in UNTOUCHED:
            if json.dumps(head.get(key), sort_keys=True) != json.dumps(cur.get(key), sort_keys=True):
                changed_untouched.append(f"{fp.stem}:{key}")
    print(f"  {len(changed_untouched)} untouched-section change(s)"
          + (f" — first: {changed_untouched[:5]}" if changed_untouched else " (correct)"))

    if errors:
        print(f"\n{len(errors)} PROBLEM(S):")
        for e in errors[:30]:
            print("   ", e)
        sys.exit(1)
    print("\nNo integrity problems found.")


if __name__ == "__main__":
    main()
