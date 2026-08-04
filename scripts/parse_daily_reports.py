import os
import re
import json
import datetime
from concurrent.futures import ThreadPoolExecutor

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_USER_HOME = os.environ.get("USERPROFILE") or os.environ.get("HOME") or ""

PGCB_DIR = os.environ.get(
    "ESB_PGCB_PARSED_DIR",
    os.path.join(_USER_HOME, "Desktop", "PGCB", "Daily Reports - D", "Daily Reports Parsed") if _USER_HOME else "",
)
PB_DIR = os.environ.get(
    "ESB_PB_PARSED_DIR",
    os.path.join(_USER_HOME, "Desktop", "Petrobangla", "Daily Gas Reports - D", "Daily Gas Reports Parsed") if _USER_HOME else "",
)
OUTPUT_DIR = os.environ.get("ESB_DAILY_OUTPUT_DIR", os.path.join(_REPO_ROOT, "public", "data", "daily"))
DATES_OUTPUT_PATH = os.environ.get("ESB_AVAILABLE_DATES_PATH", os.path.join(_REPO_ROOT, "lib", "available-dates.json"))

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

def norm_text(val):
    return ' '.join(str(val).lower().split())

def split_cells(line):
    return [c.strip() for c in line.split('|') if c.strip()]

def is_new_p1_layout(p1):
    """True for the 2025+ P1, which states both daily extremes for the reported day.

    Before that the sheet is two columns — left "The Summary of Yesterday's
    Generation & Demand", right "Today's Actual Min Gen. & Probable Gen. &
    Demand" — and only the left column belongs to the day being reported.
    The changeover lands between the reports published 2024-12-30 and
    2025-01-05.
    """
    return bool(re.search(r'minimum generation of the day', p1, re.I))

def forecast_reported_section(forecast):
    """The part of the old Forecast sheet that describes the REPORTED day.

    That sheet carries two summaries separated by a lone "Forecast" cell.
    Above it, items 1-7 restate the reported day's actuals (Highest
    Generation, Minimum Generation, Total Gas Supplied, Total Energy
    Generation); below it, items 1-5 project the NEXT day, including
    "Maximum Generation (Generation end)".

    Scanning the whole sheet lets the projection overwrite the actuals, which
    is how every archived day acquired the following day's max generation.
    The divider is present on every old-layout workbook checked, always with
    the reported-day block above it.
    """
    lines = forecast.split('\n')
    for idx, line in enumerate(lines):
        if split_cells(line) == ['Forecast']:
            return '\n'.join(lines[:idx])
    return forecast

def labelled_value(block, pattern, reject=None):
    """First positive number following a cell whose normalised text matches `pattern`.

    Patterns are anchored by their callers so that "Maximum Generation :"
    cannot be satisfied by "Till now the maximum generation is :" (an
    all-time record, not a daily figure) or by "Actual Minimum Generation up
    to 8:00 hrs." (the publication day's trough, not the reported day's).

    `reject` is a second guard for blocks that state the same measure twice
    for two different days: the old Forecast sheet carries both "Maximum
    Temperature in Dhaka was 32.4 C" (the reported day) and "Probable max.
    temperature in Dhaka 34.4 C" (tomorrow), and only the anchor stands
    between them.
    """
    for line in block.split('\n'):
        cells = split_cells(line)
        for idx, cell in enumerate(cells):
            text = norm_text(cell)
            if reject and re.search(reject, text):
                continue
            if re.search(pattern, text):
                for nxt in cells[idx + 1:]:
                    val = clean_float(nxt)
                    if val > 0.0:
                        return val
                break
    return None

def lcurve_total_series(content):
    """Half-hourly national generation from the L-Curve sheet, keyed by "HH:MM".

    The TOTAL column is located from the header rather than a fixed offset.
    It sits at index 3 on the 2025+ sheet (TIME|EAST|WEST|TOTAL) but at index
    4 on the older one (TIME|E-W INT.(Export)|EAST|WEST|TOTAL), where a fixed
    index 3 silently yields West Grid — roughly a third of the national
    total — instead.
    """
    lcurve = get_sheet_content(content, 'L-Curve')
    if not lcurve:
        return {}
    total_idx = None
    series = {}
    for line in lcurve.split('\n'):
        if '|' not in line:
            continue
        parts = [p.strip() for p in line.split('|')]
        while parts and not parts[0]:
            parts.pop(0)
        if not parts:
            continue
        upper = [p.upper() for p in parts]
        if total_idx is None:
            if upper[0] == 'TIME' and 'TOTAL' in upper:
                total_idx = upper.index('TOTAL')
            continue
        m = re.match(r'^(\d{2}:\d{2})(?::\d{2})?$', parts[0])
        if not m or total_idx >= len(parts):
            continue
        # Older sheets close with a 24:00 row. That instant is midnight
        # *ending* the day — the next day's 00:00 — so it is left out of both
        # the charted curve and the extremes.
        if m.group(1) == '24:00':
            continue
        val = clean_float(parts[total_idx])
        if val > 0.0:
            series[m.group(1)] = val
    return series

def published_demand_stats(p1, forecast):
    """Figures P1 states outright that the site used to estimate instead.

    All four sit in P1's right-hand column beside the generation figures, and
    every one was being replaced by a formula: max temperature by the constant
    32.8 (so every day since 2013 showed the same weather), unserved energy by
    load-shed x 4 / 1000 (which understated 2026-06-04 as 1.44 MKWh against a
    published 5.529), and peak/total demand by generation plus that estimate.

    Note the source's own spelling, "Energy Unserverd". Returns None per field
    where the layout does not publish it, rather than a substitute.
    """
    block = p1 + "\n" + forecast_reported_section(forecast)
    return {
        'dayPeakDemand': labelled_value(block, r'^day peak demand'),
        'totalEnergyUnserved': labelled_value(block, r'^energy unserve'),
        'totalEnergyDemand': labelled_value(block, r'^energy demand'),
        # "probable" is tomorrow's forecast and sits in the same block.
        'maxTemp': labelled_value(block, r'^max(imum)?\.? temp', reject=r'probable|forecast'),
    }


def evening_peak_hour(p1):
    """The hour PGCB stamps on the evening peak, as "HH:00".

    The published load-shed figure belongs to this hour and no other, so the
    chart needs to know which one it is rather than smearing it across a range.
    """
    for line in p1.split('\n'):
        cells = split_cells(line)
        for idx, cell in enumerate(cells):
            if re.search(r'^evening peak generation', norm_text(cell)):
                for nxt in cells[idx + 1:]:
                    m = re.match(r'^(\d{1,2}):(\d{2})', nxt.strip())
                    if m:
                        return f"{int(m.group(1)):02d}:00"
    return None


def published_fuel_costs(p1):
    """Per-fuel production cost in Taka, from P1's "Production Cost (Tk.)" block.

    The block lists fuels in two column pairs (Gas/Hydro, Coal/Solar,
    HFO/Import, HSD/Wind). These are PGCB's own costs; the site was pricing
    every fuel with a hardcoded tariff instead, which on 2026-06-04 overstated
    HFO by 29.4M Tk and imports by 31.7M Tk, and priced gas at 3.45 Tk/kWh
    against a published 3.52.
    """
    costs = {}
    started = False
    for line in p1.split('\n'):
        cells = split_cells(line)
        if not cells:
            continue
        # The older sheet writes the same figures inline under "Cost of the
        # Consumed Fuel (PDB+Pvt)", labelling them "Gas :", "Coal :", "Oil :"
        # — Oil being what the newer layout splits into HFO and HSD. Reading
        # these keeps real costs on pre-2025 days instead of nulling them.
        if any('cost of the consumed fuel' in norm_text(c) for c in cells):
            started = True
        if started:
            for idx, cell in enumerate(cells[:-1]):
                label = norm_text(cell).rstrip(':').strip()
                canon = {'gas': 'Gas', 'coal': 'Coal', 'oil': 'HFO'}.get(label)
                if canon and re.search(r'\d', cells[idx + 1]):
                    costs.setdefault(canon, clean_float(cells[idx + 1]))
        if any('production cost' in norm_text(c) for c in cells):
            started = True
            continue
        if not started:
            continue
        # The block ends at the next section heading — a row with no numbers.
        found = False
        for idx, cell in enumerate(cells[:-1]):
            name = norm_text(cell)
            if name in FUEL_ALIASES:
                val = clean_float(cells[idx + 1])
                if cells[idx + 1] and re.search(r'\d', cells[idx + 1]):
                    costs[FUEL_ALIASES[name]] = val
                    found = True
        if not found and costs and not any(re.search(r'\d', c) for c in cells):
            break
    return costs


# Canonical fuel names as the site labels them, keyed by the source's spelling.
FUEL_ALIASES = {
    'gas': 'Gas', 'coal': 'Coal', 'hfo': 'HFO', 'hsd': 'HSD',
    'hydro': 'Hydro', 'solar': 'Solar', 'import': 'Imports', 'wind': 'Wind',
}
FUEL_COLORS = {
    'Gas': '#0ea5e9', 'Coal': '#64748b', 'HFO': '#f97316', 'Hydro': '#06b6d4',
    'Solar': '#eab308', 'Imports': '#a855f7', 'HSD': '#ef4444', 'Wind': '#22c55e',
}
# Order the site has always rendered these in; Wind is appended because it only
# appears in the newer layout.
FUEL_ORDER = ['Gas', 'Coal', 'HFO', 'Hydro', 'Solar', 'Imports', 'HSD', 'Wind']


def daily_extremes(p1, forecast, series):
    """(minGen, maxGen) for the day the report describes; None where unknown.

    PGCB's own definitions, verified against the load curve on both layouts:
    "Maximum Generation" is the peak of the day's TOTAL curve, and "Minimum
    Generation" is the 08:00 morning trough — NOT the curve's global minimum,
    which can sit lower during an evening dip (2022-07-01: 9944 MW at 18:00
    against a stated 10047 MW at 08:00).

    The printed figure wins where the sheet states one for the reported day;
    the curve is the fallback, and both being absent yields None rather than
    a number derived from an unrelated peak.
    """
    if is_new_p1_layout(p1):
        min_gen = labelled_value(p1, r'^minimum generation of the day')
        max_gen = labelled_value(p1, r'^maximum generation of the day')
    else:
        reported = forecast_reported_section(forecast)
        # P1's left column and the Forecast sheet's pre-divider block state
        # the same two figures; either is authoritative for the reported day.
        max_gen = (labelled_value(p1, r'^maximum\s+generation\s*:?$')
                   or labelled_value(reported, r'^highest generation\s*:?$'))
        min_gen = labelled_value(reported, r'^minimum generation\s*:?$')

    if max_gen is None and series:
        max_gen = max(series.values())
    if min_gen is None:
        min_gen = series.get('08:00')
    return min_gen, max_gen

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

    # The Forecast sheet is still read, but only the part of it that restates
    # the REPORTED day, and only for figures it alone carries: early-2025 P1s
    # omit Total Gas Supplied, and older ones omit it and the daily extremes
    # too. Everything the two sheets share, they agree on.
    #
    # What this no longer does is scan the next-day half. The daily extremes
    # are the one genuinely forward-looking pair here and they are now derived
    # separately, by daily_extremes, from labels tied to the reported day.
    stats_content = p1 + "\n" + forecast_reported_section(forecast)
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

    # Hourly load from the L-Curve TOTAL column, located by header (see
    # lcurve_total_series). The curve is half-hourly; the on-the-hour points
    # are what the site charts.
    #
    # Only `generation` is measured hourly. PGCB publishes load shedding at the
    # evening peak hour alone, so the previous per-hour figures — total shed
    # x 0.8 spread across 18:00-23:00, with demand as generation plus that —
    # were invented, and the chart presented them as SCADA logs. The published
    # evening-peak pair is attached to its own hour and nothing is spread.
    hourly_load_data = []
    lcurve_series = lcurve_total_series(content)
    peak_hour, peak_shed = evening_peak_hour(p1), sum(regional_loadshed.values())
    if lcurve_series:
        for time_str, gen_val in sorted(lcurve_series.items()):
            if not time_str.endswith(':00'):
                continue
            is_peak = peak_hour is not None and time_str == peak_hour and peak_shed > 0.0
            # Demand at that hour is the figure P1 prints as Evening Peak
            # Demand, not generation plus shedding — PGCB reports 15275.03 for
            # 2026-06-04 where the sum gives 15259.03.
            hourly_load_data.append({
                'time': time_str,
                'generation': gen_val,
                'loadShed': round(peak_shed, 2) if is_peak else None,
                'demand': (evening_peak_demand or round(gen_val + peak_shed, 2)) if is_peak else None,
            })
    # A report without a load-curve sheet gets no curve. This used to fabricate
    # one — a flat line at the day peak, stepping to the evening peak for
    # 18:00-22:00 — which charted as though it were a measured profile.

    # Uses the full half-hourly curve, not the charted hourly subset, so a
    # peak falling on a half hour is not missed.
    min_gen, max_gen = daily_extremes(p1, forecast, lcurve_series)

    # Extract fuel mix generation
    gas_gen, coal_gen, solar_gen, oil_gen, hydro_gen = 0.0, 0.0, 0.0, 0.0, 0.0
    wind_gen = 0.0
    total_imports = 0.0
    parsed_via_table = False
    fuel_gen = {}

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
                    # Keep each published fuel under its own name. Folding HSD
                    # into HFO and dropping Wind entirely lost two of the eight
                    # fuels PGCB reports.
                    for src_name, canon in FUEL_ALIASES.items():
                        if src_name in val_map:
                            fuel_gen[canon] = val_map[src_name]
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
        
    # Fuel costs come from P1's own "Production Cost (Tk.)" block. They used to
    # be generation x a hardcoded tariff, which is why the site showed gas at a
    # flat 3.45 Tk/kWh on every day PGCB has ever published; the real figure
    # moves daily (3.52 on 2026-06-04). `unitCost` is now derived from the two
    # published numbers rather than being the input to one of them.
    published_costs = published_fuel_costs(p1)
    if not fuel_gen:
        fuel_gen = {'Gas': gas_gen, 'Coal': coal_gen, 'HFO': oil_gen,
                    'Hydro': hydro_gen, 'Solar': solar_gen, 'Imports': total_imports}
    fuel_gen.setdefault('Imports', total_imports)

    generation_data = []
    for name in FUEL_ORDER:
        gen = float(fuel_gen.get(name) or 0.0)
        cost = published_costs.get(name)
        if gen <= 0.0 and not cost and name in ('Wind', 'HSD'):
            # Only carried when the layout reports them at all.
            if name not in fuel_gen and name not in published_costs:
                continue
        unit = round(cost / (gen * 1000000.0), 4) if (cost and gen > 0.0) else None
        generation_data.append({
            'name': name,
            'gen': round(gen, 2),
            'cost': int(cost) if cost is not None else None,
            'unitCost': unit,
            'color': FUEL_COLORS[name],
        })

    published = published_demand_stats(p1, forecast)
    total_unserved = published['totalEnergyUnserved']
    total_demand = published['totalEnergyDemand']
    formatted_date = op_date.strftime("%d %b %Y")

    return {
        'systemStats': {
            'date': formatted_date,
            'dayPeakGen': day_peak_gen,
            'eveningPeakGen': evening_peak_gen,
            # Published, not inferred. This was day-peak generation plus half
            # the day's load shedding, which is not a figure PGCB reports.
            'dayPeakDemand': published['dayPeakDemand'],
            'eveningPeakDemand': evening_peak_demand,
            # null, not a multiple of an unrelated peak: a day whose source
            # states no extremes and carries no load curve has no basis for
            # these, and a fabricated number is indistinguishable from a
            # measured one once it is in the archive.
            'minGen': min_gen,
            'maxGen': max_gen,
            'totalEnergyGen': total_energy_gen,
            'totalEnergyUnserved': round(total_unserved, 3) if total_unserved is not None else None,
            'totalEnergyDemand': round(total_demand, 3) if total_demand is not None else None,
            # The source prints the day's maximum temperature. This was the
            # constant 32.8, shown identically on every day since 2013.
            'maxTemp': published['maxTemp'],
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
