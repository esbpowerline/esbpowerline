"""Deploy GridDailyData + PetrobanglaDaily to esbpowerline public/data."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path
from typing import Any

from .config import (
    AVAILABLE_DATES,
    BUILD_PETROBANGLA_TIMELINE,
    GRID_DAILY_OUT,
    PETROBANGLA_INDEX_STAGING,
    PETROBANGLA_JSON_STAGING,
    PETROBANGLA_PUBLIC,
    PETROBANGLA_PUBLIC_ROOT,
    ROOT,
    SYNC_PETROBANGLA,
)


def build_agent_bundle(
    energy: date,
    grid_data: dict,
    petrobangla_data: dict | None,
    verification: dict,
    sources: dict[str, str],
    grid_validation: dict,
    petrobangla_validation: dict,
) -> dict[str, Any]:
    iso = energy.isoformat()
    return {
        "$schema": "esb-daily-ingest/v1",
        "scope": "PGCB Pipeline A + Petrobangla Pipeline B only (matches esbpowerline codebase)",
        "energy_day": iso,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "verification": verification,
        "validation": {
            "pipeline_a": grid_validation,
            "pipeline_b": petrobangla_validation,
        },
        "sources": sources,
        "pipeline_a": {
            "description": "GridDailyData — PowerGridExplorer, home snapshot, member export",
            "target_path": f"public/data/daily/{iso}.json",
            "typescript_type": "GridDailyData",
            "loader": "lib/data/grid/daily-loader.client.ts",
            "data": grid_data,
        },
        "pipeline_b": {
            "description": "PetrobanglaDaily — Gas tab archive, Field Evidence, live week",
            "target_path": f"public/data/petrobangla/daily/{iso}.json",
            "typescript_type": "PetrobanglaDaily",
            "loader": "lib/data/petrobangla/loadArchive.ts",
            "data": petrobangla_data,
        },
        "post_steps_completed_by_deploy": [
            f"public/data/daily/{iso}.json",
            f"lib/available-dates.json append {iso}",
            "public/data/petrobangla/daily/ (when Pipeline B ok)",
            "scripts/sync_petrobangla_live.py",
            "scripts/build_petrobangla_timeline.py",
        ],
        "paste_hint": (
            f"One-click: copy pipeline_a.data into public/data/daily/{iso}.json "
            "or run with --deploy."
        ),
    }


def update_available_dates(iso: str) -> None:
    dates: list[str] = []
    if AVAILABLE_DATES.exists():
        dates = json.loads(AVAILABLE_DATES.read_text(encoding="utf-8"))
    if iso not in dates:
        dates.append(iso)
        dates.sort()
        write_json_atomic(AVAILABLE_DATES, dates)


def write_json_atomic(path: Path, data: Any, *, indent: int = 2, ensure_ascii: bool = False) -> None:
    """Serialise, then replace the file in one step. Never leave a torn one.

    `Path.write_text` truncates the target and then writes into it, so a power
    cut, a full disk or a killed process in between leaves a published file that
    is empty or half a document. That is not hypothetical here:
    `public/data/petrobangla/daily/2026-09-15.json` was committed at **zero
    bytes** (33bd6124f) and every `build_reserve_model.py` run since died on it
    with `json.loads: Expecting value: line 1 column 1` — which marked the 16th
    and 17th as failed days and froze the gas reserve model, while the site
    itself stayed correct because the DataRelease row still carried the day.

    Two guarantees, and both matter:

    * **Serialise before touching the target.** If `json.dumps` raises, the file
      on disk is the previous good one, untouched.
    * **Refuse to write nothing.** An empty or whitespace-only document is never
      a day; it is a failure that has not reported itself yet. CLAUDE.md's rule
      is that a step which wrote nothing must fail rather than claim success, and
      an empty file is the silent version of exactly that.

    The replace is atomic on POSIX and on Windows (`os.replace`), so a reader —
    or the next poll's `git status` — sees either the old file or the new one.
    `fsync` before the swap so the bytes are on the platter, not just in the page
    cache, which is what a power cut takes away.
    """
    text = json.dumps(data, indent=indent, ensure_ascii=ensure_ascii)
    if not text.strip() or text.strip() in ("{}", "[]", "null"):
        raise ValueError(f"refusing to write an empty document to {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def update_petrobangla_index(payload: dict, json_name: str, index_path: Path) -> None:
    """Append or replace one day in a petrobangla `_index.json`.

    Called for the staging copy and for the published one. Updating only staging
    left the public index behind the archive it indexes — 2026-08-17 shipped as a
    file the index never named, so the Gas tab's day list stopped a day short of
    the data.
    """
    report = payload.get("report", {})
    meta = payload.get("meta", {})
    production = payload.get("production", {})
    distribution = payload.get("distribution", {})
    iso_date = json_name.replace(".json", "")
    entry = {
        "date": iso_date,
        "date_label": report.get("report_date_label"),
        "json_file": json_name,
        "field_count": production.get("field_count"),
        "plant_count": distribution.get("plant_count"),
        "grand_total_gas_mmcfd": (production.get("grand_total") or {}).get("gas_mmcfd"),
        "parse_status": meta.get("parse_status"),
        "agent_summary": meta.get("agent_summary"),
    }
    if not entry["date"]:
        return

    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index = {"schema": "petrobangla-backlog-index/v1", "generated_at": "", "total_days": 0, "days": []}

    days = [d for d in index.get("days", []) if d.get("date") != entry["date"]]
    days.append(entry)
    days.sort(key=lambda d: d.get("date") or "")
    # Re-running a day that is already indexed identically must not rewrite
    # the file: the only difference would be `generated_at`, and the Pi's poll
    # committed, pushed and republished that stamp four times a day
    # (2026-09-03). A stamp is not a change.
    if days == index.get("days", []) and index.get("total_days") == len(days):
        return
    index["days"] = days
    index["total_days"] = len(days)
    index["generated_at"] = datetime.now().isoformat(timespec="seconds")
    write_json_atomic(index_path, index)


def deploy(
    energy: date,
    grid_data: dict,
    petrobangla_data: dict | None,
    *,
    update_index: bool = True,
    run_sync: bool = True,
) -> dict[str, Path | str]:
    iso = energy.isoformat()
    written: dict[str, Path | str] = {}

    grid_path = GRID_DAILY_OUT / f"{iso}.json"
    write_json_atomic(grid_path, grid_data)
    written["pipeline_a"] = grid_path

    if update_index:
        update_available_dates(iso)
        written["available_dates"] = AVAILABLE_DATES

    written.update(deploy_petrobangla(energy, petrobangla_data, run_sync=run_sync))
    return written


def _stated_window_iso(value: object) -> str | None:
    """`value` as an ISO date string, or None if it is not one."""
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        return None


def deploy_petrobangla(
    energy: date,
    petrobangla_data: dict | None,
    *,
    run_sync: bool = True,
) -> dict[str, Path | str]:
    """Publish the gas half of a day, with no reference to the grid half.

    Split out of `deploy()` on 2026-09-07 so a gas window can be published
    without a PGCB workbook. Petrobangla and PGCB file on their own schedules
    and neither waits for the other: on that date Petrobangla was serving the
    window filed 07.09.26 (energy day 2026-09-06) while PGCB had not filed the
    6th at all, and nothing in the chain could take the gas until it did.

    This is the same code `deploy()` has always run — called from one place, so
    the gas-only path cannot drift from the full one. It writes the staging
    copy, the public copy and BOTH indexes, then rebuilds the live week and the
    timeline, exactly as before.
    """
    written: dict[str, Path | str] = {}
    if not petrobangla_data:
        return written
    if petrobangla_data.get("meta", {}).get("parse_status") not in ("ok", "partial"):
        return written

    # Keyed by the window the DOCUMENT states, not the day the caller asked for.
    #
    # The two are the same on an ordinary day. They came apart on 2026-09-07:
    # Petrobangla skipped its 06.09.26 slot, the report served under 07.09.26
    # was the 05->06 Sep window, and the listing-key-minus-one rule asked for
    # energy day 2026-09-06. Keying on the request filed that window as a day it
    # does not cover and labelled it "06-07 Sep, 2026" — a window nobody
    # published. The parser now reads the header and reports the real window;
    # this is what makes the file, the index entry and the citation follow it.
    report = petrobangla_data.get("report", {})
    # Parsed as a date, not measured. `len(stated) == 10` was the first version
    # of this check and it validates nothing that matters: "../../../x" is
    # exactly ten characters, and this value becomes a filename joined onto both
    # the staging and the public directory. Nothing reaches here with a hostile
    # payload today — the parser writes `ed.isoformat()` — but a length check
    # that reads as validation and is not one is how that stops being true
    # quietly. `date.fromisoformat` accepts exactly the shape we want and
    # rejects every path separator.
    iso = _stated_window_iso(report.get("report_date_start")) or energy.isoformat()
    if iso != energy.isoformat():
        print(f"  gas window: document states {iso}, not the requested {energy.isoformat()} — filing under {iso}")
    json_name = f"{iso}.json"
    staging_path = PETROBANGLA_JSON_STAGING / json_name
    write_json_atomic(staging_path, petrobangla_data)
    update_petrobangla_index(petrobangla_data, json_name, PETROBANGLA_INDEX_STAGING)

    pb_path = PETROBANGLA_PUBLIC / json_name
    write_json_atomic(pb_path, petrobangla_data)
    update_petrobangla_index(petrobangla_data, json_name, PETROBANGLA_PUBLIC_ROOT / "_index.json")
    written["pipeline_b"] = pb_path

    if run_sync:
        for script, key in (
            (SYNC_PETROBANGLA, "sync_petrobangla_live"),
            (BUILD_PETROBANGLA_TIMELINE, "build_petrobangla_timeline"),
        ):
            if script.exists():
                subprocess.run([sys.executable, str(script)], cwd=str(ROOT), check=True)
                written[key] = str(script)

    return written