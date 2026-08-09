"""Inventory every sheet in every source workbook, and say which are read.

Written because "I checked a sample and it reconciled" is not evidence that no
sheet was missed. This reads the sheet names out of all ~2,000 sources and
cross-references them against the sheets the parsers actually name, so an
unread sheet — or one whose name changed in a year nobody sampled — shows up as
a row rather than as silence.

It answers three questions separately, because they have different answers:

  1. What sheets exist?          every distinct name, with how many workbooks
                                 carry it and over what date range
  2. Which are consumed?         matched against CONSUMED_SHEETS below, which
                                 is transcribed from the parser source
  3. Which are unaccounted for?  anything in (1) not covered by (2). A non-empty
                                 list here is the finding.

Names only by default — that reads a 2,000-file corpus in a couple of minutes.
`--parse` additionally runs the parsers over every workbook and reports, per
sheet, on how many days it yielded data. That is the stronger check and takes
considerably longer.

Usage:
  python scripts/audit_workbook_sheets.py
  python scripts/audit_workbook_sheets.py --parse [--limit N]
  python scripts/audit_workbook_sheets.py --json out.json
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import index_sources, read_source  # noqa: E402

REPO = Path(__file__).resolve().parent.parent

# Sheet names the parsers ask for, transcribed from the call sites. Keep this in
# step with the code: it is the claim this audit tests, so a stale entry here
# would report coverage that does not exist.
#
#   parse_pgcb_file            P1, P3, Forecast
#   lcurve_total_series        L-Curve
#   parse_hourly_shed          P4, Daily Gen
#   parse_energy_curve         En-Curve
#   parse_genlog               GenLog
#   parse_yesterday_gen        YesterdayGen
#   parse_p2_stations          P2
#   workbook_energy_day        L-Curve, En-Curve
CONSUMED_SHEETS = {
    "p1": "systemStats, fuel mix, outages, regional demand, border imports",
    "p2": "per-station evening peak, present capacity, day energy",
    "p3": "zone totals and substation loads (zone rows only)",
    "p4": "hourly generation, load shedding, demand",
    "forecast": "per-station day/evening peak (2025+ layout only)",
    "genlog": "hourly output per station (2025+)",
    "yesterdaygen": "hourly output per station (2018-2024)",
    "daily gen": "hourly generation, demand, shortage (2014-2018)",
    "l-curve": "half-hourly national generation; the day's own date",
    "l.curve": "same, pre-2018 spelling",
    "en-curve": "half-hourly generation by fuel",
    "en.curve": "same, pre-2018 spelling",
}

# Present in the workbooks and deliberately not read. Listed so they are counted
# as a decision rather than an oversight.
KNOWN_UNREAD = {
    "ewic": "East-West interconnector log — MW/MVAR per circuit",
    "voltage": "substation max/min voltages",
    "volt": "same, pre-2018 spelling",
    "generation": "per-station hourly, duplicate of YesterdayGen in that era",
    "sheet1": "empty scratch sheet",
}

SHEET_RE = re.compile(r"^## Sheet:\s*(.+)$", re.M)


def sheet_names(path: Path) -> list[str]:
    """Sheet names without converting the whole workbook where possible."""
    if path.suffix.lower() == ".txt":
        return [s.strip() for s in SHEET_RE.findall(path.read_text(encoding="utf-8", errors="ignore"))]
    import pandas as pd

    with pd.ExcelFile(path) as book:
        return [str(s).strip() for s in book.sheet_names]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--parse", action="store_true", help="also run the parsers over every workbook")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--json", help="write the full per-sheet report here")
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    sources = index_sources(Path(args.index_cache))
    days = sorted(sources)
    if args.limit:
        days = days[: args.limit]
    print(f"auditing {len(days)} source workbook(s)\n", flush=True)

    seen: dict[str, list[str]] = collections.defaultdict(list)
    unreadable: list[str] = []
    for i, day in enumerate(days):
        try:
            for name in sheet_names(Path(sources[day])):
                seen[name.strip().lower()].append(day)
        except Exception as exc:  # noqa: BLE001
            unreadable.append(f"{day}: {type(exc).__name__}")
        if (i + 1) % 400 == 0:
            print(f"  …{i + 1}/{len(days)}", flush=True)

    parsed_on: dict[str, int] = {}
    if args.parse:
        parsed_on = run_parsers(days, sources)

    rows = []
    for name, on_days in sorted(seen.items(), key=lambda kv: -len(kv[1])):
        status = ("read" if name in CONSUMED_SHEETS
                  else "not read (known)" if name in KNOWN_UNREAD
                  else "UNACCOUNTED FOR")
        rows.append({
            "sheet": name,
            "workbooks": len(on_days),
            "first": min(on_days),
            "last": max(on_days),
            "status": status,
            "purpose": CONSUMED_SHEETS.get(name) or KNOWN_UNREAD.get(name, ""),
            **({"daysParsed": parsed_on.get(name)} if args.parse else {}),
        })

    width = max(len(r["sheet"]) for r in rows) + 2
    header = f"{'sheet'.ljust(width)}{'books':>7}  {'range':<25}{'status':<18}"
    print("\n" + header + ("days parsed" if args.parse else "purpose"))
    print("-" * (len(header) + 20))
    for r in rows:
        tail = str(r.get("daysParsed", "")) if args.parse else r["purpose"][:44]
        print(f"{r['sheet'].ljust(width)}{r['workbooks']:>7}  "
              f"{r['first']}..{r['last']:<12} {r['status']:<18}{tail}")

    missed = [r for r in rows if r["status"] == "UNACCOUNTED FOR"]
    print(f"\n{len(seen)} distinct sheet name(s); {len(missed)} unaccounted for")
    if missed:
        print("EVERY ONE OF THESE IS A SHEET NO PARSER NAMES:")
        for r in missed:
            print(f"   {r['sheet']}  ({r['workbooks']} workbooks, {r['first']}..{r['last']})")
    if unreadable:
        print(f"\n{len(unreadable)} workbook(s) could not be opened: {', '.join(unreadable[:8])}")

    if args.json:
        Path(args.json).write_text(json.dumps(rows, indent=2), encoding="utf-8")
        print(f"\nfull report written to {args.json}")


def run_parsers(days, sources) -> dict[str, int]:
    """How many days each parser actually returned data on."""
    from parse_daily_reports import (
        parse_energy_curve, parse_genlog, parse_hourly_shed, parse_p2_stations,
        parse_pgcb_file, parse_plant_actuals, parse_yesterday_gen,
        get_sheet_content, lcurve_total_series,
    )
    import datetime
    import tempfile

    tmp = Path(tempfile.mkdtemp(prefix="esb-audit-"))
    counts: collections.Counter = collections.Counter()
    for i, day in enumerate(days):
        try:
            text = read_source(Path(sources[day]))
        except Exception:  # noqa: BLE001
            continue
        scratch = tmp / "a.txt"
        scratch.write_text(text, encoding="utf-8")
        try:
            if parse_pgcb_file(str(scratch), datetime.date.fromisoformat(day)):
                counts["p1"] += 1
        except Exception:  # noqa: BLE001
            pass
        if parse_p2_stations(text):
            counts["p2"] += 1
        if parse_hourly_shed(text):
            counts["p4"] += 1
        if parse_energy_curve(text):
            counts["en-curve"] += 1
        if parse_genlog(text):
            counts["genlog"] += 1
        if parse_yesterday_gen(text):
            counts["yesterdaygen"] += 1
        if parse_plant_actuals(get_sheet_content(text, "Forecast")):
            counts["forecast"] += 1
        if lcurve_total_series(text):
            counts["l-curve"] += 1
        if (i + 1) % 200 == 0:
            print(f"  parsed …{i + 1}/{len(days)}", flush=True)
    return dict(counts)


if __name__ == "__main__":
    main()
