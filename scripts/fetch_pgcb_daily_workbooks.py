"""Close the gaps in the PGCB daily-workbook archive, from PGCB's own channel.

Where PGCB actually publishes the daily report, established 2026-08-19:

  * pgcb.gov.bd hosts NO daily report files. The legacy path this project used,
    https://www.pgcb.gov.bd/reports/Daily_Report_DD-MM-YYYY.xlsx, 404s for every
    date tried, and the site's downloads page carries one monitoring report and
    nothing daily.
  * PGCB's own navigation entry "দৈনিক পরিচালন প্রতিবেদন" (Daily Operation
    Report) links straight to erp.powergrid.gov.bd.
  * The file that portal serves for 26-07-2026 is md5 758c6f0f30da4ae4… — byte
    for byte the copy held on W: as "Daily Report 26-07-2026.xlsx".

So for the daily report the ERP portal is not a mirror of the source; it IS
PGCB's publication channel, and a workbook taken from it is the publisher's own
file. That does not soften the rule in the ingest path — a copy already held is
still preferred, because it needs no network and is already named — but it does
mean the archive gaps can only be closed here.

The listing carries what matters: each row states the report date, and the
download URL's `title` parameter carries PGCB's own filename, so files land
named the way PGCB names them rather than as erp_<id>.xlsx.

Usage:
    python scripts/fetch_pgcb_daily_workbooks.py --index      # crawl, report, write the map
    python scripts/fetch_pgcb_daily_workbooks.py --missing    # what is absent from both stores
    python scripts/fetch_pgcb_daily_workbooks.py --fetch [--limit N]
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from parse_daily_reports import parse_date_from_filename  # noqa: E402

# The report listing PGCB's own site links to. The token is part of the URL the
# portal issues; it is stable and public, and appears verbatim on pgcb.gov.bd.
LISTING = (
    "https://erp.powergrid.gov.bd/w/report/"
    "eyJpdiI6IldsU2ZQTGkvbkRnQU9FMjZ5UHhmeGc9PSIsInZhbHVlIjoiQzhONVl5ZGxRY3E3T3ZVNCtLZGt1"
    "Zz09IiwibWFjIjoiN2JiNTI5MzNhOWIxZDVjY2NkMmFlZWU4ZDU1N2I4OWZlYjNlZWM1ZGU4NzRiNWU4ZjQ3"
    "ZDc1ODRlMTk3MDc0YyIsInRhZyI6IiJ9/show_report"
)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36"

# Where a held copy counts as already-archived. Source stores first, matching
# the precedence the ingest uses.
HELD_DIRS = [
    Path(r"W:\PGCB\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\acquired-from-erp"),
]
# New downloads land here, in the source store, named as PGCB names them.
DEST = Path(r"W:\PGCB\Daily Reports - D")
INDEX_PATH = ROOT / "public" / "data" / "grid-verification" / "_pgcb-workbook-index.json"

# PGCB's own filenames carry the occasional typo, and a mistyped year sails
# through any date parser as a real date. "Daily Report 04-11-219.xlsm" indexes
# as the year 219 and would sit in the map forever as a day that cannot exist.
#
# Each correction is listed by hand rather than inferred by a rule. This one is
# unambiguous — the row sits between "Daily Report 03-11-19" and "Daily Report
# 05-11-2019", and 04-11 of any other year is already accounted for — but a
# rule general enough to derive it would also silently rewrite dates that are
# merely unusual, and a wrong date here misfiles a whole day of grid data.
TITLE_DATE_FIXES: dict[str, str] = {
    "Daily Report 04-11-219.xlsm": "2019-11-04",
}

# Anything outside this is a typo or a parser failure, never a real report.
PLAUSIBLE_YEARS = range(2013, 2031)

ROW = re.compile(r"<tr\b.*?</tr>", re.S)
DOWNLOAD = re.compile(r'href="(https://erp\.powergrid\.gov\.bd/web/files/download\?[^"]+)"')
DATE_CELL = re.compile(r"(\d{2})-(\d{2})-(\d{4})")

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE


def fetch(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=_ctx) as resp:
        return resp.read()


# Excel ships in two containers and PGCB's archive spans both. The 2014-2016
# reports are legacy .xls — an OLE2 compound file beginning D0 CF 11 E0 — while
# .xlsx/.xlsm are zip archives beginning PK. Checking only for "PK" rejected
# every genuine .xls as "not a workbook" and would have skipped the entire
# early archive while reporting a clean run.
ZIP_MAGIC = b"PK"
OLE2_MAGIC = bytes.fromhex("D0CF11E0A1B11AE1")


def looks_like_workbook(data: bytes) -> bool:
    if len(data) < 20000:
        return False
    return data[:2] == ZIP_MAGIC or data[:8] == OLE2_MAGIC


def unescape(url: str) -> str:
    return url.replace("&amp;", "&")


def title_of(url: str) -> str | None:
    """PGCB's own filename, from the download URL's title parameter."""
    q = urllib.parse.parse_qs(urllib.parse.urlparse(unescape(url)).query)
    title = (q.get("title") or [""])[0].strip()
    loc = (q.get("location") or [""])[0]
    ext = Path(loc).suffix or ".xlsx"
    if not title or title.lower() in {"daily_report", "daily report", "daily"}:
        return None
    return f"{title}{ext}" if not title.lower().endswith(ext) else title


def crawl(max_pages: int, pause: float) -> tuple[dict[str, dict], list[dict]]:
    """(report date -> {url, title}, anomalies). One request per listing page."""
    index: dict[str, dict] = {}
    anomalies: list[dict] = []
    for page in range(1, max_pages + 1):
        url = LISTING if page == 1 else f"{LISTING}?page={page}"
        try:
            html = fetch(url).decode("utf-8", errors="ignore")
        except Exception as exc:
            print(f"  page {page}: {exc}")
            continue
        found = 0
        for row in ROW.findall(html):
            link = DOWNLOAD.search(row)
            if not link:
                continue
            # Two listing eras. Recent rows carry a DD-MM-YYYY date column;
            # rows before roughly 2019-11 carry no date column at all and state
            # the day only inside the filename, as "Daily_Report20-05-15" —
            # DD-MM-YY. Reading the title through the archive's own filename
            # parser handles both, and everything in between: PGCB's naming
            # wanders across "Daily Report 26-07-2026", "Daily_Report20-05-15"
            # and double-spaced variants of each.
            title = title_of(link.group(1))
            fixed = TITLE_DATE_FIXES.get(title or "")
            if fixed:
                index.setdefault(
                    fixed,
                    {
                        "url": unescape(link.group(1)),
                        "title": title,
                        "note": "date corrected from a typo in PGCB's filename",
                    },
                )
                found += 1
                continue
            filed = parse_date_from_filename(title) if title else None
            if filed is None:
                text = re.sub(r"<[^>]+>", " ", row)
                stamp = DATE_CELL.search(text)
                if not stamp:
                    continue
                dd, mm, yyyy = stamp.groups()
                try:
                    filed = date(int(yyyy), int(mm), int(dd))
                except ValueError:
                    continue
            if filed.year not in PLAUSIBLE_YEARS:
                anomalies.append({"title": title, "parsedAs": filed.isoformat()})
                continue
            index.setdefault(
                filed.isoformat(),
                {"url": unescape(link.group(1)), "title": title},
            )
            found += 1
        print(f"  page {page:3d}: {found} rows, {len(index)} dates so far")
        if found == 0 and page > 2:
            print("  (empty page — stopping)")
            break
        time.sleep(pause)
    return index, anomalies


def held_report_dates() -> set[str]:
    out: set[str] = set()
    for root in HELD_DIRS:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if path.suffix.lower() not in {".xlsx", ".xlsm", ".xls"}:
                continue
            if path.name.startswith("~$"):
                continue
            filed = parse_date_from_filename(path.name)
            if filed:
                out.add(filed.isoformat())
    return out


def load_index() -> dict[str, dict]:
    if not INDEX_PATH.exists():
        print(f"! no index yet — run --index first ({INDEX_PATH.name})", file=sys.stderr)
        return {}
    return json.loads(INDEX_PATH.read_text(encoding="utf-8"))["reports"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", action="store_true", help="crawl the listing and write the map")
    ap.add_argument("--missing", action="store_true", help="report days absent from every store")
    ap.add_argument(
        "--verify-missing",
        action="store_true",
        help="probe each still-missing day and record which links PGCB has broken",
    )
    ap.add_argument("--fetch", action="store_true", help="download the missing workbooks")
    ap.add_argument("--pages", type=int, default=160)
    ap.add_argument("--limit", type=int, default=0, help="cap downloads this run")
    ap.add_argument("--pause", type=float, default=1.0, help="seconds between requests")
    args = ap.parse_args()

    if args.index:
        print(f"crawling up to {args.pages} listing pages, {args.pause}s apart")
        index, anomalies = crawl(args.pages, args.pause)
        INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
        with INDEX_PATH.open("w", encoding="utf-8") as fh:
            json.dump(
                {
                    "source": "erp.powergrid.gov.bd — the portal pgcb.gov.bd links as its Daily Operation Report",
                    "note": (
                        "Report dates, not energy days: a workbook filed on F reports energy day F-1. "
                        "`title` is PGCB's own filename where the listing states one."
                    ),
                    "total": len(index),
                    "anomalies": anomalies,
                    "reports": dict(sorted(index.items())),
                },
                fh,
                ensure_ascii=False,
                indent=2,
            )
        print(f"\n{len(index)} report dates indexed -> {INDEX_PATH.relative_to(ROOT)}")
        if anomalies:
            print(f"{len(anomalies)} row(s) with an impossible date, not indexed:")
            for a in anomalies:
                print(f"   {a['title']} parsed as {a['parsedAs']}")
        if index:
            keys = sorted(index)
            print(f"range {keys[0]} .. {keys[-1]}")
        return 0

    index = load_index()
    if not index:
        return 1
    held = held_report_dates()
    missing = sorted(d for d in index if d not in held)

    print(f"{len(index)} dates published · {len(held)} held · {len(missing)} missing")
    if missing:
        print(f"missing range {missing[0]} .. {missing[-1]}")
        for d in missing[:15]:
            print(f"   {d}  {index[d]['title'] or '(untitled in listing)'}")
        if len(missing) > 15:
            print(f"   ... and {len(missing) - 15} more")

    if args.verify_missing:
        # A day can be missing for two quite different reasons and the register
        # should not blur them: PGCB never published it, or PGCB published it
        # and its own download link is now dead. The second is not a gap this
        # project can close, and saying so is more useful than leaving it in a
        # to-fetch list forever.
        doc = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        dead: list[dict] = []
        for day in missing:
            entry = index[day]
            try:
                data = fetch(entry["url"], timeout=25)
                status = "ok" if looks_like_workbook(data) else f"not a workbook ({len(data)} bytes)"
            except Exception as exc:
                status = str(exc)
            if status != "ok":
                dead.append({"date": day, "title": entry["title"], "status": status})
            print(f"  {day}  {entry['title'] or ''}  {status}")
            time.sleep(args.pause)
        doc["deadLinks"] = dead
        with INDEX_PATH.open("w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
        print(f"\n{len(dead)} of {len(missing)} missing days have a broken link at PGCB")
        print(f"recorded -> {INDEX_PATH.relative_to(ROOT)}")
        return 0

    if not args.fetch:
        print("\n(reporting only — pass --fetch to download)")
        return 0

    DEST.mkdir(parents=True, exist_ok=True)
    todo = missing[: args.limit] if args.limit else missing
    ok = failed = 0
    for i, day in enumerate(todo, 1):
        entry = index[day]
        dd, mm, yyyy = day[8:10], day[5:7], day[:4]
        # PGCB's own name where the listing gives one; otherwise the form the
        # archive already uses, so parse_date_from_filename can still read it.
        name = entry["title"] or f"Daily Report {dd}-{mm}-{yyyy}.xlsx"

        # The filename has to read back as the day it is filed under, because
        # every later scan — the ingest, the gap manifest, this script's own
        # held-dates check — recovers the date from the name and nothing else.
        # PGCB's "Daily Report 04-11-219.xlsm" parses as the year 219, so saving
        # it verbatim would file 2019-11-04 under a day that cannot exist and
        # leave the gap open forever while looking closed. Where the publisher's
        # name does not round-trip, the archive's canonical form is used and the
        # original is kept in the index rather than lost.
        if parse_date_from_filename(name) != date(int(yyyy), int(mm), int(dd)):
            suffix = Path(name).suffix or ".xlsx"
            name = f"Daily Report {dd}-{mm}-{yyyy}{suffix}"
            print(f"  {day}: publisher name {entry['title']!r} does not read back as this day — saving as {name}")
        dest = DEST / name
        if dest.exists():
            continue
        try:
            data = fetch(entry["url"])
            if not looks_like_workbook(data):
                head = data[:8].hex()
                print(f"  {day}: not a workbook ({len(data)} bytes, starts {head}) — skipped")
                failed += 1
            else:
                dest.write_bytes(data)
                ok += 1
                print(f"  [{i}/{len(todo)}] {day} -> {name} ({len(data) // 1024} KB)")
        except Exception as exc:
            print(f"  {day}: {exc}")
            failed += 1
        time.sleep(args.pause)

    print(f"\n{ok} downloaded, {failed} failed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
