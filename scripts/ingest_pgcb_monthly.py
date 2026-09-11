#!/usr/bin/env python3
"""Ingest PGCB's monthly System Operation Report from the ERP into the archive.

One entry point for the whole monthly chain, so the Pi's daily runner and a
session on the Windows box do exactly the same thing:

  listing   which months PGCB serves            one GET of the ERP's report page
  download  the workbook, signature-checked     PK header, whole zip, atomic write
  parse     the headline record                 parse_monthly_reports, by label
            the full detail                     parse_pgcb_monthly_workbook, by position
  check     the two readings against each other, and the sheet's own
            "previous month" column against the record already held
  write     lib/pgcb-monthly-data.json, lib/pgcb-monthly-detail/{key}.json,
            then public/data/pgcb-monthly/** rebuilt by build_pgcb_monthly_public

Usage:
  python scripts/ingest_pgcb_monthly.py                    every month the ERP serves and the archive lacks
  python scripts/ingest_pgcb_monthly.py --month 2026-07    that month from the ERP, held or not (a re-parse)
  python scripts/ingest_pgcb_monthly.py --file July-2026.xlsx   a workbook already on disk
  python scripts/ingest_pgcb_monthly.py --list             the ERP against the archive; writes nothing
  python scripts/ingest_pgcb_monthly.py --dry-run          parse and check, write nothing
  python scripts/ingest_pgcb_monthly.py --month 2026-07 --out DIR
                                                           write the record and detail under DIR, not the repo —
                                                           for diffing one machine's parse against another's

Exit 0 when everything asked for was ingested or nothing was new, 1 on any
failure. The last line is always `ingested_months=<comma-separated keys>`
(empty when none) so a runner reads what landed without parsing prose.

Why this exists. Until 2026-09-11 the monthly archive was fed by hand: a
workbook saved to the Desktop, converted to a pipe-table dump in a Desktop
folder, parse_monthly_reports.py run over that folder, then the detail parser
and the builder by hand. The folder no longer exists on any machine, and July
2026 had been on the ERP for weeks while the Grid Explorer's Macro Trends sat
on June. The parsers themselves are unchanged and reused — both reproduce the
committed June 2026 files exactly from the ERP's own copy of that workbook
(checked 2026-09-11) — this file only puts them in a row.

Two things about the parse are easy to get wrong and are pinned here:

  * The headline parser must be fed the MARKDOWN form of the workbook
    (`xlsx_to_md`, outer pipes on every row), not `xlsx_to_text`. The parser
    indexes `parts[2..4]` of each split row, which is only the label/value pair
    when a leading pipe pushes everything along by one. Fed the plain form it
    reads every figure as 0.0 and reports nothing wrong — the exact case that
    was measured on June 2026 before this was written.

  * The document says which month it is; the ERP's title does not. The detail
    parser reads "Month: <name> <year>" from QF-MIS-03 and checks it against
    the dates inside the report. The record is keyed off that, and a title that
    disagrees is reported. Same rule as the daily chain (CLAUDE.md, doctrine 5).
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import os
import re
import ssl
import sys
import urllib.request
import warnings
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
# openpyxl warns "Cannot parse header or footer" on every print-formatted
# PGCB sheet; two dozen of those per workbook bury the lines that matter.
warnings.filterwarnings("ignore")

import build_pgcb_monthly_public as builder  # noqa: E402
import parse_monthly_reports as headline  # noqa: E402
import parse_pgcb_monthly_workbook as detail  # noqa: E402
from daily_extractor.report_convert import xlsx_to_md  # noqa: E402

DATA = ROOT / "lib" / "pgcb-monthly-data.json"
DETAIL_DIR = ROOT / "lib" / "pgcb-monthly-detail"
PUBLIC_DIR = ROOT / "public" / "data" / "pgcb-monthly"

# The ERP's "Monthly Report" page. The path segment is an opaque encrypted
# route id, not a date — it has served every month since 2013 unchanged and is
# the link Hamim downloads from by hand.
LISTING_URL = os.environ.get("ESB_PGCB_MONTHLY_LISTING") or (
    "https://erp.powergrid.gov.bd/w/report/"
    "eyJpdiI6Ik53OTZRKzRRTVoxUUY4a3RMb250Y0E9PSIsInZhbHVlIjoiQmxnNjFqUUROVnk2RFh1OHJ0NGVkQT09IiwibWFjIjoiZDBlYmM3ZTUzMzBkNDM4NTNkZDQxYjc0YTc2NDQ3YTYzYmY1MjRjNDRjNTQ2MmQwOGM5MzY4MGRjNTIwYTFlYiIsInRhZyI6IiJ9"
    "/show_report"
)

# One link per report, twice — the page prints each once as "July-2026" and
# once with a suffix ("July-2026_01-01-1970", "May-2023_19-06-2023",
# "February-2023_"), both to the same file id. The titles were typed by hand
# over thirteen years and come in four shapes, all seen on 2026-09-11:
# "July-2026", "November-%202019", "January_2013", "June%202015". The first
# walker matched only the first and so believed the ERP began in 2016; it
# lists every month back to January 2013, 2013-01 .. 2017-08 as legacy .xls.
# One entry is not a report at all: id 195, "x.php", sits where February 2013
# should be — a broken upload, which is why that month has no source anywhere.
LINK_RE = re.compile(
    r'href="(https://erp\.powergrid\.gov\.bd/web/files/download\?'
    r"location=erp%2Fweb%2Freport_docs%2F(\d+)\.(xlsx|xlsm|xls)"
    r'&(?:amp;)?title=([A-Za-z]+)(?:%20|[-_ ])+(\d{4})(?:_[^"]*)?)"'
)
# "Showing 30 of 162": the listing is paginated, newest first, ?page=N.
PAGE_SHOWING_RE = re.compile(r"Showing\s+(\d+)\s+of\s+(\d+)")
MAX_PAGES = 20

MONTHS = {m.lower(): i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June",
     "July", "August", "September", "October", "November", "December"], 1)}

# The headline record spells three zones the old way; the detail parser the
# new way. Same nine areas on QF-LDC-22 either way.
ZONE_ALIAS = {"chittagong": "chattogram", "comilla": "cumilla", "barisal": "barishal"}

# As in daily_extractor/download.py: the ERP's certificate chain does not
# validate from the Pi, and the workbook is signature- and content-checked
# rather than trusted on transport.
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
USER_AGENT = "Mozilla/5.0 (esb-pi-ingest; +https://esbpowerline.com)"


def log(msg: str) -> None:
    print(msg, flush=True)


def archive_dir() -> Path:
    """Where fetched workbooks and their markdown dumps are kept.

    The Pi sets ESB_PGCB_MONTHLY_ARCHIVE beside its daily workbook store; on
    the Windows box the gitignored scratch/ tree is the default so a hand run
    never leaves a workbook in the repo.
    """
    env = os.environ.get("ESB_PGCB_MONTHLY_ARCHIVE")
    return Path(env) if env else ROOT / "scratch" / "pgcb-monthly"


# --------------------------------------------------------------------------- #
# the ERP
# --------------------------------------------------------------------------- #
@dataclass(frozen=True)
class Listed:
    key: str      # YYYY-MM, from the title — a hint, never the claim (see parse)
    title: str    # "July-2026", the name PGCB gave the file
    erp_id: int
    ext: str
    url: str


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, context=CTX, timeout=timeout) as resp:
        return resp.read()


def list_erp(all_pages: bool = False) -> list[Listed]:
    """Every report the ERP serves, one entry per month, newest id wins.

    The daily runner reads page 1 only: it is newest-first, so a new month is
    always there, and one GET a day is the whole cost. `all_pages` walks the
    lot — for `--list`, `--verify` and a backfill.
    """
    seen: dict[str, Listed] = {}
    total_claimed = None
    for page_no in range(1, MAX_PAGES + 1):
        url = LISTING_URL + (f"?page={page_no}" if page_no > 1 else "")
        page = fetch(url).decode("utf-8", "replace")
        if (m := PAGE_SHOWING_RE.search(page)) and total_claimed is None:
            total_claimed = int(m.group(2))
        found = 0
        for m in LINK_RE.finditer(page):
            url, fid, ext, month, year = m.groups()
            found += 1
            if month.lower() not in MONTHS:
                continue
            key = f"{year}-{MONTHS[month.lower()]:02d}"
            # The title is normalised to "July-2026": it names the file on
            # disk, and the four spellings are the ERP's typing, not PGCB's.
            item = Listed(key, f"{month.capitalize()}-{year}", int(fid), ext, html.unescape(url))
            if key not in seen or item.erp_id > seen[key].erp_id:
                seen[key] = item
        if page_no == 1 and not seen:
            # A login page, a redirect, or a relaid template all answer 200
            # with no report links. That is a finding, not an empty month.
            raise SystemExit(
                f"listing: no report links on {LISTING_URL} ({len(page)} bytes) — "
                "the page is not the report list any more"
            )
        if not all_pages or found == 0:
            break
    if all_pages and total_claimed is not None:
        log(f"listing: the ERP claims {total_claimed} entries; {len(seen)} distinct months read")
    return sorted(seen.values(), key=lambda item: item.key)


def workbook_is_whole(path: Path) -> bool:
    """A .xlsx is a zip; one cut short by a power cut fails the directory read.

    Same check as daily_extractor/download.py. Not imported from there because
    that module resolves its Desktop-default paths at import time.
    """
    if path.suffix.lower() == ".xls":
        # 2013-01 .. 2017-08 are legacy BIFF files, not zips. Read by xlrd,
        # which both venvs carry since 2026-09-11.
        return path.stat().st_size > 20000
    try:
        with zipfile.ZipFile(path) as zf:
            return zf.testzip() is None and any(n.startswith("xl/") for n in zf.namelist())
    except Exception:
        return False


def download(item: Listed, dest_dir: Path) -> tuple[Path, str, bool]:
    """The workbook on disk, its sha256, and whether this call fetched it."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{item.title}.{item.ext}"
    if dest.exists() and workbook_is_whole(dest):
        return dest, hashlib.sha256(dest.read_bytes()).hexdigest(), False
    dest.unlink(missing_ok=True)

    data = fetch(item.url)
    # Publisher sites serve HTML redirect pages under a .xlsx URL; a parser
    # fed HTML produces confident nonsense (CLAUDE.md § Ingestion). A .xlsx
    # is a zip ("PK"); the 2013-2017 .xls files are OLE2 compound documents
    # and open with the D0 CF 11 E0 magic instead.
    magic_ok = data[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" if item.ext == "xls" else data[:2] == b"PK"
    if not magic_ok or len(data) < 20000:
        raise SystemExit(
            f"{item.title}: download is not a workbook "
            f"({len(data)} bytes, starts {data[:12]!r})"
        )
    tmp = dest.with_name(dest.name + ".part")
    tmp.write_bytes(data)
    tmp.replace(dest)
    if not workbook_is_whole(dest):
        dest.unlink(missing_ok=True)
        raise SystemExit(f"{item.title}: downloaded workbook is not a whole zip; discarded")
    return dest, hashlib.sha256(data).hexdigest(), True


# --------------------------------------------------------------------------- #
# the archive
# --------------------------------------------------------------------------- #
def load_records() -> list[dict[str, Any]]:
    records = json.loads(DATA.read_text(encoding="utf-8"))
    records.sort(key=lambda r: r["date_key"])
    return records


def held_months(records: list[dict[str, Any]]) -> dict[str, str]:
    """Month -> 'held' or what is missing. A month is held only when all three
    artefacts exist; a partial month is re-ingested rather than assumed done."""
    out: dict[str, str] = {}
    for r in records:
        key = r["date_key"]
        missing = [
            name for name, path in (
                ("detail", DETAIL_DIR / f"{key}.json"),
                ("public", PUBLIC_DIR / f"{key}.json"),
            ) if not path.exists()
        ]
        out[key] = "held" if not missing else "missing " + " and ".join(missing)
    return out


def prev_key(key: str) -> str:
    year, month = int(key[:4]), int(key[5:7])
    return f"{year - 1}-12" if month == 1 else f"{year}-{month - 1:02d}"


# --------------------------------------------------------------------------- #
# parse and check
# --------------------------------------------------------------------------- #
def parse(xlsx: Path, source: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    doc = detail.parse_workbook(xlsx)
    doc["source"] = source

    # The dump is written beside the workbook and kept: it is what the
    # headline parser actually read, and its NAME is how that parser learns
    # the month — so it is named for the month the document states, not the
    # ERP title.
    dump = xlsx.with_name(f"{doc['month']}-{doc['year']}.txt")
    text, _ = xlsx_to_md(xlsx)
    dump.write_text(text, encoding="utf-8")

    record = headline.parse_report_file(str(dump))
    if record is None:
        raise SystemExit(f"{xlsx.name}: the headline parser could not read a month from {dump.name}")
    record["filename"] = xlsx.name
    record["month"], record["year"], record["date_key"] = doc["month"], doc["year"], doc["date_key"]
    return record, doc


def close(a: float | None, b: float | None) -> bool:
    if a is None or b is None:
        return False
    return abs(a - b) <= 0.001


def check(record: dict[str, Any], doc: dict[str, Any],
          held: dict[str, dict[str, Any]]) -> tuple[list[str], list[str], list[str]]:
    """Errors (we would publish a figure two readers disagree on), warnings
    (PGCB disagrees with its own earlier report — reported, never repaired),
    and the lines describing what agreed."""
    errors: list[str] = []
    warns: list[str] = []
    notes: list[str] = []
    keyed = doc.get("system", {}).get("keyed", {})

    # parse_monthly_reports.clean_float answers 0.0 for a cell it cannot read,
    # so a record of zeros is a parser that found nothing, not a month with no
    # generation. Null is not zero; neither is a failed read.
    zeros = [f for f in ("max_evening_peak_gen", "max_evening_peak_demand", "total_net_generation")
             if not record.get(f)]
    if zeros:
        errors.append(f"headline parser read nothing for {', '.join(zeros)} (0.0 is its failure value)")

    pairs = [
        ("peak gen", record["max_evening_peak_gen"], keyed.get("max_evening_peak_gen_mw", {}).get("value")),
        ("peak demand", record["max_evening_peak_demand"], keyed.get("max_evening_peak_demand_mw", {}).get("value")),
        ("net generation", record["total_net_generation"], keyed.get("total_net_generation_mkwh", {}).get("value")),
    ]
    areas = {a["key"]: a.get("load_mw") for a in doc.get("area_supply_at_system_peak", {}).get("areas", [])}
    for zone, value in record["regional_supply"].items():
        pairs.append((f"zone {zone}", value, areas.get(ZONE_ALIAS.get(zone, zone))))

    agreed = 0
    for name, by_label, by_position in pairs:
        if close(by_label, by_position):
            agreed += 1
        else:
            errors.append(f"{name}: by label {by_label!r}, by position {by_position!r}")
    notes.append(f"headline vs detail: {agreed} of {len(pairs)} figures agree "
                 f"(peak gen, peak demand, net generation, {len(pairs) - 3} zones)")
    notes.append("generation by fuel: single reading, not cross-checked")

    # The sheet's own "Previous Month" column against the record we hold for
    # that month. It confirmed the column indexing when June was ingested by
    # hand; here it runs every time. A disagreement is PGCB restating a figure
    # (which it does — see PGCB_MONTHLY_STALE_ROWS) and is reported as such.
    prev = held.get(prev_key(record["date_key"]))
    if prev:
        prev_pairs = [
            ("peak gen", keyed.get("max_evening_peak_gen_mw", {}).get("prev_month"), prev["max_evening_peak_gen"]),
            ("peak demand", keyed.get("max_evening_peak_demand_mw", {}).get("prev_month"), prev["max_evening_peak_demand"]),
            ("net generation", keyed.get("total_net_generation_mkwh", {}).get("prev_month"), prev["total_net_generation"]),
        ]
        # The sheet prints the previous month to two decimals; the record
        # holds what that month's own sheet said in full (4238.82 against
        # 4238.82139295 on 2019-01), so agree to the printed precision.
        ok = [n for n, a, b in prev_pairs if a is not None and b is not None and abs(a - b) <= 0.01]
        for n, a, b in prev_pairs:
            if n not in ok:
                warns.append(f"sheet says previous-month {n} was {a!r}; held {prev['date_key']} record says {b!r}")
        notes.append(f"previous month per the sheet: agrees with held {prev['date_key']} on {len(ok)} of {len(prev_pairs)}")
    else:
        notes.append(f"previous month {prev_key(record['date_key'])} not held; no continuity check")

    for name, entry in keyed.items():
        if entry.get("suspect_date"):
            warns.append(f"{name} is dated {entry.get('when')} — PGCB carried an earlier month's figure")
    if doc.get("data_quality", {}).get("header_period_mismatch"):
        mm = doc["data_quality"]["header_period_mismatch"]
        warns.append(f"printed period {mm['printed']!r} disagreed with the dates inside; used {mm['resolved']!r}")
    return errors, warns, notes


# --------------------------------------------------------------------------- #
# write
# --------------------------------------------------------------------------- #
def write(record: dict[str, Any], doc: dict[str, Any], out: Path | None) -> None:
    key = record["date_key"]
    if out is not None:
        out.mkdir(parents=True, exist_ok=True)
        (out / f"{key}.record.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        detail.write_document(doc, out / f"{key}.detail.json")
        log(f"{key}: written under {out} (repo untouched)")
        return

    records = [r for r in load_records() if r["date_key"] != key] + [record]
    records.sort(key=lambda r: r["date_key"])
    # indent=2 and the default ensure_ascii, as parse_monthly_reports.py has
    # always written this file — so the diff of an ingest is one record.
    with DATA.open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(records, fh, indent=2)
        fh.write("\n")
    detail.write_document(doc, DETAIL_DIR / f"{key}.json")
    builder.main()
    log(f"{key}: written — {DATA.relative_to(ROOT)} ({len(records)} months), "
        f"{(DETAIL_DIR / f'{key}.json').relative_to(ROOT)}, {PUBLIC_DIR.relative_to(ROOT)} rebuilt")


# --------------------------------------------------------------------------- #
# verify — the monthly twin of `npm run verify:source`
# --------------------------------------------------------------------------- #
LEDGER = ROOT / "verification" / "pgcb-monthly-ledger.json"

# Fields of the headline record that the site prints as PGCB's own figures.
INDICATOR_FIELDS = ("max_evening_peak_gen", "max_evening_peak_demand", "total_net_generation")


def _flatten_record(r: dict[str, Any]) -> dict[str, float]:
    out = {f: r[f] for f in INDICATOR_FIELDS}
    out.update({f"generation_by_fuel.{k}": v for k, v in r["generation_by_fuel"].items()})
    out.update({f"regional_supply.{k}": v for k, v in r["regional_supply"].items()})
    return out


def verify_month(item: Listed, committed_record: dict[str, Any]) -> dict[str, Any]:
    """Refetch one month from the ERP, reparse it with today's parsers, and say
    where it disagrees with what is committed.

    Verdicts, worst first — the same scale as verify:source:
      INDICATOR  a headline figure the site prints differs   fix now
      DRIFT      a detail section differs                    triage
      EVENTS     only the outage log differs                 triage (usually
                 a sheet the old parse could not read)
      MATCH      every figure and section agrees
      UNFETCHED / UNPARSED  the ERP or the parser refused
    Compared by value after the same normalisation the release layer applies,
    never by bytes — the old dumps and the workbooks spell 17.0 and 17 alike.
    """
    key = item.key
    entry: dict[str, Any] = {"month": key, "erp_id": item.erp_id, "title": item.title, "ext": item.ext}
    try:
        xlsx, sha, _ = download(item, archive_dir())
    except SystemExit as e:
        return {**entry, "verdict": "UNFETCHED", "note": str(e)}
    except Exception as e:  # network
        return {**entry, "verdict": "UNFETCHED", "note": f"download failed: {e}"}
    entry["sha256"] = sha
    try:
        record, doc = parse(xlsx, {"erp_id": item.erp_id, "title": item.title, "url": item.url, "sha256": sha})
    except SystemExit as e:
        return {**entry, "verdict": "UNPARSED", "note": str(e)}
    if record["date_key"] != key:
        return {**entry, "verdict": "UNPARSED",
                "note": f"the document states {record['date_key']}; the ERP titles it {key}"}

    indicator = []
    a, b = _flatten_record(committed_record), _flatten_record(record)
    for f in a:
        if not close(a[f], b.get(f)):
            indicator.append({"field": f, "committed": a[f], "erp": b.get(f)})

    committed_doc = json.loads((DETAIL_DIR / f"{key}.json").read_text(encoding="utf-8"))
    sections: dict[str, Any] = {}
    skip = {"source_file", "sheets_present", "source", "outage_events", "data_quality"}
    for name in sorted((set(committed_doc) | set(doc)) - skip):
        x, y = committed_doc.get(name), doc.get(name)
        if _norm(x) == _norm(y):
            continue
        sections[name] = {"committed": _size(x), "erp": _size(y)}
    # The event log is compared row by row, not by count: two parses of the
    # same sheet can agree on 442 rows and still disagree on three of them
    # (the old text dumps rendered a few cells differently), and a count
    # cannot see that.
    ev_committed = [_norm(e) for e in committed_doc.get("outage_events", [])]
    ev_erp = [_norm(e) for e in doc.get("outage_events", [])]
    ev_key = lambda e: json.dumps(e, sort_keys=True)  # noqa: E731
    only_committed = sorted(set(map(ev_key, ev_committed)) - set(map(ev_key, ev_erp)))
    only_erp = sorted(set(map(ev_key, ev_erp)) - set(map(ev_key, ev_committed)))
    events = {"committed": len(ev_committed), "erp": len(ev_erp),
              "only_committed": len(only_committed), "only_erp": len(only_erp)}

    if indicator:
        verdict = "INDICATOR"
    elif sections:
        verdict = "DRIFT"
    elif only_committed or only_erp:
        verdict = "EVENTS"
    else:
        verdict = "MATCH"
    return {**entry, "verdict": verdict, "indicator": indicator, "sections": sections, "events": events}


def _norm(o: Any) -> Any:
    if isinstance(o, dict):
        return {k: _norm(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_norm(v) for v in o]
    if isinstance(o, float) and o.is_integer():
        return int(o)
    return o


def _size(o: Any) -> Any:
    if isinstance(o, list):
        return len(o)
    if isinstance(o, dict):
        return {k: _size(v) for k, v in o.items()} if len(o) <= 4 else len(o)
    return o


def verify(listing: list[Listed], held: dict[str, dict[str, Any]], wanted: list[str], force: bool) -> int:
    ledger = json.loads(LEDGER.read_text(encoding="utf-8")) if LEDGER.exists() else {"months": {}}
    months = ledger.setdefault("months", {})
    todo = [i for i in listing if i.key in held and (not wanted or i.key in wanted)]
    if not force:
        # A month verified MATCH against this same ERP file need not be
        # refetched — the ledger is audit evidence, as source-ledger.json is.
        todo = [i for i in todo if not (months.get(i.key, {}).get("verdict") == "MATCH"
                                        and months[i.key].get("erp_id") == i.erp_id)]
    log(f"verify: {len(todo)} month(s) to refetch and reparse")
    for item in todo:
        entry = verify_month(item, held[item.key])
        months[item.key] = entry
        detail = ""
        if entry["verdict"] == "INDICATOR":
            detail = "; ".join(f"{d['field']} {d['committed']!r}->{d['erp']!r}" for d in entry["indicator"][:4])
        elif entry["verdict"] == "DRIFT":
            detail = ", ".join(f"{k} {v['committed']}->{v['erp']}" for k, v in entry["sections"].items())
        elif entry["verdict"] == "EVENTS":
            ev = entry["events"]
            detail = (f"events {ev['committed']}->{ev['erp']} "
                      f"({ev['only_committed']} only in the archive, {ev['only_erp']} only in the workbook)")
        elif entry["verdict"] in ("UNFETCHED", "UNPARSED"):
            detail = entry.get("note", "")
        log(f"  {item.key}  {entry['verdict']:10s} {detail}")
        # Written after every month so a cut mid-sweep keeps what was done.
        ledger["generated_at"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        LEDGER.parent.mkdir(parents=True, exist_ok=True)
        LEDGER.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    counts: dict[str, int] = {}
    for k in held:
        v = months.get(k, {}).get("verdict", "UNVERIFIED")
        counts[v] = counts.get(v, 0) + 1
    log("verify: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    log("ingested_months=")
    return 1 if any(months.get(k, {}).get("verdict") in ("INDICATOR", "UNPARSED") for k in held) else 0


# --------------------------------------------------------------------------- #
def ingest_one(xlsx: Path, source: dict[str, Any], held: dict[str, dict[str, Any]],
               *, expect_key: str | None, dry_run: bool, out: Path | None) -> str | None:
    record, doc = parse(xlsx, source)
    key = record["date_key"]
    log(f"{key}: document states {doc['month']} {doc['year']}"
        + (f" — the ERP titled it {expect_key}" if expect_key and expect_key != key else ""))
    for section, n in detail.section_counts(doc).items():
        log(f"  {section:28s} {n}")

    errors, warns, notes = check(record, doc, held)
    for line in notes:
        log(f"  {line}")
    for line in warns:
        log(f"  WARN {line}")
    for line in errors:
        log(f"  ERROR {line}")
    if errors:
        log(f"{key}: not written — {len(errors)} error(s) above")
        return None
    if dry_run:
        log(f"{key}: dry run — nothing written")
        return key
    write(record, doc, out)
    return key


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--month", action="append", default=[], metavar="YYYY-MM",
                    help="ingest this month from the ERP even if held (repeatable, or comma-separated)")
    ap.add_argument("--file", type=Path, help="parse a workbook already on disk instead of asking the ERP")
    ap.add_argument("--list", action="store_true", help="show the ERP against the archive; write nothing")
    ap.add_argument("--verify", action="store_true",
                    help="refetch every held month the ERP serves, reparse, diff against the archive, "
                         "write verification/pgcb-monthly-ledger.json; --month narrows it, --force redoes MATCHes")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", type=Path, help="write the parsed artefacts here instead of into the repo")
    args = ap.parse_args()
    wanted = [m for spec in args.month for m in spec.split(",") if m]
    for m in wanted:
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", m):
            ap.error(f"--month {m!r} is not YYYY-MM")

    records = load_records()
    held_by_key = {r["date_key"]: r for r in records}
    status = held_months(records)
    newest_held = max(status) if status else None
    ingested: list[str] = []
    failed = 0

    if args.file:
        src = args.file
        if not src.exists():
            log(f"{src}: no such file")
            log("ingested_months=")
            return 1
        source = {"path": str(src), "sha256": hashlib.sha256(src.read_bytes()).hexdigest()}
        key = ingest_one(src, source, held_by_key, expect_key=None, dry_run=args.dry_run, out=args.out)
        if key:
            ingested.append(key)
        else:
            failed += 1
    else:
        # The daily run reads page 1 only (newest first, one GET); a walk of
        # the whole listing is for looking, verifying and backfilling.
        listing = list_erp(all_pages=args.list or args.verify or bool(wanted))
        newest_listed = listing[-1]
        log(f"listing: {len(listing)} reports on the ERP, newest {newest_listed.title} (id {newest_listed.erp_id}); "
            f"archive holds {len(status)} months, newest {newest_held}")

        if args.verify:
            return verify(listing, held_by_key, wanted, args.force)

        if args.list:
            for item in listing:
                log(f"  {item.key}  {item.title:16s} id {item.erp_id:<6d} {status.get(item.key, 'NOT HELD')}")
            unlisted = sorted(k for k in status if k not in {i.key for i in listing})
            if unlisted:
                log(f"  held but no longer on the ERP: {len(unlisted)} months ({unlisted[0]} .. {unlisted[-1]})")
            log("ingested_months=")
            return 0

        by_key = {item.key: item for item in listing}
        if wanted:
            todo = []
            for m in wanted:
                if m not in by_key:
                    log(f"{m}: the ERP does not list it — PGCB has not posted that month")
                    failed += 1
                else:
                    todo.append(by_key[m])
        else:
            todo = [item for item in listing if status.get(item.key) != "held"]
            for item in todo:
                if item.key in status:
                    log(f"{item.key}: held but {status[item.key]} — re-ingesting")

        if not todo and not failed:
            log("nothing new: every month the ERP serves is held")

        for item in todo:
            try:
                xlsx, sha, fetched = download(item, archive_dir())
            except SystemExit as e:
                log(f"  ERROR {e}")
                failed += 1
                continue
            except Exception as e:  # network
                log(f"  ERROR {item.title}: download failed: {e}")
                failed += 1
                continue
            log(f"{item.title}: {'fetched' if fetched else 'already on disk'} id {item.erp_id} "
                f"({xlsx.stat().st_size:,} bytes, sha256 {sha[:12]}…) -> {xlsx}")
            # Deterministic on purpose — no fetch time. The Pi's first run
            # re-parsed a month this box had just committed and the two
            # documents differed in nothing but a timestamp, which cost a
            # commit and made "did the two machines parse it the same" a
            # question instead of a diff. The time is in the log.
            source = {
                "erp_id": item.erp_id,
                "title": item.title,
                "url": item.url,
                "sha256": sha,
            }
            try:
                key = ingest_one(xlsx, source, held_by_key, expect_key=item.key,
                                 dry_run=args.dry_run, out=args.out)
            except SystemExit as e:
                log(f"  ERROR {e}")
                key = None
            if key:
                ingested.append(key)
            else:
                failed += 1

    log("ingested_months=" + ",".join(ingested))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
