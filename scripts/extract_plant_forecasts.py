"""Recover PGCB's per-station availability forecast.

The 2025+ Forecast sheet carries three generation blocks per power station, not
one. Alongside the actuals the archive already parses it prints, for the day
AFTER the reported one:

    Forecasted Available Gen. on <D+1>   Day Peak | Ev. Peak
    Effective  Available Gen. on <D+1>   Day Peak | Ev. Peak

The pair is the interesting part. "Forecasted" is what the station is expected
to be able to offer; "Effective" is what PGCB expects to actually be able to
take from it. Where they differ, the gap is a constraint PGCB is anticipating —
Madanganj-55 on 2026-08-17 is forecast at 55 MW and effective at 15, against a
remark of "Liquid fuel shortage". Nothing else in this archive quantifies
expected fuel and maintenance derating station by station.

**Column mapping.** The header is merged across sub-columns, so it does not
align with the data rows, and rows whose Sl. cell is merged away are shifted one
place left. Fixed indices therefore do not work. Instead each row is anchored on
its installed-capacity cell — the only cell of the form "1*260" or "34*3.35" —
after which exactly eight numbers follow in a fixed order:

    installed | present | actual D peak | actual D ev | fcst D+1 peak
              | fcst D+1 ev | effective D+1 peak | effective D+1 ev

Verified against `public/data/plants/2026-08-16.json`, which the existing
parser produced independently: Haripur 412 (actual 0 / 403), Madanganj-55
(15 / 55), and four Ghorasal units all agree exactly, including PGCB's own
oddity of a present capacity above nameplate on the repowered Unit-4.

**Anchoring.** A forecast belongs to the day it DESCRIBES, so it is written to
`public/data/plants/{D+1}.json` — beside that day's actuals, the same rule
`extract_forecasts.py` follows for the summary block.

Usage:
    python scripts/extract_plant_forecasts.py            # dry run
    python scripts/extract_plant_forecasts.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from parse_daily_reports import get_sheet_content, split_cells  # noqa: E402
import extract_forecasts as EF  # noqa: E402

PLANTS = ROOT / "public" / "data" / "plants"

# "1*260", "2*110+1*110", "34*3.35". The one cell shape that cannot be confused
# with a measurement, which is what makes it a reliable anchor.
CAPACITY = re.compile(r"^\s*\d+(?:\.\d+)?\s*\*")
# Eight numbers follow it, in this order.
FIELDS = [
    "installedMw",
    "presentCapacityMw",
    "actualDayPeakMw",
    "actualEveningPeakMw",
    "forecastDayPeakMw",
    "forecastEveningPeakMw",
    "effectiveDayPeakMw",
    "effectiveEveningPeakMw",
]


def num(cell: str):
    m = re.search(r"-?\d[\d,]*\.?\d*", (cell or "").replace(",", ""))
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


# The two columns this whole script exists to read. Their presence is the
# precondition, checked before any row is examined.
#
# Without it the anchor fires on layouts that have no per-station forecast at
# all: the 2014 sheet yielded one "station", Raozan 25 MW, whose forecast and
# effective figures were four unrelated columns of a P2-style row read as
# though they were a forecast. One fabricated station is worse than none, and
# it would have looked like thin coverage rather than a bug.
DECLARES_FORECAST = re.compile(r"Forecasted\s+Available", re.I)
DECLARES_EFFECTIVE = re.compile(r"Effective\s+Available", re.I)


def plant_forecasts(sheet: str) -> list[dict]:
    """One entry per station row that carries a full eight-number run.

    Returns nothing at all unless the sheet declares both forecast columns —
    see DECLARES_FORECAST above.
    """
    if not (DECLARES_FORECAST.search(sheet) and DECLARES_EFFECTIVE.search(sheet)):
        return []
    out: list[dict] = []
    for line in sheet.split("\n"):
        cells = [c.strip() for c in split_cells(line)]
        anchor = next((i for i, c in enumerate(cells) if CAPACITY.match(c)), None)
        # The name sits three cells before the capacity (name, fuel, producer),
        # so an anchor closer than that is not a station row.
        if anchor is None or anchor < 3:
            continue
        values = [num(c) for c in cells[anchor + 1: anchor + 9]]
        if len(values) < 8 or any(v is None for v in values):
            continue
        row = dict(zip(FIELDS, values))
        name = cells[anchor - 3]
        if not name or CAPACITY.match(name):
            continue
        # The actuals are already held per station in this same file and are not
        # duplicated; they are read here only to key the row and to prove the
        # column run was located correctly.
        out.append(
            {
                "name": name,
                "fuel": cells[anchor - 2] or None,
                "producer": cells[anchor - 1] or None,
                "forecastDayPeakMw": row["forecastDayPeakMw"],
                "forecastEveningPeakMw": row["forecastEveningPeakMw"],
                "effectiveDayPeakMw": row["effectiveDayPeakMw"],
                "effectiveEveningPeakMw": row["effectiveEveningPeakMw"],
                "remarks": (cells[anchor + 9] if anchor + 9 < len(cells) else "") or None,
            }
        )
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    by_filed = EF.candidates()
    days = sorted(by_filed)
    if args.limit:
        days = days[: args.limit]

    tally = Counter()
    samples: list[str] = []

    def work(filed: date):
        for path in by_filed[filed]:
            # The converted-text store loses table structure and is skipped here
            # rather than trusted: it already cost the hourly forecast curve on
            # 193 days, and this table is wider and more fragile.
            if path.suffix.lower() == ".txt":
                continue
            try:
                sheet = get_sheet_content(EF.sheet_text(path), "Forecast")
            except Exception:
                continue
            if not sheet:
                continue
            rows = plant_forecasts(sheet)
            if rows:
                return filed, rows, path
        return filed, None, None

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(work, days))

    for filed, rows, path in results:
        if not rows:
            tally["no per-station forecast in any held copy"] += 1
            continue
        target = filed  # the workbook filed on F forecasts F
        out_path = PLANTS / f"{target.isoformat()}.json"
        if not out_path.exists():
            tally["forecast for a day with no plant file"] += 1
            continue

        # Every station PGCB expects to be derated, and by how much. Computed
        # once here rather than in the page, so an export carries the same
        # figure the page shows.
        constrained = [
            r
            for r in rows
            if r["forecastEveningPeakMw"] is not None
            and r["effectiveEveningPeakMw"] is not None
            and r["forecastEveningPeakMw"] - r["effectiveEveningPeakMw"] > 0.05
        ]
        # Both totals are stored, not just the difference between them.
        #
        # On 2026-08-17 the stations sum to 20,220 MW forecast-available and
        # 13,382 MW effective — yet PGCB's own summary forecast for generation
        # at the evening peak is 16,130 MW, and the grid actually delivered
        # 15,891 MW. So the effective sum is NOT a prediction of system output
        # and must not be presented as one: it sits below what the same report
        # forecasts in summary and below what the day did. Publishing only
        # "6,838 MW held back" would read as a shortfall claim the source does
        # not make. The page can state all three and let them disagree.
        forecast_total = sum(
            r["forecastEveningPeakMw"] for r in rows if r["forecastEveningPeakMw"] is not None
        )
        effective_total = sum(
            r["effectiveEveningPeakMw"] for r in rows if r["effectiveEveningPeakMw"] is not None
        )
        payload = {
            "targetDay": target.isoformat(),
            "issuedOn": (filed - timedelta(days=1)).isoformat(),
            "issuedIn": path.stem,
            "stations": rows,
            "stationCount": len(rows),
            "forecastAvailableEveningMw": round(forecast_total, 2),
            "effectiveAvailableEveningMw": round(effective_total, 2),
            "deratedStations": len(constrained),
            "deratedMwAtEveningPeak": round(
                sum(r["forecastEveningPeakMw"] - r["effectiveEveningPeakMw"] for r in constrained), 2
            ),
        }
        tally["extracted"] += 1
        if len(samples) < 4:
            samples.append(
                f"  {target}  {len(rows):3d} stations · {payload['deratedStations']:3d} derated "
                f"· {payload['deratedMwAtEveningPeak']:8.1f} MW held back at evening peak"
            )
        if args.apply:
            doc = json.loads(out_path.read_text(encoding="utf-8"))
            doc["plantForecast"] = payload
            with out_path.open("w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)

    print("=== per-station forecast extraction ===")
    for k, v in sorted(tally.items(), key=lambda kv: -kv[1]):
        print(f"  {v:6d}  {k}")
    print()
    print(f"{tally['extracted']} days {'written' if args.apply else 'would be written'}")
    if samples:
        print()
        print("samples:")
        print("\n".join(samples))
    if not args.apply:
        print()
        print("(dry run - re-run with --apply to write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
