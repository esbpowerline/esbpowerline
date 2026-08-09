"""Emit per-station detail for each day: public/data/plants/{date}.json.

Two sheets the site has never read:

  GenLog   hourly output for every power station, ~160 x 24 numbers a day.
           Only the 2025+ workbooks carry it.
  Forecast the per-plant table. Only its "Actual Generation on <reported day>"
           pair is taken. The forecast-availability columns and the Remarks
           beside them describe the NEXT day and are deliberately left out —
           mixing the two is the defect the rest of this repair removed.

Kept in its own file per day rather than inside the daily payload, which the
Grid Explorer loads on every view; this is fetched only when the tab is opened.

It lives outside public/data/daily on purpose: Next traces that directory into
every function importing the server-side daily loader, so 17MB placed there
took a 250MB Vercel function to 256MB and the deploy failed.

Both parses are checked against figures the day already publishes before the
file is written — the station sum at each peak against P1, and GenLog's own
national total against the L-Curve — so a day only lands if it reconciles.

Usage:
  python scripts/build_daily_plants.py [--apply] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import datetime
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import DAILY, index_sources, read_source  # noqa: E402

PLANTS = DAILY.parent / "plants"
from parse_daily_reports import (  # noqa: E402
    get_sheet_content,
    lcurve_total_series,
    parse_genlog,
    parse_p2_stations,
    parse_plant_actuals,
    parse_pgcb_file,
    parse_yesterday_gen,
)

REPO = Path(__file__).resolve().parent.parent
# The station total at a peak should reproduce P1's figure for that peak.
# A megawatt of slack absorbs the sheet's own rounding.
PEAK_TOLERANCE_MW = 1.5


def plants_from_p2(text):
    """The Forecast sheet's per-plant table, or P2's where the day has none.

    Forecast carries "Actual Generation on <day>" from 2025 and nothing before,
    which is why the Power Stations tab began there. P2 has the same stations
    every year back to 2014, with the evening peak and the day's energy, and
    states its own National Grid Total so the parse can be checked against the
    sheet that produced it.

    Returns (plants, p2_totals). `dayPeakMw` is None on the P2 path: that column
    exists only on the Forecast sheet, and inventing it from the evening peak
    would be a measurement the report never made.
    """
    plants = parse_plant_actuals(get_sheet_content(text, "Forecast"))
    p2 = parse_p2_stations(text)

    if plants:
        # Even where Forecast supplies the peaks, only P2 has the day's energy.
        # Matched on the name as printed, which the two sheets share.
        if p2:
            energy = {s["name"].strip().lower(): s for s in p2["stations"]}
            for plant in plants:
                match = energy.get(plant["name"].strip().lower())
                if match:
                    plant["energyKwh"] = match["energyKwh"]
                    if match.get("remarks"):
                        plant["remarks"] = match["remarks"]
        return plants, (p2 or {}).get("totals") or {}

    if not p2:
        return None, {}

    return [
        {
            "name": s["name"],
            "fuel": "",
            "producer": s["producer"],
            "installedCapacity": s["installedCapacity"],
            "installedMw": None,
            "presentCapacityMw": s["presentCapacityMw"],
            "dayPeakMw": None,
            "eveningPeakMw": s["eveningPeakMw"],
            "energyKwh": s["energyKwh"],
            "remarks": s["remarks"],
        }
        for s in p2["stations"]
    ], p2["totals"]


def reconcile_p2(plants, totals, stats):
    """Check a P2-sourced day against the two totals it can be checked against.

    P2 prints its own National Grid Total, and the day's energy is also stated
    on P1. Both are compared: the sheet's internal total catches a misread
    column, and P1 catches the sheet itself being the wrong day's — which is how
    2019-07-02's hourly matrix was found holding figures 2,700 MW below its own
    load curve.
    """
    problems = []
    national = totals.get("national") or {}

    summed = sum(float(p.get("eveningPeakMw") or 0) for p in plants)
    printed = float(national.get("eveningPeakMw") or 0)
    if printed and abs(summed - printed) > PEAK_TOLERANCE_MW:
        problems.append((
            "plants",
            f"station sum at the evening peak is {summed:.1f} MW against P2's own total {printed:.1f}",
        ))

    published = float(stats.get("eveningPeakGen") or 0)
    if printed and published and abs(printed - published) > max(PEAK_TOLERANCE_MW, published * 0.01):
        problems.append((
            "plants",
            f"P2's evening peak total {printed:.1f} MW is not the day's published {published:.1f}",
        ))

    energy_kwh = sum(float(p.get("energyKwh") or 0) for p in plants)
    published_mkwh = float(stats.get("totalEnergyGen") or 0)
    if energy_kwh and published_mkwh:
        drift = abs(energy_kwh / 1e6 - published_mkwh) / published_mkwh
        # A percent covers the rounding between a station table in kWh and a
        # headline in MKWh; a wrong day is out by far more.
        if drift > 0.01:
            problems.append((
                "plants",
                f"station energy sums to {energy_kwh / 1e6:.2f} MKWh against a published {published_mkwh:.2f}",
            ))
    return problems


def reconcile(plants, genlog, stats, curve):
    """Problems that should stop something being written, as (scope, message).

    Scope matters because the two checks fail for different reasons. Station
    figures that do not add up to the published peaks mean the table was misread
    and none of the day can be trusted. GenLog's roll-up columns disagreeing
    with the load curve, when the station rows themselves sum correctly, means
    the roll-up is wrong — and on four of the 32 July 2026 reports it is: PGCB
    prints 0 at 19:00 and then lags one row to the end of the day, while the
    station rows and the East/West columns beside it stay exact.

    Rejecting the whole day for that discards 160 correct station series to
    avoid publishing one bad column, so the caller is told which column instead.
    """
    problems = []
    if plants:
        for key, stat_key, label in (
            ("dayPeakMw", "dayPeakGen", "day peak"),
            ("eveningPeakMw", "eveningPeakGen", "evening peak"),
        ):
            published = float(stats.get(stat_key) or 0)
            summed = sum(float(p.get(key) or 0) for p in plants)
            if published and abs(summed - published) > PEAK_TOLERANCE_MW:
                problems.append((
                    "plants",
                    f"station sum at {label} is {summed:.1f} MW against a published {published:.1f}",
                ))
    if genlog and curve:
        hours = genlog["hours"]
        stations = genlog.get("stations") or []
        for series in ("national", "eastern", "western"):
            published = (genlog.get("totals") or {}).get(series) or []
            off = [
                (h, n, curve[h])
                for h, n in zip(hours, published)
                if h in curve and abs(n - curve[h]) > PEAK_TOLERANCE_MW
            ]
            # East and West are each a part of the whole, so only the national
            # column is expected to reproduce the curve. The other two are
            # checked against their own sum instead, below.
            if series != "national" or not off:
                continue
            summed_ok = stations and all(
                abs(sum(s["hourlyMw"][i] for s in stations) - curve[h]) <= PEAK_TOLERANCE_MW
                for i, h in enumerate(hours)
                if h in curve
            )
            scope = f"genlog.totals.{series}" if summed_ok else "plants"
            detail = (
                "the station rows still sum to the curve on every hour, so the column is wrong, "
                "not the log"
                if summed_ok
                else "the station rows do not sum to the curve either"
            )
            problems.append((
                scope,
                f"GenLog's {series} total disagrees with the load curve on {len(off)} hour(s), "
                f"first {off[0][0]}: {off[0][1]:.1f} vs {off[0][2]:.1f} — {detail}",
            ))
    return problems


def apply_reconciliation(doc, problems):
    """Drop what did not reconcile; return (doc or None, notes).

    None means the day itself is unusable. Otherwise the named roll-up columns
    are removed — a reader seeing no National Grid Total row is being told the
    report did not publish a usable one, which is true.
    """
    if any(scope == "plants" for scope, _ in problems):
        return None, [m for _, m in problems]
    notes = []
    for scope, message in problems:
        if scope.startswith("genlog.totals."):
            doc.get("genlog", {}).get("totals", {}).pop(scope.rsplit(".", 1)[1], None)
            notes.append(message)
    return doc, notes


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    sources = index_sources(Path(args.index_cache))
    days = sorted(sources)
    if args.limit:
        days = days[: args.limit]
    print(f"{len(days)} day(s) with a source workbook")

    tmp = Path(tempfile.mkdtemp(prefix="esb-plants-"))
    stats = collections.Counter()
    flagged: list[str] = []
    written_bytes = 0

    for i, day in enumerate(days):
        try:
            text = read_source(sources[day])
            scratch = tmp / "p.txt"
            scratch.write_text(text, encoding="utf-8")
            parsed = parse_pgcb_file(str(scratch), datetime.date.fromisoformat(day))
        except Exception:  # noqa: BLE001
            stats["source unreadable"] += 1
            continue
        if not parsed:
            stats["source unreadable"] += 1
            continue

        plants, p2_totals = plants_from_p2(text)
        # GenLog from 2025, the same matrix transposed as YesterdayGen before it.
        genlog = parse_genlog(text) or parse_yesterday_gen(text)
        if not plants and not genlog:
            stats["neither sheet present"] += 1
            continue

        doc = {"date": day}
        if plants:
            doc["plants"] = plants
        if genlog:
            doc["genlog"] = genlog

        system_stats = parsed.get("systemStats") or {}
        problems = reconcile(plants, genlog, system_stats, lcurve_total_series(text))
        # A day whose peaks come from P2 cannot be checked the Forecast way —
        # there is no day-peak column — so it is checked against P2's own
        # printed total and against the energy P1 publishes instead.
        if plants and plants[0].get("dayPeakMw") is None:
            problems = [p for p in problems if not p[1].startswith("station sum at")]
            problems += reconcile_p2(plants, p2_totals, system_stats)
        doc, notes = apply_reconciliation(doc, problems)
        if doc is None:
            stats["rejected — does not reconcile"] += 1
            flagged.append(f"{day}: {notes[0]}")
            continue
        for note in notes:
            stats["published without a roll-up column the report got wrong"] += 1
            flagged.append(f"{day}: {note}")

        if plants:
            stats["with plant table"] += 1
        if genlog:
            stats["with hourly GenLog"] += 1

        # Compact: these are fetched by the browser and never hand-edited, and
        # pretty-printing 160 stations x 24 hours doubles the file (117 KB to
        # 56 KB a day). Stations idle all day are kept — "this plant produced
        # nothing" is itself a fact the page should be able to show.
        body = json.dumps(doc, separators=(",", ":"))
        written_bytes += len(body)
        stats["days written"] += 1
        if args.apply:
            PLANTS.mkdir(parents=True, exist_ok=True)
            (PLANTS / f"{day}.json").write_text(body, encoding="utf-8")
        if (i + 1) % 400 == 0:
            print(f"  …{i + 1}/{len(days)}", flush=True)

    print()
    for k, v in sorted(stats.items()):
        print(f"{v:6d} | {k}")
    if stats["days written"]:
        print(f"\navg {written_bytes / stats['days written'] / 1024:.1f} KB/day, "
              f"{written_bytes / 1024 / 1024:.1f} MB total")
    if flagged:
        print(f"\n{len(flagged)} day(s) rejected or published without a roll-up column:")
        for r in flagged[:12]:
            print("   ", r)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
