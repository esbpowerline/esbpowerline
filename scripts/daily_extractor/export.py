"""Deploy GridDailyData + PetrobanglaDaily to esbpowerline public/data."""
from __future__ import annotations

import json
import subprocess
import sys
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
        AVAILABLE_DATES.parent.mkdir(parents=True, exist_ok=True)
        AVAILABLE_DATES.write_text(json.dumps(dates, indent=2), encoding="utf-8")


def update_petrobangla_staging_index(payload: dict, json_name: str) -> None:
    """Append or replace one day in grid_backlog petrobangla_json/_index.json."""
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

    index_path = PETROBANGLA_INDEX_STAGING
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        index = {"schema": "petrobangla-backlog-index/v1", "generated_at": "", "total_days": 0, "days": []}

    days = [d for d in index.get("days", []) if d.get("date") != entry["date"]]
    days.append(entry)
    days.sort(key=lambda d: d.get("date") or "")
    index["days"] = days
    index["total_days"] = len(days)
    index["generated_at"] = datetime.now().isoformat(timespec="seconds")
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


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

    GRID_DAILY_OUT.mkdir(parents=True, exist_ok=True)
    grid_path = GRID_DAILY_OUT / f"{iso}.json"
    grid_path.write_text(json.dumps(grid_data, indent=2), encoding="utf-8")
    written["pipeline_a"] = grid_path

    if update_index:
        update_available_dates(iso)
        written["available_dates"] = AVAILABLE_DATES

    if petrobangla_data and petrobangla_data.get("meta", {}).get("parse_status") in ("ok", "partial"):
        json_name = f"{iso}.json"
        staging_path = PETROBANGLA_JSON_STAGING / json_name
        staging_path.parent.mkdir(parents=True, exist_ok=True)
        staging_path.write_text(json.dumps(petrobangla_data, indent=2, ensure_ascii=False), encoding="utf-8")
        update_petrobangla_staging_index(petrobangla_data, json_name)

        PETROBANGLA_PUBLIC.mkdir(parents=True, exist_ok=True)
        pb_path = PETROBANGLA_PUBLIC / json_name
        pb_path.write_text(json.dumps(petrobangla_data, indent=2, ensure_ascii=False), encoding="utf-8")
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