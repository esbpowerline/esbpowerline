"""Validate parsed output against lib/data/grid types (mirrors validate-daily-report.ts)."""
from __future__ import annotations

from dataclasses import dataclass, field

from .config import (
    PETROBANGLA_GAS_DISTRIBUTION_COMPANIES,
    PETROBANGLA_GAS_PRODUCTION_COMPANIES,
    REQUIRED_GENERATION_FUELS,
)

SYSTEM_STATS_KEYS = (
    "date",
    "dayPeakGen",
    "eveningPeakGen",
    "dayPeakDemand",
    "eveningPeakDemand",
    "minGen",
    "maxGen",
    "totalEnergyGen",
    "totalEnergyUnserved",
    "totalEnergyDemand",
    "maxTemp",
    "totalGasSuppliedPower",
    "avgProductionCost",
    "totalDailyCost",
)

# Read from the source or not at all. Each is null on layouts that do not
# publish it, rather than carrying an estimate: the extremes when the report
# states neither and has no load curve, and demand/unserved/temperature on
# older layouts that print only generation.
NULLABLE_STATS_KEYS = frozenset({
    "minGen", "maxGen", "dayPeakDemand", "totalEnergyUnserved",
    "totalEnergyDemand", "maxTemp",
})


@dataclass
class ValidationResult:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def validate_grid_daily(data: dict, iso_date: str) -> ValidationResult:
    """Check GridDailyData shape required by PowerGridExplorer + Zod schema."""
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(data, dict):
        return ValidationResult(False, [f"{iso_date}: root must be an object"])

    stats = data.get("systemStats")
    if not isinstance(stats, dict):
        errors.append("systemStats is required")
    else:
        for key in SYSTEM_STATS_KEYS:
            if key not in stats:
                errors.append(f"systemStats.{key} missing")
        if "date" in stats and not isinstance(stats["date"], str):
            errors.append("systemStats.date must be a string")
        for key in SYSTEM_STATS_KEYS:
            if key == "date":
                continue
            val = stats.get(key)
            if key in stats and val is None and key in NULLABLE_STATS_KEYS:
                continue
            if key in stats and not isinstance(val, (int, float)):
                suffix = " or null" if key in NULLABLE_STATS_KEYS else ""
                errors.append(f"systemStats.{key} must be a number{suffix}")

    gen = data.get("generationData")
    if not isinstance(gen, list) or len(gen) < 1:
        errors.append("generationData must be a non-empty array")
    else:
        fuels = set()
        for i, row in enumerate(gen):
            if not isinstance(row, dict):
                errors.append(f"generationData[{i}] must be an object")
                continue
            for k in ("name", "gen", "cost", "unitCost", "color"):
                if k not in row:
                    errors.append(f"generationData[{i}].{k} missing")
            if "name" in row:
                fuels.add(row["name"])
        for fuel in REQUIRED_GENERATION_FUELS:
            if fuel not in fuels:
                warnings.append(f'missing generation fuel "{fuel}" (dev warning in site)')

    hourly = data.get("hourlyLoadData")
    if hourly is not None:
        if not isinstance(hourly, list):
            errors.append("hourlyLoadData must be an array when present")
        elif len(hourly) not in (24, 25):
            # 25 is PGCB's own row set, not a defect: the 24 hours plus the
            # evening-peak half hour (19:30 on 2026-08-07 through 08-10), which
            # parse_daily_reports keeps deliberately rather than dropping the
            # instant PGCB stamps the peak on. The shipped archive carries 25 rows
            # for those days, and validate-daily-report.ts imposes no count rule at
            # all — so a flat `!= 24` rejected days PGCB published normally. Worse,
            # it sat on an `else` that skipped every per-row check below, leaving
            # exactly those days unvalidated.
            errors.append(f"hourlyLoadData must have 24 or 25 rows (got {len(hourly)})")
        else:
            times = set()
            for i, row in enumerate(hourly):
                if not isinstance(row, dict):
                    errors.append(f"hourlyLoadData[{i}] must be an object")
                    continue
                t = row.get("time")
                if t:
                    times.add(t)
                g = row.get("generation")
                s = row.get("loadShed")
                d = row.get("demand")
                if isinstance(g, (int, float)) and isinstance(s, (int, float)) and isinstance(d, (int, float)):
                    if abs(d - (g + s)) > 0.05:
                        # A warning, not an error: PGCB's own hourly table never satisfies
                        # this identity — on 2026-07-28 its published demand exceeds
                        # generation + load-shed by 20-112 MW every hour, most likely
                        # busbar against substation end. validate-daily-report.ts, which
                        # this file mirrors, imposes no such rule, and the shipped archive
                        # already carries non-reconciling rows (2026-07-24, 2026-07-26).
                        # Refusing the day here discards a report PGCB actually published.
                        warnings.append(
                            f"hourlyLoadData[{i}]: demand {d} != generation + loadShed "
                            f"({g} + {s}); reported as published"
                        )
            if len(times) != len(hourly):
                warnings.append("hourlyLoadData has duplicate timestamps")
            if not {f"{h:02d}:00" for h in range(24)} <= times:
                warnings.append("hourlyLoadData does not cover all 24 hours")

    for section, keys in (
        ("regionalDemandData", ("zone", "loadShed", "demand", "pct")),
        ("borderImportsData", ("source", "energy", "peakFlow", "type")),
        ("dailyOutages", ("time", "plant", "load", "reason")),
        ("gasProductionData", ("company", "fields", "gas", "condensate", "share")),
        ("gasDistributionData", ("company", "power", "fertilizer", "others", "total")),
    ):
        rows = data.get(section)
        if rows is None:
            continue
        if not isinstance(rows, list):
            errors.append(f"{section} must be an array when present")
            continue
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                errors.append(f"{section}[{i}] must be an object")
                continue
            for k in keys:
                if k not in row:
                    errors.append(f"{section}[{i}].{k} missing")

    prod = data.get("gasProductionData") or []
    if prod:
        for row in prod:
            company = row.get("company", "")
            if not any(company.startswith(c.split(" ")[0]) for c in PETROBANGLA_GAS_PRODUCTION_COMPANIES):
                warnings.append(f'unknown gas production company "{company}"')

    dist = data.get("gasDistributionData") or []
    if dist:
        for row in dist:
            company = row.get("company", "")
            if not any(company.startswith(c.split(" ")[0]) for c in PETROBANGLA_GAS_DISTRIBUTION_COMPANIES):
                warnings.append(f'unknown gas distribution company "{company}"')

    return ValidationResult(ok=len(errors) == 0, errors=errors, warnings=warnings)


def validate_petrobangla_daily(data: dict | None) -> ValidationResult:
    if data is None:
        return ValidationResult(True, warnings=["Pipeline B skipped (no Petrobangla PDF)"])
    errors: list[str] = []
    warnings: list[str] = []
    meta = data.get("meta") or {}
    if meta.get("parse_status") not in ("ok", "partial"):
        errors.append(f"meta.parse_status must be ok or partial (got {meta.get('parse_status')!r})")
    report = data.get("report") or {}
    if not report.get("report_date_end"):
        errors.append("report.report_date_end required for archive index")
    production = data.get("production") or {}
    if not production.get("fields"):
        errors.append("production.fields required")
    distribution = data.get("distribution") or {}
    summary = distribution.get("summary") or {}
    if not summary.get("grand_total") and not summary.get("total_"):
        warnings.append("distribution.summary.grand_total missing (live week KPIs may break)")
    return ValidationResult(ok=len(errors) == 0, errors=errors, warnings=warnings)