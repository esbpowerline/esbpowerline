"""Run the daily chain over the last few energy days — the polling entry point.

`run_daily_ingest.py` takes one day. Publishers do not: PGCB files energy day D
on the morning of D+1, Petrobangla files the gas window that opened on D a day
or two later still, and a poll that only looked at yesterday would publish the
grid half and never come back for the gas. So a poll re-runs a short trailing
window every time; the chain is idempotent ("Index already matches", "unchanged
4") and a day that gains its gas window is republished as the release it should
have been (2026-09-01 shipped gasless on the 2nd and filled in on the 3rd).

Exit code: yesterday is *allowed* to be missing — PGCB may simply not have
posted yet, and the next poll will see it. A failure on any older day, or any
failure that is not "collection failed", is a real problem and fails the run so
the scheduler shows red.

    python scripts/ingest_recent_days.py            # D-3 .. D-1, Dhaka time
    python scripts/ingest_recent_days.py --days 5
    python scripts/ingest_recent_days.py --dry-run  # just list the dates
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
DHAKA = timezone(timedelta(hours=6))  # BST, UTC+06:00, no DST — see observation-window.ts


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", type=int, default=3, help="trailing window length, ending yesterday (Dhaka)")
    ap.add_argument("--until", help="last energy day to run (default: yesterday in Dhaka)")
    ap.add_argument("--no-publish", action="store_true", help="write the files but leave the live site alone")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    last = date.fromisoformat(args.until) if args.until else datetime.now(DHAKA).date() - timedelta(days=1)
    days = [last - timedelta(days=i) for i in range(args.days - 1, -1, -1)]  # oldest first: D-1 needs D-2's workbook
    if args.dry_run:
        print("\n".join(d.isoformat() for d in days))
        return 0

    rows: list[dict] = []
    for day in days:
        cmd = [sys.executable, str(SCRIPTS / "run_daily_ingest.py"), "--date", day.isoformat(), "--json"]
        if args.no_publish:
            cmd.append("--no-publish")
        print(f"\n=== {day.isoformat()} ===", flush=True)
        proc = subprocess.run(cmd, text=True, capture_output=True, encoding="utf-8", errors="replace")
        report = _last_json(proc.stdout)
        if report is None:
            # The chain prints one JSON document last; anything else is a crash.
            print(proc.stdout[-4000:], proc.stderr[-4000:], sep="\n", flush=True)
            rows.append({"day": day, "ok": False, "note": f"chain crashed (exit {proc.returncode})", "artifacts": {}})
            continue
        for step in report.get("steps", []):
            mark = "ok " if step.get("ok") else "!! "
            print(f"  {mark}{step['step']:<20} {str(step.get('detail', ''))[:110]}", flush=True)
        rows.append({
            "day": day,
            "ok": bool(report.get("ok")),
            "note": report.get("note") or "",
            "artifacts": report.get("artifacts") or {},
        })

    failed_real = []
    for row in rows:
        if row["ok"]:
            continue
        # Yesterday not posted yet is the expected state for the early polls.
        if row["day"] == last and "collection failed" in row["note"]:
            row["note"] = "not published yet — will retry next poll"
            continue
        failed_real.append(row)

    summary = _summary(rows)
    print("\n" + summary, flush=True)
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        Path(step_summary).open("a", encoding="utf-8").write(summary + "\n")
    return 1 if failed_real else 0


def _last_json(out: str) -> dict | None:
    start = out.rfind("\n{")
    if start < 0:
        start = 0 if out.startswith("{") else -1
    if start < 0:
        return None
    try:
        return json.loads(out[start:])
    except json.JSONDecodeError:
        return None


def _summary(rows: list[dict]) -> str:
    lines = ["| energy day | grid | curve | plants | gas | result |", "|---|---|---|---|---|---|"]
    for r in rows:
        a = r["artifacts"]
        cell = lambda k: "✓" if a.get(k) else "–"  # noqa: E731
        result = "published" if r["ok"] else r["note"] or "failed"
        lines.append(f"| {r['day'].isoformat()} | {cell('grid')} | {cell('curve')} | {cell('plants')} | {cell('gas')} | {result} |")
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
