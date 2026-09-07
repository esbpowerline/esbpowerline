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
  7. forward forecast     — the same projection for the day still RUNNING, which
                            the archive cannot supply until tomorrow. Only when
                            this energy day + 1 is today in Dhaka
  8. archive fallback     — the bundled last-resort copy
  9. available dates      — the date list the picker and middleware read
 10. gas timeline         — only when the gas archive gained a day; the National
                            Timeline card and the reserve model both read it
 11. reserve model        — same gate as the timeline; rebuilds the depletion
                            model, its sensitivity artifact, then runs the
                            36-check validator (which fails if the two artifacts
                            were built on different archive dates)
 12. publish              — writes the DataRelease rows the live site reads

Three failure modes this chain used to have, all of which reported success:

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
  * Never publishing the forward forecast at all. Nothing ran
    build_forward_forecast.py, so public/data/forecast/ held two files a
    fortnight apart and the "Today against Forecast" card rendered nothing
    from 2026-08-25 to 08-28 — silently, because the card declines to draw
    half a comparison. Step 7 now runs it as part of the daily routine.

Usage:
    python scripts/run_daily_ingest.py --date 2026-08-19
    python scripts/run_daily_ingest.py --date 2026-08-19 --json
    python scripts/run_daily_ingest.py --date 2026-08-19 --no-publish
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
PUBLIC = ROOT / "public" / "data"
# The energy-day → workbook map the curve and plants builders resolve through.
# `ESB_SOURCE_INDEX` moves it off scratch/ on the Actions runner, where it is
# carried between polls in the cache next to the archive it points into.
SOURCE_INDEX = Path(os.environ.get("ESB_SOURCE_INDEX", str(ROOT / "scratch" / "backfill-source-index.json")))

# The local PGCB archive. `ESB_PGCB_ARCHIVE` names it on a machine that is not
# Hamim's Windows box — the GitHub Actions runner that ingests four times a day
# keeps its copy under the workspace and restores it from the Actions cache
# (2026-09-03). The Windows paths stay as the fallback for the desktop.
_env_archive = os.environ.get("ESB_PGCB_ARCHIVE")
PGCB_SOURCE_DIRS = (
    [Path(_env_archive)]
    if _env_archive
    else [
        Path(r"W:\Grid-Explorer\PGCB\Daily Reports - D"),
        Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
    ]
)
# Where the extractor drops the workbook it has just downloaded. That is a
# working directory, not a store: it is keyed by energy day rather than by
# PGCB's report name, and nothing downstream looks in it. A day collected on a
# machine with no reachable store therefore has its workbook on disk and still
# builds no curve and no plants — see ensure_source_workbook. Follows the
# extractor's own `ESB_DAILY_REPORTS_ROOT` (daily_extractor/config.py).
EXTRACTOR_DROP = Path(
    os.environ.get("ESB_DAILY_REPORTS_ROOT", str(Path.home() / "Desktop" / "Daily Reports"))
)


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
            env={**os.environ, "PYTHONUTF8": "1"},
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


# Dhaka is UTC+6 year-round, the same assumption build_forward_forecast makes.
DHAKA = timezone(timedelta(hours=6))


def run_forward_forecast(day: date) -> dict:
    """Publish PGCB's projection for the day this ingest's workbook was filed on.

    The archive anchors a forecast to the day it DESCRIBES, so the projection
    for a day only reaches the site once that day is itself archived — by which
    time the live hours it should have been read against are gone. The forward
    half is written out separately for that reason, and nothing was running it:
    `public/data/forecast/` held two files a fortnight apart, so the Grid
    Explorer's "Today against Forecast" card rendered nothing at all from
    2026-08-25 to 08-28 and said nothing about it.

    The target is this energy day + 1 — the day the workbook we just ingested
    was filed on, which is where its Forecast sheet's projection belongs. That
    is only worth publishing while it is still today: a backfill of an old day
    must not write a "forward" forecast for a day that has long since settled,
    and the archive already carries that day's forecast anyway.

    Exit 1 means PGCB has not filed that morning's workbook yet, which is the
    ordinary state of an ingest run before ~09:00 Dhaka. That is a skip, not a
    failure. Exit 2 — the workbook disagreeing about which day it is — is real.
    """
    target = day + timedelta(days=1)
    today = datetime.now(DHAKA).date()
    if target != today:
        return {
            "step": "forward forecast",
            "ok": True,
            "seconds": 0,
            "detail": (
                f"skipped — {target} is not today in Dhaka ({today}); the forward "
                "forecast is only for the day still running"
            ),
        }

    started = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS / "build_forward_forecast.py")],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=900,
            env={**os.environ, "PYTHONUTF8": "1"},
        )
    except Exception as e:  # noqa: BLE001
        return {"step": "forward forecast", "ok": False,
                "seconds": round(time.time() - started, 1), "detail": str(e)}

    out = (proc.stdout or "").strip().splitlines()
    err = (proc.stderr or "").strip().splitlines()
    tail = out[-1] if out else (err[-1] if err else "")
    if proc.returncode == 1:
        return {
            "step": "forward forecast",
            "ok": True,
            "seconds": round(time.time() - started, 1),
            "detail": f"nothing to write yet — {tail}",
        }
    return {
        "step": "forward forecast",
        "ok": proc.returncode == 0,
        "seconds": round(time.time() - started, 1),
        "detail": tail,
    }


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
            env={**os.environ, "PYTHONUTF8": "1"},
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
        say(f"[1/12] collecting {iso} …")
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

    # Did the extractor publish a gas window for a day PGCB has not filed?
    #
    # Computed HERE, before the workbook lookup below, and not later where it
    # reads more naturally. `ensure_source_workbook` reports a missing workbook
    # as a failed step, which is right on an ordinary day and wrong on this one:
    # PGCB not having filed yet is the premise of a gas-only run, not a fault in
    # it, and recording it as a failure would make every gas-only day report as
    # broken and count against the Pi's consecutive-failure alert.
    #
    # The gas half is NOT looked for under `iso`. Since 2026-09-07 a gas window
    # is filed under the day the document itself states, which is not always the
    # day that was asked for — Petrobangla skipped a filing slot and the report
    # served under 07.09.26 turned out to be the 05->06 Sep window. So the
    # extractor's own verdict is the discriminator, and the artifact check is
    # kept only as the corroborating case where the two do agree.
    extractor_step = next((s for s in steps if s["step"] == "extractor"), None)
    extractor_said = str((extractor_step or {}).get("detail", ""))
    said_gas_only = extractor_said.startswith("GAS ONLY")
    gas_only = not (PUBLIC / "daily" / f"{iso}.json").exists() and (
        said_gas_only or (PUBLIC / "petrobangla" / "daily" / f"{iso}.json").exists()
    )

    # The day the gas was actually FILED under, which is not always the day this
    # run was asked for. A gas window is keyed by the window the document states
    # (export.deploy_petrobangla), and on 2026-09-07 the document fetched for
    # energy day 2026-09-06 turned out to be the 05->06 Sep window and was
    # correctly filed as 2026-09-05. Reading the extractor's own line is how the
    # rest of the chain follows it: the first run after that fix wrote the day
    # to disk and then published nothing, because the timeline, the reserve
    # model and the release step were all still looking under 2026-09-06.
    gas_iso = iso
    if said_gas_only:
        m = re.search(r"published the (\d{4}-\d{2}-\d{2}) gas window", extractor_said)
        if m:
            gas_iso = m.group(1)
            if gas_iso != iso:
                say(f"      gas filed under {gas_iso}, not the requested {iso}")

    # Two workbooks matter, not one. The day's own workbook feeds the curve and
    # the station detail; the one PGCB filed the morning OF this day — that is
    # the previous energy day's report — carries the forecast this day is
    # measured against, and the per-station forecast with it.
    # On a runner the archive starts empty and the source index does not exist,
    # and index_sources() then walks the (empty) store instead of the cache —
    # so the workbook this run just filed is invisible to the curve and plants
    # builders. An empty index makes ensure_source_workbook register it.
    if os.environ.get("ESB_PGCB_ARCHIVE") and not SOURCE_INDEX.exists():
        SOURCE_INDEX.parent.mkdir(parents=True, exist_ok=True)
        SOURCE_INDEX.write_text("{}", encoding="utf-8")

    if not gas_only:
        held, problem = ensure_source_workbook(day)
        if held:
            say(f"      source workbook: {held}")
        if problem:
            say(f"      ! {problem}")
            steps.append({"step": "source workbook", "ok": False, "seconds": 0.0, "detail": problem})
        prior, _ = ensure_source_workbook(day - timedelta(days=1))
        if prior:
            say(f"      forecast issued in: {prior}")

    # PGCB has not filed this energy day, but Petrobangla had filed the gas
    # window that opens on it, and the extractor published that window alone.
    #
    # Steps 2..9 every one of them read the day's PGCB workbook — the curve, the
    # station detail, the forecast, the archive fallback, the date index. With
    # no workbook they would either fail or, worse, exit 0 having written
    # nothing, which is the exact shape `gate()` exists to catch. Skipping them
    # by name records honestly that they did not run and why, rather than
    # reporting eight green steps that did nothing.
    #
    # They are not lost. When PGCB files the day, the trailing window brings it
    # back through this chain and every one of these runs then, with the gas
    # already on disk.
    if gas_only:
        say("gas only — PGCB has not filed this day; skipping the grid steps")
        for name in ("energy curve", "split curve", "border imports", "plants",
                     "forecast", "forward forecast", "archive fallback", "available dates"):
            steps.append({
                "step": name,
                "ok": True,
                "seconds": 0.0,
                "detail": "skipped — PGCB has not filed this day; only the gas window was published",
            })
    else:
        say("[2/12] energy curve …")
        # Both builders are told which index to read so they resolve the workbook
        # this run just registered, wherever SOURCE_INDEX lives.
        steps.append(run("energy curve", [str(SCRIPTS / "backfill_energy_curve.py"), "--apply", "--from", iso,
                                          "--index-cache", str(SOURCE_INDEX)]))

        say("[3/12] split curve …")
        steps.append(run("split curve", [str(SCRIPTS / "split_energy_curve.py"), "--apply"]))
        # Both curve steps exit 0 with nothing to do when no source workbook was
        # found, which is how days have shipped with no fuel curve under a clean
        # run. The file is the only honest test of the step.
        gate(steps, PUBLIC / "curves" / f"{iso}.json", "split curve",
             "no curve written — the day's source workbook was not readable")

        # After the curve, not before it: Nepal is the fourth interconnector and it
        # is derived from the curve stack, so running this first finds nothing.
        say("[4/12] border imports (Nepal) …")
        steps.append(run("border imports", [str(SCRIPTS / "backfill_border_imports.py"), "--apply", "--from", iso]))

        say("[5/12] per-station detail …")
        steps.append(run("plants", [str(SCRIPTS / "build_daily_plants.py"), "--apply", "--only", iso,
                                    "--index-cache", str(SOURCE_INDEX)]))
        gate(steps, PUBLIC / "plants" / f"{iso}.json", "plants",
             "no station detail written — the day's source workbook was not readable")

        # Anchors each held workbook's projection onto the day it DESCRIBES, so this
        # fills the day's `forecast` key from the report filed that morning. Without
        # it the archive keeps only what happened, never what was expected.
        say("[6/12] forecast …")
        steps.append(run("forecast", [str(SCRIPTS / "extract_forecasts.py"), "--apply"]))

        # The forward half of the same projection, for the day still running.
        say("[7/12] forward forecast …")
        steps.append(run_forward_forecast(day))

        say("[8/12] archive fallback …")
        steps.append(run("archive fallback", [str(SCRIPTS / "rebuild_archive_fallback.py"), "--apply"]))

        say("[9/12] available dates …")
        steps.append(run("available dates", [str(SCRIPTS / "sync_available_dates.py"), "--apply"]))

    # The gas archive only gains a day when Petrobangla has published the window
    # that opens on this energy day — it files that under the NEXT morning, so
    # the newest day routinely has no gas and the timeline needs no rebuild.
    gas_day = PUBLIC / "petrobangla" / "daily" / f"{gas_iso}.json"
    if gas_day.exists():
        say("[10/12] gas timeline …")
        steps.append(run("gas timeline", [str(SCRIPTS / "build_petrobangla_timeline.py")], timeout=900))

        # The Gas Reserve Depletion panel reads reserve-model.json; without this
        # rebuild its "as of" and remaining balance sit at whatever day the model
        # was last built for. The sensitivity artifact must be rebuilt with it —
        # the validator pins both to the same archive date and fails otherwise.
        say("[11/12] reserve model …")
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
        say("[12/12] publish …")
        # Publish the day that was written. On a gas-only run keyed to a
        # different window that is `gas_iso`; on every ordinary day the two are
        # the same string.
        steps.append(publish_releases(gas_iso if gas_only else iso, aggregates=gas_day.exists()))

    return finish(
        iso,
        steps,
        args.json,
        note=(f"gas only — PGCB has not filed this day; the {gas_iso} gas window is "
              "published and the grid half waits") if gas_only else None,
        gas_iso=gas_iso,
    )


def artifacts_for(iso: str, gas_iso: str | None = None) -> dict:
    """What the day actually has on disk once the chain has run.

    `gas_iso` is separate because a gas window is filed under the window the
    document states, which is not always the day the run was asked for. Passing
    the requested day for both would report `gas: false` on a run whose entire
    output was a correctly filed gas day.
    """
    return {
        "grid": (PUBLIC / "daily" / f"{iso}.json").exists(),
        "curve": (PUBLIC / "curves" / f"{iso}.json").exists(),
        "plants": (PUBLIC / "plants" / f"{iso}.json").exists(),
        "gas": (PUBLIC / "petrobangla" / "daily" / f"{gas_iso or iso}.json").exists(),
    }


def finish(iso: str, steps: list[dict], as_json: bool, note: str | None = None,
           gas_iso: str | None = None) -> int:
    failed = [s for s in steps if not s["ok"]]
    result = {
        "ok": not failed,
        "date": iso,
        "steps": steps,
        "artifacts": artifacts_for(iso, gas_iso),
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
