"""Parse downloaded reports into GridDailyData + PetrobanglaDaily."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .config import (
    GRID_DAILY_OUT,
    PARSE_GRID,
    PARSE_PETROBANGLA,
    PETROBANGLA_GAS_DISTRIBUTION_COMPANIES,
    PETROBANGLA_GAS_PRODUCTION_COMPANIES,
    PETROBANGLA_JSON_STAGING,
)
from .convert import pdf_to_text, xlsx_to_text


@dataclass
class ParseResult:
    energy_day: date
    grid_data: dict | None
    petrobangla_data: dict | None
    pgcb_text_path: Path | None
    petrobangla_text_path: Path | None
    warnings: list[str]


def _load_grid_parser():
    spec = importlib.util.spec_from_file_location("parse_daily", PARSE_GRID)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _zero_gas_sections() -> tuple[list, list]:
    production = [
        {"company": c, "fields": f, "gas": 0.0, "condensate": 0.0, "share": 0.0}
        for c, f in zip(
            PETROBANGLA_GAS_PRODUCTION_COMPANIES,
            (5, 5, 9, 3, 1, 0),
        )
    ]
    distribution = [
        {"company": c, "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0}
        for c in PETROBANGLA_GAS_DISTRIBUTION_COMPANIES
    ]
    return production, distribution


def _gas_from_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    if not data.get("gasProductionData"):
        return None
    return {
        "gasProductionData": data["gasProductionData"],
        "gasDistributionData": data.get("gasDistributionData", []),
    }


def _nearest_gas_before(energy: date) -> dict | None:
    for path in sorted(GRID_DAILY_OUT.glob("*.json"), reverse=True):
        try:
            file_date = date.fromisoformat(path.stem)
        except ValueError:
            continue
        if file_date >= energy:
            continue
        gas = _gas_from_json(path)
        if gas:
            return gas
    return None


def _apply_gas_fallback(grid_data: dict, energy: date, warnings: list[str]) -> None:
    """Match ingest_official_daily: keep same-day gas, else carry forward prior day."""
    iso = energy.isoformat()
    preserved = _gas_from_json(GRID_DAILY_OUT / f"{iso}.json")
    if preserved:
        grid_data["gasProductionData"] = preserved["gasProductionData"]
        grid_data["gasDistributionData"] = preserved["gasDistributionData"]
        warnings.append("Petrobangla unavailable — kept existing gas sections for this energy day")
        return
    fallback = _nearest_gas_before(energy)
    if fallback:
        grid_data["gasProductionData"] = fallback["gasProductionData"]
        grid_data["gasDistributionData"] = fallback["gasDistributionData"]
        warnings.append("Petrobangla unavailable — carried forward gas from prior energy day")
        return
    prod, dist = _zero_gas_sections()
    grid_data["gasProductionData"] = prod
    grid_data["gasDistributionData"] = dist
    warnings.append("Petrobangla unavailable — zero-filled gas sections (Gas tab empty state)")


def parse_petrobangla_pdf(pdf_path: Path, energy: date) -> dict | None:
    if not PARSE_PETROBANGLA.exists():
        return None
    PETROBANGLA_JSON_STAGING.mkdir(parents=True, exist_ok=True)
    out_name = f"{energy.isoformat()}.json"
    out_path = PETROBANGLA_JSON_STAGING / out_name
    try:
        subprocess.run(
            [
                sys.executable,
                str(PARSE_PETROBANGLA),
                "--single",
                str(pdf_path),
                "--output",
                str(PETROBANGLA_JSON_STAGING),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        stem_out = PETROBANGLA_JSON_STAGING / f"{pdf_path.stem}.json"
        if stem_out.exists() and stem_out != out_path:
            data = json.loads(stem_out.read_text(encoding="utf-8"))
            out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            stem_out.unlink(missing_ok=True)
        if out_path.exists():
            return json.loads(out_path.read_text(encoding="utf-8"))
    except subprocess.CalledProcessError:
        return None
    return None


def parse_all(
    energy: date,
    pgcb_xlsx: Path | None,
    petrobangla_pdf: Path | None,
    work_dir: Path,
) -> ParseResult:
    work_dir.mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []
    parser = _load_grid_parser()

    pgcb_text_path = None
    grid_data = None
    if pgcb_xlsx and pgcb_xlsx.exists():
        pgcb_text_path = work_dir / f"pgcb_{energy.isoformat()}.txt"
        pgcb_text_path.write_text(xlsx_to_text(pgcb_xlsx), encoding="utf-8")
        grid_data = parser.parse_pgcb_file(str(pgcb_text_path), energy)
        if not grid_data:
            warnings.append("PGCB parser returned no data")

    pb_text_path = None
    petrobangla_data = None
    pb_gas_ok = False
    if petrobangla_pdf and petrobangla_pdf.exists():
        pb_text_path = work_dir / f"petrobangla_{energy.isoformat()}.txt"
        pb_text_path.write_text(pdf_to_text(petrobangla_pdf), encoding="utf-8")
        pb_gas = parser.parse_petrobangla_file(str(pb_text_path))
        if grid_data and pb_gas:
            grid_data["gasProductionData"] = pb_gas["gasProductionData"]
            grid_data["gasDistributionData"] = pb_gas["gasDistributionData"]
            pb_gas_ok = True
        elif not pb_gas:
            warnings.append("Petrobangla text parse failed for Pipeline A gas summary")
        petrobangla_data = parse_petrobangla_pdf(petrobangla_pdf, energy)
        if not petrobangla_data:
            warnings.append("Petrobangla full PDF parser (Pipeline B) failed")

    if grid_data and not pb_gas_ok:
        _apply_gas_fallback(grid_data, energy, warnings)

    return ParseResult(
        energy_day=energy,
        grid_data=grid_data,
        petrobangla_data=petrobangla_data,
        pgcb_text_path=pgcb_text_path,
        petrobangla_text_path=pb_text_path,
        warnings=warnings,
    )