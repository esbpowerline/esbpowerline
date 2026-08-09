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

def _sheet_key(name):
    """A sheet name reduced to what identifies it, ignoring how it is punctuated."""
    return re.sub(r'[^a-z0-9]', '', str(name).lower())


def get_sheet_content(content, sheet_name):
    """The body of one sheet, matched on name however PGCB punctuated it.

    The same sheet is spelled several ways across the archive — "L-Curve" and
    "L.curve", "En-Curve" and "En.curve" and "En curve", "P1" and "P 1" — and an
    exact match silently returns nothing for the variants. Two consequences were
    live: 2014-04-11 published with a zero day peak, zero evening peak and zero
    energy because its sheet is called "P 1", and the whole 2014-2018 range was
    recorded as having no energy curve when in fact 414 workbooks carry one
    under "En.curve".

    Matched on the whole name, not a prefix, so "P1" cannot take "P10".
    """
    wanted = _sheet_key(sheet_name)
    for m in re.finditer(r'## Sheet:\s*(.*)', content):
        if _sheet_key(m.group(1)) != wanted:
            continue
        rest = content[m.end():]
        nxt = rest.find('## Sheet:')
        return rest[:nxt] if nxt != -1 else rest
    return ""

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

def parse_hourly_shed(content):
    """The P4 sheet: generation, load shedding and demand for every published hour.

    "Hourly Demand, Generation & Load-Shed Report" — the one sheet that states
    all three together. Nothing in this repo read it before, which is why the
    archive carries an hourly generation curve with load shedding and demand
    null on all 24 points: PGCB was assumed to publish that pair for the evening
    peak alone, and P1 does. P4 publishes it every hour.

    Its row set is PGCB's own choice — the 24 hours plus the evening-peak half
    hour, 25 rows — so 19:30 arrives with the rest instead of being dropped for
    not landing on the hour.

    Columns are located from the header row rather than by offset; the blank
    spacer columns between them are why the raw split is kept positional here
    instead of going through `split_cells`, which discards empties and would
    slide every data row one place against its own header.

    Returns [{'time', 'generation', 'loadShed', 'demand'}], or [] when the
    sheet is absent — true of every workbook before the 2025 layout.
    """
    # P4 from 2025; before that the same three columns are on "Daily Gen",
    # headed "Hourly Generation & Demand". Nothing read either, which is why
    # every pre-2025 day carries an hourly curve with demand and shedding null.
    p4 = get_sheet_content(content, 'P4') or get_sheet_content(content, 'Daily Gen')
    if not p4:
        return []

    # PGCB has called the unserved column Load-Shed and Shortage in different
    # years; they are the same measure.
    want = {'generation': 'generation', 'load-shed': 'loadShed',
            'loadshed': 'loadShed', 'shortage': 'loadShed', 'demand': 'demand'}
    col = {}
    rows = []
    for line in p4.split('\n'):
        if '|' not in line:
            continue
        parts = [p.strip() for p in line.split('|')]
        if not col:
            # "Hour" on the 2025 sheet, "Time" on the older one.
            hour_idx = next((i for i, p in enumerate(parts) if norm_text(p) in ('hour', 'time')), None)
            if hour_idx is None:
                continue
            for i, p in enumerate(parts[hour_idx + 1:], start=hour_idx + 1):
                key = want.get(norm_text(p))
                if key and key not in col:
                    col[key] = i
            # A header naming neither of the two figures this exists to recover
            # is not the header — keep looking rather than reading a title row.
            if 'loadShed' not in col or 'demand' not in col:
                col = {}
                continue
            col['_hour'] = hour_idx
            continue

        hour = parts[col['_hour']] if col['_hour'] < len(parts) else ''
        m = re.match(r'^(\d{1,2}:\d{2})(?::\d{2})?$', hour)
        # Same convention as the load curve: a closing 24:00 row is the next
        # day's midnight and belongs to neither day's profile.
        if not m or m.group(1) == '24:00':
            continue
        time_str = m.group(1).zfill(5)
        gen = clean_float(parts[col['generation']]) if col.get('generation', 99) < len(parts) else 0.0
        if gen <= 0.0:
            continue
        shed = clean_float(parts[col['loadShed']]) if col['loadShed'] < len(parts) else 0.0
        demand = clean_float(parts[col['demand']]) if col['demand'] < len(parts) else 0.0
        rows.append({
            'time': time_str,
            'generation': gen,
            # Zero shedding is a measurement, not a gap — PGCB prints 0 on the
            # hours it served everything, and nulling those would put the chart
            # back to showing an absence where there is a published figure.
            'loadShed': round(shed, 2),
            'demand': round(demand, 2) if demand > 0.0 else None,
        })
    return rows


def hourly_shed_from_yesterday_gen(content):
    """The hourly triple for 2018-2024, which publish it on no sheet of its own.

    Those workbooks have neither P4 nor Daily Gen, but the YesterdayGen matrix
    carries a national "Total (MW)" column and a "Shortage" column beside the
    stations, which is generation and unserved load at the same hourly stamps.

    Demand stays null. The two sheets that do publish it state demand outright
    rather than as generation plus shedding, and the difference is real — 15,275
    against a summed 15,259 on 2026-06-04 — so deriving it here would put a
    figure in a column that is meant to hold only published ones.
    """
    log = parse_yesterday_gen(content)
    if not log:
        return []
    national = (log.get('totals') or {}).get('national') or []
    shortage = (log.get('totals') or {}).get('shortage') or []
    if not national:
        return []
    return [
        {
            'time': hour,
            'generation': national[i],
            'loadShed': round(shortage[i], 2) if i < len(shortage) else None,
            'demand': None,
        }
        for i, hour in enumerate(log['hours'])
        if national[i] > 0
    ]

# Every series the En-Curve sheet has carried, under one set of names. Held as a
# list rather than read blindly from the header so a renamed or reordered column
# is visible as a parse failure instead of silently changing what a series means.
#
# `Oil-Public`/`Oil-Pvt` exist only for the 2018-2021 sheets, which report oil as
# one column instead of splitting HFO from HSD. They are kept separate rather
# than folded into HFO because the source does not say how much of that oil was
# which, and filing it all under HFO would invent a split.
ENERGY_CURVE_FUELS = (
    'Gas-Public', 'Gas-Pvt', 'HVDC', 'Nepal', 'Tripura', 'Adani', 'Hydro',
    'Coal', 'Solar', 'HFO-Public', 'HFO-Pvt', 'HSD-Public', 'HSD-Pvt',
    'Oil-Public', 'Oil-Pvt', 'Wind', 'Shortage',
)

# What each layout calls those series. PGCB has renamed this sheet's columns
# three times, and matching only the current names is not a safe failure: the
# 2022-2024 header shares exactly seven names with the 2025 one — HVDC, Tripura,
# Hydro, Coal, Solar, Wind, Shortage — so the sheet parsed "successfully" while
# every gas and oil column was dropped. The chart then stacked about a third of
# the day's generation and presented it as the whole fuel mix.
#
#   2018-2020  GAS HVDC P.GEN(GAS). P.GEN(OIL). COAL HYDRO OIL SHORTAGE TRIPURA
#   2021       + SOLAR
#   2022-2024  GAS HVDC P.GEN(GAS). P.GEN(HSD) P.GEN(HFO). COAL HYDRO
#              G.GEN(HSD) G.GEN(HFO) TRIPURA SOLAR [WIND from 2023] SHORTAGE
#   2025+      the canonical names above
#
# "G.GEN" is government generation and "P.GEN" private, which is the same split
# the 2025 sheet writes as -Public and -Pvt.
ENERGY_CURVE_ALIASES = {
    'gas': 'Gas-Public',
    'p.gen(gas).': 'Gas-Pvt',
    'p.gen(gas)': 'Gas-Pvt',
    'g.gen(hfo)': 'HFO-Public',
    'p.gen(hfo).': 'HFO-Pvt',
    'p.gen(hfo)': 'HFO-Pvt',
    'g.gen(hsd)': 'HSD-Public',
    'p.gen(hsd)': 'HSD-Pvt',
    'oil': 'Oil-Public',
    'p.gen(oil).': 'Oil-Pvt',
    'p.gen(oil)': 'Oil-Pvt',
}

# The stack, less Shortage, is the national total the L-Curve sheet also states.
# Two independently printed sheets agreeing is what makes a partial column match
# detectable; without it a missing column just looks like a quiet day.
#
# Judged on the MEDIAN relative gap, not on how many rows clear a tolerance. The
# two failure modes look nothing alike: an unmatched column is missing from every
# row, so the median moves to roughly that fuel's share — tens of percent — while
# PGCB's own sheets disagreeing on a handful of half hours leaves the median at
# zero. A count-based rule cannot tell them apart, and set anywhere sensible it
# separated 2021-01-01 (42 of 48 rows exact) from 2021-01-04 (44 of 48) as though
# they were different in kind.
ENERGY_CURVE_MAX_MEDIAN_GAP = 0.05
ENERGY_CURVE_MIN_CHECKED_ROWS = 12

def parse_energy_curve(content):
    """The En-Curve sheet: half-hourly generation split by fuel and by importer.

    The daily fuel mix the site already shows is one number per fuel for the
    whole day. This is the same split every half hour — 48 points across 15
    columns — so the shape of the day can be read rather than its total: coal
    flat through the night, solar arriving at 06:00 and gone by 18:00, HFO
    called up for the evening peak.

    It also names the four imports separately (HVDC Bheramara, Nepal, Tripura,
    Adani) where `borderImportsData` carries three and no Nepal at all, and it
    splits public from private generation, which nothing else here does.

    "Shortage" is the same measure P4 calls Load-Shed, at half-hour resolution.

    Columns are matched by name — through ENERGY_CURVE_ALIASES, since PGCB has
    renamed them three times — and read positionally, so the title block printed
    to the right of the data (which varies row to row) cannot be mistaken for a
    series.

    Before returning, the stack is checked against the L-Curve sheet's own
    national total. A name-based matcher fails quietly when a layout changes:
    the columns it still recognises parse, the rest come back null, and the
    result looks like a valid but unusually low day. Only a second sheet stating
    the same total catches that.

    Returns {'fuels': [...], 'rows': [{'time', 'mw': [...]}]} or None.
    """
    curve = get_sheet_content(content, 'En-Curve')
    if not curve:
        return None

    def canonical(cell):
        text = norm_text(cell)
        if text in ENERGY_CURVE_ALIASES:
            return ENERGY_CURVE_ALIASES[text]
        for fuel in ENERGY_CURVE_FUELS:
            if text == norm_text(fuel):
                return fuel
        return None

    idx_of = {}
    rows = []
    for line in curve.split('\n'):
        if '|' not in line:
            continue
        parts = [p.strip() for p in line.split('|')]
        if not idx_of:
            if not any(norm_text(p) == 'time' for p in parts):
                continue
            for i, p in enumerate(parts):
                fuel = canonical(p)
                if fuel and fuel not in idx_of:
                    idx_of[fuel] = i
            # The thinnest layout still carries nine columns; fewer than that
            # and this is a title row that happens to say "time".
            if len(idx_of) < 8:
                idx_of = {}
            continue

        m = re.match(r'^(\d{1,2}:\d{2})(?::\d{2})?$', parts[1] if len(parts) > 1 else '')
        if not m or m.group(1) == '24:00':
            continue
        mw = []
        for fuel in ENERGY_CURVE_FUELS:
            i = idx_of.get(fuel)
            # None, not 0: a column this workbook does not carry is unknown,
            # and charting it as zero output would be a claim the source
            # never makes.
            if i is None or i >= len(parts) or parts[i] == '':
                mw.append(None)
            else:
                mw.append(clean_float(parts[i]))
        if all(v in (None, 0.0) for v in mw):
            continue
        rows.append({'time': m.group(1).zfill(5), 'mw': mw})

    if len(rows) < 12:
        return None

    # The stack must reproduce the load curve. Shortage is unserved load, not
    # generation, so it is left out of the sum.
    shortage_at = ENERGY_CURVE_FUELS.index('Shortage')
    series = lcurve_total_series(content)
    if series:
        gaps = []
        for row in rows:
            published = series.get(row['time'])
            if not published:
                continue
            stacked = sum(v for i, v in enumerate(row['mw']) if v is not None and i != shortage_at)
            gaps.append(abs(stacked - published) / published)
        if len(gaps) >= ENERGY_CURVE_MIN_CHECKED_ROWS:
            gaps.sort()
            median = gaps[len(gaps) // 2]
            if median > ENERGY_CURVE_MAX_MEDIAN_GAP:
                return None

    return {'fuels': list(ENERGY_CURVE_FUELS), 'rows': rows}

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


TIME_CELL = re.compile(r'^\d{1,2}:\d{2}(?::\d{2})?$')
# "not applicable" markers PGCB puts in a time column it has nothing for.
PLACEHOLDER_CELL = re.compile(r'^[-–—.]+$|^n/?a$', re.IGNORECASE)
# P1's hourly remarks share the event table's shape — a time cell followed by
# a sentence — so they have to be excluded by content: "12:00 | Day Peak
# Generation is 14740 MW." is a restatement of a headline figure, not an outage.
NOT_AN_EVENT = re.compile(
    r'^(day|evening)\s+peak\s+(generation|demand)\b'
    r'|^(minimum|maximum)\s+generation\b'
    r'|^total\s+(gen|energy)\b'
    r'|^load\s*shed(ding)?\s*(is|:)',
    re.IGNORECASE,
)


def split_event_text(desc, load_cell=None):
    """Asset, cause and lost load teased out of one free-text event description."""
    plant_val, reason_val = desc, ""
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
    load_match = re.search(r'(\d+(?:\.\d+)?\s*MW)', load_cell or '', re.IGNORECASE) \
        or re.search(r'(\d+(?:\.\d+)?\s*MW)', desc, re.IGNORECASE)
    return (
        plant_val.strip(),
        reason_val.strip() if reason_val else desc.strip(),
        load_match.group(1) if load_match else "HT Outage",
    )


def outage_row(line):
    """(time_in, time_out, description, load_cell) for an event row, else None.

    Columns are found by shape, not offset. They sit at parts[2..4] on the
    2025+ sheet but at parts[1..3] on the older one, which has no leading
    spacer column — so reading the newer offsets against an older report put
    the restoration time in `time`, the description in `time_out`, and left
    plant, reason and load empty on every pre-2025 day in the archive. The
    header row cannot be used to align them either: its cells are merged and
    do not line up with the data beneath.
    """
    cells = [c.strip() for c in line.split('|')]
    idx = [i for i, c in enumerate(cells) if c]
    # A restoration-only entry leaves the outage-time column as a dash:
    # "| - | 10:34 | Rajshahi 132/33kV S/S Main Bus is restored. |". Treating
    # that dash as content stopped 170 days' worth of these from parsing.
    while idx and PLACEHOLDER_CELL.match(cells[idx[0]]):
        idx = idx[1:]
    if not idx or not TIME_CELL.match(cells[idx[0]]):
        return None
    time_in, rest = cells[idx[0]], idx[1:]
    time_out = ''
    if rest and TIME_CELL.match(cells[rest[0]]):
        time_out, rest = cells[rest[0]], rest[1:]
    desc_at = next((i for i in rest if len(cells[i]) > 12 and re.search(r'[A-Za-z]{3}', cells[i])), None)
    if desc_at is None or NOT_AN_EVENT.match(cells[desc_at]):
        return None
    load_cell = next(
        (cells[i] for i in rest if i > desc_at and re.search(r'\d+(?:\.\d+)?\s*MW', cells[i], re.I)),
        None,
    )
    return time_in, time_out, cells[desc_at], load_cell, desc_at


# Headings that sit alone in a cell and would otherwise be swallowed into the
# preceding event as if they were wrapped description text.
SECTION_HEADING = re.compile(
    r'^(event summary|description of event|planned|forced|status of unavailable'
    r'|zone-?wise|total|remarks|outage time|restoration time)\b',
    re.IGNORECASE,
)


def outage_continuation(line, desc_col):
    """The wrapped tail of the previous event's description, or None.

    Keyed to the column the description itself occupied, because a wrapped row
    is not necessarily a lone cell: on 2025-05-23 the Natore event continues
    with "maintenance" in the description column AND "interrup." in the
    lost-load column, and the tail can be as short as "Filling." — so neither
    a one-cell rule nor a length floor works. A row carrying a time is a new
    event, never a continuation.
    """
    if desc_col is None:
        return None
    cells = [c.strip() for c in line.split('|')]
    if desc_col >= len(cells) or not cells[desc_col]:
        return None
    if any(TIME_CELL.match(c) for c in cells if c):
        return None
    text = cells[desc_col]
    if NOT_AN_EVENT.match(text) or SECTION_HEADING.match(text):
        return None
    if not re.search(r'[A-Za-z]{3}', text):
        return None
    return text


# Columns in GenLog that are roll-ups or unrelated readings, not power stations.
GENLOG_AGGREGATES = {
    'national grid total': 'national',
    'eastern total': 'eastern',
    'western total': 'western',
}
GENLOG_IGNORED = {'water level', 'hour', ''}


def parse_genlog(content):
    """Hourly generation per power station, from the GenLog sheet.

    A single wide matrix: one header row of station names, a row of installed
    capacities beneath it, then one row per hour. Only the 2025+ workbooks
    carry it — older reports have a `YesterdayGen` sheet of a different shape —
    so this returns None rather than guessing when the sheet is absent.

    `national` is PGCB's own total column, kept so the per-station figures can
    be checked against it and against the L-Curve rather than trusted blind.
    """
    sheet = get_sheet_content(content, 'GenLog')
    if not sheet:
        return None
    lines = [l for l in sheet.split('\n') if l.strip('| ')]

    header_at = next(
        (i for i, l in enumerate(lines)
         if any(c.strip().lower() == 'hour' for c in l.split('|'))),
        None,
    )
    if header_at is None or header_at + 1 >= len(lines):
        return None
    header = [c.strip() for c in lines[header_at].split('|')]
    capacity = [c.strip() for c in lines[header_at + 1].split('|')]
    hour_col = next(i for i, c in enumerate(header) if c.lower() == 'hour')

    stations, aggregates = [], {}
    for col, name in enumerate(header):
        key = name.lower().strip()
        if col == hour_col or key in GENLOG_IGNORED:
            continue
        if key in GENLOG_AGGREGATES:
            aggregates[GENLOG_AGGREGATES[key]] = col
        else:
            stations.append({
                'col': col,
                'name': name,
                'capacityMw': clean_float(capacity[col]) if col < len(capacity) else 0.0,
            })
    if not stations:
        return None

    hours, values = [], {c: [] for c in [s['col'] for s in stations] + list(aggregates.values())}
    for line in lines[header_at + 1:]:
        cells = [c.strip() for c in line.split('|')]
        if hour_col >= len(cells):
            continue
        m = re.match(r'^(\d{1,2}):(\d{2})', cells[hour_col])
        if not m:
            continue
        stamp = f"{int(m.group(1)):02d}:{m.group(2)}"
        # 24:00 is midnight closing the day — the next day's 00:00.
        if not stamp.endswith(':00') or stamp == '24:00':
            continue
        hours.append(stamp)
        for col in values:
            values[col].append(clean_float(cells[col]) if col < len(cells) else 0.0)

    if not hours:
        return None
    return {
        'hours': hours,
        'stations': [
            {'name': s['name'], 'capacityMw': s['capacityMw'], 'hourlyMw': values[s['col']]}
            for s in stations
        ],
        'totals': {name: values[col] for name, col in aggregates.items()},
    }


# Rows that close a section rather than describing a station. PGCB prints an
# area total after each region, and depending on the year also a sector total
# ("Public Sector Total") and the three grid totals; counting any of them as a
# plant doubles that section's contribution — matching only "area|zone|grid
# total" let the 2014 sector rows through and put the day 79% over its own
# published peak. Any row whose name ends in "total" is a roll-up.
P2_TOTAL_ROW = re.compile(r'\btotals?\s*[:.]?\s*$|\b(area|zone|grid)\s+total\b', re.I)


def _p2_header_columns(lines, name_row):
    """Column index -> the full header text above it, joined across its rows.

    P2 spells a heading over as many as four physical rows — "Present" /
    "Capacity" / "MW" sit in three — so a single-line match finds "Present" and
    "Peak" but never tells them apart from "Installed Capacity". Joining the
    window per column makes each one a complete phrase.
    """
    joined = {}
    for line in lines[max(0, name_row - 2):name_row + 4]:
        # The sheet title sits two rows above the header on the 2025 layout and
        # reads "EVENING PEAK GENERATION AND DAY LONG ENERGY DATA OF POWER
        # STATIONS" — it contains "peak", "energy" and "power stations", so a
        # contains-match against it claims all three columns and every figure
        # comes back 0. Titles and letterheads are dropped by length.
        if re.search(r'evening peak generation|description of the generation|'
                     r'power grid|load dispatch', norm_text(line)):
            continue
        for i, cell in enumerate(line.split('|')):
            text = cell.strip()
            # The pre-converted .txt files carry a markdown rule row.
            if not text or set(text) <= set(':- '):
                continue
            # "Date :", the date beside it and the page number share columns
            # with real headings. Anchoring the patterns instead would be the
            # obvious fix and is wrong: "Date :" lands in the same column as
            # "Name of the Power Stations", so every anchored match failed.
            if re.match(r'^(date|month|day)\s*:?$|^page\s*-?\s*\d+$|^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$',
                        norm_text(text)):
                continue
            joined[i] = f"{joined.get(i, '')} {text}".strip()
    return joined


def parse_p2_stations(content):
    """Per-station evening-peak generation and day-long energy, from the P2 sheet.

    "Evening Peak Generation and Day Long Energy Data of Power Stations", and
    the one per-station table PGCB has printed continuously — it is in every
    workbook back to 2014, where the Forecast sheet's actual-generation columns
    begin in 2025 and the GenLog matrix with them. Nothing here read it, so the
    Power Stations tab started in 2025 for want of a parser rather than for want
    of data.

    Energy generated is in this sheet and no other. It is the day's output per
    station in kWh, which the peak columns cannot express: a plant held at half
    load all day and one run flat out for an hour can show the same peak.

    Column positions are read from the header, which moves between layouts —
    2014-2018 prints Unit then Producer and no installed capacity, later sheets
    print Producer then Installed Capacity. The units row is not trustworthy:
    from 2019 it labels the energy column MW where the values are plainly kWh.

    Returns {'stations': [...], 'totals': {...}} or None.
    """
    p2 = get_sheet_content(content, 'P2')
    if not p2:
        return None

    lines = [l for l in p2.split('\n') if l.strip('| ')]
    # The heading is wrapped in the cell — "Name of the <br> Power Stations" —
    # and the marker survives the conversion, so it has to come out before the
    # phrase can be matched at all.
    name_row = next(
        (i for i, l in enumerate(lines)
         if re.search(r'name of (the\s*)?power station', norm_text(l.replace('<br>', ' ')))),
        None,
    )
    if name_row is None:
        return None

    header = _p2_header_columns(lines, name_row)

    def column(pattern, reject=None):
        for idx in sorted(header):
            text = norm_text(header[idx].replace('<br>', ' '))
            if reject and re.search(reject, text):
                continue
            if re.search(pattern, text):
                return idx
        return None

    # Anchored at the start of the heading. A bare contains-match is what let
    # the sheet title claim the peak and energy columns.
    name_col = column(r'^name of (the\s*)?power station')
    producer_col = column(r'^producer\b')
    installed_col = column(r'^installed capacity|^unit no\.? x capacity|^unit\b')
    present_col = column(r'^present')
    peak_col = column(r'^peak\b')
    energy_col = column(r'^energy\b')
    remarks_col = column(r'^remark')
    if name_col is None or peak_col is None or energy_col is None:
        return None

    def cell(cells, idx):
        return cells[idx].strip() if idx is not None and idx < len(cells) else ''

    units, totals = [], {}
    for line in lines[name_row + 1:]:
        cells = line.split('|')
        name = re.sub(r'\s*<br>\s*', ' ', cell(cells, name_col)).strip()

        peak = clean_float(cell(cells, peak_col))
        energy = clean_float(cell(cells, energy_col))
        present = clean_float(cell(cells, present_col))
        if not any(cell(cells, c) for c in (peak_col, energy_col, present_col)):
            continue

        # Roll-up rows do not always sit in the station-name column: on the 2025
        # layout every area and grid total is written one column to its left,
        # which left the name cell blank and folded all twelve of them into the
        # last station. Look for the label anywhere on the row.
        label = next((c.strip() for c in cells if c.strip() and P2_TOTAL_ROW.search(c.strip())), '')
        if label:
            key = ('eastern' if 'eastern' in label.lower() else
                   'western' if 'western' in label.lower() else
                   'national' if 'national' in label.lower() else None)
            if key:
                totals[key] = {'presentCapacityMw': present, 'eveningPeakMw': peak, 'energyKwh': energy}
            # Area totals are recorded nowhere and simply skipped.
            continue

        units.append({
            'name': name if len(name) >= 3 else '',
            'producer': cell(cells, producer_col),
            'installedCapacity': cell(cells, installed_col),
            'presentCapacityMw': present,
            'eveningPeakMw': peak,
            'energyKwh': energy,
            'remarks': cell(cells, remarks_col),
        })

    stations = _p2_group_units(units)
    if len(stations) < 20:
        return None
    return {'stations': stations, 'totals': totals}


def _p2_group_units(units):
    """Fold each station's unit rows together, by nearest printed name.

    A multi-unit station gets one row per unit and PGCB merges the name cell
    across the block, so only one of them carries text. An unnamed row joins the
    named row above it — the ordinary way to read a merged cell that a
    text conversion has flattened — and the first rows of the sheet, which have
    no row above, join the first named row below.

    Exact from 2015 on, where the name sits on the block's first row. **The 2014
    sheet centres it instead**: Ghorasal's six units are named on the second row
    and Haripur SBU's three on the middle one, so a unit printed above its own
    station's name is filed under the preceding station. The merge geometry that
    would settle it does not survive the conversion, and the alternatives are no
    better — attaching each orphan to its nearest name instead splits Ghorasal's
    six units three ways, because the blocks around a centred name are not
    symmetric.

    What this cannot do is lose or double-count a row, so the day's totals are
    unaffected and the reconciliation against P2's own National Grid Total still
    tests every figure. On 2014 layouts it decides only which of two adjacent
    stations a unit is filed under.
    """
    named = [i for i, u in enumerate(units) if u['name']]
    if not named:
        return []

    groups: dict[int, list[int]] = {i: [] for i in named}
    for i, unit in enumerate(units):
        if unit['name']:
            groups[i].append(i)
            continue
        earlier = [j for j in named if j < i]
        groups[earlier[-1] if earlier else named[0]].append(i)

    stations = []
    for head in named:
        rows = [units[i] for i in sorted(groups[head])]
        capacity = sum(r['presentCapacityMw'] for r in rows)
        stations.append({
            'name': units[head]['name'],
            'producer': next((r['producer'] for r in rows if r['producer']), ''),
            'installedCapacity': '+'.join(r['installedCapacity'] for r in rows if r['installedCapacity']),
            'presentCapacityMw': round(capacity, 2) or None,
            'eveningPeakMw': round(sum(r['eveningPeakMw'] for r in rows), 2),
            'energyKwh': round(sum(r['energyKwh'] for r in rows), 2),
            'remarks': next((r['remarks'] for r in rows if r['remarks']), ''),
        })
    return stations


def parse_yesterday_gen(content):
    """Hourly output per station from the YesterdayGen sheet — GenLog, transposed.

    The 2018-2024 workbooks carry the same hourly station matrix that GenLog
    holds from 2025, turned on its side: stations are columns and hours are
    rows. Nothing read it, so the Power Stations tab's hourly log began in 2025
    while the data goes back to mid-2018.

    The station columns stop at "Eastern Grid Total". Everything after it is
    something else — the two grid totals, a national "Total (MW)", the same
    per-fuel split the En-Curve sheet carries, then Shortage and the Kaptai
    water level. Summing the row indiscriminately gives about four times the
    day's generation, because the aggregates are sitting in it.

    Emitted in GenLog's shape so both eras render through one component.
    `capacityMw` is 0: this sheet states output only, where GenLog prints a
    capacity row above the matrix.
    """
    block = get_sheet_content(content, 'YesterdayGen')
    if not block:
        return None

    lines = [l for l in block.split('\n') if l.strip('| ')]
    header_row = next((i for i, l in enumerate(lines) if re.search(r'plant name', norm_text(l))), None)
    if header_row is None:
        return None

    header = [c.strip() for c in lines[header_row].split('|')]
    # Everything from the first grid roll-up onwards is an aggregate, not a plant.
    stop = next((i for i, h in enumerate(header)
                 if re.search(r'(eastern|western)\s+grid\s+total|^total\s*\(', norm_text(h))), len(header))
    name_col = next((i for i, h in enumerate(header) if re.search(r'plant name', norm_text(h))), 0)

    stations = [{'name': h, 'col': i} for i, h in enumerate(header[:stop])
                if h and i != name_col and not set(h) <= set(':- ')]
    aggregates = {}
    for i, h in enumerate(header):
        key = ('eastern' if re.search(r'eastern grid total', norm_text(h)) else
               'western' if re.search(r'western grid total', norm_text(h)) else
               'national' if re.search(r'^total\s*\(', norm_text(h)) else
               'shortage' if norm_text(h) == 'shortage' else None)
        if key and key not in aggregates:
            aggregates[key] = i
    if len(stations) < 20:
        return None

    hours: list[str] = []
    values: dict[int, list[float]] = {s['col']: [] for s in stations}
    totals: dict[str, list[float]] = {k: [] for k in aggregates}
    for line in lines[header_row + 1:]:
        cells = [c.strip() for c in line.split('|')]
        stamp = cells[name_col] if name_col < len(cells) else ''
        m = re.match(r'^(\d{1,2}):(\d{2})(?::\d{2})?$', stamp)
        if not m:
            continue
        hour = f"{int(m.group(1)):02d}:{m.group(2)}"
        # Same convention as everywhere else here: only whole hours are charted,
        # and a closing 24:00 is the next day's midnight.
        if not hour.endswith(':00') or hour == '24:00':
            continue
        hours.append(hour)
        for col in values:
            values[col].append(clean_float(cells[col]) if col < len(cells) else 0.0)
        for key, col in aggregates.items():
            totals[key].append(clean_float(cells[col]) if col < len(cells) else 0.0)

    if len(hours) < 20:
        return None
    return {
        'hours': hours,
        'stations': [
            {'name': s['name'], 'capacityMw': 0, 'hourlyMw': values[s['col']]}
            for s in stations
        ],
        'totals': totals,
    }


def parse_plant_actuals(forecast):
    """Per-station figures for the REPORTED day, from the Forecast sheet.

    That sheet is laid out for the next day, but its "Actual Generation on
    <reported day>" pair is the one block on it that belongs to the day being
    reported. Everything to the right — forecast availability, effective
    availability and the Remarks that explain them — describes tomorrow, and is
    deliberately not read here: mixing the two is the defect this whole repair
    exists to remove.

    Column positions are taken from the header row rather than assumed, since
    the sheet gained columns between layouts.
    """
    if not forecast:
        return None
    lines = [l for l in forecast.split('\n') if l.strip('| ')]
    header_at = next(
        (i for i, l in enumerate(lines)
         if re.search(r'name of the', l, re.I) and re.search(r'actual generation', l, re.I)),
        None,
    )
    if header_at is None:
        return None
    header = [c.strip() for c in lines[header_at].split('|')]

    def col_of(pattern):
        return next((i for i, c in enumerate(header) if re.search(pattern, norm_text(c))), None)

    name_col = col_of(r'^name of the')
    fuel_col = col_of(r'^fuel$')
    producer_col = col_of(r'^producer')
    installed_col = col_of(r'^installed capacity')
    present_col = col_of(r'^present capacity')
    actual_col = col_of(r'^actual generation on')
    if name_col is None or actual_col is None:
        return None

    plants = []
    for line in lines[header_at + 1:]:
        cells = [c.strip() for c in line.split('|')]
        if name_col >= len(cells):
            continue
        name = cells[name_col]
        # Skip the two sub-header rows (dates, "Day Peak"/"Ev. Peak", units)
        # and any total line.
        if not name or len(name) < 4 or re.match(r'^(day|ev\.?|mw|unit no)', norm_text(name)):
            continue
        if re.match(r'^(total|grand total)\b', norm_text(name)):
            break
        # The sheet repeats its own column heading partway down the table, and
        # closes with the OIS generation stamp. Both cleared every test above —
        # they are long enough, and they carry no figures to contradict — so
        # they were emitted as stations with 0 MW. Harmless to every total and
        # wrong in the table, where they read as two plants that produced
        # nothing: 319 of 332 archived days carried both.
        if re.match(r'^name of the\b', norm_text(name)) or name.lstrip().startswith('***'):
            continue
        if re.search(r'report is generated digitally', name, re.I):
            continue

        def cell(i):
            return cells[i] if i is not None and i < len(cells) else ''

        plants.append({
            'name': re.sub(r'\s*<br>\s*', ' ', name).strip(),
            'fuel': cell(fuel_col),
            'producer': cell(producer_col),
            # "Installed Capacity" spans two sub-columns: the unit breakdown
            # ("1*210") and its total in MW.
            'installedCapacity': cell(installed_col),
            'installedMw': clean_float(cell(installed_col + 1 if installed_col is not None else None)) or None,
            'presentCapacityMw': clean_float(cell(present_col)) or None,
            # The two columns immediately under "Actual Generation on <date>".
            'dayPeakMw': clean_float(cell(actual_col)),
            'eveningPeakMw': clean_float(cell(actual_col + 1)),
        })
    return plants or None


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
    current_load_cell = None
    current_desc_col = None
    for line in p1.split('\n'):
        parts = [p.strip() for p in line.split('|')]
        # Format 1: the tabular event summary, on both sheet generations.
        row = outage_row(line)
        if row:
            time_in, time_out, desc, load_cell, desc_col = row
            current_desc_col = desc_col
            plant_val, reason_val, load_val = split_event_text(desc, load_cell)
            current_outage = {
                'time': f"{time_in} - {time_out}" if (time_in and time_out) else (time_in or time_out),
                'plant': plant_val,
                'load': load_val,
                'reason': reason_val,
                'full_desc': desc,
            }
            current_load_cell = load_cell
            daily_outages.append(current_outage)
            continue

        if current_outage:
            more = outage_continuation(line, current_desc_col)
            if more:
                current_outage['full_desc'] = f"{current_outage['full_desc']} {more}"
                plant_val, reason_val, load_val = split_event_text(
                    current_outage['full_desc'], current_load_cell)
                current_outage['plant'] = plant_val
                current_outage['reason'] = reason_val
                current_outage['load'] = load_val
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
            
            plant_val, reason_val, load_val = split_event_text(desc)
            daily_outages.append({
                'time': time_val,
                'plant': plant_val,
                'load': load_val,
                'reason': reason_val,
                # Carried here too so every row has the same shape, whichever
                # branch produced it.
                'full_desc': desc,
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

    # P4 states generation, shedding and demand together for every hour it
    # publishes, so where it exists it is the whole curve and the evening-peak
    # special case below is not needed. It is preferred only after its
    # generation column is checked against the L-Curve on the hours they share:
    # two sheets agreeing is what makes the third and fourth columns safe to
    # believe, and a disagreement means one of them is not this day's.
    shed_rows = parse_hourly_shed(content) or hourly_shed_from_yesterday_gen(content)
    if shed_rows and lcurve_series:
        shared = [(r['generation'], lcurve_series[r['time']])
                  for r in shed_rows if r['time'] in lcurve_series]
        agrees = bool(shared) and all(abs(a - b) <= 1.0 for a, b in shared)
        if not agrees:
            shed_rows = []
    if shed_rows:
        hourly_load_data = shed_rows
    elif lcurve_series:
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

    # P1 leaves the "Total Gen. (MKWH)" cell empty on some days — the unit sits
    # where the number should be and there is no number anywhere on the row. It
    # is a gap in the published sheet, not a parse failure, and it took 65 days
    # of early 2018 to a headline generation of zero, which in turn zeroed the
    # average production cost that divides by it.
    #
    # P2's National Grid Total is the same measurement, and where P1 does print
    # its figure the two agree to the digit — 127.67354 against 127.67 on
    # 2018-01-05. So the day is recovered from the other sheet rather than left
    # at zero or filled from the fuel mix, which is a different quantity: it is
    # gross generation at the plant and runs both above and below this.
    if total_energy_gen <= 0.0:
        p2 = parse_p2_stations(content)
        national = ((p2 or {}).get('totals') or {}).get('national') or {}
        recovered = float(national.get('energyKwh') or 0) / 1e6
        if recovered > 0:
            total_energy_gen = round(recovered, 6)

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

    energy_curve = parse_energy_curve(content)

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
        'hourlyLoadData': hourly_load_data,
        # Omitted rather than empty on the layouts without an En-Curve sheet,
        # so the site can tell "this day published no fuel curve" from "the
        # fuel curve was read and every series was flat".
        **({'energyCurveData': energy_curve} if energy_curve else {}),
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
