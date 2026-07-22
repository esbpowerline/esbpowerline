"""Convert a re-parse JSON (Desktop petrobangla-parser) into the v1 PetrobanglaDaily
archive format, keyed by gas-day START (live-sync convention), then update
_index.json and rebuild _live_week.json."""
import hashlib
import json
import re
import sys
from datetime import datetime, date
from pathlib import Path

ROOT = Path(r"C:\Users\User\esbpowerline")
PUBLIC = ROOT / "public" / "data" / "petrobangla"
DAILY = PUBLIC / "daily"
QUARANTINE = {
    "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
    "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
    "2025-05-22", "2026-02-22",
}
CODE_MAP = {"1. BGFCL": "BGFCL", "2. SGFL": "SGFL", "3. BAPEX": "BAPEX",
            "4. IOCs": "IOC", "5. RPGCL (R-LNG)": "RPGCL",
            "BGFCL": "BGFCL", "SGFL": "SGFL", "BAPEX": "BAPEX",
            "IOCs": "IOC", "RPGCL": "RPGCL"}
CANON_COMPANY = {"BGFCL": "1. BGFCL", "SGFL": "2. SGFL", "BAPEX": "3. BAPEX",
                 "IOC": "4. IOCs", "RPGCL": "5. RPGCL (R-LNG)"}

reparse_path = Path(sys.argv[1])
pdf_path = Path(sys.argv[2])
rp = json.loads(reparse_path.read_text(encoding="utf-8"))

start = rp["report"]["gas_day_start"]
end = rp["report"]["gas_day_end"]
key = start  # live-sync convention: keyed by gas-day start
sd, ed = date.fromisoformat(start), date.fromisoformat(end)
label = f"{sd.day:02d}-{ed.day:02d} {ed.strftime('%b')}, {ed.year}"

def slug(s):
    return re.sub(r"[^a-z0-9#]+", "-", s.lower()).strip("-")

def prod_row(f, record_type):
    company_raw = f.get("company") or ""
    code = CODE_MAP.get(company_raw)
    company = CANON_COMPANY.get(code, company_raw)
    name = f.get("field") or f.get("label") or ""
    if code == "RPGCL" and name.strip("() ").upper() == "R-LNG":
        name = "R-LNG Terminal"
    operator = f.get("operator")
    if name.lower() == "bangora":
        operator = "TULLOW"  # PDF column bleed files Bangora under CHEVRON
    return {
        "record_type": record_type,
        "id": f"{(code or '').lower()}/{slug(name)}" if record_type == "field" else f"{(code or '').lower()}/subtotal",
        "company": company or None,
        "company_code": code or (None if record_type != "grand_total" else "TOTAL"),
        "operator": operator,
        "field": name,
        "producing_wells": f.get("wells"),
        "capacity_mmcfd": f.get("capacity"),
        "gas_mmcfd": f.get("gas"),
        "condensate_bbld": f.get("condensate"),
        "pct_of_total_capacity": f.get("pct_cap"),
        "pct_of_total_production": f.get("pct_prod"),
    }

fields = [prod_row(f, "field") for f in rp["production"]["fields"]]
subtotals = [prod_row(s, "subtotal") for s in rp["production"]["subtotals"]]
gt_src = dict(rp["production"]["grand_total"])
gt_src["company"] = gt_src.get("label")
gt_src["field"] = gt_src.get("label")
grand_total = prod_row(gt_src, "grand_total")
grand_total["company_code"] = "TOTAL"
grand_total["id"] = "total/grand-total"

rpgcl = rp.get("rpgcl") or {}
products_src = rpgcl.get("products") or {}
products = {}
for src_k, dst_k in (("NGL", "ngl"), ("Cond", "cond"), ("LPG", "lpg"), ("MS", "ms"),
                     ("Octane", "octane"), ("Kerosene", "kerosene"), ("Diesel", "diesel")):
    if products_src.get(src_k) is not None:
        products[dst_k] = products_src[src_k]
if rpgcl.get("prod_hsd_bbld") is not None:
    products["hsd"] = rpgcl["prod_hsd_bbld"]

pipeline = rp.get("ns_ra_pipeline") or {}

def num_pct(s):
    if not s:
        return None
    m = re.search(r"[\d.]+", str(s))
    return float(m.group()) if m else None

dist = rp["distribution"]
companies = []
plant_count = 0
for c in dist["companies"]:
    plants = [{"name": p["name"], "demand_mmcfd": p.get("demand"), "supply_mmcfd": p.get("supply")}
              for p in c.get("power_plants", [])]
    plant_count += len(plants)
    fert_entries = c.get("fertilizer") or []
    sub = c.get("subtotal") or {}
    others = c.get("others_supl") or []
    remarks = [r for r in (c.get("remarks") or []) if r.strip().lower() != "shutdown plants"]
    companies.append({
        "company": c["company"],
        "company_code": c["company"],
        "power_plants": plants,
        "power_demand_mmcfd": sub.get("power_demand"),
        "power_supply_mmcfd": sub.get("power_supply"),
        "fertilizer": ({
            "company": ", ".join(f["name"] for f in fert_entries) or None,
            "demand_mmcfd": sub.get("fert_max_demand"),
            "supply_mmcfd": sub.get("fert_supply"),
        } if (fert_entries or sub.get("fert_max_demand") is not None) else None),
        "others_supplementary_mmcfd": sub.get("others_supl") if isinstance(sub.get("others_supl"), (int, float)) else (sum(others) if others else None),
        "total_mmcfd": sub.get("total"),
        "remarks_shutdown_plants": remarks,
    })

totals = dist.get("totals") or {}
dgt = dist.get("grand_total") or {}
pct = dist.get("pct_of_total") or {}
EMPTY = {k: None for k in ("power_demand_mmcfd", "power_supply_mmcfd", "fertilizer_demand_mmcfd",
                           "fertilizer_supply_mmcfd", "others_supplementary_mmcfd", "total_mmcfd", "extra")}
summary = {
    "total_": {
        "power_demand_mmcfd": totals.get("power_demand"),
        "power_supply_mmcfd": totals.get("power_supply"),
        "fertilizer_demand_mmcfd": totals.get("fert_max_demand"),
        "fertilizer_supply_mmcfd": totals.get("fert_supply"),
        "others_supplementary_mmcfd": totals.get("others_supl"),
        "total_mmcfd": totals.get("total"),
        "extra": totals.get("total_incl_non_grid"),
    },
    "non-grid_power": dict(EMPTY),
    "grand_total": {
        "power_demand_mmcfd": dgt.get("power_demand"),
        "power_supply_mmcfd": dgt.get("power_supply"),
        "fertilizer_demand_mmcfd": dgt.get("fert_max_demand"),
        "fertilizer_supply_mmcfd": dgt.get("fert_supply"),
        "others_supplementary_mmcfd": dgt.get("others_supl"),
        "total_mmcfd": dgt.get("total"),
        "extra": None,
    },
    "pct_of_total_distribution": {
        **EMPTY,
        "power_supply_mmcfd": num_pct(pct.get("power")),
        "fertilizer_supply_mmcfd": num_pct(pct.get("fertilizer")),
        "others_supplementary_mmcfd": num_pct(pct.get("others")),
        "total_mmcfd": num_pct(pct.get("total")),
    },
}

diversity_src = dist.get("diversity") or {}
non_grid = dist.get("non_grid") or {}

field_gas_sum = round(sum(f["gas_mmcfd"] or 0 for f in fields), 1)
gt_gas = grand_total["gas_mmcfd"]
variance = round(abs(field_gas_sum - (gt_gas or 0)), 1)

entities = (
    [{"type": "gas_field", "id": "/" + slug(f["field"]), "name": f["field"], "company_code": None,
      "operator": None, "gas_mmcfd": f["gas_mmcfd"], "producing_wells": f["producing_wells"],
      "capacity_mmcfd": f["capacity_mmcfd"]} for f in fields]
    + [{"type": "power_plant", "name": p["name"], "distribution_company": c["company"],
        "demand_mmcfd": p["demand_mmcfd"], "supply_mmcfd": p["supply_mmcfd"]}
       for c in companies for p in c["power_plants"]]
)

doc = {
    "$schema": "petrobangla-daily/v1",
    "meta": {
        "schema_version": "1.0.0",
        "parser_version": "2.1.0-reparse-direct",
        "source_pdf": str(pdf_path).replace("\\", "/"),
        "source_filename": pdf_path.name,
        "parsed_at": datetime.now().isoformat(timespec="seconds"),
        "page_count": 1,
        "parse_status": "ok",
        "warnings": rp.get("warnings") or [],
        "content_sha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
        "agent_summary": (
            f"Petrobangla daily gas report for {label}. {len(fields)} producing fields, "
            f"{plant_count} power plants tracked. Grand total gas production {gt_gas} MMCFD."
        ),
        "queryable_collections": ["production.fields", "production.subtotals",
                                  "distribution.companies.power_plants", "distribution.summary",
                                  "sgfl.products", "entities"],
    },
    "report": {
        "reference_no": None,
        "period": "8.00 to 8.00",
        "units": {"gas": "MMCFD", "condensate": "BBLD", "lpg": "Kg", "products": "BBLD"},
        "report_date_label": label,
        "report_date_start": start,
        "report_date_end": end,
        "month_label": f"{ed.strftime('%b')}, {ed.year}",
        "gas_day_start": start,
        "gas_day_end": end,
        "gas_window": (rp["report"].get("window") or "8.00-8.00").replace(" ", ""),
    },
    "production": {
        "fields": fields,
        "subtotals": subtotals,
        "grand_total": grand_total,
        "field_count": len(fields),
        **({"remarks": rp["production_remarks"]} if rp.get("production_remarks") else {}),
    },
    "sgfl": {
        "products": products,
        "pipeline_metrics": pipeline.get("deliveries") or {},
        "pipeline_total": pipeline.get("total"),
    },
    "distribution": {
        "companies": companies,
        "summary": summary,
        "non_grid_power": [{"name": e.get("name"), "supply_mmcfd": e.get("supply")}
                           for e in (non_grid.get("entries") or [])],
        "plant_count": plant_count,
        "diversity": {
            "factor": diversity_src.get("factor"),
            "power_demand_adjusted_mmcfd": diversity_src.get("power_demand_adjusted"),
            "fertilizer_demand_adjusted_mmcfd": diversity_src.get("fert_demand_adjusted"),
        } if diversity_src.get("factor") is not None else None,
    },
    "validation": {
        "field_gas_sum_mmcfd": field_gas_sum,
        "grand_total_gas_mmcfd": gt_gas,
        "variance_mmcfd": variance,
        "reconciled": variance <= 1.0,
    },
    "entities": entities,
}

out_path = DAILY / f"{key}.json"
if out_path.exists():
    print(f"REFUSING to overwrite existing {out_path}")
    sys.exit(1)
out_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Wrote {out_path}")

# _index.json
index = json.loads((PUBLIC / "_index.json").read_text(encoding="utf-8"))
entry = {
    "date": key, "date_label": label, "json_file": f"{key}.json",
    "field_count": len(fields), "plant_count": plant_count,
    "grand_total_gas_mmcfd": gt_gas, "parse_status": "ok",
    "agent_summary": doc["meta"]["agent_summary"],
}
index["days"] = [d for d in index["days"] if d.get("date") != key] + [entry]
index["days"].sort(key=lambda d: d.get("date") or "")
index["total_days"] = len(index["days"])
index["generated_at"] = datetime.now().isoformat(timespec="seconds")
(PUBLIC / "_index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Index updated: {index['total_days']} days, last={index['days'][-1]['date']}")

# _live_week.json (mirror sync_petrobangla_live.build_live_week)
ok = [d for d in index["days"] if d.get("parse_status") == "ok" and d.get("date") not in QUARANTINE]
ok.sort(key=lambda d: d["date"])
window = ok[-7:]
days = []
for e in window:
    p = DAILY / (e.get("json_file") or f"{e['date']}.json")
    if p.exists():
        days.append(json.loads(p.read_text(encoding="utf-8")))
live = {
    "generated_at": datetime.now().isoformat(timespec="seconds"),
    "live_week_count": 7,
    "latest_date": window[-1]["date"] if window else None,
    "latest_label": window[-1].get("date_label") if window else None,
    "index_entries": window,
    "days": days,
}
(PUBLIC / "_live_week.json").write_text(json.dumps(live, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Live week rebuilt: {len(days)} days, latest={live['latest_date']}")
