"""Enrich public/data/petrobangla/daily/*.json with fields from the 2026-07 re-parse.

The re-parsed JSONs (W:\\Petrobangla\\...\\Parsed-Structured\\json) carry sections the
v1 archive lacks: distribution diversity factor + adjusted demands, RPGCL refinery
HSD/kerosene/diesel output, production remarks, and the explicit gas-day window.

Strictly additive: existing non-null values are never overwritten. Each archive day
is matched to a re-parse report by date convention (archive keys are report END
dates for ~95% of files, gas-day START dates for a handful of recent live-sync
days) and the match is verified against the production grand total before any
field is copied. Rebuilds _live_week.json afterwards since it embeds full days.

Usage: python scripts/enrich_petrobangla_daily.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_DIR = ROOT / "public" / "data" / "petrobangla" / "daily"
PUBLIC = ROOT / "public" / "data" / "petrobangla"
REPARSE_DIR = Path(r"w:\Petrobangla\Daily Gas Reports - D\Parsed-Structured\json")
ENRICH_SOURCE = "reparse-2026-07"
GT_TOLERANCE = 1.0  # MMCFD — grand totals must agree this closely to accept a match
LIVE_WEEK_COUNT = 7
QUARANTINE = {
    "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
    "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
    "2025-05-22", "2026-02-22",
}

FILENAME_DATE = re.compile(r"\((\d{2})\.(\d{2})\.(\d{2})\)")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def filename_date(name: str) -> str | None:
    m = FILENAME_DATE.search(name)
    if not m:
        return None
    dd, mm, yy = m.groups()
    try:
        return datetime(2000 + int(yy), int(mm), int(dd)).strftime("%Y-%m-%d")
    except ValueError:
        return None


def build_reparse_index() -> tuple[dict[str, dict], dict[str, dict]]:
    """Index re-parse reports by gas_day_start and gas_day_end (report date)."""
    by_start: dict[str, dict] = {}
    by_end: dict[str, dict] = {}
    for path in sorted(REPARSE_DIR.glob("*.json")):
        try:
            data = load_json(path)
        except (json.JSONDecodeError, OSError) as e:
            print(f"  skip unreadable {path.name}: {e}")
            continue
        report = data.get("report") or {}
        start, end = report.get("gas_day_start"), report.get("gas_day_end")
        if not start or not end:
            # A few month-boundary PDFs have mangled header dates the re-parser
            # couldn't read — fall back to the filename date (= report/end date).
            end = filename_date(path.name)
            if not end:
                continue
            start = (datetime.strptime(end, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
        data["_source_file"] = path.name
        # Duplicate gas days exist (mislabeled PDFs); prefer the file whose
        # filename agrees with the parsed report date.
        consistent = filename_date(path.name) == report.get("report_date")
        for key, bucket in ((start, by_start), (end, by_end)):
            prev = bucket.get(key)
            if prev is None or (consistent and not prev.get("_consistent")):
                data["_consistent"] = consistent
                bucket[key] = data
    return by_start, by_end


def grand_total_gas(day: dict, new_format: bool) -> float | None:
    gt = (day.get("production") or {}).get("grand_total") or {}
    val = gt.get("gas") if new_format else gt.get("gas_mmcfd")
    return float(val) if isinstance(val, (int, float)) else None


def match_report(
    key: str, old: dict, by_start: dict[str, dict], by_end: dict[str, dict]
) -> tuple[dict | None, str]:
    old_gt = grand_total_gas(old, new_format=False)
    report = old.get("report") or {}
    candidates: list[tuple[str, dict | None]] = [
        ("end", by_end.get(key)),
        ("start", by_start.get(key)),
        ("end", by_end.get(report.get("report_date_end") or "")),
        ("start", by_start.get(report.get("report_date_start") or "")),
    ]
    seen: set[int] = set()
    for mode, cand in candidates:
        if cand is None or id(cand) in seen:
            continue
        seen.add(id(cand))
        new_gt = grand_total_gas(cand, new_format=True)
        if old_gt is not None and new_gt is not None:
            if abs(old_gt - new_gt) <= GT_TOLERANCE:
                return cand, mode
        elif old_gt is None:
            # Partial parse without a grand total — accept on date agreement alone.
            return cand, f"{mode}-weak"
    return None, ""


def fill(target: dict, key: str, value) -> bool:
    """Set target[key] = value only when value is non-null and slot is empty/null."""
    if value is None:
        return False
    if target.get(key) is None:
        target[key] = value
        return True
    return False


def enrich_day(old: dict, new: dict, mode: str) -> list[str]:
    added: list[str] = []
    new_report = new.get("report") or {}
    old_report = old.setdefault("report", {})
    for src_key, dst_key in (
        ("gas_day_start", "gas_day_start"),
        ("gas_day_end", "gas_day_end"),
        ("window", "gas_window"),
    ):
        if fill(old_report, dst_key, new_report.get(src_key)):
            added.append(f"report.{dst_key}")

    rpgcl = new.get("rpgcl") or {}
    products = rpgcl.get("products") or {}
    if products or rpgcl.get("prod_hsd_bbld") is not None:
        sgfl = old.setdefault("sgfl", {})
        sgfl_products = sgfl.setdefault("products", {})
        for src_key, dst_key in (
            ("NGL", "ngl"), ("Cond", "cond"), ("LPG", "lpg"), ("MS", "ms"),
            ("Octane", "octane"), ("Kerosene", "kerosene"), ("Diesel", "diesel"),
        ):
            if fill(sgfl_products, dst_key, products.get(src_key)):
                added.append(f"sgfl.products.{dst_key}")
        if fill(sgfl_products, "hsd", rpgcl.get("prod_hsd_bbld")):
            added.append("sgfl.products.hsd")

    pipeline = new.get("ns_ra_pipeline") or {}
    deliveries = pipeline.get("deliveries") or {}
    if deliveries:
        sgfl = old.setdefault("sgfl", {})
        metrics = sgfl.setdefault("pipeline_metrics", {})
        for seg, val in deliveries.items():
            if fill(metrics, seg, val):
                added.append(f"sgfl.pipeline_metrics.{seg}")
        if fill(sgfl, "pipeline_total", pipeline.get("total")):
            added.append("sgfl.pipeline_total")

    remarks = new.get("production_remarks")
    if remarks and old.get("production") is not None:
        if fill(old["production"], "remarks", remarks):
            added.append("production.remarks")

    diversity = (new.get("distribution") or {}).get("diversity") or {}
    if diversity.get("factor") is not None and old.get("distribution") is not None:
        if old["distribution"].get("diversity") is None:
            old["distribution"]["diversity"] = {
                "factor": diversity.get("factor"),
                "power_demand_adjusted_mmcfd": diversity.get("power_demand_adjusted"),
                "fertilizer_demand_adjusted_mmcfd": diversity.get("fert_demand_adjusted"),
            }
            added.append("distribution.diversity")

    if added:
        old.setdefault("meta", {})["enrichment"] = {
            "enriched_at": datetime.now().isoformat(timespec="seconds"),
            "source": ENRICH_SOURCE,
            "matched_report": new.get("_source_file"),
            "match_mode": mode,
            "fields_added": added,
        }
    return added


def rebuild_live_week() -> None:
    index = load_json(PUBLIC / "_index.json")
    ok = [
        d for d in index.get("days", [])
        if d.get("parse_status") == "ok" and d.get("date") not in QUARANTINE
    ]
    ok.sort(key=lambda d: d["date"])
    window = ok[-LIVE_WEEK_COUNT:]
    days = []
    for entry in window:
        path = ARCHIVE_DIR / (entry.get("json_file") or f"{entry['date']}.json")
        if not path.exists():
            path = ARCHIVE_DIR / f"{entry['date']}.json"
        if path.exists():
            days.append(load_json(path))
    latest = window[-1] if window else None
    bundle = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "live_week_count": LIVE_WEEK_COUNT,
        "latest_date": latest["date"] if latest else None,
        "latest_label": latest.get("date_label") if latest else None,
        "index_entries": window,
        "days": days,
    }
    (PUBLIC / "_live_week.json").write_text(
        json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Rebuilt _live_week.json: {len(days)} days, latest={bundle['latest_date']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report without writing")
    args = parser.parse_args()

    print(f"Indexing re-parse reports from {REPARSE_DIR} ...")
    by_start, by_end = build_reparse_index()
    print(f"  {len(by_end)} reports indexed")

    stats = {"matched": 0, "enriched": 0, "unmatched": [], "unchanged": 0}
    field_counts: dict[str, int] = {}

    for path in sorted(ARCHIVE_DIR.glob("20*.json")):
        key = path.stem
        old = load_json(path)
        new, mode = match_report(key, old, by_start, by_end)
        if new is None:
            stats["unmatched"].append(key)
            continue
        stats["matched"] += 1
        added = enrich_day(old, new, mode)
        if not added:
            stats["unchanged"] += 1
            continue
        stats["enriched"] += 1
        for f in added:
            group = ".".join(f.split(".")[:2])
            field_counts[group] = field_counts.get(group, 0) + 1
        if not args.dry_run:
            path.write_text(json.dumps(old, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\nMatched {stats['matched']} days, enriched {stats['enriched']}, "
          f"already-complete {stats['unchanged']}, unmatched {len(stats['unmatched'])}")
    if stats["unmatched"]:
        print("Unmatched days:", ", ".join(stats["unmatched"]))
    print("\nFields added (by section):")
    for field, count in sorted(field_counts.items(), key=lambda kv: -kv[1]):
        print(f"  {field}: {count}")

    if not args.dry_run:
        rebuild_live_week()
    else:
        print("\nDry run — nothing written.")


if __name__ == "__main__":
    main()
