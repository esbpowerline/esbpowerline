import os
import re
import json
import datetime
from concurrent.futures import ThreadPoolExecutor

PGCB_DIR = r"C:\Users\user\Desktop\PGCB\Daily Reports - D\Daily Reports Parsed"
PB_DIR = r"C:\Users\user\Desktop\Petrobangla\Daily Gas Reports - D\Daily Gas Reports Parsed"
OUTPUT_DIR = r"C:\Users\user\esbpowerline\public\data\daily"
DATES_OUTPUT_PATH = r"C:\Users\user\esbpowerline\lib\available-dates.json"

def clean_float(val_str):
    if not val_str:
        return 0.0
    clean = re.sub(r'[^\d\.\-]', '', str(val_str).replace(',', '').strip())
    try:
        return float(clean) if '.' in clean else float(int(clean))
    except ValueError:
        return 0.0

def parse_date_from_filename(f):
    m = re.search(r'(\d{1,2})[-. ](\d{1,2})[-. ](\d{2,4})', f)
    if not m:
        return None
    d_str, m_str, y_str = m.groups()
    d_val, m_val, y_val = int(d_str), int(m_str), int(y_str)
    if y_val < 50:
        y_val += 2000
    elif y_val < 100:
        y_val += 1900
    try:
        return datetime.date(y_val, m_val, d_val)
    except Exception:
        return None

def extract_production_values(line, field_name):
    idx = line.lower().find(field_name.lower())
    if idx == -1:
        return 0.0, 0.0
    rest = line[idx + len(field_name):].strip()
    words = rest.split()
    nums = []
    for w in words:
        w_clean = re.sub(r'[^\d\-.]', '', w)
        if not w_clean:
            break
        try:
            nums.append(float(w_clean))
        except ValueError:
            break
    if len(nums) >= 4:
        return nums[2], nums[3]
    elif len(nums) >= 3:
        return nums[2], 0.0
    return 0.0, 0.0

def extract_first_number(val_str):
    if not val_str:
        return 0.0
    s = str(val_str).replace(',', '')
    nums = re.findall(r'[-+]?\d*\.\d+|\d+', s)
    if nums:
        return float(nums[0])
    return 0.0

def get_sheet_content(content, sheet_name):
    pattern = r'## Sheet:\s*' + re.escape(sheet_name) + r'\b'
    m = re.search(pattern, content, re.IGNORECASE)
    if not m:
        return ""
    start_idx = m.end()
    rest = content[start_idx:]
    next_sheet = rest.find('## Sheet:')
    if next_sheet != -1:
        return rest[:next_sheet]
    return rest

def parse_pgcb_file(filepath, op_date):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading PGCB file {filepath}: {e}")
        return None

    # Load sheets dynamically
    p1 = get_sheet_content(content, 'P1')
    forecast = get_sheet_content(content, 'Forecast')
    p3 = get_sheet_content(content, 'P3')

    # Initialize stats
    day_peak_gen = 0.0
    evening_peak_gen = 0.0
    evening_peak_demand = 0.0
    total_energy_gen = 0.0
    total_gas_supplied_power = 0.0
    total_daily_cost = 0.0
    min_gen = 0.0
    max_gen = 0.0

    # Combine P1 and Forecast for basic stats parsing to cover all formats
    stats_content = p1 + "\n" + forecast
    for line in stats_content.split('\n'):
        line_lower = line.lower()
        parts = [p.strip() for p in line.split('|') if p.strip()]
        if not parts:
            continue
        
        for idx, cell in enumerate(parts):
            cell_lower = cell.lower()
            if 'day peak generation' in cell_lower:
                if idx + 1 < len(parts): day_peak_gen = clean_float(parts[idx+1])
            elif 'evening peak generation' in cell_lower:
                if idx + 1 < len(parts): evening_peak_gen = clean_float(parts[idx+1])
            elif 'evening peak demand' in cell_lower or 'e.p. demand' in cell_lower:
                if idx + 1 < len(parts): evening_peak_demand = clean_float(parts[idx+1])
            elif 'energy generated' in cell_lower or 'total gen.' in cell_lower or 'total gen (' in cell_lower:
                if idx + 1 < len(parts): total_energy_gen = clean_float(parts[idx+1])
            elif 'total gas supplied' in cell_lower or 'gas consumed' in cell_lower:
                if idx + 1 < len(parts):
                    val = clean_float(parts[idx+1])
                    if val > 0: total_gas_supplied_power = val
                if total_gas_supplied_power == 0.0:
                    nums = re.findall(r'[-+]?\d*\.\d+|\d+', cell)
                    if nums: total_gas_supplied_power = float(nums[0])
            elif 'min. gen.' in cell_lower or 'minimum generation' in cell_lower:
                if idx + 1 < len(parts):
                    val = clean_float(parts[idx+1])
                    if val > 0: min_gen = val
            elif 'max. gen.' in cell_lower or 'maximum generation' in cell_lower:
                if idx + 1 < len(parts):
                    val = clean_float(parts[idx+1])
                    if val > 0: max_gen = val
            elif 'coal    :' in cell_lower or 'total   :' in cell_lower or 'total:' in cell_lower:
                if 'total' in cell_lower:
                    if idx + 1 < len(parts): total_daily_cost = clean_float(parts[idx+1])

    if evening_peak_demand == 0.0:
        evening_peak_demand = evening_peak_gen

    # Regional loadshedding
    regional_loadshed = {
        'Dhaka': 0.0, 'Chattogram': 0.0, 'Cumilla': 0.0, 'Mymensingh': 0.0,
        'Sylhet': 0.0, 'Khulna': 0.0, 'Barishal': 0.0, 'Rajshahi': 0.0, 'Rangpur': 0.0
    }
    
    in_loadshed_section = False
    for line in p1.split('\n'):
        line_lower = line.lower()
        if 'load-shed' in line_lower or 'load shedding' in line_lower or 'loadshed' in line_lower or 'area' in line_lower and 'yesterday' in line_lower:
            in_loadshed_section = True
            continue
        if in_loadshed_section:
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                for idx, cell in enumerate(parts):
                    cell_lower = cell.lower()
                    matched_zone = None
                    if 'dhaka' in cell_lower: matched_zone = 'Dhaka'
                    elif 'chittagong' in cell_lower or 'chattogram' in cell_lower: matched_zone = 'Chattogram'
                    elif 'comilla' in cell_lower or 'cumilla' in cell_lower: matched_zone = 'Cumilla'
                    elif 'mymensingh' in cell_lower: matched_zone = 'Mymensingh'
                    elif 'sylhet' in cell_lower: matched_zone = 'Sylhet'
                    elif 'khulna' in cell_lower: matched_zone = 'Khulna'
                    elif 'barisal' in cell_lower or 'barishal' in cell_lower: matched_zone = 'Barishal'
                    elif 'rajshahi' in cell_lower: matched_zone = 'Rajshahi'
                    elif 'rangpur' in cell_lower: matched_zone = 'Rangpur'
                    
                    if matched_zone:
                        right_cells = [c.strip() for c in parts[idx+1:] if c.strip()]
                        val = 0.0
                        if right_cells:
                            val = clean_float(right_cells[0])
                        regional_loadshed[matched_zone] = val
                        break
                    elif 'total' in cell_lower:
                        in_loadshed_section = False
                        break
                if not in_loadshed_section:
                    break

    # Extract outages from P1
    daily_outages = []
    current_outage = None
    for line in p1.split('\n'):
        parts = [p.strip() for p in line.split('|')]
        # Format 1: Tabular format (newer reports)
        if len(parts) >= 5:
            time_in = parts[2]
            time_out = parts[3]
            desc = parts[4]
            
            is_new = False
            if time_in and re.match(r'^\d{2}:\d{2}', time_in):
                is_new = True
            elif time_out and re.match(r'^\d{2}:\d{2}', time_out):
                is_new = True
                
            if is_new:
                time_val = f"{time_in} - {time_out}" if (time_in and time_out) else (time_in or time_out)
                plant_val = desc
                reason_val = ""
                for keyword in [' due to ', ' for ', ' Due to ']:
                    if keyword in desc:
                        split_parts = desc.split(keyword, 1)
                        plant_val = split_parts[0]
                        reason_val = keyword.strip() + " " + split_parts[1]
                        break
                for verb in [' was ', ' is ', ' tripped ', ' synchronized ', ' S/D ', ' Scheduled S/D ']:
                    if verb in plant_val:
                        plant_val = plant_val.split(verb, 1)[0]
                        break
                load_match = re.search(r'(\d+(?:\.\d+)?\s*MW)', desc, re.IGNORECASE)
                load_val = load_match.group(1) if load_match else "HT Outage"
                
                current_outage = {
                    'time': time_val,
                    'plant': plant_val.strip(),
                    'load': load_val,
                    'reason': reason_val.strip() if reason_val else desc.strip(),
                    'full_desc': desc
                }
                daily_outages.append(current_outage)
                continue
            elif current_outage and desc and len(parts) > 4 and not parts[1] and not parts[2] and not parts[3]:
                # Continuation of description line
                current_outage['full_desc'] += " " + desc
                desc_full = current_outage['full_desc']
                plant_val = desc_full
                reason_val = ""
                for keyword in [' due to ', ' for ', ' Due to ']:
                    if keyword in desc_full:
                        split_parts = desc_full.split(keyword, 1)
                        plant_val = split_parts[0]
                        reason_val = keyword.strip() + " " + split_parts[1]
                        break
                for verb in [' was ', ' is ', ' tripped ', ' synchronized ', ' S/D ', ' Scheduled S/D ']:
                    if verb in plant_val:
                        plant_val = plant_val.split(verb, 1)[0]
                        break
                load_match = re.search(r'(\d+(?:\.\d+)?\s*MW)', desc_full, re.IGNORECASE)
                load_val = load_match.group(1) if load_match else "HT Outage"
                
                current_outage['plant'] = plant_val.strip()
                current_outage['load'] = load_val
                current_outage['reason'] = reason_val.strip() if reason_val else desc_full.strip()
                continue
                
        # Format 2: Fallback to lettered list pattern (legacy reports)
        cells = [c.strip() for c in line.split('|') if c.strip()]
        if not cells:
            continue
        merged = ' '.join(cells)
        m = re.search(r'\b([a-z]{1,2})\)\s*([A-Z].*)', merged)
        if m:
            desc = m.group(2)
            time_match = re.search(r'((?:from|at|since|under)\s*\d{2}:\d{2}(?:\s*to\s*\d{2}:\d{2})?)', desc, re.IGNORECASE)
            time_val = time_match.group(1) if time_match else "Outage"
            
            plant_val = desc
            reason_val = ""
            for keyword in [' due to ', ' for ']:
                if keyword in desc:
                    parts_legacy = desc.split(keyword, 1)
                    plant_val = parts_legacy[0]
                    reason_val = keyword.strip() + " " + parts_legacy[1]
                    break
            for verb in [' was ', ' is ', ' tripped ', ' synchronized ']:
                if verb in plant_val:
                    plant_val = plant_val.split(verb, 1)[0]
                    break
            load_match = re.search(r'(\d+(?:\.\d+)?\s*MW)', desc, re.IGNORECASE)
            load_val = load_match.group(1) if load_match else "HT Outage"
            
            daily_outages.append({
                'time': time_val,
                'plant': plant_val.strip(),
                'load': load_val,
                'reason': reason_val.strip() if reason_val else desc.strip()
            })

    # Extract regional max load served from P3
    regional_served = {
        'Dhaka': 0.0, 'Chattogram': 0.0, 'Cumilla': 0.0, 'Mymensingh': 0.0,
        'Sylhet': 0.0, 'Khulna': 0.0, 'Barishal': 0.0, 'Rajshahi': 0.0, 'Rangpur': 0.0
    }
    if p3:
        for line in p3.split('\n'):
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                cells = [c.strip() for c in parts if c.strip()]
                for idx, cell in enumerate(cells):
                    cell_lower = cell.lower()
                    matched_zone = None
                    if 'dhaka area' in cell_lower: matched_zone = 'Dhaka'
                    elif 'chittagong area' in cell_lower or 'chattogram area' in cell_lower: matched_zone = 'Chattogram'
                    elif 'comilla area' in cell_lower or 'cumilla area' in cell_lower: matched_zone = 'Cumilla'
                    elif 'mymensingh area' in cell_lower: matched_zone = 'Mymensingh'
                    elif 'sylhet area' in cell_lower: matched_zone = 'Sylhet'
                    elif 'khulna area' in cell_lower: matched_zone = 'Khulna'
                    elif 'rajshahi area' in cell_lower: matched_zone = 'Rajshahi'
                    elif 'barisal area' in cell_lower or 'barishal area' in cell_lower: matched_zone = 'Barishal'
                    elif 'rangpur area' in cell_lower: matched_zone = 'Rangpur'
                    
                    if matched_zone:
                        val = 0.0
                        if idx + 1 < len(cells):
                            val = clean_float(cells[idx+1])
                        regional_served[matched_zone] = val

    # Combine load shedding and served to get regional demand
    regional_demand_data = []
    for zone in ['Dhaka', 'Chattogram', 'Cumilla', 'Mymensingh', 'Sylhet', 'Khulna', 'Barishal', 'Rajshahi', 'Rangpur']:
        shed = regional_loadshed[zone]
        served = regional_served[zone]
        demand = served + shed
        pct = (shed / demand * 100.0) if demand > 0.0 else 0.0
        regional_demand_data.append({
            'zone': zone,
            'loadShed': shed,
            'demand': round(demand, 2),
            'pct': round(pct, 1)
        })

    # Extract hourly load data from L-Curve (TOTAL column = index 3 in ERP pipe layout)
    hourly_load_data = []
    lcurve = get_sheet_content(content, 'L-Curve')
    if lcurve:
        for line in lcurve.split('\n'):
            if '|' not in line:
                continue
            parts = [p.strip() for p in line.split('|')]
            while parts and not parts[0]:
                parts.pop(0)
            if not parts:
                continue
            time_match = re.match(r'^(\d{2}:\d{2})(?::\d{2})?$', parts[0])
            if not time_match:
                continue
            time_str = time_match.group(1)
            if not time_str.endswith(':00'):
                continue
            gen_val = 0.0
            if len(parts) >= 4 and parts[3]:
                gen_val = clean_float(parts[3])
            elif len(parts) >= 5:
                gen_val = clean_float(parts[4])
            if gen_val <= 0:
                continue
            total_shed = sum(regional_loadshed.values())
            hour_shed = 0.0
            hour_int = int(time_str[:2])
            if 18 <= hour_int <= 23 and total_shed > 0.0:
                hour_shed = total_shed * 0.8
            demand_val = gen_val + hour_shed
            hourly_load_data.append({
                'time': time_str,
                'generation': gen_val,
                'loadShed': round(hour_shed, 2),
                'demand': round(demand_val, 2)
            })
    if not hourly_load_data:
        for h in range(24):
            time_str = f"{h:02d}:00"
            gen_val = evening_peak_gen if h >= 18 and h <= 22 else day_peak_gen
            hourly_load_data.append({
                'time': time_str,
                'generation': gen_val,
                'loadShed': 0.0,
                'demand': gen_val
            })

    # Extract fuel mix generation
    gas_gen, coal_gen, solar_gen, oil_gen, hydro_gen = 0.0, 0.0, 0.0, 0.0, 0.0
    wind_gen = 0.0
    total_imports = 0.0
    parsed_via_table = False

    # Look for Zone-wise Generation Summary (MKWHr.) table in P1
    header_idx = -1
    lines = p1.split('\n')
    for idx, line in enumerate(lines):
        if '|' in line:
            parts = [p.strip().lower() for p in line.split('|') if p.strip()]
            if 'gas' in parts and 'coal' in parts and 'hfo' in parts and 'total' in parts:
                header_idx = idx
                headers = parts
                break

    if header_idx != -1:
        for line in lines[header_idx + 1:]:
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                cells = [c for c in parts if c]
                if cells and cells[0].lower() == 'total':
                    val_map = {}
                    for h_idx, h in enumerate(headers):
                        if h_idx < len(cells) - 1:
                            val_map[h] = clean_float(cells[h_idx + 1])
                    
                    gas_gen = val_map.get('gas', 0.0)
                    coal_gen = val_map.get('coal', 0.0)
                    oil_gen = val_map.get('hfo', 0.0) + val_map.get('hsd', 0.0)
                    hydro_gen = val_map.get('hydro', 0.0)
                    solar_gen = val_map.get('solar', 0.0)
                    wind_gen = val_map.get('wind', 0.0)
                    total_imports = val_map.get('import', 0.0)
                    parsed_via_table = True
                    break

    if not parsed_via_table:
        # Fallback to search By Gas etc. in whole file
        for line in content.split('\n'):
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                for idx, cell in enumerate(parts):
                    cell_clean = cell.lower()
                    if 'by gas' in cell_clean:
                        if idx + 1 < len(parts): gas_gen = clean_float(parts[idx+1])
                    elif 'by coal' in cell_clean:
                        if idx + 1 < len(parts): coal_gen = clean_float(parts[idx+1])
                    elif 'by solar' in cell_clean:
                        if idx + 1 < len(parts): solar_gen = clean_float(parts[idx+1])
                    elif 'by oil' in cell_clean:
                        if idx + 1 < len(parts): oil_gen = clean_float(parts[idx+1])
                    elif 'by hydro' in cell_clean:
                        if idx + 1 < len(parts): hydro_gen = clean_float(parts[idx+1])

    # Import stats
    border_imports_data = []
    hvdc_gen, adani_gen, tripura_gen = 0.0, 0.0, 0.0
    hvdc_peak, adani_peak, tripura_peak = 0.0, 0.0, 0.0

    if parsed_via_table:
        # Newer files: parse from P1 interconnector section using cell keywords
        for line in p1.split('\n'):
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                cells = [c for c in parts if c]
                for idx, cell in enumerate(cells):
                    cell_lower = cell.lower()
                    if 'hvdc' in cell_lower and 'interconnector' in cell_lower:
                        if idx + 2 < len(cells): hvdc_gen = extract_first_number(cells[idx+2])
                        if idx + 4 < len(cells): hvdc_peak = extract_first_number(cells[idx+4])
                    elif 'adani' in cell_lower and 'interconnector' in cell_lower:
                        if idx + 2 < len(cells): adani_gen = extract_first_number(cells[idx+2])
                        if idx + 4 < len(cells): adani_peak = extract_first_number(cells[idx+4])
                    elif ('cumilla' in cell_lower or 'tripura' in cell_lower) and 'interconnector' in cell_lower:
                        if idx + 2 < len(cells): tripura_gen = extract_first_number(cells[idx+2])
                        if idx + 4 < len(cells): tripura_peak = extract_first_number(cells[idx+4])
    else:
        # Older files: parse from YesterdayGen or GenLog
        ygen_content = get_sheet_content(content, 'YesterdayGen') or get_sheet_content(content, 'GenLog')
        if ygen_content:
            lines = ygen_content.split('\n')
            name_row, kwh_row, peak_row = None, None, None
            for line in lines:
                if 'plant name' in line.lower():
                    name_row = line
                elif '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) > 1:
                        if parts[1] == 'KWH': kwh_row = line
                        elif parts[1] == 'Yesterday Evening Peak': peak_row = line
            
            if name_row and kwh_row and peak_row:
                names = [n.strip() for n in name_row.split('|')]
                kwhs = [k.strip() for k in kwh_row.split('|')]
                peaks = [p.strip() for p in peak_row.split('|')]
                
                for i in range(len(names)):
                    name = names[i]
                    k = clean_float(kwhs[i]) if i < len(kwhs) else 0.0
                    p = clean_float(peaks[i]) if i < len(peaks) else 0.0
                    name_lower = name.lower()
                    
                    if 'hvdc' in name_lower or 'bheramara (hvdc' in name_lower or 'bheramara hvdc' in name_lower:
                        hvdc_gen = k / 1000000.0
                        hvdc_peak = p
                    elif 'tripura' in name_lower or 'impoprt (tripura)' in name_lower:
                        tripura_gen = k / 1000000.0
                        tripura_peak = p
                    elif 'adani' in name_lower:
                        adani_gen = k / 1000000.0
                        adani_peak = p

    if hvdc_gen > 0.0 or hvdc_peak > 0.0:
        border_imports_data.append({'source': 'HVDC Bheramara (India)', 'energy': round(hvdc_gen, 2), 'peakFlow': hvdc_peak, 'type': 'C/B Interconnector (West)'})
    if adani_gen > 0.0 or adani_peak > 0.0:
        border_imports_data.append({'source': 'Adani Godda (India)', 'energy': round(adani_gen, 2), 'peakFlow': adani_peak, 'type': 'C/B Interconnector (North)'})
    if tripura_gen > 0.0 or tripura_peak > 0.0:
        border_imports_data.append({'source': 'Tripura Cumilla (India)', 'energy': round(tripura_gen, 2), 'peakFlow': tripura_peak, 'type': 'C/B Interconnector (East)'})

    if total_imports == 0.0:
        total_imports = hvdc_gen + adani_gen + tripura_gen

    avg_production_cost = 0.0
    if total_energy_gen > 0.0:
        avg_production_cost = total_daily_cost / (total_energy_gen * 1000000.0)
        
    generation_data = [
        { 'name': 'Gas', 'gen': round(gas_gen, 2), 'cost': int(gas_gen * 1000000 * 3.45), 'unitCost': 3.45, 'color': '#0ea5e9' },
        { 'name': 'Coal', 'gen': round(coal_gen, 2), 'cost': int(coal_gen * 1000000 * 6.62), 'unitCost': 6.62, 'color': '#64748b' },
        { 'name': 'HFO', 'gen': round(oil_gen, 2), 'cost': int(oil_gen * 1000000 * 18.06), 'unitCost': 18.06, 'color': '#f97316' },
        { 'name': 'Hydro', 'gen': round(hydro_gen, 2), 'cost': int(hydro_gen * 1000000 * 0.10), 'unitCost': 0.10, 'color': '#06b6d4' },
        { 'name': 'Solar', 'gen': round(solar_gen, 2), 'cost': int(solar_gen * 1000000 * 15.77), 'unitCost': 15.77, 'color': '#eab308' },
        { 'name': 'Imports', 'gen': round(total_imports, 2), 'cost': int(total_imports * 1000000 * 6.34), 'unitCost': 6.34, 'color': '#a855f7' },
        { 'name': 'HSD (Diesel)', 'gen': 0.0, 'cost': 0, 'unitCost': 0.0, 'color': '#ef4444' }
    ]

    total_unserved = sum(regional_loadshed.values()) * 4.0 / 1000.0
    total_demand = total_energy_gen + total_unserved
    formatted_date = op_date.strftime("%d %b %Y")

    return {
        'systemStats': {
            'date': formatted_date,
            'dayPeakGen': day_peak_gen,
            'eveningPeakGen': evening_peak_gen,
            'dayPeakDemand': round(day_peak_gen + sum(regional_loadshed.values()) * 0.5, 2),
            'eveningPeakDemand': evening_peak_demand,
            'minGen': min_gen if min_gen > 0.0 else day_peak_gen * 0.7,
            'maxGen': max_gen if max_gen > 0.0 else evening_peak_gen * 1.1,
            'totalEnergyGen': total_energy_gen,
            'totalEnergyUnserved': round(total_unserved, 2),
            'totalEnergyDemand': round(total_demand, 2),
            'maxTemp': 32.8,
            'totalGasSuppliedPower': total_gas_supplied_power,
            'avgProductionCost': round(avg_production_cost, 3),
            'totalDailyCost': int(total_daily_cost)
        },
        'generationData': generation_data,
        'borderImportsData': border_imports_data,
        'regionalDemandData': regional_demand_data,
        'dailyOutages': daily_outages,
        'hourlyLoadData': hourly_load_data
    }

def parse_petrobangla_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading Petrobangla file {filepath}: {e}")
        return None

    if 'II. Distribution' not in content:
        return None

    parts = content.split('II. Distribution')
    prod_sec = parts[0]
    dist_sec = parts[1]

    # Tokenize production section
    words = prod_sec.split()

    subtotals = [line for line in prod_sec.split('\n') if 'sub-total' in line.lower()]
    r_lng_gas = 0.0
    if subtotals:
        last_sub = subtotals[-1]
        nums = [float(x) for x in re.findall(r'[-+]?\d*\.\d+|\d+', last_sub)]
        if len(nums) >= 3:
            r_lng_gas = nums[2]

    bgfcl_gas, bgfcl_cond = 0.0, 0.0
    sgfl_gas, sgfl_cond = 0.0, 0.0
    bapex_gas, bapex_cond = 0.0, 0.0
    chevron_gas, chevron_cond = 0.0, 0.0
    tullow_gas, tullow_cond = 0.0, 0.0

    bgfcl_fields = ['Titas', 'Habiganj', 'Bakhrabad', 'Narsingdi', 'Meghna']
    sgfl_fields = ['Sylhet', 'Kailashtila', 'Rashidpur', 'Beanibazar']
    bapex_fields = ['Salda', 'Fenchuganj', 'Shahbazpur', 'Semutung', 'Sundalpur', 'Srikail', 'Begumganj', 'Rupganj']
    chevron_fields = ['Jalalabad', 'Maulavibazar', 'Bibiyana']

    for line in prod_sec.split('\n'):
        line_lower = line.lower()
        for f in bgfcl_fields:
            if f.lower() in line_lower:
                g, c = extract_production_values(line, f)
                bgfcl_gas += g
                bgfcl_cond += c
        for f in sgfl_fields:
            if f.lower() in line_lower:
                g, c = extract_production_values(line, f)
                sgfl_gas += g
                sgfl_cond += c
        for f in bapex_fields:
            if f.lower() in line_lower:
                g, c = extract_production_values(line, f)
                bapex_gas += g
                bapex_cond += c
        for f in chevron_fields:
            if f.lower() in line_lower:
                g, c = extract_production_values(line, f)
                chevron_gas += g
                chevron_cond += c
        if 'bangora' in line_lower:
            g, c = extract_production_values(line, 'Bangora')
            if g == 0.0:
                g, c = extract_production_values(line, 'Tullow')
            tullow_gas += g
            tullow_cond += c

    total_gas = bgfcl_gas + sgfl_gas + bapex_gas + chevron_gas + tullow_gas + r_lng_gas
    
    def get_share(val):
        return round(val / total_gas * 100.0, 1) if total_gas > 0.0 else 0.0

    gas_production_data = [
        { 'company': 'BGFCL (Titas, Habiganj, Bakhrabad)', 'fields': 5, 'gas': round(bgfcl_gas, 1), 'condensate': round(bgfcl_cond, 1), 'share': get_share(bgfcl_gas) },
        { 'company': 'SGFL (Sylhet, Rashidpur, Kailashtila)', 'fields': 5, 'gas': round(sgfl_gas, 1), 'condensate': round(sgfl_cond, 1), 'share': get_share(sgfl_gas) },
        { 'company': 'BAPEX (Shahbazpur, Srikail, Begumganj)', 'fields': 9, 'gas': round(bapex_gas, 1), 'condensate': round(bapex_cond, 1), 'share': get_share(bapex_gas) },
        { 'company': 'Chevron (Bibiyana, Jalalabad, Moulavibazar)', 'fields': 3, 'gas': round(chevron_gas, 1), 'condensate': round(chevron_cond, 1), 'share': get_share(chevron_gas) },
        { 'company': 'Tullow (Bangora)', 'fields': 1, 'gas': round(tullow_gas, 1), 'condensate': round(tullow_cond, 1), 'share': get_share(tullow_gas) },
        { 'company': 'RPGCL (R-LNG Import / LNG Terminal)', 'fields': 0, 'gas': round(r_lng_gas, 1), 'condensate': 0.0, 'share': get_share(r_lng_gas) }
    ]

    subtotal_lines = [line for line in dist_sec.split('\n') if 'sub-total' in line.lower()]
    is_vertical = True
    for line in subtotal_lines:
        nums = re.findall(r'[-+]?\d*\.\d+|\d+', line)
        if len(nums) >= 4:
            is_vertical = False
            break

    companies = [
        'TGTDCL (Dhaka & Mymensingh)',
        'BGDCL (Cumilla & Sylhet)',
        'KGDCL (Chattogram)',
        'JGTDSL (Sylhet region)',
        'PGCL (Rajshahi & Rangpur)',
        'SGCL (Barishal & Khulna)'
    ]
    
    gas_distribution_data = []

    if not is_vertical:
        for idx, line in enumerate(subtotal_lines[:6]):
            nums = [float(x) for x in re.findall(r'[-+]?\d*\.\d+|\d+', line)]
            power, fertilizer, others, total = 0.0, 0.0, 0.0, 0.0
            if len(nums) >= 6:
                power = nums[1]
                fertilizer = nums[3]
                others = nums[4]
                total = nums[5]
            elif len(nums) == 5:
                power = nums[1]
                fertilizer = 0.0
                others = nums[3]
                total = nums[4]
            gas_distribution_data.append({
                'company': companies[idx],
                'power': round(power, 1),
                'fertilizer': round(fertilizer, 1),
                'others': round(others, 1),
                'total': round(total, 1)
            })
    else:
        words = dist_sec.split()
        subtotal_indices = [i for i, w in enumerate(words) if w.lower() == 'sub-total']
        for idx, pos in enumerate(subtotal_indices[:6]):
            nums = []
            for j in range(pos + 1, len(words)):
                w_clean = re.sub(r'[^\d\-.]', '', words[j])
                if not w_clean:
                    break
                try:
                    nums.append(float(w_clean))
                except ValueError:
                    break
            
            if len(nums) >= 3 and nums[2] == 0.0:
                nums = nums[:5]
            else:
                nums = nums[:6]

            power, fertilizer, others, total = 0.0, 0.0, 0.0, 0.0
            if len(nums) >= 6:
                power = nums[1]
                fertilizer = nums[3]
                others = nums[4]
                total = nums[5]
            elif len(nums) == 5:
                power = nums[1]
                fertilizer = 0.0
                others = nums[3]
                total = nums[4]
                
            gas_distribution_data.append({
                'company': companies[idx] if idx < len(companies) else f"Company {idx}",
                'power': round(power, 1),
                'fertilizer': round(fertilizer, 1),
                'others': round(others, 1),
                'total': round(total, 1)
            })

    return {
        'gasProductionData': gas_production_data,
        'gasDistributionData': gas_distribution_data
    }

def process_single_date(op_date, pgcb_path, pb_path):
    pgcb_data = parse_pgcb_file(pgcb_path, op_date)
    if not pgcb_data:
        return None

    pb_data = None
    if pb_path:
        pb_data = parse_petrobangla_file(pb_path)

    merged = pgcb_data.copy()
    if pb_data:
        merged['gasProductionData'] = pb_data['gasProductionData']
        merged['gasDistributionData'] = pb_data['gasDistributionData']
    else:
        merged['gasProductionData'] = [
            { 'company': 'BGFCL (Titas, Habiganj, Bakhrabad)', 'fields': 5, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 },
            { 'company': 'SGFL (Sylhet, Rashidpur, Kailashtila)', 'fields': 5, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 },
            { 'company': 'BAPEX (Shahbazpur, Srikail, Begumganj)', 'fields': 9, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 },
            { 'company': 'Chevron (Bibiyana, Jalalabad, Moulavibazar)', 'fields': 3, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 },
            { 'company': 'Tullow (Bangora)', 'fields': 1, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 },
            { 'company': 'RPGCL (R-LNG Import / LNG Terminal)', 'fields': 0, 'gas': 0.0, 'condensate': 0.0, 'share': 0.0 }
        ]
        merged['gasDistributionData'] = [
            { 'company': 'TGTDCL (Dhaka & Mymensingh)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 },
            { 'company': 'BGDCL (Cumilla & Sylhet)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 },
            { 'company': 'KGDCL (Chattogram)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 },
            { 'company': 'JGTDSL (Sylhet region)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 },
            { 'company': 'PGCL (Rajshahi & Rangpur)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 },
            { 'company': 'SGCL (Barishal & Khulna)', 'power': 0.0, 'fertilizer': 0.0, 'others': 0.0, 'total': 0.0 }
        ]

    date_key = op_date.strftime("%Y-%m-%d")
    out_path = os.path.join(OUTPUT_DIR, f"{date_key}.json")
    try:
        with open(out_path, 'w', encoding='utf-8') as out_f:
            json.dump(merged, out_f, indent=2)
        return date_key
    except Exception as e:
        print(f"Error writing merged JSON for {date_key}: {e}")
        return None

def main():
    print("Starting daily reports parsing and compilation pipeline...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    pgcb_files = os.listdir(PGCB_DIR)
    pb_files = os.listdir(PB_DIR)

    pgcb_mapping = {}
    for f in pgcb_files:
        dt = parse_date_from_filename(f)
        if dt:
            op_date = dt - datetime.timedelta(days=1)
            pgcb_mapping[op_date] = os.path.join(PGCB_DIR, f)

    pb_mapping = {}
    for f in pb_files:
        dt = parse_date_from_filename(f)
        if dt:
            op_date = dt - datetime.timedelta(days=1)
            pb_mapping[op_date] = os.path.join(PB_DIR, f)

    all_dates = sorted(list(pgcb_mapping.keys()))
    print(f"Total operational dates available in PGCB: {len(all_dates)}")

    success_dates = []
    
    def process_task(op_date):
        pgcb_path = pgcb_mapping[op_date]
        pb_path = pb_mapping.get(op_date)
        return process_single_date(op_date, pgcb_path, pb_path)

    print("Engaging multithreaded compiler engine (8 threads)...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(process_task, all_dates)
        for r in results:
            if r:
                success_dates.append(r)

    success_dates.sort()
    print(f"Successfully compiled {len(success_dates)} daily records.")

    os.makedirs(os.path.dirname(DATES_OUTPUT_PATH), exist_ok=True)
    with open(DATES_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(success_dates, f, indent=2)
    print(f"Index written to {DATES_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
