"""Organize downloaded files into Daily Report folders by site name."""
from __future__ import annotations

import shutil
from datetime import date
from pathlib import Path

from .config import SITE_FOLDERS, site_dir


def organize_files(
    energy: date,
    *,
    pgcb_xlsx: Path | None = None,
    pgcb_text: Path | None = None,
    petrobangla_pdf: Path | None = None,
    petrobangla_text: Path | None = None,
    grid_json: Path | None = None,
    petrobangla_json: Path | None = None,
    agent_bundle: Path | None = None,
    verification_report: Path | None = None,
) -> Path:
    """Copy all artifacts into Desktop/Daily Reports/Daily Report YYYY-MM-DD/."""
    root = site_dir(energy, "pgcb").parent
    mapping = [
        (pgcb_xlsx, site_dir(energy, "pgcb")),
        (pgcb_text, site_dir(energy, "pgcb")),
        (petrobangla_pdf, site_dir(energy, "petrobangla")),
        (petrobangla_text, site_dir(energy, "petrobangla")),
        (grid_json, site_dir(energy, "output")),
        (petrobangla_json, site_dir(energy, "output")),
        (agent_bundle, site_dir(energy, "output")),
        (verification_report, site_dir(energy, "verification")),
    ]
    for src, dest_dir in mapping:
        if not src or not src.exists():
            continue
        dest_dir.mkdir(parents=True, exist_ok=True)
        target = dest_dir / src.name
        if src.resolve() != target.resolve():
            shutil.copy2(src, target)

    # Write a simple README in the report folder
    readme = root / "README.txt"
    readme.write_text(
        "\n".join([
            f"Daily Report — energy day {energy.isoformat()}",
            "",
            "Pipelines (esbpowerline codebase scope only):",
            "  A — PGCB → GridDailyData → public/data/daily/",
            "  B — Petrobangla → PetrobanglaDaily → public/data/petrobangla/daily/",
            "",
            f"  {SITE_FOLDERS['pgcb']}/          Pipeline A source files",
            f"  {SITE_FOLDERS['petrobangla']}/   Pipeline B source files",
            f"  {SITE_FOLDERS['output']}/        agent_bundle + grid_daily + petrobangla_daily JSON",
            f"  {SITE_FOLDERS['verification']}/  official re-parse + Google 2FA report",
        ]),
        encoding="utf-8",
    )
    return root