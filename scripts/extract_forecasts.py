"""Recover PGCB's next-day forecast, which the archive has been discarding.

Every PGCB workbook states two days, not one. Alongside the reported energy
day's actuals it publishes a projection for the FOLLOWING day — probable peak
demand, probable peak generation, probable energy, and a load-shed forecast
broken out by area. `parse_daily_reports.forecast_reported_section` deliberately
cuts that half off, for a good reason: scanning the whole sheet let the
projection overwrite the actuals. Cutting it out kept the actuals honest and
threw the forecast away.

It is worth having on its own terms. PGCB publishing what it expected, next to
what the grid then did, is the only accountability record either agency emits,
and this archive already holds both halves.

Two layouts state it differently:

  pre-2025   The Forecast sheet carries two summaries either side of a lone
             "Forecast" cell. Below it: numbered items 1-5, "Maximum Demand*
             Evening (Generation end)", "Reserve(Generation end)" and so on.
  2025+      A "Forecast Scenario (DD-MM-YYYY)" block with the same quantities
             renamed to "Probable Maximum Demand at Evening Peak" etc., plus a
             probable temperature the old layout puts elsewhere.

Both target the day AFTER the reported energy day, confirmed from their own
headers: the workbook filed 01-04-2026 reports energy day 2026-03-31 and heads
its block "Forecast Scenario (01-04-2026)".

Anchoring follows lib/data/grid/observation-window.ts: a forecast anchors to the
day it DESCRIBES, so it is written onto the target day's file, not the issuing
day's. Opening 1 April therefore shows what was forecast for 1 April next to
what happened on 1 April, with no second fetch.

Usage:
    python scripts/extract_forecasts.py             # dry run
    python scripts/extract_forecasts.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
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

from parse_daily_reports import (  # noqa: E402
    get_sheet_content,
    parse_date_from_filename,
    split_cells,
)

DAILY = ROOT / "public" / "data" / "daily"
# Three stores hold PGCB workbooks and they do not cover the same days. The
# pre-converted text store has 1,129 files; the ERP mirror has 2,918 workbooks
# including every recent day the text store stops short of. Reading all of them
# is what takes forecast coverage from a quarter of the archive to most of it.
#
# Order is precedence: an already-converted text file is preferred because it
# costs nothing to read, and the workbooks are opened only for days it misses.
PARSED_DIRS = [
    Path(r"W:\Grid-Explorer\PGCB\Daily Reports - D\Daily Reports Parsed"),
    Path(os.path.expandvars(r"%USERPROFILE%\Desktop\PGCB\Daily Reports - D\Daily Reports Parsed")),
]
# Source precedence, and it is not negotiable: the publisher's own file wins.
#
# PGCB's ERP portal is a VERIFICATION tool, not a source. It republishes the
# same workbook, so a figure taken from it is a figure taken second-hand, and
# the citation this archive prints would name an ERP copy rather than the
# document PGCB actually issued. The mirror is read only where no source copy
# is held — which is often, and is why it stays in the list at all: 2,357 days
# exist only as an ERP copy, against 643 that exist only as a source copy.
#
# Checked before reordering: on the 535 days held in both stores the files are
# byte-identical, so this changes provenance and not a single figure.
_env_archive = os.environ.get("ESB_PGCB_ARCHIVE")
SOURCE_WORKBOOK_DIRS = (
    # Off the Windows box (the GitHub Actions runner, 2026-09-03) the archive
    # is wherever `ESB_PGCB_ARCHIVE` points; same precedence rules apply.
    [Path(_env_archive)]
    if _env_archive
    else [
        Path(r"W:\Grid-Explorer\PGCB\Daily Reports - D"),
        Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
    ]
)
ERP_MIRROR_DIRS = (
    [Path(_env_archive) / "acquired-from-erp"]
    if _env_archive
    else [Path(r"C:\ESB-Grid-Archive\01-pgcb\acquired-from-erp")]
)
WORKBOOK_DIRS = [*SOURCE_WORKBOOK_DIRS, *ERP_MIRROR_DIRS]
WORKBOOK_SUFFIXES = {".xlsx", ".xlsm", ".xls"}

# PGCB's nine load-shed areas, in the order both layouts print them. Spellings
# changed with the 2025 layout (Comilla -> Cumilla, Barisal -> Barishal); the
# canonical form is the current one and the older spelling is an alias, so a
# reader comparing 2019 with 2026 sees one zone rather than two.
AREA_CANON = {
    "dhaka": "Dhaka",
    "chittagong": "Chattogram",
    "chattogram": "Chattogram",
    "khulna": "Khulna",
    "rajshahi": "Rajshahi",
    "comilla": "Cumilla",
    "cumilla": "Cumilla",
    "mymensingh": "Mymensingh",
    "mymensing": "Mymensingh",
    "sylhet": "Sylhet",
    "barisal": "Barishal",
    "barishal": "Barishal",
    "rangpur": "Rangpur",
}


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def num(cell: str):
    """First number in a cell, or None. Tolerates "13000.00 MW" and "33.00°C"."""
    if cell is None:
        return None
    m = re.search(r"-?\d[\d,]*\.?\d*", str(cell).replace(",", ""))
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def row_value(cells: list[str], idx: int):
    """First numeric cell strictly after `idx`."""
    for cell in cells[idx + 1:]:
        val = num(cell)
        if val is not None:
            return val
    return None


def find(lines, patterns, reject=None):
    """First numeric value on a line whose text matches any of `patterns`.

    `reject` guards the pairs both layouts state twice — "Maximum Generation"
    appears as an all-time record and as a daily figure, and the reported-day
    actuals use the same words as the projection.
    """
    for line in lines:
        cells = split_cells(line)
        for idx, cell in enumerate(cells):
            text = norm(cell)
            if not text:
                continue
            if reject and re.search(reject, text):
                continue
            if any(re.search(p, text) for p in patterns):
                val = row_value(cells, idx)
                if val is not None:
                    return val
    return None


def area_forecast(lines) -> dict[str, float] | None:
    """The area-wise load-shed forecast: a row of zone names, then a row of MW.

    Matching by COLUMN POSITION does not work and quietly fabricates figures.
    On the pre-2025 layout the zone names sit at cells 4-12 of the "Reserve"
    row while their values sit at cells 5-13 of a row two below, which also
    carries a clock time — reading position 4 there returns 5.0 from
    "05:00:00" and prints it as a 5 MW shortfall in Dhaka. It did, on roughly
    900 days, until this was rewritten.

    What is stable across both layouts is that the values are the LAST run of
    numbers on their row, one per zone, optionally followed by PGCB's own
    total. So the zones are counted, the trailing numbers are taken from the
    right, and where a Total column exists it is checked against their sum
    rather than trusted or discarded.
    """
    for i, line in enumerate(lines):
        cells = split_cells(line)
        zones = [AREA_CANON[norm(c)] for c in cells if norm(c) in AREA_CANON]
        if len(zones) < 5:
            continue
        last_zone_at = max(idx for idx, c in enumerate(cells) if norm(c) in AREA_CANON)
        has_total = any(norm(c) == "total" for c in cells[last_zone_at + 1:])
        need = len(zones) + (1 if has_total else 0)

        for probe in lines[i + 1: i + 5]:
            numbers = [n for n in (num(c) for c in split_cells(probe)) if n is not None]
            if len(numbers) < need:
                continue
            tail = numbers[-need:]
            values = dict(zip(zones, tail))
            if has_total:
                stated = tail[-1]
                summed = sum(tail[:-1])
                # A stated total that disagrees with its own parts means the row
                # was read wrong, not that PGCB mis-added: these are integers on
                # one printed line. Rejecting is safer than publishing either.
                if abs(stated - summed) > 0.51:
                    return None
            return values
    return {}


HOUR_ROW = re.compile(r"^([0-2]\d):([0-5]\d)$")
ISSUED_AT = re.compile(
    r"generated digitally.{0,140}?at\s*(\d{1,2}):(\d{2})\s*hrs?\s*on\s*(\d{1,2})-(\d{1,2})-(\d{4})",
    re.I | re.S,
)


def cell(cells: list[str], idx: int):
    return num(cells[idx]) if idx < len(cells) else None


def hourly_forecast(block) -> list[dict] | None:
    """The forecast load curve: one row per hour of the target day.

    The 2025+ Forecast Scenario opens with a "Hour | Generation | Load-Shed |
    Demand" table — 24 hourly rows plus the 18:30 and 19:30 half-hour samples
    PGCB takes around the evening peak, 26 in all. The archive already holds
    the ACTUAL curve for the same day in `hourlyLoadData`, so this is the other
    half of a comparison nobody could make before: not just whether the peak
    was forecast correctly, but whether the shape of the day was.

    Absent from the pre-2025 layout, which forecasts summary figures only.
    """
    rows: list[dict] = []
    for line in block:
        cells = [c.strip() for c in split_cells(line)]
        if not cells:
            continue
        if not HOUR_ROW.match(cells[0]):
            # The table is contiguous. Once past it, stop rather than pick up
            # the clock times that appear in the signature block below.
            if rows:
                break
            continue
        rows.append(
            {
                "time": cells[0],
                "generationMw": cell(cells, 1),
                "loadShedMw": cell(cells, 2),
                "demandMw": cell(cells, 3),
            }
        )
    return rows or None


def issued_at(forecast_sheet: str) -> str | None:
    """When PGCB's system generated the report, as an ISO instant in BST.

    This matters more than it looks. The scenario targets the day the workbook
    is FILED, and the stamp says it was generated at ~10:00 THAT MORNING — so
    the projection is issued on the day it describes, eight to eleven hours
    before the evening peak. It is not a day-ahead forecast, and the early
    hours of the curve above were published after they had already happened.
    """
    m = ISSUED_AT.search(forecast_sheet)
    if not m:
        return None
    hh, mi, dd, mm, yyyy = m.groups()
    return f"{int(yyyy):04d}-{int(mm):02d}-{int(dd):02d}T{int(hh):02d}:{int(mi):02d}:00+06:00"


def legacy_block(forecast_sheet: str) -> list[str] | None:
    """Lines BELOW the lone "Forecast" divider — the pre-2025 projection."""
    lines = forecast_sheet.split("\n")
    for idx, line in enumerate(lines):
        if split_cells(line) == ["Forecast"]:
            return lines[idx + 1:]
    return None


def scenario_block(forecast_sheet: str) -> list[str] | None:
    """Lines from the 2025+ "Forecast Scenario (DD-MM-YYYY)" heading."""
    lines = forecast_sheet.split("\n")
    for idx, line in enumerate(lines):
        if re.search(r"forecast scenario", line, re.I):
            return lines[idx:]
    return None


def extract(forecast_sheet: str) -> tuple[dict | None, str | None]:
    """Returns (forecast, layout) or (None, None) when the sheet states none."""
    block = scenario_block(forecast_sheet)
    layout = "scenario"
    if block is None:
        block = legacy_block(forecast_sheet)
        layout = "divider"
    if block is None:
        return None, None

    # "Actual Minimum Generation up to 8:00 hrs." sits inside the pre-2025 block
    # but is a MEASUREMENT taken on the publication morning, not a projection.
    # It is excluded rather than renamed — mixing one actual into a forecast
    # record is exactly the confusion this whole exercise is undoing.
    out = {
        "maxDemandEveningMw": find(
            block, [r"maximum demand.*evening", r"probable maximum demand at evening"]
        ),
        "maxDemandDayMw": find(
            block, [r"maximum demand.*day", r"probable maximum demand at day"]
        ),
        "shortageMw": find(block, [r"shortage\s*\(generation end\)"]),
        "maxGenEveningMw": find(
            block,
            [r"^2\s*$", r"maximum generation", r"probable maximum generation"],
            reject=r"till now|actual minimum",
        ),
        "totalEnergyGenMkwh": find(
            block, [r"total energy generation", r"probable total energy"]
        ),
        "reserveMw": find(block, [r"reserve\s*\(generation end\)"]),
        "maxTempC": find(block, [r"probable maximum temperature", r"probable max\.? temp"]),
        "totalLoadShedMw": find(block, [r"total load shed forecast"]),
    }
    hourly = hourly_forecast(block)
    if hourly:
        out["hourly"] = hourly
    stamp = issued_at(forecast_sheet)
    if stamp:
        out["issuedAt"] = stamp

    areas = area_forecast(block)
    if areas is None:
        out["areaLoadShedUnread"] = True
    elif areas:
        # PGCB states the area breakdown and its total separately, so the two
        # can be checked against each other. On 2024-04-01 the nine areas sum
        # to 435, which is exactly the stated total — that agreement is what
        # proves the right run of cells was read, and a disagreement means it
        # was not. The breakdown is dropped rather than published on a
        # mismatch; a fabricated per-zone shortfall is worse than none.
        total = out.get("totalLoadShedMw")
        if total is not None and abs(sum(areas.values()) - total) > 0.51:
            out["areaLoadShedUnread"] = True
        else:
            out["areaLoadShedMw"] = areas
    # The undifferentiated 2014 figure, recorded only where the split pair is
    # genuinely absent so it can never shadow them.
    if out["maxDemandEveningMw"] is None and out["maxDemandDayMw"] is None:
        out["maxDemandMw"] = find(
            block, [r"^maximum demand\b"], reject=r"evening|day|till now"
        )

    out = {k: v for k, v in out.items() if v is not None and v != {}}
    if not any(
        k in out
        for k in ("maxDemandEveningMw", "maxDemandMw", "maxGenEveningMw", "totalEnergyGenMkwh")
    ):
        return None, layout
    return out, layout


def parsed_dir() -> Path | None:
    for d in PARSED_DIRS:
        if d.is_dir():
            return d
    return None


def sheet_text(path: Path) -> str | None:
    """The workbook as pipe-delimited text, whatever form it is held in."""
    if path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore")
    from daily_extractor.convert import xlsx_to_text

    return xlsx_to_text(path)


def candidates() -> dict[date, list[Path]]:
    """Every held workbook, keyed by the date PGCB FILED it under.

    A day usually has more than one candidate — the same report as text on W:
    and as a workbook in the ERP mirror. They are kept in precedence order and
    tried in turn, so a file that fails to convert falls through to the next
    copy rather than dropping the day.
    """
    out: dict[date, list[Path]] = {}
    for root in WORKBOOK_DIRS:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*")):
            if path.suffix.lower() not in WORKBOOK_SUFFIXES:
                continue
            # "~$Daily Report.xlsx" is an Excel lock file, not a report.
            if path.name.startswith("~$"):
                continue
            filed = parse_date_from_filename(path.name)
            if filed:
                out.setdefault(filed, []).append(path)

    # The pre-converted .txt store goes LAST, not first.
    #
    # It was first because it is free to read — no workbook to open. But it is a
    # derived artifact, not a document PGCB issued, and its conversion is lossy
    # in exactly the place that matters: for 2026-06-23 the .txt yields 0 rows
    # of the hourly forecast curve where the workbook yields 26. Preferring it
    # cost the curve on 193 days that have one.
    #
    # It stays in the list because a day whose workbook is not held is still
    # better read from a lossy conversion than not at all.
    src = parsed_dir()
    if src is not None:
        for name in sorted(os.listdir(src)):
            if name.lower().endswith(".txt"):
                filed = parse_date_from_filename(name)
                if filed:
                    out.setdefault(filed, []).append(src / name)
    return out


def same_forecast(stored, fresh) -> bool:
    """Are these the same forecast, ignoring how JSON spelled the numbers?

    `==` already treats 18310 and 18310.0 as equal; what it does not survive is
    a float that has been through a JSON round trip. Comparing the canonical
    serialisation of both sides settles number *type* and key order at once.
    """
    if stored is None:
        return False

    def canon(v):
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return round(float(v), 6)
        if isinstance(v, dict):
            return {k: canon(x) for k, x in sorted(v.items())}
        if isinstance(v, list):
            return [canon(x) for x in v]
        return v

    return canon(stored) == canon(fresh)


def forecast_for(filed: date, paths: list[Path]) -> tuple[dict | None, str | None, Path | None]:
    for path in paths:
        try:
            text = sheet_text(path)
        except Exception:
            continue
        if not text:
            continue
        sheet = get_sheet_content(text, "Forecast")
        if not sheet:
            continue
        forecast, layout = extract(sheet)
        if forecast:
            return forecast, layout, path
    return None, None, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    by_filed = candidates()
    if not by_filed:
        print("! no PGCB workbook or text store reachable", file=sys.stderr)
        return 1
    print(f"{len(by_filed)} report dates held across all stores")

    days = sorted(by_filed)
    if args.limit:
        days = days[: args.limit]

    tally = Counter()
    samples: list[tuple[str, str, dict]] = []
    results: list[tuple[date, dict, str, Path]] = []

    def work(filed: date):
        forecast, layout, path = forecast_for(filed, by_filed[filed])
        return filed, forecast, layout, path

    # Opening ~3,000 workbooks is the slow half of this script; the extraction
    # itself is string work. Threads are enough because pandas releases the GIL
    # over the file read.
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for filed, forecast, layout, path in pool.map(work, days):
            if not forecast:
                tally["no projection found in any held copy"] += 1
                continue
            results.append((filed, forecast, layout, path))

    for filed, forecast, layout, path in sorted(results):
        # A workbook filed on F reports energy day F-1 and forecasts F.
        target = filed
        forecast["issuedOn"] = (filed - timedelta(days=1)).isoformat()
        forecast["issuedIn"] = path.stem
        forecast["targetDay"] = target.isoformat()
        forecast["layout"] = layout
        # Which store this was read from. "erp-mirror" means no source copy of
        # the workbook is held for that day and the figure came from PGCB's
        # republishing portal instead — worth knowing, and worth closing.
        forecast["issuedFrom"] = (
            "erp-mirror"
            if any(str(path).startswith(str(d)) for d in ERP_MIRROR_DIRS)
            else "source-copy"
        )
        # A .txt is a conversion this project made, not a file PGCB issued, so
        # it is named as such rather than passed off as either store's copy.
        if path.suffix.lower() == ".txt":
            forecast["issuedFrom"] = "converted-text"
            forecast["issuedFromNote"] = (
                "read from a pre-converted text copy; no workbook is held for this day"
            )

        out_path = DAILY / f"{target.isoformat()}.json"
        if not out_path.exists():
            tally["forecast for a day not in the archive"] += 1
            continue

        tally[f"extracted ({layout})"] += 1
        if len(samples) < 5:
            samples.append((target.isoformat(), layout, forecast))
        if args.apply:
            doc = json.loads(out_path.read_text(encoding="utf-8"))
            # Re-extracting a day that already carries the same forecast must not
            # touch the file. Python reads 18310 and 18310.0 as equal but json
            # writes them differently, so an unconditional write rewrote every
            # whole number as a float and turned an idempotent step into a diff
            # on days nobody had re-ingested. This runs on every daily ingest now,
            # so that churn would land in every data commit.
            if same_forecast(doc.get("forecast"), forecast):
                tally["already current"] += 1
                continue
            doc["forecast"] = forecast
            with out_path.open("w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)

    written = sum(v for k, v in tally.items() if k.startswith("extracted")) - tally["already current"]
    print()
    print("=== forecast extraction ===")
    for k, v in sorted(tally.items(), key=lambda kv: -kv[1]):
        print(f"  {v:6d}  {k}")
    print()
    print(f"{written} days {'written' if args.apply else 'would be written'}")
    print()
    print("samples:")
    for day, layout, f in samples:
        keys = {k: v for k, v in f.items() if k not in ("issuedIn",)}
        print(f"  {day} [{layout}] {json.dumps(keys, ensure_ascii=False)[:200]}")
    if not args.apply:
        print()
        print("(dry run - re-run with --apply to write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
