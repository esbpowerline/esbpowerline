import json
import re
import shutil
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline")
DAILY_DIR = ROOT / "public" / "data" / "petrobangla" / "daily"
DAILY_REPORTS = Path(r"C:\Users\hamim\Desktop\Daily Reports")

def get_text_file(date_str: str) -> Path | None:
    path = DAILY_REPORTS / f"Daily Report {date_str}" / "pgcb" / f"petrobangla_{date_str}.txt"
    return path if path.exists() else None

def parse_day(date_str: str, label: str):
    txt_path = get_text_file(date_str)
    if not txt_path:
        return None
    
    text = txt_path.read_text(encoding="utf-8")
    
    bib_gas = 0.0
    bib_wells = 0
    m = re.search(r'Bibiyana\s+(\d+)\s+[\d\.]+\s+([\d\.]+)', text)
    if m:
        bib_wells = int(m.group(1))
        bib_gas = float(m.group(2))
        
    lng_gas = 0.0
    m = re.search(r'(?:R-LNG|RPGCL).*?([\d\.]+)\s+[\d\.]+\s+[\d\.]+\s+[\d\.]+\s*$', text, re.MULTILINE)
    if m:
        lng_gas = float(m.group(1))
    else:
        m = re.search(r'Sub-Total\s+0\s+1100\s+([\d\.]+)', text)
        if m:
            lng_gas = float(m.group(1))
            
    grand_gas = 0.0
    m = re.search(r'119\s+3854\s+([\d\.]+)', text)
    if m:
        grand_gas = float(m.group(1))
    else:
        m = re.search(r'Grand Total \(1\+2\+3\+4\+5\):\s+\d+\s+[\d\.]+\s+([\d\.]+)', text)
        if m:
            grand_gas = float(m.group(1))

    power_demand = 0.0
    power_supply = 0.0
    fertilizer_demand = 0.0
    fertilizer_supply = 0.0
    others = 0.0
    
    lines = text.splitlines()
    for line in reversed(lines):
        if "Grand Total" in line and "(1+2" not in line:
            parts = re.findall(r'[\d\.]+', line)
            if len(parts) >= 6:
                power_demand = float(parts[0])
                power_supply = float(parts[1])
                fertilizer_demand = float(parts[2])
                fertilizer_supply = float(parts[3])
                others = float(parts[4])
            break

    return {
        "grand_gas": grand_gas,
        "bib_gas": bib_gas,
        "bib_wells": bib_wells,
        "lng_gas": lng_gas,
        "power_demand": power_demand,
        "power_supply": power_supply,
        "fertilizer_demand": fertilizer_demand,
        "fertilizer_supply": fertilizer_supply,
        "others": others
    }

def main():
    template_path = DAILY_DIR / "2026-07-06.json"
    if not template_path.exists():
        print("Template 2026-07-06.json not found!")
        return

    with open(template_path, "r", encoding="utf-8") as f:
        template = json.load(f)
        
    dates_to_add = [
        ("2026-07-07", "07-08 July, 2026"),
        ("2026-07-08", "08-09 July, 2026"),
        ("2026-07-09", "09-10 July, 2026"),
        ("2026-07-10", "10-11 July, 2026"),
        ("2026-07-11", "11-12 July, 2026"),
        ("2026-07-12", "12-13 July, 2026"),
    ]

    for d, label in dates_to_add:
        parsed = parse_day(d, label)
        if not parsed:
            continue
            
        data = json.loads(json.dumps(template))
        
        # Update meta and report
        data["meta"]["agent_summary"] = f"Mocked petrobangla daily file for {label}."
        data["report"]["report_date_label"] = label
        data["report"]["report_date_end"] = d
        data["report"]["report_date_start"] = d
        
        # Update grand totals
        data["production"]["grand_total"]["gas_mmcfd"] = parsed["grand_gas"]
        
        # Update fields
        for field in data["production"]["fields"]:
            if field["field"] == "Bibiyana":
                field["gas_mmcfd"] = parsed["bib_gas"]
                field["producing_wells"] = parsed["bib_wells"]
            elif field["field"] == "R-LNG Terminal":
                field["gas_mmcfd"] = parsed["lng_gas"]
                
        # Update distribution summary
        summary = data["distribution"].get("summary", {})
        gt = summary.get("grand_total", summary.get("total_", {}))
        if gt:
            gt["power_demand_mmcfd"] = parsed["power_demand"]
            gt["power_supply_mmcfd"] = parsed["power_supply"]
            gt["fertilizer_demand_mmcfd"] = parsed["fertilizer_demand"]
            gt["fertilizer_supply_mmcfd"] = parsed["fertilizer_supply"]
            gt["others_supplementary_mmcfd"] = parsed["others"]
            
        # Write file
        out_path = DAILY_DIR / f"{d}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Generated {out_path.name}")
        
    print("Done generating individual daily JSON files!")

if __name__ == "__main__":
    main()
