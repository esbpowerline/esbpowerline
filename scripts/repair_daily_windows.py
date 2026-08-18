"""Put an observation window on every archived day, and make the gas citation
name the document the figures actually came from.

Three defects this repairs, all found by auditing the archive against W::

  1. Orphan citations. 832 days name a Petrobangla PDF while carrying no gas
     figures at all — a source credited for numbers that are not on the page.

  2. Off-by-one citations. A handful of gas-carrying days cite the PDF named
     for the energy day itself. Petrobangla names a file for the morning its
     window CLOSES, so that PDF holds the PREVIOUS gas day. The figures on
     those pages are right; the document a reader was told to check is not.

  3. Unciteable citations. 46 days from 2026-06-25 name an opaque UUID
     ("a627934c-....pdf") captured from a live fetch. Nobody can ask
     Petrobangla for that file. 44 resolve to a properly-named PDF held on W:.

The rule applied throughout is the anchor rule in lib/data/grid/observation-window.ts:
energy day D carries the gas window that OPENS at 08:00 on D, which Petrobangla
files under D+1. A citation is only rewritten when the day's stored gas total
matches that window's grand total — otherwise the day is reported and left
alone, because a mismatch means the archive is wrong in a way renaming cannot
fix.

Usage:
    python scripts/repair_daily_windows.py            # dry run, prints a report
    python scripts/repair_daily_windows.py --apply    # write the changes
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
PB_DAILY = ROOT / "public" / "data" / "petrobangla" / "daily"
PB_PDF_DIRS = [
    Path(r"W:\Petrobangla\Daily Gas Reports - D"),
    Path(r"C:\ESB-Grid-Archive\02-petrobangla"),
]

# Petrobangla's filename stamp, e.g. "(17.08.26)". Tolerates the spaced variant
# the site has used ("(16 12.25)").
NAME_DATE = re.compile(r"\((\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{2,4})\)")

# Identifying which document a day's figures came from is a question about
# DOCUMENT IDENTITY, not about agreement to the last decimal. Two guards do it:
#
#   absolute/relative slack — the daily copy and the Petrobangla record are
#   built by different parsers over the same page, and a row one of them drops
#   moves the total by a couple of MMCFD out of ~3,000 (0.07%).
#
#   the neighbour test — a genuine day shift is not subtle. Consecutive gas days
#   differ by tens to hundreds of MMCFD, so the correct window must also be a
#   strictly better match than the windows either side of it. That is what makes
#   loose slack safe: slack alone could accept a neighbour, slack plus the
#   neighbour test cannot.
GAS_MATCH_TOLERANCE_MMCFD = 1.5
GAS_MATCH_TOLERANCE_PCT = 0.005


def iso_shift(iso: str, days: int) -> str:
    y, m, d = map(int, iso.split("-"))
    return (date(y, m, d) + timedelta(days=days)).isoformat()


def load_json(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def index_pdfs() -> dict[str, str]:
    """Map window-END date -> filename, from whichever PDF store is reachable."""
    out: dict[str, str] = {}
    for directory in PB_PDF_DIRS:
        if not directory.is_dir():
            continue
        for name in os.listdir(directory):
            if not name.lower().endswith(".pdf"):
                continue
            m = NAME_DATE.search(name)
            if not m:
                continue
            dd, mm, yy = m.groups()
            yy = int(yy)
            yy = yy + 2000 if yy < 100 else yy
            try:
                key = date(yy, int(mm), int(dd)).isoformat()
            except ValueError:
                continue
            # A "_1" duplicate is a redownload of the same day; prefer the plain
            # name so the citation matches what the site serves.
            if key not in out or "_1" in out[key]:
                out[key] = name
        if out:
            break
    return out


def index_gas_windows() -> dict[str, dict]:
    """Map gas-day START -> the archived Petrobangla record for that window.

    The archive's own file keys are not a reliable index: files up to
    2026-06-21 are keyed on the window's END and files from 2026-06-22 on its
    START. Reading gas_day_start out of each record sidesteps the flip entirely.
    """
    out: dict[str, dict] = {}
    if not PB_DAILY.is_dir():
        return out
    for path in sorted(PB_DAILY.glob("20*.json")):
        try:
            doc = load_json(path)
        except Exception:
            continue
        report = doc.get("report") or {}
        start = report.get("gas_day_start")
        if not start:
            continue
        production = doc.get("production") or {}
        grand = production.get("grand_total") or {}
        # Identity is tested against the SUM OF FIELD ROWS, not the printed
        # grand total. Petrobangla's own grand total does not always equal its
        # own field rows — 2020-07-05 prints 3100.7 against 23 fields summing to
        # 3096.8 — and the daily archive stores the field sum. Testing against
        # the printed total flagged 63 correctly-cited days as mismatches when
        # the only disagreement was inside Petrobangla's own page.
        field_sum = sum(float(f.get("gas_mmcfd") or 0) for f in production.get("fields") or [])
        out[start] = {
            "fieldSum": field_sum or None,
            "label": report.get("report_date_label"),
            "start": start,
            "end": report.get("gas_day_end"),
            "period": report.get("period"),
            "gas": grand.get("gas_mmcfd"),
            "pdf": (doc.get("meta") or {}).get("source_filename"),
            "key": path.stem,
        }
    return out


def window_total(record) -> float | None:
    if record is None:
        return None
    return record.get("fieldSum") or record.get("gas")


def window_matches(shown: float, record, windows: dict, day: str) -> bool:
    """Is `record` the document `shown` came from?

    Slack, then the neighbour test: the day's own window must beat both the
    window before it and the window after it. A shift of one day changes the
    national total by far more than the parser slack, so a near-tie is itself
    evidence something is wrong and the day is reported rather than rewritten.
    """
    mine = window_total(record)
    if mine is None:
        return False
    gap = abs(mine - shown)
    if gap > max(GAS_MATCH_TOLERANCE_MMCFD, mine * GAS_MATCH_TOLERANCE_PCT):
        return False
    for offset in (-1, 1):
        other = window_total(windows.get(iso_shift(day, offset)))
        if other is not None and abs(other - shown) <= gap:
            return False
    return True


def embedded_gas_total(doc) -> float:
    rows = doc.get("gasProductionData") or []
    return sum(float(r.get("gas") or 0) for r in rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes to disk")
    ap.add_argument("--limit", type=int, default=0, help="stop after N files (debugging)")
    args = ap.parse_args()

    pdfs = index_pdfs()
    windows = index_gas_windows()
    if not pdfs:
        print("! no Petrobangla PDF store reachable — citations cannot be repaired", file=sys.stderr)
    print(f"indexed {len(pdfs)} source PDFs, {len(windows)} parsed gas windows\n")

    tally = Counter()
    problems: list[str] = []
    changed = 0

    paths = sorted(DAILY.glob("20*.json"))
    if args.limit:
        paths = paths[: args.limit]

    for path in paths:
        day = path.stem
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
            continue
        try:
            doc = load_json(path)
        except Exception as exc:
            problems.append(f"{day}: unreadable ({exc})")
            tally["unreadable"] += 1
            continue

        source_files = doc.get("sourceFiles") or {}
        before = json.dumps(source_files, sort_keys=True)
        gas_total = embedded_gas_total(doc)
        has_gas = gas_total > 0
        record = windows.get(day)
        filed_as = iso_shift(day, 1)

        # ---- the gas citation -------------------------------------------------
        if not has_gas:
            if source_files.get("petrobangla"):
                source_files.pop("petrobangla", None)
                tally["orphan citation removed"] += 1
        else:
            correct = pdfs.get(filed_as)
            if record is None:
                tally["gas shown but no parsed window"] += 1
                problems.append(f"{day}: {gas_total:.1f} MMCFD shown, no parsed gas window opens this day")
            elif record["fieldSum"] is None and record["gas"] is None:
                tally["window has no comparable total"] += 1
            elif not window_matches(gas_total, record, windows, day):
                tally["figures disagree with window — left alone"] += 1
                problems.append(
                    f"{day}: shown {gas_total:.1f} vs window {record['start']}->{record['end']} "
                    f"field sum {window_total(record):.1f} — citation NOT rewritten"
                )
            else:
                # The archived record names the PDF it was parsed from; prefer it
                # to the directory index, then fall back to the index.
                name = record["pdf"] if record["pdf"] and NAME_DATE.search(record["pdf"]) else correct
                if name and source_files.get("petrobangla") != name:
                    old = source_files.get("petrobangla")
                    source_files["petrobangla"] = name
                    if old is None:
                        tally["citation added"] += 1
                    elif not NAME_DATE.search(old):
                        tally["UUID citation resolved"] += 1
                    else:
                        tally["off-by-one citation corrected"] += 1
                elif not name:
                    tally["no citeable PDF held"] += 1
                    problems.append(f"{day}: gas shown but no properly-named PDF held for {filed_as}")

        # ---- the observation windows ------------------------------------------
        # Written onto the day so the UI never has to infer a window, and so the
        # export carries the same statement the page makes.
        wins = {
            "timezone": "+06:00",
            "pgcb": {
                "unit": "energy day",
                "start": f"{day}T00:00:00+06:00",
                "end": f"{iso_shift(day, 1)}T00:00:00+06:00",
                "filedAs": filed_as,
                "sourceFile": source_files.get("pgcb"),
            },
        }
        if has_gas and record:
            wins["petrobangla"] = {
                "unit": "gas day",
                "start": f"{record['start']}T08:00:00+06:00",
                "end": f"{record['end']}T08:00:00+06:00",
                "filedAs": record["end"],
                "publishedLabel": record["label"],
                "period": record["period"],
                "sourceFile": source_files.get("petrobangla"),
            }
        doc["observationWindows"] = wins

        if source_files:
            doc["sourceFiles"] = source_files
        elif "sourceFiles" in doc:
            del doc["sourceFiles"]

        after = json.dumps(doc.get("sourceFiles") or {}, sort_keys=True)
        if after != before or True:  # windows are new on every file
            changed += 1
            if args.apply:
                tmp = path.with_suffix(".json.tmp")
                with tmp.open("w", encoding="utf-8") as fh:
                    # indent=2 and no trailing newline reproduce the archive's
                    # existing formatting exactly, so the diff shows the fields
                    # that changed rather than 4,500 reflowed files.
                    json.dump(doc, fh, ensure_ascii=False, indent=2)
                tmp.replace(path)

    print("=== citation repair ===")
    for k, v in sorted(tally.items(), key=lambda kv: -kv[1]):
        print(f"  {v:6d}  {k}")
    print(f"\n{changed} files {'written' if args.apply else 'would be written'}")
    if problems:
        print(f"\n=== {len(problems)} days need a look ===")
        for line in problems[:40]:
            print("  " + line)
        if len(problems) > 40:
            print(f"  ... and {len(problems) - 40} more")
    if not args.apply:
        print("\n(dry run — re-run with --apply to write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
