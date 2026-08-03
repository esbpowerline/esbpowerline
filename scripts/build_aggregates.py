"""Rebuild the three Petrobangla aggregates after a day has been added.

  _index.json           catalogue of every archive day
  _live_week.json       the last seven days, bundled whole
  timeline-summary.json slim per-day series behind the charts and reserve model

The index is updated *incrementally* — the one new day is upserted and every
other entry is left byte-identical. A full rebuild would risk silently
rewriting 2,200 historical entries if this script's derivation differed even
slightly from whatever produced them years ago.

The timeline is a full rebuild via build_petrobangla_timeline.py, which was
verified to reproduce the existing file exactly (0 of 2,277 days changed), so
regenerating it is safe.

Usage:
  python scripts/build_aggregates.py --date 2026-08-01
  python scripts/build_aggregates.py --date 2026-08-01 --dry-run
"""
from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PB = ROOT / "public" / "data" / "petrobangla"
DAILY = PB / "daily"
INDEX = PB / "_index.json"
LIVE_WEEK = PB / "_live_week.json"
TIMELINE = PB / "timeline-summary.json"

LIVE_WEEK_DAYS = 7


def window_label(start: datetime.date, end: datetime.date) -> str:
    if start.month == end.month:
        return f"{start:%d}-{end:%d} {end:%b}, {end:%Y}"
    return f"{start:%d %b} - {end:%d %b}, {end:%Y}"


def index_entry(date: str, doc: dict) -> dict:
    """One `_index.days` row, derived from the day document."""
    report = doc.get("report") or {}
    start_iso = report.get("gas_day_start") or report.get("report_date_start") or date
    end_iso = report.get("gas_day_end") or report.get("report_date_end")
    try:
        start = datetime.date.fromisoformat(start_iso)
        end = datetime.date.fromisoformat(end_iso) if end_iso else start + datetime.timedelta(days=1)
        label = window_label(start, end)
    except (TypeError, ValueError):
        label = report.get("report_date_label") or date

    production = doc.get("production") or {}
    distribution = doc.get("distribution") or {}
    grand = production.get("grand_total") or {}

    return {
        "date": date,
        "date_label": label,
        "json_file": f"{date}.json",
        "field_count": production.get("field_count") or len(production.get("fields") or []),
        "plant_count": distribution.get("plant_count") or 0,
        "grand_total_gas_mmcfd": grand.get("gas_mmcfd"),
        "parse_status": (doc.get("meta") or {}).get("parse_status", "ok"),
        "agent_summary": (doc.get("meta") or {}).get("agent_summary", ""),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="the archive day just written, ISO")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    day_path = DAILY / f"{args.date}.json"
    if not day_path.exists():
        print(json.dumps({"ok": False, "error": f"No archive file at {day_path}"}))
        return

    doc = json.loads(day_path.read_text(encoding="utf-8"))
    entry = index_entry(args.date, doc)

    # --- _index.json : upsert one day ------------------------------------
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    days = [d for d in index.get("days", []) if d.get("date") != args.date]
    existed = len(days) != len(index.get("days", []))

    # Drop entries whose day file no longer exists. Without this a withdrawn day
    # stays in the catalogue pointing at a deleted file, and the live-week bundle
    # silently comes up short because one of its seven days cannot be loaded.
    before = len(days)
    days = [d for d in days if (DAILY / f"{d.get('date')}.json").exists()]
    pruned = before - len(days)

    days.append(entry)
    days.sort(key=lambda d: d["date"])
    index["days"] = days
    index["total_days"] = len(days)
    index["generated_at"] = datetime.datetime.now().isoformat(timespec="seconds")

    # --- _live_week.json : last N days, bundled whole ---------------------
    recent = [d["date"] for d in days][-LIVE_WEEK_DAYS:]
    week_days = []
    week_entries = []
    for d in recent:
        p = DAILY / f"{d}.json"
        if not p.exists():
            continue
        week_days.append(json.loads(p.read_text(encoding="utf-8")))
        match = next((e for e in days if e["date"] == d), None)
        if match:
            week_entries.append(match)

    latest = week_entries[-1] if week_entries else None
    live_week = {
        "generated_at": index["generated_at"],
        "live_week_count": len(week_days),
        "latest_date": latest["date"] if latest else None,
        "latest_label": latest["date_label"] if latest else None,
        "index_entries": week_entries,
        "days": week_days,
    }

    if args.dry_run:
        print(json.dumps({
            "ok": True,
            "dryRun": True,
            "indexAction": "updated" if existed else "added",
            "indexDays": len(days),
            "liveWeekDays": len(week_days),
            "latest": live_week["latest_date"],
        }))
        return

    INDEX.write_text(json.dumps(index, indent=2), encoding="utf-8")
    LIVE_WEEK.write_text(json.dumps(live_week, indent=2), encoding="utf-8")

    # --- timeline-summary.json : full rebuild -----------------------------
    proc = subprocess.run(
        [sys.executable, str(Path(__file__).parent / "build_petrobangla_timeline.py")],
        capture_output=True,
        text=True,
        timeout=600,
    )
    if proc.returncode != 0:
        print(json.dumps({"ok": False, "error": f"Timeline rebuild failed: {proc.stderr[-300:]}"}))
        return

    timeline = json.loads(TIMELINE.read_text(encoding="utf-8"))

    print(json.dumps({
        "ok": True,
        "indexAction": "updated" if existed else "added",
        "indexDays": index["total_days"],
        "prunedMissing": pruned,
        "liveWeekDays": live_week["live_week_count"],
        "latest": live_week["latest_date"],
        "latestLabel": live_week["latest_label"],
        "timelineDays": timeline.get("total_days"),
        "timelineOkDays": timeline.get("ok_days"),
    }))


if __name__ == "__main__":
    main()
