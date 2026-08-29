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
     source workbooks     — file and index the day's workbook, and the previous
                            day's, which is where this day's forecast is stated
  2. energy curve         — must precede the border backfill, which reads curves/
  3. split curve          — moves the curve out of the day file into curves/
  4. border imports       — the extractor emits three interconnectors; Nepal is
                            the fourth and comes from the curve stack
  5. plants               — per-station detail, keyed off the source workbook
  6. forecast             — PGCB's projection for the day, from the report filed
                            that morning; anchored onto the day it describes
  7. archive fallback     — the bundled last-resort copy
  8. available dates      — the date list the picker and middleware read
  9. gas timeline         — only when the gas archive gained a day; the National
                            Timeline card and the reserve model both read it
 10. reserve model        — same gate as the timeline; rebuilds the depletion
                            model, its sensitivity artifact, then runs the
                            36-check validator (which fails if the two artifacts
                            were built on different archive dates)
 11. publish              — writes the DataRelease rows the live site reads

Two failure modes this chain used to have, both of which reported success:

  * Steps that exit 0 having written nothing. The curve and plants builders
    treat a missing source workbook as "nothing to do", so a day could ship
    with no fuel curve, no station detail and no Nepal row under an all-green
    run. Those steps are now gated on the file they exist to write.
  * Rebuilding the files but never publishing them. The site consults the
    release manifest before the filesystem, so any key that has ever been
    published keeps serving its DataRelease row no matter what the file says.
    That is how the National Timeline and the rolling week sat four days
    behind an archive that was fully up to date. Pass --no-publish to rebuild
    without touching the releases.

Usage:
    python scripts/run_daily_ingest.py --date 2026-08-19
    python scripts/run_daily_ingest.py --date 2026-08-19 --json
    python scripts/run_daily_ingest.py --date 2026-08-19 --no-publish
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
    Path(r"W:\Grid-Explorer\PGCB\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
]
# Where the extractor drops the workbook it has just downloaded. That is a
# working directory, not a store: it is keyed by energy day rather than by
# PGCB's report name, and nothing downstream looks in it. A day collected on a
# machine with no reachable store therefore has its workbook on disk and still
# builds no curve and no plants — see ensure_source_workbook.
EXTRACTOR_DROP = Path.home() / "Desktop" / "Daily Reports"


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


def gate(steps: list[dict], artifact: Path, step: str, why: str) -> None:
    """Fail a step that exited 0 without producing the file it exists to write.

    Several builders treat "no input" as nothing to do rather than as an error,
    so a clean run is not evidence of a complete day. Checking the artifact is
    what makes "the ingest ran" and "the day is complete" the same statement.
    """
    if artifact.exists():
        return
    for s in reversed(steps):
        if s["step"] == step:
            s["ok"] = False
            s["detail"] = why
            return
    steps.append({"step": step, "ok": False, "seconds": 0.0, "detail": why})


def canonical_stem(day: date) -> str:
    """PGCB's own report name for an energy day — publication-dated, so day + 1."""
    filed = day + timedelta(days=1)
    return f"Daily Report {filed.day:02d}-{filed.month:02d}-{filed.year}"


def confirms_energy_day(workbook: Path, day: date) -> bool:
    """Does this workbook state the energy day we are about to index it as?

    Indexing the wrong file is worse than indexing nothing: the curve and plants
    builders trust the map, so an off-by-one id would publish another day's
    stations under this date and nothing downstream would notice. The workbook
    names its own day, so ask it rather than trusting the ERP id or the filename.
    """
    try:
        sys.path.insert(0, str(SCRIPTS))
        from backfill_daily_extremes import read_source, workbook_energy_day  # noqa: PLC0415

        return workbook_energy_day(read_source(workbook)) == day.isoformat()
    except Exception:  # noqa: BLE001
        return False


def file_from_extractor_drop(day: date) -> Path | None:
    """Copy the workbook the extractor downloaded into a real source store.

    Both entries in PGCB_SOURCE_DIRS are absent on some machines — W: is not
    always mounted, and the local archive is not created by anything — and then
    every step of this chain still reports success while the curve and plants
    builders quietly publish nothing, because they resolve their input through
    the source index and the index has no entry to give them. The workbook is
    right there in the extractor's own output directory, so file it under the
    name PGCB gives it and the two builders find it like any other day.
    """
    drop = EXTRACTOR_DROP / f"Daily Report {day.isoformat()}" / "PGCB"
    if not drop.is_dir():
        return None
    books = sorted(b for ext in ("*.xlsx", "*.xlsm", "*.xls") for b in drop.glob(ext))
    book = next((b for b in books if confirms_energy_day(b, day)), None)
    if book is None:
        return None

    store = next((d for d in PGCB_SOURCE_DIRS if d.is_dir()), None)
    if store is None:
        # Nothing reachable to file into. The last entry is the local archive,
        # which is this machine's store whether or not it has been created yet.
        store = PGCB_SOURCE_DIRS[-1]
        try:
            store.mkdir(parents=True, exist_ok=True)
        except Exception:  # noqa: BLE001
            return None

    dest = store / f"{canonical_stem(day)}{book.suffix}"
    if not dest.exists():
        import shutil  # noqa: PLC0415

        try:
            shutil.copy2(book, dest)
        except Exception:  # noqa: BLE001
            return None
    return dest


def ensure_source_workbook(day: date) -> tuple[str | None, str | None]:
    """Make sure the day's workbook is held AND in the source-index cache.

    `index_sources()` only walks the share when the cache file is absent, so a
    day collected today is invisible to the curve and plants builders until the
    cache is rebuilt — and rebuilding it means reading ~2,400 workbooks over the
    network. Adding the one new entry is enough, and when no store holds the
    workbook at all the extractor's copy is filed first.

    Returns (path, problem): at most one is set.
    """
    iso = day.isoformat()
    index: dict[str, str] = {}
    if SOURCE_INDEX.exists():
        try:
            index = json.loads(SOURCE_INDEX.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            index = {}
        if iso in index and Path(index[iso]).exists():
            return index[iso], None

    held: Path | None = None
    stem = canonical_stem(day)
    for root in PGCB_SOURCE_DIRS:
        for ext in (".xlsx", ".xlsm", ".xls"):
            candidate = root / f"{stem}{ext}"
            if candidate.exists():
                held = candidate
                break
        if held:
            break
    if held is None:
        held = file_from_extractor_drop(day)
    if held is None:
        return None, (
            f"no source workbook for {iso} in any store, and none in "
            f"{EXTRACTOR_DROP} to file — the curve and plants builders have nothing to read"
        )

    if not SOURCE_INDEX.exists():
        return str(held), None  # No cache: the builders will walk the store themselves.
    index[iso] = str(held)
    SOURCE_INDEX.parent.mkdir(parents=True, exist_ok=True)
    SOURCE_INDEX.write_text(json.dumps(index, indent=2), encoding="utf-8")
    return str(held), None


def publish_releases(iso: str, aggregates: bool) -> dict:
    """Publish what the chain just wrote, so the live site serves it.

    Rebuilding public/data is not publishing. `fetchDataJson` consults the
    release manifest first, so for any key that has ever been published through
    the panel the site serves the DataRelease row and ignores the file on disk.
    The three gas singletons are the ones that bite: GAS_TIMELINE backs the
    National Timeline and GAS_LIVE_WEEK the rolling week, and both had rows —
    so those two cards sat on 2026-08-24 for four days while every file
    underneath them was current.
    """
    started = time.time()
    args = [
        "npx", "tsx", "--conditions", "react-server",
        str(SCRIPTS / "publish-local.ts"), "--date", iso,
    ]
    if not aggregates:
        args.append("--no-aggregates")
    try:
        proc = subprocess.run(
            args,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=900,
            shell=sys.platform == "win32",  # npx is a .cmd on Windows
            env={**__import__("os").environ, "PYTHONUTF8": "1"},
        )
        lines = [ln for ln in (proc.stdout or "").strip().splitlines() if ln.strip()]
        summary = next((ln for ln in reversed(lines) if "published" in ln), "")
        return {
            "step": "publish",
            "ok": proc.returncode == 0,
            "seconds": round(time.time() - started, 1),
            "detail": summary or (proc.stderr or "").strip()[-300:],
        }
    except Exception as e:  # noqa: BLE001
        return {
            "step": "publish",
            "ok": False,
            "seconds": round(time.time() - started, 1),
            "detail": str(e),
        }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="energy day, YYYY-MM-DD")
    ap.add_argument("--json", action="store_true", help="emit JSON only (for the admin panel)")
    ap.add_argument("--skip-extractor", action="store_true", help="the day is already collected")
    ap.add_argument(
        "--no-publish",
        action="store_true",
        help="rebuild the files but do not publish them — the live site keeps serving "
             "whatever releases it already has",
    )
    args = ap.parse_args()

    day = date.fromisoformat(args.date)
    iso = day.isoformat()
    steps: list[dict] = []

    def say(msg: str) -> None:
        if not args.json:
            print(msg)

    if not args.skip_extractor:
        say(f"[1/11] collecting {iso} …")
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

    # Two workbooks matter, not one. The day's own workbook feeds the curve and
    # the station detail; the one PGCB filed the morning OF this day — that is
    # the previous energy day's report — carries the forecast this day is
    # measured against, and the per-station forecast with it.
    held, problem = ensure_source_workbook(day)
    if held:
        say(f"      source workbook: {held}")
    if problem:
        say(f"      ! {problem}")
        steps.append({"step": "source workbook", "ok": False, "seconds": 0.0, "detail": problem})
    prior, _ = ensure_source_workbook(day - timedelta(days=1))
    if prior:
        say(f"      forecast issued in: {prior}")

    say("[2/11] energy curve …")
    steps.append(run("energy curve", [str(SCRIPTS / "backfill_energy_curve.py"), "--apply", "--from", iso]))

    say("[3/11] split curve …")
    steps.append(run("split curve", [str(SCRIPTS / "split_energy_curve.py"), "--apply"]))
    # Both curve steps exit 0 with nothing to do when no source workbook was
    # found, which is how days have shipped with no fuel curve under a clean
    # run. The file is the only honest test of the step.
    gate(steps, PUBLIC / "curves" / f"{iso}.json", "split curve",
         "no curve written — the day's source workbook was not readable")

    # After the curve, not before it: Nepal is the fourth interconnector and it
    # is derived from the curve stack, so running this first finds nothing.
    say("[4/11] border imports (Nepal) …")
    steps.append(run("border imports", [str(SCRIPTS / "backfill_border_imports.py"), "--apply", "--from", iso]))

    say("[5/11] per-station detail …")
    steps.append(run("plants", [str(SCRIPTS / "build_daily_plants.py"), "--apply", "--only", iso]))
    gate(steps, PUBLIC / "plants" / f"{iso}.json", "plants",
         "no station detail written — the day's source workbook was not readable")

    # Anchors each held workbook's projection onto the day it DESCRIBES, so this
    # fills the day's `forecast` key from the report filed that morning. Without
    # it the archive keeps only what happened, never what was expected.
    say("[6/11] forecast …")
    steps.append(run("forecast", [str(SCRIPTS / "extract_forecasts.py"), "--apply"]))

    say("[7/11] archive fallback …")
    steps.append(run("archive fallback", [str(SCRIPTS / "rebuild_archive_fallback.py"), "--apply"]))

    say("[8/11] available dates …")
    steps.append(run("available dates", [str(SCRIPTS / "sync_available_dates.py"), "--apply"]))

    # The gas archive only gains a day when Petrobangla has published the window
    # that opens on this energy day — it files that under the NEXT morning, so
    # the newest day routinely has no gas and the timeline needs no rebuild.
    gas_day = PUBLIC / "petrobangla" / "daily" / f"{iso}.json"
    if gas_day.exists():
        say("[9/11] gas timeline …")
        steps.append(run("gas timeline", [str(SCRIPTS / "build_petrobangla_timeline.py")], timeout=900))

        # The Gas Reserve Depletion panel reads reserve-model.json; without this
        # rebuild its "as of" and remaining balance sit at whatever day the model
        # was last built for. The sensitivity artifact must be rebuilt with it —
        # the validator pins both to the same archive date and fails otherwise.
        say("[10/11] reserve model …")
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

    # Last, and only after every file it would read is final. The gas
    # singletons are republished whenever the gas archive moved, since the
    # National Timeline and the rolling week are served from those rows.
    if args.no_publish:
        steps.append({
            "step": "publish",
            "ok": True,
            "seconds": 0,
            "detail": "skipped (--no-publish) — the live site still serves its existing releases",
        })
    else:
        say("[11/11] publish …")
        steps.append(publish_releases(iso, aggregates=gas_day.exists()))

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
