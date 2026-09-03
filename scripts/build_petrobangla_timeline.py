"""Build slim timeline summary for Petrobangla archive charts (one pass over JSON)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _artifact_io import write_if_changed  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "petrobangla" / "daily"
OUT = ROOT / "public" / "data" / "petrobangla" / "timeline-summary.json"
QUARANTINE = {
    "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
    "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
    "2025-05-22", "2026-02-22",
}


def domestic_lng(fields: list) -> tuple[float, float]:
    domestic = 0.0
    lng = 0.0
    for f in fields:
        g = float(f.get("gas_mmcfd") or 0)
        if f.get("company_code") == "RPGCL":
            lng += g
        else:
            domestic += g
    return domestic, lng


def main():
    rows = []
    for path in sorted(DAILY.glob("20*.json")):
        if path.name.startswith("_"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        meta = data.get("meta", {})
        status = meta.get("parse_status", "failed")
        report = data.get("report", {})
        date = path.stem
        gt = data.get("production", {}).get("grand_total", {})
        fields = data.get("production", {}).get("fields", [])
        dom, lng = domestic_lng(fields)
        major_names = ("Bibiyana", "Titas", "Jalalabad", "Habiganj", "Rashidpur", "Shahbazpur", "R-LNG Terminal", "Bangora")
        field_map = {n: next((float(f.get("gas_mmcfd") or 0) for f in fields if f.get("field") == n), 0.0) for n in major_names}
        bib = field_map.get("Bibiyana", 0.0)
        dist = data.get("distribution", {}).get("summary", {}).get("grand_total", {})
        pd = dist.get("power_demand_mmcfd")
        ps = dist.get("power_supply_mmcfd")
        fulfillment = (float(ps) / float(pd) * 100) if pd and ps and float(pd) > 0 else None
        rows.append({
            "date": date,
            "parse_status": status,
            "quarantined": date in QUARANTINE,
            "total_gas": float(gt.get("gas_mmcfd") or 0),
            "domestic_gas": dom,
            "lng_gas": lng,
            "bibiyana_gas": bib,
            "major_fields": field_map,
            "producing_wells": float(gt.get("producing_wells") or 0),
            "power_demand": float(pd) if pd is not None else None,
            "power_supply": float(ps) if ps is not None else None,
            "power_fulfillment_pct": round(fulfillment, 2) if fulfillment is not None else None,
            "fertilizer_demand": dist.get("fertilizer_demand_mmcfd"),
            "fertilizer_supply": dist.get("fertilizer_supply_mmcfd"),
            "others_mmcfd": dist.get("others_supplementary_mmcfd"),
        })
    rows.sort(key=lambda r: r["date"])
    ok = [r for r in rows if r["parse_status"] == "ok" and not r["quarantined"]]
    peak = max(ok, key=lambda r: r["total_gas"]) if ok else None
    low = min(ok, key=lambda r: r["total_gas"]) if ok else None
    doc = {
        "generated_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        "total_days": len(rows),
        "ok_days": len(ok),
        "peak": {"date": peak["date"], "gas": peak["total_gas"]} if peak else None,
        "low": {"date": low["date"], "gas": low["total_gas"]} if low else None,
        "days": rows,
    }
    # A rebuild with no new day must not rewrite the file: the only difference
    # would be the stamp, and the scheduled poll was committing and
    # republishing that four times a day (2026-09-03). See _artifact_io.
    if write_if_changed(OUT, doc):
        print(f"Wrote {len(rows)} days to {OUT}")
    else:
        print(f"Unchanged: {len(rows)} days already in {OUT}")


if __name__ == "__main__":
    main()