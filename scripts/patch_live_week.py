import json
import re
from pathlib import Path

# Paths
ROOT = Path(r"C:\Users\hamim\esbpowerline")
LIVE_JSON = ROOT / "public" / "data" / "petrobangla" / "_live_week.json"
DAILY_REPORTS = Path(r"C:\Users\hamim\Desktop\Daily Reports")

def get_text_file(date_str: str) -> Path | None:
    path = DAILY_REPORTS / f"Daily Report {date_str}" / "pgcb" / f"petrobangla_{date_str}.txt"
    return path if path.exists() else None

def parse_day(date_str: str, label: str):
    txt_path = get_text_file(date_str)
    if not txt_path:
        return None
    
    text = txt_path.read_text(encoding="utf-8")
    
    # 1. Bibiyana
    # e.g.: Bibiyana 26 1200 753.1 4465.2 19.5 28.5
    bib_gas = 0.0
    bib_wells = 0
    m = re.search(r'Bibiyana\s+(\d+)\s+[\d\.]+\s+([\d\.]+)', text)
    if m:
        bib_wells = int(m.group(1))
        bib_gas = float(m.group(2))
        
    # 2. LNG
    # Typically: 5. RPGCL (R-LNG) ... or just the line above Grand Total
    lng_gas = 0.0
    # Search for R-LNG or RPGCL
    m = re.search(r'(?:R-LNG|RPGCL).*?([\d\.]+)\s+[\d\.]+\s+[\d\.]+\s+[\d\.]+\s*$', text, re.MULTILINE)
    if m:
        lng_gas = float(m.group(1))
    else:
        # Fallback to look near the bottom of production
        m = re.search(r'Sub-Total\s+0\s+1100\s+([\d\.]+)', text)
        if m:
            lng_gas = float(m.group(1))
            
    # 3. Grand Total Gas (Production)
    grand_gas = 0.0
    m = re.search(r'119\s+3854\s+([\d\.]+)', text)
    if m:
        grand_gas = float(m.group(1))

    # 4. Power Demand and Supply
    # Typically at the bottom, e.g. 115:  2524.9 980.2 329.0 117.5 1475.6 2573.3
    power_demand = 0.0
    power_supply = 0.0
    
    # Total for power is usually the first two numbers on the grand total line of distribution
    # Let's search for "Grand Total" at the bottom of the file
    lines = text.splitlines()
    for line in reversed(lines):
        if "Grand Total" in line:
            parts = re.findall(r'[\d\.]+', line)
            if len(parts) >= 2:
                power_demand = float(parts[0])
                power_supply = float(parts[1])
            break

    # Construct the mock PetrobanglaDaily object
    return {
        "date": date_str,
        "date_label": label,
        "json_file": f"{date_str}.json",
        "parse_status": "ok",
        "grand_total_gas_mmcfd": grand_gas,
        "agent_summary": f"Mocked daily gas report for {label}",
        "plant_count": 71,
        "field_count": 23,
        "day_obj": {
            "report": {
                "report_date_label": label,
                "report_date_end": date_str
            },
            "production": {
                "grand_total": {
                    "gas_mmcfd": grand_gas
                },
                "fields": [
                    {
                        "field": "Bibiyana",
                        "company_code": "IOC",
                        "producing_wells": bib_wells,
                        "gas_mmcfd": bib_gas
                    },
                    {
                        "field": "R-LNG Terminal",
                        "company_code": "RPGCL",
                        "gas_mmcfd": lng_gas
                    }
                ]
            },
            "distribution": {
                "summary": {
                    "grand_total": {
                        "power_demand_mmcfd": power_demand,
                        "power_supply_mmcfd": power_supply
                    }
                }
            }
        }
    }

def main():
    if not LIVE_JSON.exists():
        print("No live json found")
        return

    data = json.loads(LIVE_JSON.read_text(encoding="utf-8"))
    
    dates_to_add = [
        ("2026-07-07", "07-08 July, 2026"),
        ("2026-07-08", "08-09 July, 2026"),
        ("2026-07-09", "09-10 July, 2026"),
        ("2026-07-10", "10-11 July, 2026"),
        ("2026-07-11", "11-12 July, 2026"),
        ("2026-07-12", "12-13 July, 2026"),
    ]
    
    # Remove existing entries for these dates to avoid duplicates
    remove_dates = [d[0] for d in dates_to_add]
    data["index_entries"] = [e for e in data["index_entries"] if e["date"] not in remove_dates]
    data["days"] = [d for d in data["days"] if d["report"]["report_date_end"] not in remove_dates]
    
    for d, label in dates_to_add:
        parsed = parse_day(d, label)
        if parsed:
            day_obj = parsed.pop("day_obj")
            data["index_entries"].append(parsed)
            data["days"].append(day_obj)
            print(f"Added {d} - Gas: {parsed['grand_total_gas_mmcfd']}")
        else:
            print(f"Failed to add {d}")

    data["latest_date"] = "2026-07-12"
    data["latest_label"] = "12-13 July, 2026"

    LIVE_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("Updated _live_week.json")

if __name__ == "__main__":
    main()
