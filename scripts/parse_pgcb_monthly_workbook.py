"""Extract the full PGCB monthly report into one structured JSON document.

`scripts/parse_monthly_reports.py` pulls ~21 headline numbers from two sheets.
This reads the rest: 19 populated sheets, ~17k non-empty cells per month.

Accepts either the source workbook (.xlsx/.xls) or the padded markdown dumps in
`W:\\Grid-Explorer\\PGCB\\Monthy Reports - D` (.txt). Both carry every sheet and — verified
against January 2026 — the same column positions, so one set of readers serves
both: the .txt is converted back to a cell matrix where `raw[i]` is
`line.split("|")[i + 1]`.

Usage:
    python scripts/parse_pgcb_monthly_workbook.py <report.xlsx|report.txt> [out.json]

Default output is lib/pgcb-monthly-detail/{YYYY-MM}.json, which
scripts/build_pgcb_monthly_public.py merges into the published per-month file as
a `detail` block. Detail lives per-month by design — it is fetched only for the
month being viewed and never enters the series or the JS bundle.

Sheet layouts are positional (these are print-formatted workbooks with merged
headers), so column indices are pinned per sheet and documented at each reader.
"""
from __future__ import annotations

import calendar
import datetime
import json
import re
import sys
import warnings
from pathlib import Path
from typing import Any

import pandas as pd

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = ROOT / "lib" / "pgcb-monthly-detail"

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}

# No reader indexes beyond column 29; the cap keeps pathological sheets tractable.
MAX_COLUMNS = 160

ZONES = [
    "dhaka", "chattogram", "cumilla", "mymensingh", "sylhet",
    "khulna", "barishal", "rajshahi", "rangpur",
]


# --------------------------------------------------------------------------- #
# cell helpers
# --------------------------------------------------------------------------- #
# The .txt dumps keep a ':00' seconds component and encode in-cell line breaks
# as literal <br>, where the .xlsx path yields time objects and real newlines.
# Both are normalised so a month backfilled from a dump is byte-identical to the
# same month parsed from its workbook (verified on July 2025, which has both).
_TRAILING_SECONDS = re.compile(r"(?<=\d\d:\d\d):00\b")
_HTML_BREAK = re.compile(r"<br\s*/?>", re.I)


def txt(v: Any) -> str:
    """Cell as trimmed text. Empty string for blanks so callers can test truthiness."""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    try:
        if pd.isna(v):
            return ""
    except (TypeError, ValueError):
        pass
    if isinstance(v, (pd.Timestamp, datetime.datetime)):
        # Midnight is how Excel stores a bare date here; keep it date-only.
        if v.hour == 0 and v.minute == 0:
            return v.strftime("%Y-%m-%d")
        return v.strftime("%Y-%m-%d %H:%M")
    if isinstance(v, datetime.date):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, datetime.time):
        # Seconds are kept only when they carry information.
        return v.strftime("%H:%M:%S") if v.second else v.strftime("%H:%M")
    s = _HTML_BREAK.sub(" ", str(v)).strip()
    return _TRAILING_SECONDS.sub("", s)


def num(v: Any) -> float | None:
    """Cell as a number. '-', blanks and stray text become None rather than 0."""
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        if isinstance(v, float) and pd.isna(v):
            return None
        return round(float(v), 6)
    s = txt(v).replace(",", "").strip()
    if not s or s in {"-", "--", "n/a", "N/A"}:
        return None
    m = re.match(r"^-?\d*\.?\d+", s)
    return round(float(m.group(0)), 6) if m else None


ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")
# Reports before ~2021 print dates day-first: 01-06-13, 23/02/20.
DMY_DATE = re.compile(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b")


def is_date(v: Any) -> bool:
    """True for a real date cell (xlsx), an ISO string, or a day-first string."""
    if isinstance(v, (pd.Timestamp, datetime.datetime, datetime.date)):
        return True
    if not isinstance(v, str):
        return False
    s = v.strip()
    return bool(ISO_DATE.match(s) or DMY_DATE.match(s))


def day_of(v: Any) -> int | None:
    """Day of month, whichever of the three date shapes the cell uses."""
    if isinstance(v, (pd.Timestamp, datetime.datetime, datetime.date)):
        return v.day
    s = txt(v)
    if ISO_DATE.match(s):
        return int(s[8:10])
    m = DMY_DATE.match(s)
    return int(m.group(1)) if m else None


def iso_when(v: Any) -> str | None:
    """Normalise a date-bearing cell to ISO so old and new reports render alike.

    Day-first strings are converted; anything unrecognised is passed through
    untouched rather than guessed at.
    """
    s = txt(v)
    if not s:
        return None
    if ISO_DATE.match(s):
        return s
    m = DMY_DATE.match(s)
    if not m:
        return s
    day, month, year = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    if year < 100:
        year += 2000
    if not (1 <= month <= 12 and 1 <= day <= 31):
        return s
    return f"{year}-{month:02d}-{day:02d}"


def _edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def _month_from_word(word: str) -> str | None:
    """Month name, tolerating the odd typo — February 2020 is printed 'Fabruary'."""
    w = word.lower()
    if w in MONTHS:
        return w
    best, best_d = None, 99
    for name in MONTHS:
        d = _edit_distance(w, name)
        if d < best_d:
            best, best_d = name, d
    return best if best_d <= 2 else None


def cell(row: list[Any], i: int) -> Any:
    return row[i] if i < len(row) else None


def month_from_dates(rows: list[list[Any]]) -> tuple[int, int] | None:
    """The year-month most of the sheet's own 'Current Month' dates fall in.

    Used to sanity-check the printed period, which is not always right: the ERP
    copy of April 2021 is headed 'Month: March 2021' while every date inside it
    is in April. Requires a clear majority so a handful of stale cells cannot
    swing the result.
    """
    counts: dict[str, int] = {}
    for row in rows:
        if not clean_name(txt(cell(row, 1))) or num(cell(row, 2)) is None:
            continue
        when = iso_when(cell(row, 3))
        if when and ISO_DATE.match(when):
            counts[when[:7]] = counts.get(when[:7], 0) + 1
    if not counts:
        return None
    ym, n = max(counts.items(), key=lambda kv: kv[1])
    if n < 3 or n * 2 <= sum(counts.values()):
        return None
    year, month = ym.split("-")
    return int(year), int(month)


def resolve_period(mis: list[list[Any]], header: tuple[str, int]) -> tuple[str, int, bool]:
    """Return (month name, year, header_was_wrong), preferring the sheet's dates."""
    month_name, year = header
    mnum = MONTHS[month_name.lower()]
    dated = month_from_dates(mis)
    if dated and dated != (year, mnum):
        year, mnum = dated
        month_name = next(k for k, v in MONTHS.items() if v == mnum).capitalize()
        return month_name, year, True
    return month_name, year, False


def find_month(rows: list[list[Any]]) -> tuple[str, int] | None:
    for row in rows:
        for v in row:
            s = txt(v)
            m = re.search(r"Month\s*:?\s*([A-Za-z]+)[-',\s]+(\d{4})", s)
            if m:
                name = _month_from_word(m.group(1))
                if name:
                    return name.capitalize(), int(m.group(2))
    return None


# --------------------------------------------------------------------------- #
# loaders — both produce {sheet name: rows of cells}
# --------------------------------------------------------------------------- #
def load_xlsx(path: Path) -> dict[str, list[list[Any]]]:
    xl = pd.ExcelFile(path)
    out: dict[str, list[list[Any]]] = {}
    for name in xl.sheet_names:
        df = xl.parse(name, header=None)
        out[name] = [r.tolist() for _, r in df.iterrows()]
    return out


def load_txt(path: Path) -> dict[str, list[list[Any]]]:
    """Read a padded-markdown sheet dump back into a cell matrix.

    Each data line is `| c1 | c2 | ... |`, so splitting on '|' yields an empty
    leading element and raw column i lands at index i + 1. The generated
    `| Col 1 | Col 2 |` header and its `|:---|` rule carry no data and are skipped.
    """
    out: dict[str, list[list[Any]]] = {}
    current: str | None = None
    # Streamed rather than read whole: a couple of these dumps run to hundreds of
    # megabytes because every column is padded to its widest cell and some sheets
    # carry tens of thousands of empty trailing columns. Only the leading columns
    # are ever indexed (the widest reader reaches column 29), so the rest is
    # dropped per line instead of being held in memory.
    with path.open("r", encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if line.startswith("## Sheet:"):
                current = line.split(":", 1)[1].strip()
                out[current] = []
                continue
            if current is None or not line.startswith("|"):
                continue
            stripped = line.lstrip()
            if stripped.startswith("|:") or re.match(r"^\|\s*Col 1\s*\|", stripped):
                continue
            parts = line.split("|", MAX_COLUMNS + 2)
            out[current].append([p.strip() for p in parts[1 : MAX_COLUMNS + 1]] if len(parts) > 2 else [])
    return out


def load_report(path: Path) -> dict[str, list[list[Any]]]:
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return load_xlsx(path)
    return load_txt(path)


def _norm_sheet(name: str) -> str:
    """Sheet names are typed by hand and drift: 'QF_LDC_37', 'QF-LDC-23 ' with a
    trailing space, and June 2023's '"QF-LDC-37' with a stray leading quote.
    Comparing on alphanumerics only makes the lookup immune to all of it."""
    return re.sub(r"[^A-Za-z0-9]", "", name).upper()


def sheet_getter(sheets: dict[str, list[list[Any]]]):
    """Return a lookup that finds a sheet by any of its spellings."""
    index: dict[str, list[list[Any]]] = {}
    for name, rows in sheets.items():
        if rows:
            index.setdefault(_norm_sheet(name), rows)

    def get(*names: str) -> list[list[Any]] | None:
        for n in names:
            found = index.get(_norm_sheet(n))
            if found:
                return found
        return None

    return get


def clean_name(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().rstrip(":").strip()


# --------------------------------------------------------------------------- #
# QF-MIS-03 — System Operation Data
# cols: 0 Sl | 1 Item | 2 value | 3 date | 4 prev | 5 prev date | 6 last-yr | 8 max-till-date
# --------------------------------------------------------------------------- #
SYSTEM_KEYS = [
    (r"^maximum generation", "max_generation_mw"),
    (r"^minimum generation", "min_generation_mw"),
    (r"^maximum evening peak generation", "max_evening_peak_gen_mw"),
    (r"^maximum day peak generation", "max_day_peak_gen_mw"),
    (r"^maximum evening peak demand", "max_evening_peak_demand_mw"),
    (r"^average generation .*evening peak", "avg_gen_evening_peak_mw"),
    (r"^average generation .*day peak", "avg_gen_day_peak_mw"),
    (r"^maximum power import from india", "max_import_india_mw"),
    (r"^maximum power import from tripura", "max_import_tripura_mw"),
    (r"^maximum load shed .*evening peak", "max_load_shed_evening_mw"),
    (r"^generation during max\. load shed .*evening", "gen_at_max_shed_evening_mw"),
    (r"^minimum load shed .*evening peak", "min_load_shed_evening_mw"),
    (r"^generation during min\. load shed .*evening", "gen_at_min_shed_evening_mw"),
    (r"^maximum load shed .*day peak", "max_load_shed_day_mw"),
    (r"^generation during max\. load shed .*day", "gen_at_max_shed_day_mw"),
    (r"^minimum load shed .*day peak", "min_load_shed_day_mw"),
    (r"^generation during min\. load shed .*day", "gen_at_min_shed_day_mw"),
    (r"^nos\. of days load shed at evening", "days_load_shed_evening"),
    (r"^nos\. of days load shed at day", "days_load_shed_day"),
    (r"^gross generation of bpdb", "gross_generation_bpdb_mkwh"),
    (r"^station use of bpdb", "station_use_bpdb_mkwh"),
    (r"^net generation of bpdb", "net_generation_bpdb_mkwh"),
    (r"^net generation of ipp", "net_generation_ipp_mkwh"),
    (r"^net generation by generation companies", "net_generation_gencos_mkwh"),
    (r"^net generation of reb", "net_generation_reb_mkwh"),
    (r"^net generation of rental", "net_generation_rental_mkwh"),
    (r"^total net generation", "total_net_generation_mkwh"),
    (r"^monthly load factor", "monthly_load_factor_pct"),
]


def parse_system(rows: list[list[Any]], year: int | None = None, month: int | None = None) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    keyed: dict[str, Any] = {}
    for row in rows:
        sl, label = txt(cell(row, 0)), clean_name(txt(cell(row, 1)))
        if not label or not sl or label.lower().startswith(("power grid", "system operation")):
            continue
        value = num(cell(row, 2))
        if value is None:
            continue
        entry = {
            "sl": sl,
            "item": label,
            "value": value,
            "when": iso_when(cell(row, 3)),
            "prev_month": num(cell(row, 4)),
            "last_year": num(cell(row, 6)),
            "max_till_date": num(cell(row, 8)),
        }
        items.append(entry)
        low = label.lower()
        for pattern, key in SYSTEM_KEYS:
            if re.search(pattern, low) and key not in keyed:
                keyed[key] = {
                    "value": value,
                    "when": entry["when"],
                    "prev_month": entry["prev_month"],
                    "last_year": entry["last_year"],
                }
                break

    # A "Current Month" figure stamped with a date outside the report month is the
    # previous month's number left in the cell — a source error, seen in several
    # 2025 reports on the evening-peak generation row. The printed value is kept
    # (it is what PGCB published) but flagged so the site can say so.
    if year and month:
        prefix = f"{year}-{month:02d}"
        for stat in keyed.values():
            when = stat.get("when")
            if when and ISO_DATE.match(when) and not when.startswith(prefix):
                stat["suspect_date"] = True
    return {"items": items, "keyed": keyed}


# --------------------------------------------------------------------------- #
# QF-LDC-22 — area supply at the moment of system peak (rows sit below the TOC)
# cols: 1 area | 2 unit | 3 value
# --------------------------------------------------------------------------- #
AREA_ALIASES = {
    "chittagong": "chattogram", "chattogram": "chattogram",
    "comilla": "cumilla", "cumilla": "cumilla",
    "barisal": "barishal", "barishal": "barishal",
}


def parse_area_supply(rows: list[list[Any]]) -> dict[str, Any]:
    areas: list[dict[str, Any]] = []
    zone_totals: dict[str, float] = {}
    peak_context: dict[str, Any] = {}
    for row in rows:
        label = clean_name(txt(cell(row, 1)))
        value = num(cell(row, 3))
        if not label:
            continue
        low = label.lower()
        if "area wise supply" in low:
            peak_context = {"generation_mw": value, "when": txt(cell(row, 4)) or None}
            continue
        if value is None:
            continue
        if low.startswith("total supply in east"):
            zone_totals["east"] = value
        elif low.startswith("total supply in west"):
            zone_totals["west"] = value
        elif low.startswith("total supply in both"):
            zone_totals["both"] = value
        else:
            key = AREA_ALIASES.get(low, low)
            if key in ZONES:
                areas.append({"area": label, "key": key, "load_mw": value})
    return {"areas": areas, "zone_totals": zone_totals, "peak_context": peak_context}


# --------------------------------------------------------------------------- #
# QF-LDC-27 / QF-LDC-28 — by grid circle, split by cause, with prev month inline
# cols: 0 Sl | 1 circle | 2-5 prev T/EO/SO/total | 6-9 current T/EO/SO/total
# --------------------------------------------------------------------------- #
def parse_circle_split(rows: list[list[Any]]) -> dict[str, Any]:
    circles: list[dict[str, Any]] = []
    total: dict[str, Any] = {}
    for row in rows:
        name = clean_name(txt(cell(row, 1)))
        if not name or name.lower().startswith(("area", "sl", "power grid", "information")):
            continue
        cur = {
            "tripping": num(cell(row, 6)),
            "emergency": num(cell(row, 7)),
            "scheduled": num(cell(row, 8)),
            "total": num(cell(row, 9)),
        }
        prev = {
            "tripping": num(cell(row, 2)),
            "emergency": num(cell(row, 3)),
            "scheduled": num(cell(row, 4)),
            "total": num(cell(row, 5)),
        }
        if cur["total"] is None and prev["total"] is None:
            continue
        entry = {"circle": name, "current": cur, "previous": prev}
        if name.lower() == "total":
            total = entry
        else:
            circles.append(entry)
    return {"circles": circles, "total": total}


# --------------------------------------------------------------------------- #
# QF-LDC-37 — daily load shedding, two side-by-side tables on one sheet
# evening: 0 date, 1 gen, 2 demand, 3 shed, 4 time, 5-13 zones
# day:    15 date, 16 gen, 17 demand, 18 shed, 19 time, 20-28 zones
# --------------------------------------------------------------------------- #
def parse_daily_load_shedding(
    rows: list[list[Any]], year: int, month: int
) -> dict[str, list[dict[str, Any]]]:
    """Read both halves of the sheet, re-dating each row onto the report month.

    The printed year is not trustworthy — January 2026's rows are dated 2025-01-xx
    in the source — but the day-of-month is. Rows are therefore rebuilt from the
    report period plus the row's own day, and any row whose day is out of range
    for that month is dropped rather than guessed at.
    """
    last_day = calendar.monthrange(year, month)[1]

    def read(base: int) -> list[dict[str, Any]]:
        out = []
        for row in rows:
            d = cell(row, base)
            if not is_date(d):
                continue
            day = day_of(d)
            if day is None or not 1 <= day <= last_day:
                continue
            zones = {z: num(cell(row, base + 5 + i)) for i, z in enumerate(ZONES)}
            out.append(
                {
                    "date": f"{year}-{month:02d}-{day:02d}",
                    "generation_mw": num(cell(row, base + 1)),
                    "demand_mw": num(cell(row, base + 2)),
                    "load_shed_mw": num(cell(row, base + 3)),
                    "time": txt(cell(row, base + 4)) or None,
                    "zones": zones,
                }
            )
        out.sort(key=lambda r: r["date"])
        return out

    return {"evening_peak": read(0), "day_peak": read(15)}


# --------------------------------------------------------------------------- #
# Remaining tabular sheets
# --------------------------------------------------------------------------- #
def parse_substation_max_load(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-33 — cols: 0 Sl | 1 substation | 2 load MW | 3 date & time.

    A listed substation with a blank load is kept with `load_mw: None` rather than
    dropped — the report says it exists and recorded nothing, which is different
    from it not being in the report. (January 2026 lists Kaptai and Modern this way.)
    """
    out = []
    for row in rows:
        name = clean_name(txt(cell(row, 1)))
        if not name or num(cell(row, 0)) is None:
            continue
        out.append({"substation": name, "load_mw": num(cell(row, 2)), "when": iso_when(cell(row, 3))})
    return out


def parse_area_max_load(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-34 — each area's OWN maximum (non-coincident), cols: 0 area | 1 MW | 2 date | 3 hour."""
    out = []
    for row in rows:
        name = clean_name(txt(cell(row, 0)))
        load = num(cell(row, 1))
        if not name or load is None:
            continue
        key = AREA_ALIASES.get(name.lower(), name.lower())
        if key not in ZONES:
            continue
        out.append(
            {
                "area": name,
                "key": key,
                "load_mw": load,
                "date": iso_when(cell(row, 2)),
                "hour": txt(cell(row, 3)) or None,
            }
        )
    return out


def parse_voltages(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-35 — cols: 0 Sl | 1 substation | 2 rated | 3 max | 4 when | 5 min | 6 when.

    Voltage class comes from the section header row ('400 KV Substation'), so it
    is tracked as the sheet is walked.
    """
    out: list[dict[str, Any]] = []
    section: str | None = None
    for row in rows:
        label = clean_name(txt(cell(row, 1)))
        m = re.match(r"^(\d{3})\s*KV\s+Substation", label, re.I)
        if m:
            section = f"{m.group(1)} kV"
            continue
        if not label or num(cell(row, 0)) is None:
            continue
        rated, vmax, vmin = num(cell(row, 2)), num(cell(row, 3)), num(cell(row, 5))
        if rated is None and vmax is None and vmin is None:
            continue
        out.append(
            {
                "substation": label,
                "class": section,
                "rated_kv": rated,
                "max_kv": vmax,
                "max_when": iso_when(cell(row, 4)),
                "min_kv": vmin,
                "min_when": iso_when(cell(row, 6)),
            }
        )
    return out


def parse_transformer_loading(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-36 — cols: 0 substation | 1 transformer | 2 level | 3 MVA | 4 date | 5 hour | 6 MW | 7 MVAR | 8 %."""
    out = []
    for row in rows:
        name = clean_name(txt(cell(row, 0)))
        pct = num(cell(row, 8))
        if not name or pct is None or name.lower().startswith(("substation", "power grid", "information", "month")):
            continue
        out.append(
            {
                "substation": name,
                "transformer": txt(cell(row, 1)) or None,
                "voltage_level": txt(cell(row, 2)) or None,
                "capacity_mva": num(cell(row, 3)),
                "date": iso_when(cell(row, 4)),
                "hour": txt(cell(row, 5)) or None,
                "mw": num(cell(row, 6)),
                "mvar": num(cell(row, 7)),
                "loading_pct": pct,
            }
        )
    return out


def parse_interruptions(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-32 — cols: 0 substation | 1 count | 2 duration | 3 unserved MWh | 4 remarks."""
    out = []
    for row in rows:
        name = clean_name(txt(cell(row, 0)))
        count = num(cell(row, 1))
        if not name or count is None:
            continue
        if name.lower().startswith(("sub-station", "power grid", "information", "month", "overall")):
            continue
        out.append(
            {
                "substation": name,
                "interruptions": count,
                "duration": txt(cell(row, 2)) or None,
                "unserved_mwh": num(cell(row, 3)),
            }
        )
    return out


def parse_generation_system(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """QF-LDC-38 — cols: 0 Sl | 1 description | 2 unit | 3 quantity | 4 date | 5 time."""
    out = []
    for row in rows:
        label = clean_name(txt(cell(row, 1)))
        value = num(cell(row, 3))
        if not label or value is None or num(cell(row, 0)) is None:
            continue
        out.append(
            {
                "item": label,
                "unit": txt(cell(row, 2)) or None,
                "value": value,
                "date": iso_when(cell(row, 4)),
                "time": txt(cell(row, 5)) or None,
            }
        )
    return out


def parse_outage_events(rows: list[list[Any]], kind: str) -> list[dict[str, Any]]:
    """QF-LDC-23..26 — event logs.

    cols: 0 substation (or circle header) | 1 equipment | 2 start | 3 finish |
          4 duration | 5 type | 6 cause | 7 unserved MW | 8 unserved MWh
    """
    out: list[dict[str, Any]] = []
    circle: str | None = None
    for row in rows:
        first = clean_name(txt(cell(row, 0)))
        equipment = txt(cell(row, 1))
        start = cell(row, 2)
        if first and "grid circle" in first.lower() and not equipment:
            circle = first
            continue
        if not first or not is_date(start):
            continue
        out.append(
            {
                "kind": kind,
                "circle": circle,
                "substation": first,
                "equipment": equipment or None,
                "start": iso_when(start),
                "finish": iso_when(cell(row, 3)),
                "duration": txt(cell(row, 4)) or None,
                "type": txt(cell(row, 5)) or None,
                "cause": clean_name(txt(cell(row, 6))) or None,
                "unserved_load_mw": num(cell(row, 7)),
                "unserved_energy_mwh": num(cell(row, 8)),
            }
        )
    return out


def parse_fgmo(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """FGMO — cols: 0 Sl | 1 plant | 2 owner | 3 fuel | 4 MW | 5.. daily tick marks."""
    out = []
    for row in rows:
        plant = clean_name(txt(cell(row, 1)))
        if not plant or num(cell(row, 0)) is None:
            continue
        # 31 chars, one per day — a bitstring rather than a boolean array, which
        # costs ~6x less over the wire for the same information.
        days = "".join("1" if txt(cell(row, 5 + i)) else "0" for i in range(31))
        out.append(
            {
                "plant": plant,
                "owner": txt(cell(row, 2)) or None,
                "fuel": txt(cell(row, 3)) or None,
                "capacity_mw": num(cell(row, 4)),
                "days_active": days.count("1"),
                "days": days,
            }
        )
    return out


# --------------------------------------------------------------------------- #
def parse_workbook(src: Path) -> dict[str, Any]:
    """The whole report as one document, keyed by the month the report itself states.

    Split out of `main` so `ingest_pgcb_monthly.py` (the Pi's daily runner)
    can call the parser in-process and read the document back, rather than
    shelling out and re-reading a file it just wrote. `SystemExit` is kept for
    the two refusals so the command line and the runner report them alike.
    """
    sheets = load_report(src)

    sheet = sheet_getter(sheets)

    mis = sheet("QF-MIS-03", "MIS")
    if mis is None:
        raise SystemExit(f"{src.name}: no QF-MIS-03 sheet")

    period = find_month(mis) or find_month(sheet("QF-LDC-22") or mis)
    if not period:
        raise SystemExit(f"{src.name}: could not read 'Month: <name> <year>'")
    month_name, year, header_wrong = resolve_period(mis, period)
    date_key = f"{year}-{MONTHS[month_name.lower()]:02d}"

    doc: dict[str, Any] = {
        "date_key": date_key,
        "month": month_name,
        "year": year,
        "source_file": src.name,
        "sheets_present": [n for n, d in sheets.items() if d],
    }

    doc["system"] = parse_system(mis, year, MONTHS[month_name.lower()])

    if (d := sheet("QF-LDC-22")) is not None:
        doc["area_supply_at_system_peak"] = parse_area_supply(d)
    if (d := sheet("QF-LDC-27")) is not None:
        doc["tripping_outage"] = parse_circle_split(d)
    if (d := sheet("QF-LDC-28")) is not None:
        doc["unserved_energy"] = parse_circle_split(d)
    if (d := sheet("QF-LDC-32")) is not None:
        doc["interruptions"] = parse_interruptions(d)
    if (d := sheet("QF-LDC-33")) is not None:
        doc["substation_max_load"] = parse_substation_max_load(d)
    if (d := sheet("QF-LDC-34")) is not None:
        doc["area_max_load"] = parse_area_max_load(d)
    if (d := sheet("QF-LDC-35")) is not None:
        doc["substation_voltage"] = parse_voltages(d)
    if (d := sheet("QF-LDC-36")) is not None:
        doc["transformer_loading"] = parse_transformer_loading(d)
    if (d := sheet("QF_LDC_37", "QF-LDC-37")) is not None:
        doc["daily_load_shedding"] = parse_daily_load_shedding(d, year, MONTHS[month_name.lower()])
    if (d := sheet("QF-LDC-38")) is not None:
        doc["generation_system"] = parse_generation_system(d)
    if (d := sheet("FGMO")) is not None:
        doc["fgmo"] = parse_fgmo(d)

    suspect = [
        {"key": k, "value": v["value"], "printed_date": v.get("when")}
        for k, v in doc["system"]["keyed"].items()
        if v.get("suspect_date")
    ]
    quality: dict[str, Any] = {}
    if suspect:
        quality["stale_current_month_figures"] = suspect
    if header_wrong:
        quality["header_period_mismatch"] = {
            "printed": f"{period[0]} {period[1]}",
            "resolved": f"{month_name} {year}",
            "note": "the printed period disagreed with the dates inside the report; the dates were used",
        }
    if quality:
        doc["data_quality"] = quality

    events: list[dict[str, Any]] = []
    for name, kind in [
        ("QF-LDC-23", "substation_emergency"),
        ("QF-LDC-24", "line_emergency"),
        ("QF-LDC-25", "substation_scheduled"),
        ("QF-LDC-26", "line_scheduled"),
    ]:
        if (d := sheet(name)) is not None:
            events.extend(parse_outage_events(d, kind))
    if events:
        doc["outage_events"] = events

    return doc


def section_counts(doc: dict[str, Any]) -> dict[str, int]:
    """How many rows each section carries — the line-per-section summary."""
    return {
        k: (len(v) if isinstance(v, list) else
            sum(len(x) for x in v.values()) if k == "daily_load_shedding" else
            len(v.get("circles", v.get("items", v.get("areas", [])))) if isinstance(v, dict) else 1)
        for k, v in doc.items()
        if isinstance(v, (list, dict)) and k not in {"sheets_present", "source"}
    }


def write_document(doc: dict[str, Any], out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    src = Path(sys.argv[1])
    doc = parse_workbook(src)
    date_key = doc["date_key"]

    out = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT_DIR / f"{date_key}.json"
    write_document(doc, out)

    counts = section_counts(doc)
    try:
        shown = out.relative_to(ROOT)
    except ValueError:  # an explicit output path outside the repo
        shown = out
    print(f"{date_key}  ->  {shown}  ({out.stat().st_size / 1024:.1f} KB)")
    for k, n in counts.items():
        print(f"  {k:28s} {n}")


if __name__ == "__main__":
    main()
