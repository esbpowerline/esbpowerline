"""Install correctly-reparsed Petrobangla days over corrupt or missing archive files.

Three archived files were found to hold the wrong period entirely — not a
rounding error, a different month or a different year:

    2020-01-13.json   held "12-13 Jan, 2021"   (a year out)
    2020-09-27.json   held "26-27 Aug, 2020"   (a month out)
    2020-10-17.json   absent, though its PDF is held

Re-parsing the held PDFs with parse_petrobangla_archive.py produces the right
labels and totals, and the field sums reconcile: 2020-01-12 comes to 2726.0
MMCFD, which is exactly what the daily grid archive already shows for that day.
So the grid figures were right all along and only the gas archive entry was
wrong — which is why this replaces those entries rather than touching the
daily reports.

The enrichment fields (`gas_day_start`, `gas_day_end`, `gas_window`) are added
here because the archive parser does not write them and every consumer, this
project's own repair script included, resolves a day's window from them.

Deliberately NOT installed: the 2026-06-21 window. Files up to 2026-06-21 are
keyed on the window's END and files from 2026-06-22 on its START, so the window
that opens on 2026-06-21 has no free key under either convention — 2026-06-21 is
taken by the window ending that day and 2026-06-22 by the window starting it.
That collision is the file-keying flip, and it wants resolving once for the
whole archive rather than papering over here.

Usage:
    python scripts/install_reparsed_gas_days.py            # dry run
    python scripts/install_reparsed_gas_days.py --apply
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
PB_DAILY = ROOT / "public" / "data" / "petrobangla" / "daily"
PDF_DIR = Path(r"W:\Grid-Explorer\Petrobangla\Daily Gas Reports - D")
PARSER = ROOT / "scripts" / "parse_petrobangla_archive.py"

# (gas-day start, source PDF stamp). The PDF is named for the morning the
# window closes, so the stamp is always the start plus one.
TARGETS = [
    ("2020-01-12", "13.01.20"),
    ("2020-09-26", "27.09.20"),
    ("2020-10-16", "17.10.20"),
]


def archive_key(start: date) -> str:
    """Where this window belongs under the archive's own convention.

    Files up to 2026-06-21 are keyed on the window's END; the three days here
    all fall in that era, so the key is the start plus one.
    """
    return (start + timedelta(days=1)).isoformat()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    scratch = ROOT / "scratch"
    scratch.mkdir(exist_ok=True)
    installed = 0

    for start_iso, stamp in TARGETS:
        pdf = PDF_DIR / f"Daily-Gas-Intake-Offtake-Report ({stamp}).pdf"
        if not pdf.exists():
            print(f"! {start_iso}: source PDF not held ({pdf.name})")
            continue

        out = scratch / f"pb-install-{start_iso}.json"
        proc = subprocess.run(
            [sys.executable, str(PARSER), str(pdf), start_iso, str(out)],
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0 or not out.exists():
            print(f"! {start_iso}: parse failed — {(proc.stderr or '').strip()[:120]}")
            continue

        doc = json.loads(out.read_text(encoding="utf-8"))
        report = doc.get("report") or {}
        start = report.get("report_date_start")
        end = report.get("report_date_end")

        # The parse is only trusted if the PDF's own printed range matches the
        # day it was asked for. A file that reports another period is exactly
        # the defect being repaired, and installing one blind would repeat it.
        if start != start_iso:
            print(
                f"! {start_iso}: parsed report covers {report.get('report_date_label')} "
                f"({start} -> {end}) — refusing to install"
            )
            continue

        report["gas_day_start"] = start
        report["gas_day_end"] = end
        report["gas_window"] = "8.00-8.00"
        report["gas_day_source"] = "report_date_label; reparsed from the held PDF"
        report["window_status"] = "resolved"
        doc["report"] = report

        key = archive_key(date(*map(int, start_iso.split("-"))))
        dest = PB_DAILY / f"{key}.json"
        prior = None
        if dest.exists():
            try:
                prior = (json.loads(dest.read_text(encoding="utf-8")).get("report") or {}).get(
                    "report_date_label"
                )
            except Exception:
                prior = "(unreadable)"

        grand = (doc.get("production") or {}).get("grand_total") or {}
        print(
            f"{key}.json  <- {report['report_date_label']}  "
            f"({grand.get('gas_mmcfd')} MMCFD)"
            + (f"   replacing: {prior}" if prior else "   (new file)")
        )

        if args.apply:
            with dest.open("w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)
        installed += 1

    print(f"\n{installed} files {'installed' if args.apply else 'would be installed'}")
    if not args.apply:
        print("(dry run - re-run with --apply to write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
