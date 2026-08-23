"""Run the complete daily ingest for one energy day.

`daily_data_extractor.py` is not the whole ingest. It writes the grid day and,
when the gas PDF exists, the gas day — and stops. Five more steps produce the
rest of what the site reads, and each one of them has been silently skipped at
some point, which is how days shipped with no fuel curve, no Nepal
interconnector, no station detail, or a stale gas timeline.

This runs the chain in the order the steps actually depend on each other and
reports every step, so "the ingest ran" and "the day is complete" stop being
different things.

The order is load-bearing:
  1. extractor            — grid day (+ gas day if Petrobangla has published it)
  2. energy curve         — must precede the border backfill, which reads curves/
  3. split curve          — moves the curve out of the day file into curves/
  4. border imports       — the extractor emits three interconnectors; Nepal is
                            the fourth and comes from the curve stack
  5. plants               — per-station detail, keyed off the source workbook
  6. archive fallback     — the bundled last-resort copy
  7. available dates      — the date list the picker and middleware read
  8. gas timeline         — only when the gas archive gained a day; the National
                            Timeline card and the reserve model both read it
  9. reserve model        — same gate as the timeline; rebuilds the depletion
                            model, its sensitivity artifact, then runs the
                            36-check validator (which fails if the two artifacts
                            were built on different archive dates)

Usage:
    python scripts/run_daily_ingest.py --date 2026-08-19
    python scripts/run_daily_ingest.py --date 2026-08-19 --json
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
PUBLIC = ROOT / "public" / "data"
SOURCE_INDEX = ROOT / "scratch" / "backfill-source-index.json"

PGCB_SOURCE_DIRS = [
    Path(r"W:\PGCB\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
]


def run(name: str, args: list[str], timeout: int = 1800) -> dict:
    """Run one step, capturing its outcome rather than aborting the chain."""
    started = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, *args],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**__import__("os").environ, "PYTHONUTF8": "1"},
        )
        tail = (proc.stdout or "").strip().splitlines()
        return {
            "step": name,
            "ok": proc.returncode == 0,
            "seconds": round(time.time() - started, 1),
            "detail": tail[-1] if tail else (proc.stderr or "").strip()[-300:],
        }
    except subprocess.TimeoutExpired:
        return {"step": name, "ok": False, "seconds": timeout, "detail": "timed out"}
    except Exception as e:  # noqa: BLE001
        return {"step": name, "ok": False, "seconds": round(time.time() - started, 1), "detail": str(e)}


def ensure_source_indexed(day: date) -> str | None:
    """Make sure the day's workbook is in the source-index cache.

    `index_sources()` only walks the share when the cache file is absent, so a
    day collected today is invisible to the curve and plants builders until the
    cache is rebuilt — and rebuilding it means reading ~2,400 workbooks over the
    network. The extractor has already filed the workbook under PGCB's own name,
    so the one new entry can just be added.
    """
    if not SOURCE_INDEX.exists():
        return None  # No cache: the builders will walk the share themselves.

    try:
        index = json.loads(SOURCE_INDEX.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None
    if day.isoformat() in index:
        return None

    filed = day + timedelta(days=1)
    stem = f"Daily Report {filed.day:02d}-{filed.month:02d}-{filed.year}"
    for root in PGCB_SOURCE_DIRS:
        for ext in (".xlsx", ".xlsm", ".xls"):
            candidate = root / f"{stem}{ext}"
            if candidate.exists():
                index[day.isoformat()] = str(candidate)
                SOURCE_INDEX.write_text(json.dumps(index, indent=2), encoding="utf-8")
                return str(candidate)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="energy day, YYYY-MM-DD")
    ap.add_argument("--json", action="store_true", help="emit JSON only (for the admin panel)")
    ap.add_argument("--skip-extractor", action="store_true", help="the day is already collected")
    args = ap.parse_args()

    day = date.fromisoformat(args.date)
    iso = day.isoformat()
    steps: list[dict] = []

    def say(msg: str) -> None:
        if not args.json:
            print(msg)

    if not args.skip_extractor:
        say(f"[1/9] collecting {iso} …")
        steps.append(
            run(
                "extractor",
                [str(SCRIPTS / "daily_data_extractor.py"), "--date", iso,
                 "--skip-google", "--auto-confirm", "--deploy"],
                timeout=2400,
            )
        )
        if not steps[-1]["ok"]:
            # Without the grid day there is nothing for the rest of the chain to
            # enrich; continuing would produce a half-day and report success.
            return finish(iso, steps, args.json, note="collection failed — chain stopped")

    indexed = ensure_source_indexed(day)
    if indexed:
        say(f"      indexed source workbook: {indexed}")

    say("[2/9] energy curve …")
    steps.append(run("energy curve", [str(SCRIPTS / "backfill_energy_curve.py"), "--apply", "--from", iso]))

    say("[3/9] split curve …")
    steps.append(run("split curve", [str(SCRIPTS / "split_energy_curve.py"), "--apply"]))

    say("[4/9] border imports (Nepal) …")
    steps.append(run("border imports", [str(SCRIPTS / "backfill_border_imports.py"), "--apply", "--from", iso]))

    say("[5/9] per-station detail …")
    steps.append(run("plants", [str(SCRIPTS / "build_daily_plants.py"), "--apply", "--only", iso]))

    say("[6/9] archive fallback …")
    steps.append(run("archive fallback", [str(SCRIPTS / "rebuild_archive_fallback.py"), "--apply"]))

    say("[7/9] available dates …")
    steps.append(run("available dates", [str(SCRIPTS / "sync_available_dates.py"), "--apply"]))

    # The gas archive only gains a day when Petrobangla has published the window
    # that opens on this energy day — it files that under the NEXT morning, so
    # the newest day routinely has no gas and the timeline needs no rebuild.
    gas_day = PUBLIC / "petrobangla" / "daily" / f"{iso}.json"
    if gas_day.exists():
        say("[8/9] gas timeline …")
        steps.append(run("gas timeline", [str(SCRIPTS / "build_petrobangla_timeline.py")], timeout=900))

        # The Gas Reserve Depletion panel reads reserve-model.json; without this
        # rebuild its "as of" and remaining balance sit at whatever day the model
        # was last built for. The sensitivity artifact must be rebuilt with it —
        # the validator pins both to the same archive date and fails otherwise.
        say("[9/9] reserve model …")
        steps.append(run("reserve model", [str(SCRIPTS / "build_reserve_model.py"), "--apply"], timeout=900))
        if steps[-1]["ok"]:
            steps.append(
                run(
                    "reserve sensitivity",
                    [str(SCRIPTS / "reserve_sensitivity.py"), "--json",
                     str(PUBLIC / "petrobangla" / "reserve-sensitivity.json")],
                    timeout=900,
                )
            )
            steps.append(run("reserve verify", [str(SCRIPTS / "verify_reserve_model.py")], timeout=300))
    else:
        skip = "skipped — Petrobangla has not published this gas window yet"
        steps.append({"step": "gas timeline", "ok": True, "seconds": 0, "detail": skip})
        steps.append({"step": "reserve model", "ok": True, "seconds": 0, "detail": skip})

    return finish(iso, steps, args.json)


def artifacts_for(iso: str) -> dict:
    """What the day actually has on disk once the chain has run."""
    return {
        "grid": (PUBLIC / "daily" / f"{iso}.json").exists(),
        "curve": (PUBLIC / "curves" / f"{iso}.json").exists(),
        "plants": (PUBLIC / "plants" / f"{iso}.json").exists(),
        "gas": (PUBLIC / "petrobangla" / "daily" / f"{iso}.json").exists(),
    }


def finish(iso: str, steps: list[dict], as_json: bool, note: str | None = None) -> int:
    failed = [s for s in steps if not s["ok"]]
    result = {
        "ok": not failed,
        "date": iso,
        "steps": steps,
        "artifacts": artifacts_for(iso),
        "note": note,
    }

    if as_json:
        print(json.dumps(result))
    else:
        print()
        for s in steps:
            print(f"  {'✓' if s['ok'] else '✗'} {s['step']:<18} {s['seconds']:>6.1f}s  {s['detail'][:90]}")
        arts = result["artifacts"]
        print(
            f"\n  artifacts: grid={'Y' if arts['grid'] else '-'} curve={'Y' if arts['curve'] else '-'} "
            f"plants={'Y' if arts['plants'] else '-'} gas={'Y' if arts['gas'] else '-'}"
        )
        if note:
            print(f"  {note}")
        print(f"\n{'complete' if not failed else f'{len(failed)} step(s) failed'}")

    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
