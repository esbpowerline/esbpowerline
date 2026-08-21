"""Parse an uploaded PGCB report (+ optional Petrobangla PDF) and emit JSON on stdout.

The admin panel shells out to this. It deliberately reuses the existing, trusted
parsers rather than reimplementing them — `parse_pgcb_file` and
`parse_petrobangla_file` carry years of quirk knowledge that a rewrite would
silently lose.

Unlike `process_single_date`, nothing is written to public/data. The caller gets
the payload back and decides whether to publish it, so a bad parse never lands
on disk or on the site.

The grid report may be the .xlsx/.xls/.xlsm workbook PGCB files, or a .docx or
.pdf copy of the same report; `daily_extractor.report_convert` renders all three
into the pipe-table text `parse_pgcb_file` reads, and says in the warnings what
it had to infer for the two that carry no sheet names.

Usage:
  python scripts/ingest_bridge.py --pgcb <file.xlsx|.docx|.pdf> [--pb <file.pdf>] [--date YYYY-MM-DD]

Output (stdout, JSON):
  {"ok": true, "date": "...", "payload": {...}, "validation": {...}}
  {"ok": false, "error": "..."}
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Keep the existing parsers from writing anywhere real if they ever try.
os.environ.setdefault("ESB_DAILY_OUTPUT_DIR", tempfile.mkdtemp(prefix="esb-ingest-"))


def fail(message: str) -> None:
    print(json.dumps({"ok": False, "error": message}))
    sys.exit(0)


def derive_energy_day(filename: str) -> str | None:
    """PGCB names files by the *publication* date; the energy day is the day before.

    "Daily Report 02-08-2026.xlsx" therefore describes energy day 2026-08-01.
    """
    # Day and month may be one or two digits ("01-7-2023"), matching
    # parse_date_from_filename. The lookahead refuses a 5-digit year rather
    # than clipping it: "21-8-20223_.xlsm" would otherwise read as 2022-08-21
    # when the sheet inside says 2023-08-20.
    m = re.search(r"(\d{1,2})[-_. ](\d{1,2})[-_. ](\d{4})(?!\d)", filename)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return (datetime.date(y, mo, d) - datetime.timedelta(days=1)).isoformat()
        except ValueError:
            return None
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", filename)
    if m:
        try:
            return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
        except ValueError:
            return None
    # Two-digit year, e.g. "Daily Report 01-03-18_.xlsm" — 375 of the 1,185
    # workbooks on W: are named this way and returned nothing here, which sent
    # them down the workbook-date path unnecessarily. Tried last, and the
    # lookahead stops it from clipping "01-05-20" out of "01-05-2026".
    m = re.search(r"(\d{1,2})[-_. ](\d{1,2})[-_. ](\d{2})(?!\d)", filename)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y += 2000 if y < 50 else 1900
        try:
            return (datetime.date(y, mo, d) - datetime.timedelta(days=1)).isoformat()
        except ValueError:
            return None
    return None


def xlsx_to_md(path: Path) -> str:
    """Workbook to pipe-table text.

    The implementation moved to `daily_extractor.report_convert`, which returns
    (text, notes) so the docx and pdf readers can report what they inferred.
    `backfill_daily_extremes` and `reingest_from_archive` import this name and
    want the text alone, so the entry point stays here.
    """
    from daily_extractor.report_convert import xlsx_to_md as _impl

    return _impl(path)[0]


def refine_outage_reason(outages: list) -> int:
    """Re-split `reason` where the cause was lost to keyword precedence.

    parse_pgcb_file tries [' due to ', ' for ', ' Due to '] in that order, so
    "… Project Work S/D Due to DCRM Test for CB." splits at " for " and the
    reason becomes "for CB." — dropping the actual cause. An explicit "Due to"
    must win over a bare "for".

    Only `reason` is corrected. `plant` is left as the parser produced it so
    these rows keep the same shape as the 4,500 already in the archive; the
    asset is still identified either way. Returns the number of rows changed.
    """
    fixed = 0
    for o in outages:
        desc = (o.get("full_desc") or "").strip()
        if not desc or not re.search(r"\bdue to\b", desc, re.IGNORECASE):
            continue
        m = re.search(r"\s+(due to\b)", desc, re.IGNORECASE)
        if not m:
            continue
        candidate = desc[m.start(1):].strip()
        if candidate and candidate != o.get("reason"):
            o["reason"] = candidate
            fixed += 1
    return fixed


# Field-to-owner map, ported verbatim from FIELD_OWNER in
# components/news/power-grid/PetrobanglaSectionDetail.tsx. Field *names* are the
# canonical owner signal because the archive's company_code is null on most rows
# and files Bangora (Tullow) under CHEVRON.
FIELD_OWNER = {
    "titas": "BGFCL", "habiganj": "BGFCL", "bakhrabad": "BGFCL",
    "narsingdi": "BGFCL", "meghna": "BGFCL",
    "sylhet": "SGFL", "kailashtila #1 (silicagel)": "SGFL",
    "kailashtila #2 (mste)": "SGFL", "rashidpur": "SGFL", "beanibazar": "SGFL",
    "salda": "BAPEX", "fenchuganj": "BAPEX", "shahbazpur": "BAPEX",
    "semutung": "BAPEX", "sundalpur": "BAPEX", "srikail": "BAPEX",
    "begumganj": "BAPEX", "begumgonj": "BAPEX", "rupganj": "BAPEX",
    "jalalabad": "CHEVRON", "maulavibazar": "CHEVRON",
    "moulavibazar": "CHEVRON", "bibiyana": "CHEVRON",
    "bangora": "TULLOW",
}

# The six labels the Grid Explorer expects, in order.
GAS_PRODUCTION_LABELS = [
    ("BGFCL", "BGFCL (Titas, Habiganj, Bakhrabad)"),
    ("SGFL", "SGFL (Sylhet, Rashidpur, Kailashtila)"),
    ("BAPEX", "BAPEX (Shahbazpur, Srikail, Begumganj)"),
    ("CHEVRON", "Chevron (Bibiyana, Jalalabad, Moulavibazar)"),
    ("TULLOW", "Tullow (Bangora)"),
    ("RPGCL", "RPGCL (R-LNG Import / LNG Terminal)"),
]


def _parse_loose_date(value: str) -> datetime.date | None:
    """A date cell in either form the workbooks use: 2022-07-01 or 01-07-2022."""
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", value)
    if m:
        y, mo, d = (int(g) for g in m.groups())
    else:
        m = re.match(r"^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$", value)
        if not m:
            return None
        d, mo, y = (int(g) for g in m.groups())
    try:
        return datetime.date(y, mo, d)
    except ValueError:
        return None


def curve_sheet_date(text: str) -> str | None:
    """The energy day as stated in the load-curve sheet's own Date header.

    This is the one label that means the same thing on both workbook layouts.
    P1 does not: the 2025+ sheet's "Date :" is the energy day, but the older
    sheet's "Reporting Date :" is the *publication* date, a day later.

    Correct on 82 of 83 workbooks sampled across 2019-2026, and the exception
    is not one: "Daily Report 26-01-2021_.xlsm" prints 2022-01-25, and its
    figures (8842 / 10021 MW, 199.04 MKWh) sit squarely in January 2022's
    range, not January 2021's — 2022-01-25 being the day missing from the
    archive. The filename carries the typo, not the sheet. Two W: workbooks
    are misnamed this way, and in both the printed date is the right one.
    """
    from parse_daily_reports import get_sheet_content, norm_text, split_cells

    for sheet in ("L-Curve", "En-Curve"):
        block = get_sheet_content(text, sheet)
        if not block:
            continue
        for line in block.split("\n")[:8]:
            cells = split_cells(line)
            for i, cell in enumerate(cells):
                if re.match(r"^date\b", norm_text(cell)) and i + 1 < len(cells):
                    parsed = _parse_loose_date(cells[i + 1])
                    if parsed:
                        return parsed.isoformat()
    return None


def workbook_energy_day(text: str) -> str | None:
    """The day a PGCB workbook describes, or None when it does not say.

    Only the load-curve sheet's own Date header counts. This used to fall
    back to the most frequent date in the file, a heuristic tuned on the 2025+
    layout where the energy day repeats through every sheet header (18
    occurrences against 7 of the publication date on the August 2026 reports).

    That fallback is actively harmful on the pre-2018 .xls workbooks, which
    have no load-curve sheet: across 24 of them it returned the *publication*
    date — keying the day 24 hours late, the very error this module exists to
    prevent — or a stray template date of 2010-07-18. Returning None instead
    lets the caller keep the filename's day, which for those files is right
    and agrees with parse_date_from_filename on 1,181 of 1,184 workbooks.

    Picking the first "Date:" match is no better: in
    "Daily Report 03-08-2026.xlsx" the earliest match is the publication date.
    """
    return curve_sheet_date(text)


def clean_field_name(raw) -> str:
    """Strip leaked "N. COMPANY" prefixes so "1. BGFCL Bakhrabad" reads "Bakhrabad"."""
    s = re.sub(r"^\s*\d+\.\s*", "", str(raw or ""))
    s = re.sub(r"\b(BGFCL|SGFL|BAPEX|CHEVRON|TULLOW|IOCS?)\b\s*", "", s, flags=re.IGNORECASE)
    return s.strip()


def field_owner(f: dict) -> str | None:
    name = clean_field_name(f.get("field")).lower()
    if name in FIELD_OWNER:
        return FIELD_OWNER[name]
    if name.startswith("r-lng"):
        return "RPGCL"
    operator = str(f.get("operator") or "").upper()
    if "CHEVRON" in operator:
        return "CHEVRON"
    if "TULLOW" in operator:
        return "TULLOW"
    code = f.get("company_code")
    return code if code and code != "IOC" else None


def is_real_field_row(f: dict) -> bool:
    if f.get("record_type") != "field":
        return False
    return not re.search(r"sub.?total|grand.?total", str(f.get("field") or ""), re.IGNORECASE)


def derive_gas_production(gas_archive: dict, existing: list) -> tuple[list, float]:
    """Rebuild the six-row production summary from the archive's per-field rows.

    The text-scraping summary parser silently drops fields — on 2026-07-31 it
    missed Kailashtila #2 (42.6 MMCFD), leaving SGFL at 94 against the archive's
    139.5 and the day's total 45.7 short of the PDF's own printed grand total.
    The archive reconciles against that printed total, so it is the authority.

    `fields` (the producing-well count shown per company) is carried over from
    the existing summary — it is a label, not a measurement, and recomputing it
    would churn a second number for no gain.
    """
    fields = [f for f in (gas_archive.get("production") or {}).get("fields") or [] if is_real_field_row(f)]
    if not fields:
        return existing, 0.0

    gas_by, cond_by = {}, {}
    for f in fields:
        owner = field_owner(f)
        if not owner:
            continue
        gas_by[owner] = gas_by.get(owner, 0.0) + float(f.get("gas_mmcfd") or 0)
        cond_by[owner] = cond_by.get(owner, 0.0) + float(f.get("condensate_bbld") or 0)

    total = sum(gas_by.values())
    if total <= 0:
        return existing, 0.0

    prior = {row.get("company"): row for row in existing or []}
    out = []
    for code, label in GAS_PRODUCTION_LABELS:
        gas = round(gas_by.get(code, 0.0), 1)
        out.append({
            "company": label,
            "fields": (prior.get(label) or {}).get("fields", 0),
            "gas": gas,
            "condensate": round(cond_by.get(code, 0.0), 1),
            "share": round(gas / total * 100, 1) if total else 0.0,
        })
    return out, round(total, 1)


# Not every note is a problem. Showing "I rebuilt the gas summary correctly"
# in the same amber box as "this is the wrong day's PDF" trains the operator to
# ignore both. Classify at output time, in one place, so no message can be added
# later without falling into a sensible default.
BLOCKING_PATTERNS = (
    r"REJECTED",
    r"reconciliation FAILED",
    r"have an empty plant",
    r"parsed no production fields",
    r"could not be determined",
    r"not\s+physically possible",
    r"the two are crossed",
)
INFO_PATTERNS = (
    r"summary rebuilt from",
    r"Recovered the cause text",
    r"Energy day taken from the workbook",
    r"left as scraped",
)


def classify(message: str) -> str:
    """blocking = do not publish; info = something was handled; caution = look."""
    for pat in BLOCKING_PATTERNS:
        if re.search(pat, message, re.IGNORECASE):
            return "blocking"
    for pat in INFO_PATTERNS:
        if re.search(pat, message, re.IGNORECASE):
            return "info"
    return "caution"


def window_label(start: datetime.date, end: datetime.date) -> str:
    """Label for an 8am-8am gas window, in the form the archive already uses.

    Within one month the month is written once ("30-31 Jul, 2026"); across a
    month boundary both are spelled out ("31 Jul - 01 Aug, 2026").
    """
    if start.month == end.month:
        return f"{start:%d}-{end:%d} {end:%b}, {end:%Y}"
    return f"{start:%d %b} - {end:%d %b}, {end:%Y}"


MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


# The two forms Petrobangla uses for its 8am-8am window. Across a month
# boundary both months are spelled out; within one month the month is written
# once after the day pair.
_WINDOW_CROSS_MONTH = re.compile(
    r"Date\s*:\s*(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*[^0-9A-Za-z]{0,6}(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*[,\s]*(\d{4})"
)
_WINDOW_SAME_MONTH = re.compile(
    r"Date\s*:\s*(\d{1,2})\s*[-–]\s*(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*[,\s]*(\d{4})"
)


def pdf_header_text(pdf: Path) -> str:
    """The report's top band, read by word coordinates rather than flowed text.

    `pypdf` returns the date digits on these files as unmapped CID glyphs, so the
    window regex found nothing and the day could not be confirmed from the file
    itself — leaving the filename as the only authority, which is precisely the
    assumption that filed nine copies of one report as nine separate days.
    PyMuPDF decodes the same glyphs correctly.

    Words are ordered by position so "Date :" and the dates that follow it stay
    adjacent; the flowed extraction interleaves them with the letterhead.
    """
    try:
        import fitz
    except ImportError:
        return ""
    try:
        with fitz.open(str(pdf)) as doc:
            words = [w for w in doc[0].get_text("words") if w[1] < 40]
    except Exception:  # noqa: BLE001
        return ""
    words.sort(key=lambda w: (round(w[1] / 4), w[0]))
    return " ".join(w[4] for w in words)


def printed_window_start(pb_text: str) -> datetime.date | None:
    """The date the PDF's own 8am-8am window opens on.

    Petrobangla prints either "Date : 31 Jul - 01 Aug, 2026" or, within a single
    month, "Date : 05-06 Aug, 2026". The first date is the gas day the report
    covers, and it is the only trustworthy statement of which day the file
    holds — the filename is the publication date, a day later.
    """
    head = pb_text[:900]

    m = _WINDOW_SAME_MONTH.search(head)
    if m:
        day, _d2, mon, year = m.group(1), m.group(2), m.group(3).lower(), m.group(4)
        if mon not in MONTHS:
            return None
        try:
            return datetime.date(int(year), MONTHS[mon], int(day))
        except ValueError:
            return None

    m = _WINDOW_CROSS_MONTH.search(head)
    if not m:
        return None
    day, mon, _d2, mon2, year = m.group(1), m.group(2).lower(), m.group(3), m.group(4).lower(), m.group(5)
    if mon not in MONTHS:
        return None
    try:
        start = datetime.date(int(year), MONTHS[mon], int(day))
    except ValueError:
        return None
    # A window opening in December closes in January of the next year; the
    # printed year belongs to the closing date in that case.
    if mon == "dec" and mon2 == "jan":
        start = start.replace(year=int(year) - 1)
    return start


def parse_gas_archive(pdf: Path, op_date: datetime.date, tmpdir: Path):
    """Full Petrobangla day via parse_petrobangla_archive.py.

    The archive is keyed by the gas-day START, which for grid energy day E is E
    itself — the 8am-8am window that opens on E. That is why the same date drives
    both halves of an upload.

    Returns (document | None, warnings).
    """
    warnings: list[str] = []
    out_path = tmpdir / "gas.json"
    script = Path(__file__).resolve().parent / "parse_petrobangla_archive.py"

    proc = subprocess.run(
        [sys.executable, str(script), str(pdf), op_date.isoformat(), str(out_path)],
        capture_output=True,
        text=True,
        timeout=180,
    )
    if proc.returncode != 0 or not out_path.exists():
        detail = (proc.stderr or proc.stdout or "").strip().splitlines()
        warnings.append(f"Gas archive parser failed: {detail[-1] if detail else 'unknown error'}")
        return None, warnings

    doc = json.loads(out_path.read_text(encoding="utf-8"))

    # The 2.0.0 parser omits the explicit gas-day window that later files carry
    # and the site reads. Patch it in rather than shipping a day whose shape
    # differs from its neighbours.
    end = op_date + datetime.timedelta(days=1)
    doc.setdefault("report", {})
    doc["report"]["gas_day_start"] = op_date.isoformat()
    doc["report"]["gas_day_end"] = end.isoformat()
    doc["report"]["gas_window"] = "8.00-8.00"

    # The 2.0.0 parser writes "31-01 Jul, 2026" for a window that actually ends
    # in August. The archive index and the live-week panel surface this string
    # to readers, so it is corrected to the form every shipped day uses.
    doc["report"]["report_date_label"] = window_label(op_date, end)

    val = doc.get("validation") or {}
    if not val.get("reconciled", True):
        warnings.append(
            f"Gas reconciliation FAILED: field sum {val.get('field_gas_sum_mmcfd')} vs printed grand total "
            f"{val.get('grand_total_gas_mmcfd')} (variance {val.get('variance_mmcfd')} MMCFD, tolerance 5). "
            "Do not publish without checking the PDF."
        )

    if not (doc.get("production") or {}).get("fields"):
        warnings.append("Gas archive parsed no production fields — the PDF layout may have changed.")

    return doc, warnings


def fetch_sources(iso: str) -> tuple[str, str | None, list[str]]:
    """Download the day's PGCB workbook and Petrobangla PDF from the publishers.

    Same downloader the CLI extractor uses, so the admin panel and the command
    line pull identical files: PGCB from its ERP by attachment id, Petrobangla
    from its own daily-gas listing. Nothing is sourced from EMRD, which only
    links back to Petrobangla and publishes no report of its own.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from daily_extractor.download import download_for_energy_day

    energy = datetime.date.fromisoformat(iso)
    result = download_for_energy_day(energy)
    notes = list(result.errors or [])

    if not result.pgcb_xlsx:
        fail(
            f"No PGCB report published for energy day {iso}. PGCB posts a day's report the "
            "following morning, so today's is normally available tomorrow."
        )
    if not result.petrobangla_pdf:
        notes.append(
            f"Petrobangla has not published the gas report covering {iso} yet, so gas "
            "sections fall back to the previous day."
        )
    return str(result.pgcb_xlsx), (str(result.petrobangla_pdf) if result.petrobangla_pdf else None), notes


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pgcb")
    ap.add_argument("--pb")
    ap.add_argument("--date")
    ap.add_argument("--pgcb-name", default="")
    # The admin route writes the upload to a temp file, so the name the
    # operator actually chose has to travel separately — same reason as
    # --pgcb-name. Without it every day published from the panel recorded
    # its gas source as "pb.pdf", in the archive AND in the grid day.
    ap.add_argument("--pb-name", default="")
    ap.add_argument(
        "--expect-gas-window",
        help=(
            "ISO date the gas PDF's letterhead prints, when that is known to be a misprint. "
            "Accepts the file for --date anyway and records why. 2026-07-10's report is headed "
            "11 Jul; its figures belong to the 10th. Any other printed window is still rejected."
        ),
    )
    ap.add_argument(
        "--fetch",
        action="store_true",
        help="Download the day's sources from PGCB and Petrobangla instead of taking uploads.",
    )
    args = ap.parse_args()

    fetch_notes: list[str] = []
    if args.fetch:
        if not args.date:
            fail("--fetch needs --date (the energy day to collect).")
        args.pgcb, args.pb, fetch_notes = fetch_sources(args.date)
        # The ERP names its attachments erp_<id>.xlsx, which carries no date for
        # derive_energy_day to read. The day is already known — it selected the
        # attachment — so state it rather than letting the filename path guess.
        args.pgcb_name = ""
    elif not args.pgcb:
        fail("--pgcb is required unless --fetch is given.")

    try:
        from daily_extractor.convert import pdf_to_text
        from daily_extractor.report_convert import report_to_md
        from parse_daily_reports import parse_pgcb_file, parse_petrobangla_file
    except Exception as exc:  # noqa: BLE001
        fail(f"Could not import parsers: {exc}")

    iso = args.date or derive_energy_day(args.pgcb_name or Path(args.pgcb).name)
    op_date = None
    if iso:
        try:
            op_date = datetime.date.fromisoformat(iso)
        except ValueError:
            fail(f"Invalid date: {iso}")

    warnings: list[str] = list(fetch_notes)
    tmpdir = Path(tempfile.mkdtemp(prefix="esb-ingest-src-"))

    # --- PGCB grid -------------------------------------------------------
    #
    # The workbook is the report as PGCB files it, but the desk is also sent
    # Word and PDF copies of the same thing. Those go through the same parser:
    # the reader in report_convert rebuilds the pipe-table text a workbook
    # produces, and returns notes about what it had to infer to get there.
    try:
        pgcb_text, source_notes = report_to_md(
            Path(args.pgcb), args.pgcb_name or Path(args.pgcb).name
        )
    except Exception as exc:  # noqa: BLE001
        fail(f"Could not read the report: {exc}")
    warnings.extend(source_notes)

    pgcb_txt_path = tmpdir / "pgcb.txt"
    pgcb_txt_path.write_text(pgcb_text, encoding="utf-8")

    if not source_notes and "## Sheet: P1" not in pgcb_text:
        warnings.append("No 'P1' sheet found — this may not be a PGCB daily report.")

    # The filename is the *publication* date, a day ahead of the data, so the
    # authority on which day this is must be the workbook's own printed date.
    # Report it either way so the reviewer can see the derivation was right,
    # rather than having to trust the filename arithmetic.
    # Which day is this? The filename minus one and the load-curve sheet's own
    # Date header normally agree — they do on 173 of 173 workbooks from 2018
    # on, including the August 2026 reports. So a disagreement is itself the
    # anomaly, and its SIZE says which side is wrong:
    #
    #   * a day or two apart -> the sheet header is stale, copied from the
    #     previous report. "18-11-2024_.xlsm" and "18-09-2024_.xlsm" both hold
    #     the day their filename implies while their curve sheet names the day
    #     before, which the archive's own neighbouring entries confirm.
    #   * a year apart -> the filename is a typo. "26-01-2021_.xlsm" holds
    #     2022-01-25 and "21-8-20223_.xlsm" holds 2023-08-20.
    #
    # Either way the operator is told, because either way one of the two
    # sources for the most important field in the file is wrong.
    #
    # This has to settle BEFORE the workbook is parsed: parse_pgcb_file stamps
    # systemStats.date from whatever it is given, so deciding the day
    # afterwards published "25 Jan 2021" inside a file keyed 2022-01-25.
    source_grid_date = workbook_energy_day(pgcb_text)

    if op_date is None:
        if not source_grid_date:
            fail(
                "Could not determine the energy day from either the filename or the workbook's own "
                "printed date. Expected a name like 'Daily Report 02-08-2026.xlsx'; pass --date to set it."
            )
        op_date = datetime.date.fromisoformat(source_grid_date)
        warnings.append(
            f"The filename gave no usable date, so the energy day was taken from the workbook itself "
            f"({op_date.isoformat()}). Confirm it before publishing."
        )
    elif source_grid_date:
        try:
            printed = datetime.date.fromisoformat(source_grid_date)
            gap = abs((printed - op_date).days)
            if printed != op_date:
                if args.date:
                    warnings.append(
                        f"You set the energy day to {op_date.isoformat()}, but the workbook's load-curve "
                        f"sheet is dated {printed.isoformat()}. Your override was kept — confirm it is right."
                    )
                elif gap > 3:
                    warnings.append(
                        f"The workbook's load-curve sheet is dated {printed.isoformat()}, {gap} days from "
                        f"what the filename implies ({op_date.isoformat()}). At that distance the filename "
                        "is the likelier typo, so the sheet's date was used. Confirm before publishing."
                    )
                    op_date = printed
                else:
                    warnings.append(
                        f"The workbook's load-curve sheet is dated {printed.isoformat()} but the filename "
                        f"implies {op_date.isoformat()}. These agree on every clean report, and a one-day "
                        "gap is a stale sheet header, so the filename was used. Confirm before publishing."
                    )
        except ValueError:
            pass

    payload = parse_pgcb_file(str(pgcb_txt_path), datetime.datetime.combine(op_date, datetime.time()))
    if not payload:
        fail("The PGCB parser returned nothing. Is this the daily report workbook?")

    # --- Petrobangla gas -------------------------------------------------
    #
    # Two products come out of one PDF, and both are needed:
    #   * the six-row summary embedded in the grid file (gasProductionData /
    #     gasDistributionData), read by the Grid Explorer's overview
    #   * the full archive at public/data/petrobangla/daily/{date}.json — field
    #     level detail, distribution plants, entities and the parser's own
    #     reconciliation — read by the Gas tab and the Petrobangla pages
    #
    # The archive comes from parse_petrobangla_archive.py (PyMuPDF), which is a
    # different and much richer parser than the text-scraping path used for the
    # summary. Publishing only the summary leaves the gas pages a day stale.
    gas_archive = None
    if args.pb:
        try:
            pb_text = pdf_to_text(Path(args.pb))
            pb_txt_path = tmpdir / "pb.txt"
            pb_txt_path.write_text(pb_text, encoding="utf-8")
            pb_data = parse_petrobangla_file(str(pb_txt_path))
        except Exception as exc:  # noqa: BLE001
            pb_data = None
            warnings.append(f"Gas summary could not be parsed: {exc}")

        if pb_data:
            payload["gasProductionData"] = pb_data["gasProductionData"]
            payload["gasDistributionData"] = pb_data["gasDistributionData"]
        else:
            warnings.append(
                "The gas PDF produced no summary. The gas report lags the grid by a day: "
                f"energy day {op_date.isoformat()} needs the PDF whose 8am-8am window STARTS that day."
            )

        # Refuse a gas PDF that is not this day's before parsing it. The report
        # states its own window; keying it to the grid workbook's energy day
        # regardless is how 31 July's production was filed under 1 August and
        # relabelled "01-02 Aug, 2026" — a plausible-looking duplicate that the
        # reconciliation checks cannot catch, because the numbers are internally
        # perfect. They are simply the wrong day's numbers.
        printed_start = printed_window_start(pb_text)
        if printed_start is None:
            # The flowed text lost the date to a CID font; read the header band
            # by coordinates instead. This is the guard that decides whether the
            # PDF is even this day's, so it is worth a second attempt before
            # falling back to trusting the filename.
            printed_start = printed_window_start(pdf_header_text(Path(args.pb)))
        # A letterhead the operator has already adjudicated. Narrow on purpose:
        # the expected misprint must be stated exactly, so this waives one known
        # document defect rather than disabling the check.
        adjudicated = (
            printed_start is not None
            and args.expect_gas_window
            and printed_start.isoformat() == args.expect_gas_window
        )
        if adjudicated:
            warnings.append(
                f"Gas day taken as {op_date.isoformat()} although the report is headed "
                f"{printed_start.isoformat()} — accepted because that misprint was stated up front. "
                "The figures are filed against the adjudicated day, not the printed one."
            )
            printed_start = op_date

        if printed_start and printed_start != op_date:
            gas_archive = None
            # The six-row summary was scraped from this PDF a moment ago, so it
            # holds the WRONG day's production. Discard it too, or rejecting the
            # archive achieves nothing: the grid file would still carry another
            # day's gas figures, which is the exact duplication this guard
            # exists to prevent. Blank them and let the day publish gas-less.
            payload.pop("gasProductionData", None)
            payload.pop("gasDistributionData", None)
            warnings.append(
                f"GAS PDF REJECTED — it covers the gas day starting {printed_start.isoformat()}, but this "
                f"upload is energy day {op_date.isoformat()}. Its window is printed on the report itself. "
                f"You need the report whose window OPENS on {op_date.isoformat()} "
                f"(usually the file named for {(op_date + datetime.timedelta(days=1)).isoformat()}). "
                "Gas figures were discarded, including the summary; the grid day is unaffected."
            )
        else:
            gas_archive, gas_warnings = parse_gas_archive(Path(args.pb), op_date, tmpdir)
            warnings.extend(gas_warnings)
            # Restore the uploaded name over the temp one before anything reads
            # it: meta.source_filename is what daily_enrich credits as the day's
            # Petrobangla source and what the window block cites.
            if gas_archive and args.pb_name:
                gas_archive.setdefault("meta", {})["source_filename"] = args.pb_name
            if printed_start is None:
                warnings.append(
                    "The gas PDF's printed window could not be read (its date digits use a CID font on some "
                    "layouts), so the day could not be confirmed from the file itself. Check it manually."
                )

        # The PDF states its own 8am-8am window. Surface it so the operator can
        # confirm the gas day matches the grid day rather than assuming it.
        m = re.search(r"Date\s*:\s*(.+?)\s*(?:\n|$)", pb_text[:600])
        if m:
            source_gas_window = m.group(1).strip()
            if gas_archive is not None:
                gas_archive.setdefault("meta", {})["source_printed_window"] = source_gas_window
    else:
        warnings.append("No gas PDF supplied — gas figures will publish empty and the gas archive will not advance.")

    # Match process_single_date: a day without gas still carries the zeroed
    # company rows. The site keys its "not published yet" state off these, so
    # omitting them entirely would produce a shape the UI has never seen.
    if not payload.get("gasProductionData"):
        payload["gasProductionData"] = [
            {"company": "BGFCL (Titas, Habiganj, Bakhrabad)", "fields": 5, "gas": 0.0, "condensate": 0.0, "share": 0.0},
            {"company": "SGFL (Sylhet, Rashidpur, Kailashtila)", "fields": 5, "gas": 0.0, "condensate": 0.0, "share": 0.0},
            {"company": "BAPEX (Shahbazpur, Srikail, Begumganj)", "fields": 9, "gas": 0.0, "condensate": 0.0, "share": 0.0},
            {"company": "Chevron (Bibiyana, Jalalabad, Moulavibazar)", "fields": 3, "gas": 0.0, "condensate": 0.0, "share": 0.0},
            {"company": "Tullow (Bangora)", "fields": 1, "gas": 0.0, "condensate": 0.0, "share": 0.0},
            {"company": "RPGCL (R-LNG Import / LNG Terminal)", "fields": 0, "gas": 0.0, "condensate": 0.0, "share": 0.0},
        ]
        payload["gasDistributionData"] = [
            {"company": "TGTDCL (Dhaka & Mymensingh)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
            {"company": "BGDCL (Cumilla & Sylhet)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
            {"company": "KGDCL (Chattogram)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
            {"company": "JGTDSL (Sylhet region)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
            {"company": "PGCL (Rajshahi & Rangpur)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
            {"company": "SGCL (Barishal & Khulna)", "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0},
        ]
        has_gas = False
    else:
        has_gas = any(float(r.get("gas") or 0) > 0 for r in payload["gasProductionData"])

    # A correctly-parsed day carries roughly 28-72 outage rows, every one with a
    # plant. A handful of rows, or blank plants, is the signature of the column
    # shift that silently emptied 34 archive days — surface it, do not publish
    # into it unknowingly.
    outages = payload.get("dailyOutages") or []
    refined = refine_outage_reason(outages)
    if refined:
        warnings.append(f"Recovered the cause text on {refined} outage row(s) where the parser split on \" for \" first.")
    unstructured = [o for o in outages if not str(o.get("plant") or "").strip()]
    if outages and len(unstructured) == len(outages):
        warnings.append(
            f"All {len(outages)} outage rows have an empty plant — the workbook columns have shifted. "
            "Do not publish; the outage detail is being lost."
        )
    elif len(outages) < 5:
        warnings.append(
            f"Only {len(outages)} outage rows parsed; a normal day has 28-72. Check the Event Summary section."
        )

    # The daily extremes are the one pair a workbook states twice — once for
    # the day it reports on, once as tomorrow's projection — so they are the
    # pair most likely to be keyed a day out. Every archived day before this
    # fix carried the projection. A max below the day's own peak is the
    # signature, and it is cheap to check here.
    extremes = payload.get("systemStats") or {}
    max_gen, min_gen = extremes.get("maxGen"), extremes.get("minGen")
    peak = max(float(extremes.get("dayPeakGen") or 0), float(extremes.get("eveningPeakGen") or 0))
    if max_gen is None or min_gen is None:
        warnings.append(
            "Max/min generation could not be read from this workbook and will publish as null. "
            "The site renders those as — rather than a number."
        )
    else:
        # PGCB's own figures disagree slightly on a few days — 2022-05-19
        # prints an evening peak of 12907 MW and a maximum of 12887 MW, both
        # at 19:30, with the load curve backing the lower one. Tolerate that
        # scale of source rounding; a day carrying the next day's forecast is
        # out by hundreds or thousands of MW, not twenty.
        tolerance = max(50.0, peak * 0.01)
        if peak and float(max_gen) < peak - tolerance:
            warnings.append(
                f"Max generation ({max_gen} MW) is BELOW this day's own peak ({peak} MW), which is not "
                "physically possible. The forecast sheet's next-day figure may have been read instead."
            )
        if float(min_gen) > float(max_gen):
            warnings.append(f"Min generation ({min_gen} MW) exceeds max ({max_gen} MW) — the two are crossed.")

    # A flat curve means the L-Curve sheet was not read; the site charts it.
    curve = payload.get("hourlyLoadData") or []
    if len({round(float(h.get("generation") or 0), 3) for h in curve}) <= 3:
        warnings.append(
            f"The hourly load curve has only {len({round(float(h.get('generation') or 0), 3) for h in curve})} "
            "distinct values — the L-Curve sheet was not parsed and the chart will be a placeholder."
        )

    # The same PDF produces two gas figures: the six-row summary embedded in the
    # grid file (text-scraped by parse_petrobangla_file) and the full archive
    # (parse_petrobangla_archive.py, which reconciles against the PDF's own
    # printed grand total). When they disagree the archive is the reliable one —
    # it has an independent check and the summary does not. Surface the gap
    # rather than publishing two contradictory totals for one day.
    if gas_archive:
        scraped = payload.get("gasProductionData") or []
        scraped_total = round(sum(float(r.get("gas") or 0) for r in scraped), 1)
        # `grand_total` is present-but-null on the days whose PDF prints no
        # grand-total row, so the key must be defaulted after the lookup, not
        # in it — `.get(k, {})` returns the None that is there and the next
        # `.get` raises, taking the whole ingest down. Four of 32 July days.
        archive_total = float(((gas_archive.get("production") or {}).get("grand_total") or {}).get("gas_mmcfd") or 0)

        # Three possible sources for the six-row summary, in order of trust:
        #
        #   1. the PDF's own printed per-company sub-totals, read row-wise
        #      (pb_rows_extract) — survives layout drift and reconciles exactly
        #   2. the archive's per-field rows grouped by owner — only when the
        #      archive passed its own reconciliation
        #   3. the text scraper — last resort; it silently drops fields
        #
        # On 2026-08-01 the archive parser lost RPGCL's ~501 MMCFD to a shifted
        # coordinate window while the row reader reconciled to 0.0 variance, so
        # preferring the printed sub-totals is what makes this robust.
        derived, derived_total, source = scraped, 0.0, "scraped"

        rows_result = None
        try:
            from pb_rows_extract import company_totals
            rows_result = company_totals(str(args.pb))
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"Row-based gas cross-check unavailable: {exc}")

        if rows_result and rows_result.get("reconciled"):
            gas_by = rows_result["companies"]
            cond_by = rows_result.get("condensate") or {}
            total = rows_result["total"]
            prior = {r.get("company"): r for r in scraped}
            derived = [
                {
                    "company": label,
                    "fields": (prior.get(label) or {}).get("fields", 0),
                    "gas": round(gas_by.get(code, 0.0), 1),
                    "condensate": round(cond_by.get(code, 0.0), 1),
                    "share": round(gas_by.get(code, 0.0) / total * 100, 1) if total else 0.0,
                }
                for code, label in GAS_PRODUCTION_LABELS
            ]
            derived_total, source = total, "printed sub-totals"
        elif bool((gas_archive.get("validation") or {}).get("reconciled")):
            derived, derived_total = derive_gas_production(gas_archive, scraped)
            source = "archive fields"
        else:
            warnings.append(
                "Gas production summary left as scraped: neither the printed sub-totals nor the archive "
                "reconciled against the PDF's grand total. This day's gas figures are unverified."
            )

        if derived_total > 0:
            payload["gasProductionData"] = derived
            drift = round(derived_total - scraped_total, 1)
            if abs(drift) > 1.0:
                warnings.append(
                    f"Gas production summary rebuilt from the {source}: {derived_total} MMCFD against the "
                    f"scraped {scraped_total} ({drift:+} MMCFD). The scraper had dropped fields; the archive "
                    f"reconciles to the PDF's printed total of {archive_total}."
                )
            residual = round(archive_total - derived_total, 1)
            if abs(residual) > 5.0:
                warnings.append(
                    f"Rebuilt summary is still {residual} MMCFD from the printed grand total "
                    f"({archive_total}) — a field may be unattributed. Check before publishing."
                )

        # Distribution cannot be derived: the archive's per-company rows carry
        # null power/fertilizer/others on these parses, only grand totals.
        dist_total = round(sum(float(r.get("total") or 0) for r in payload.get("gasDistributionData") or []), 1)
        summary = (gas_archive.get("distribution") or {}).get("summary") or {}
        # `total_` is the grid-connected figure the six-row summary represents;
        # `grand_total` additionally includes non-grid power (84.0 MMCFD on
        # 2026-07-31), so comparing against it would warn on every single day.
        printed = (summary.get("total_") or summary.get("grand_total") or {}).get("total_mmcfd")
        if printed and abs(float(printed) - dist_total) > 1.0:
            warnings.append(
                f"Gas distribution summary totals {dist_total} MMCFD but the PDF prints {printed}. "
                "Distribution is still scraped — the archive has no per-company breakdown to rebuild from."
            )

    # Same enrichment the CLI collector applies, from the same module: the
    # admin route and the collector must not produce differently shaped days.
    try:
        from daily_enrich import enrich_grid_daily

        # `gas_archive`, not `pb_data`: the latter is only the six-row summary
        # scraped for Pipeline A, while the window block needs the full
        # PetrobanglaDaily record — its printed date label, its 8am-8am period
        # and the PDF's own filename all live there.
        for note in enrich_grid_daily(
            payload,
            op_date,
            pgcb_file=(args.pgcb_name or Path(args.pgcb).name) if args.pgcb else None,
            petrobangla=gas_archive,
        ):
            warnings.append(note)
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"enrichment skipped: {exc}")

    stats = payload.get("systemStats") or {}
    gas_val = (gas_archive or {}).get("validation") or {}
    gas_prod = (gas_archive or {}).get("production") or {}
    gas_dist = (gas_archive or {}).get("distribution") or {}
    gas_grand = gas_prod.get("grand_total") or {}
    dist_total = (gas_dist.get("summary") or {}).get("grand_total") or (gas_dist.get("summary") or {}).get("total_") or {}

    validation = {
        "warnings": warnings,
        "notes": [{"level": classify(w), "message": w} for w in warnings],
        "summary": {
            "energyDay": op_date.isoformat(),
            "sourceGridDate": source_grid_date,
            "hasGas": has_gas,
            "sections": sorted(payload.keys()),
            "dayPeak": stats.get("dayPeakGen"),
            "eveningPeak": stats.get("eveningPeakGen"),
            "maxGen": stats.get("maxGen"),
            "minGen": stats.get("minGen"),
            "totalEnergy": stats.get("totalEnergyGen"),
            "curvePoints": len(payload.get("hourlyLoadData") or []),
        },
        "gas": None
        if not gas_archive
        else {
            "gasDayStart": gas_archive["report"]["gas_day_start"],
            "sourcePrintedWindow": (gas_archive.get("meta") or {}).get("source_printed_window"),
            "gasDayEnd": gas_archive["report"]["gas_day_end"],
            "fieldCount": gas_prod.get("field_count"),
            "plantCount": gas_dist.get("plant_count"),
            "totalGasMmcfd": gas_grand.get("gas_mmcfd"),
            "powerDemand": dist_total.get("power_demand_mmcfd"),
            "powerSupply": dist_total.get("power_supply_mmcfd"),
            "reconciled": gas_val.get("reconciled"),
            "varianceMmcfd": gas_val.get("variance_mmcfd"),
            "entityCount": len(gas_archive.get("entities") or []),
        },
    }

    print(
        json.dumps(
            {
                "ok": True,
                "date": op_date.isoformat(),
                "payload": payload,
                "gasArchive": gas_archive,
                "validation": validation,
            }
        )
    )


if __name__ == "__main__":
    main()
