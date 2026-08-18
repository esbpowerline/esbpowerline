"""Sync Petrobangla hot-folder PDFs, index, and 7-day live cache to public/data."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESKTOP_JSON = Path(r"C:\Users\user\Desktop\grid_backlog\petrobangla_json")
DESKTOP_INDEX = DESKTOP_JSON / "_index.json"
HOT_FOLDER = Path(r"C:\Users\user\Desktop\New weeks")
PARSE_CLI = Path(r"C:\Users\user\Desktop\grid_backlog\parse_petrobangla.py")
PUBLIC = ROOT / "public" / "data" / "petrobangla"
PUBLIC_DAILY = PUBLIC / "daily"
LIVE_WEEK_COUNT = 7
QUARANTINE = {
    "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
    "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
    "2025-05-22", "2026-02-22",
}


def ingest_hot_pdfs() -> int:
    if not HOT_FOLDER.is_dir():
        return 0
    count = 0
    for pdf in sorted(HOT_FOLDER.glob("*.pdf")):
        try:
            subprocess.run(
                [sys.executable, str(PARSE_CLI), "--single", str(pdf)],
                check=True,
                capture_output=True,
                text=True,
            )
            count += 1
            print(f"Parsed hot PDF: {pdf.name}")
        except subprocess.CalledProcessError as e:
            print(f"Skip {pdf.name}: {e.stderr or e}")
    return count


def copy_daily_files() -> int:
    PUBLIC_DAILY.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in DESKTOP_JSON.glob("20*.json"):
        if src.name.startswith("_"):
            continue
        dst = PUBLIC_DAILY / src.name
        if not dst.exists() or src.stat().st_mtime > dst.stat().st_mtime:
            shutil.copy2(src, dst)
            n += 1
    return n


def build_live_week(index: dict) -> dict:
    ok = [
        d for d in index.get("days", [])
        if d.get("parse_status") == "ok" and d.get("date") not in QUARANTINE
    ]
    ok.sort(key=lambda d: d["date"])
    window = ok[-LIVE_WEEK_COUNT:]
    days = []
    for entry in window:
        jf = entry.get("json_file") or f"{entry['date']}.json"
        path = PUBLIC_DAILY / jf
        if not path.exists():
            path = PUBLIC_DAILY / f"{entry['date']}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        days.append(data)
    latest = window[-1] if window else None
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "live_week_count": LIVE_WEEK_COUNT,
        "latest_date": latest["date"] if latest else None,
        "latest_label": latest.get("date_label") if latest else None,
        "index_entries": window,
        "days": days,
    }


def main():
    ingest_hot_pdfs()
    copy_daily_files()
    public_index = PUBLIC / "_index.json"
    index = json.loads(public_index.read_text(encoding="utf-8")) if public_index.exists() else None
    if DESKTOP_INDEX.exists():
        staged = json.loads(DESKTOP_INDEX.read_text(encoding="utf-8"))
        # The copy is wholesale, so a staging folder holding one freshly written
        # day would replace the whole published index with that day. The daily
        # extractor creates exactly that folder when it deploys Pipeline B, so
        # adopt staging only when it actually covers at least as much.
        if index is None or len(staged.get("days", [])) >= len(index.get("days", [])):
            shutil.copy2(DESKTOP_INDEX, public_index)
            index = staged
        else:
            print(
                f"Keeping published index ({len(index.get('days', []))} days); "
                f"staging holds only {len(staged.get('days', []))}."
            )
    live = build_live_week(index)
    (PUBLIC / "_live_week.json").write_text(json.dumps(live, indent=2), encoding="utf-8")
    print(f"Live week: {len(live['days'])} days, latest={live['latest_date']}")


if __name__ == "__main__":
    main()