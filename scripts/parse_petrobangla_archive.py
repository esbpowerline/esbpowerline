#!/usr/bin/env python3
"""Reconstructed Petrobangla daily PDF -> PetrobanglaDaily archive JSON.

Replaces the lost Desktop/grid_backlog/parse_petrobangla.py. Uses pymupdf word
coordinates (robust for the dense multi-column report) and validates that the
per-field gas sum reconciles with the printed grand total before emitting.

Usage: python scripts/parse_petrobangla_archive.py <pdf> <energy_day ISO> [out.json]
"""
from __future__ import annotations
import sys, json, re, hashlib, datetime
from collections import defaultdict
import fitz  # pymupdf

COMPANY_HEADERS = {
    'BGFCL': 'BGFCL', 'SGFL': 'SGFL', 'BAPEX': 'BAPEX',
    'IOCS': 'CHEVRON', 'CHEVRON': 'CHEVRON', 'TULLOW': 'TULLOW', 'RPGCL': 'RPGCL',
}
DIST_CODES = ['TGTDCL', 'BGDCL', 'KGDCL', 'JGTDSL', 'PGCL', 'SGCL']
NUM = re.compile(r'^-?\d+(?:\.\d+)?$')


def rows_in(words, x0, x1, y0, y1, tol=2.5):
    """Cluster words into rows by y-proximity (gap <= tol). Handles reports where a
    field name and its numbers land on y-lines a pixel apart."""
    sel = [w for w in words if x0 <= w[0] <= x1 and y0 <= w[1] <= y1]
    sel.sort(key=lambda w: w[1])
    out, cur, prev_y = [], [], None
    for w in sel:
        if prev_y is not None and w[1] - prev_y > tol and cur:
            ys = [x[1] for x in cur]
            out.append((round(sum(ys) / len(ys)), sorted(cur, key=lambda w: w[0])))
            cur = []
        cur.append(w)
        prev_y = w[1]
    if cur:
        ys = [x[1] for x in cur]
        out.append((round(sum(ys) / len(ys)), sorted(cur, key=lambda w: w[0])))
    return out


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def field_name(name, company_code):
    """A field's own name, without the company heading printed to its left.

    The first field under each company shares a line with that company's
    heading, so its row reads "1. BGFCL Bakhrabad" where the rows below it read
    "Narsingdi". Whether the numeral is picked up at all depends on where the
    page happens to place the heading, which means the same field can be named
    two ways in two files for no reason in the data.

    Named consistently here so it does not have to be undone downstream —
    `clean_field_name` in ingest_bridge exists to strip exactly this, and the
    owner map in the Petrobangla section detail is keyed on the cleaned form.
    """
    cleaned = re.sub(r'^\s*\d+\.\s*', '', name)
    # Any company, not just the one in force: a heading sharing a line with its
    # first field carries trailing numbers, so the header branch above declines
    # it and `company_code` is still the PREVIOUS company on exactly the rows
    # that need stripping — "2. SGFL Kailashtila #2 (MSTE)" arrives while the
    # code still reads BGFCL. This is also why the owner map downstream is keyed
    # on field names rather than on `company_code`.
    codes = '|'.join(re.escape(c) for c in list(COMPANY_HEADERS) + ['IOC'])
    cleaned = re.sub(rf'^(?:{codes})\b\s*', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip() or name


# The production block's horizontal extent on the layout these coordinates were
# measured from, alongside the section headings that bracket it. Section I is the
# production table; section III starts the right-hand column. Keeping all four
# numbers together is what lets the band be re-derived for a page printed at a
# different size instead of being asserted.
REF_SECTION_I_X = 101.2
REF_SECTION_III_X = 412.7
REF_PROD_X0 = 98.0
REF_PROD_X1 = 390.0


def production_band(words):
    """Left and right edges of the production table on this particular page.

    Petrobangla prints the same report on two page sizes — Letter for most days,
    A4 for a handful — and the A4 files are not a scaled copy: the table moves
    left as well, so 'Titas' starts at x=92.6 where the Letter files put it at
    129.1. Against the fixed 98..390 band those files lost the field-name column
    outright, every row fell below the six-numeric test, and 20 of 23 fields
    vanished. What survived was two stragglers and the printed total row, summing
    to 45.8 MMCFD more than the day actually produced. Four of the 32 July 2026
    reports are printed this way.

    The band is therefore expressed as a position between the 'I.' and 'III.'
    section headings, which bracket the table on every layout, and restored at
    the same relative offsets. On the Letter pages this reproduces 98..390
    exactly, so the days already in the archive are unaffected.

    Falls back to the measured constants when either heading is missing.
    """
    return map_ref_x(words, REF_PROD_X0), map_ref_x(words, REF_PROD_X1)


def map_ref_x(words, ref_x):
    """Map an x measured on the reference (Letter) layout onto this file's layout.

    Every fixed x in this parser was measured on a Letter page, so every one of
    them is wrong on the A4 files by the same left shift. Expressing them as a
    position between the 'I.' and 'III.' headings — which bracket the table on
    both layouts — makes them portable, and reproduces the original constants
    exactly on Letter pages, so archived days are unaffected.
    """
    def heading_x(token):
        hits = [w[0] for w in words if w[4] == token and w[1] < 120]
        return min(hits) if hits else None

    i_x, iii_x = heading_x('I.'), heading_x('III.')
    if i_x is None or iii_x is None or iii_x - i_x < 50:
        return ref_x
    scale = (iii_x - i_x) / (REF_SECTION_III_X - REF_SECTION_I_X)
    return i_x + (ref_x - REF_SECTION_I_X) * scale


def parse_production(words):
    """Return (fields, subtotals, grand_total). Field rows carry exactly the
    trailing 6 numerics: wells, capacity, gas, condensate, %cap, %prod.
    Layout-independent: anchors on 'Titas' (top) and the production 'Grand' row."""
    prod_x0, prod_x1 = production_band(words)
    titas_y = min((w[1] for w in words if w[4] == 'Titas' and w[0] < prod_x1), default=50)
    # production grand-total row = 'Grand' word inside the production x-band
    grand_y = min((w[1] for w in words
                   if w[4] == 'Grand' and prod_x0 <= w[0] <= prod_x1), default=titas_y + 200)
    fields, subtotals = [], []
    grand = None
    company_code = None
    company_label = None
    operator = None
    for y, ws in rows_in(words, prod_x0, prod_x1, titas_y - 10, grand_y + 6):
        toks = [w[4] for w in ws]
        upper = [t.upper().rstrip('.') for t in toks]
        # company header line (e.g. "1. BGFCL", "CHEVRON", "TULLOW", "5. RPGCL (R-LNG)")
        hit = next((COMPANY_HEADERS[u] for u in upper if u in COMPANY_HEADERS), None)
        # RPGCL is the one company whose header row also carries its figures, so
        # the "no numbers in the last four tokens" test never matches it. Older
        # reports print "5. RPGCL (R-LNG)" and were caught by the "5." check;
        # newer ones drop the numeral and print plain "RPGCL (R-LNG)", which fell
        # through both tests. company_code then stayed on the previous company,
        # the `elif company_code == 'RPGCL'` branch below never fired, and the
        # R-LNG Terminal row vanished — 501 MMCFD short on 2026-08-01, with the
        # subtotal misattributed to CHEVRON. Match on the company itself.
        if (hit and not any(NUM.match(t) for t in toks[-4:])) \
                or (hit and toks and toks[0] in ('5.', '5')) \
                or hit == 'RPGCL':
            company_code = hit
            m = re.search(r'(\d+)\.\s*([A-Za-z]+)', ' '.join(toks))
            company_label = f"{m.group(1)}. {hit}" if m else hit
            operator = hit if hit in ('CHEVRON', 'TULLOW') else None
            if 'RPGCL' in upper:
                company_label = '5. RPGCL (R-LNG)'
            # RPGCL header line also carries its numbers -> fall through
            if not any(NUM.match(t) for t in toks):
                continue
        nums = [t for t in toks if NUM.match(t)]
        names = [t for t in toks if not NUM.match(t)]
        name = field_name(' '.join(names).strip(), company_code)
        is_grand = 'Grand' in names or 'Grand' in toks
        is_sub = name.startswith('Sub-Total') or 'Sub-Total' in names
        # a data row needs >=6 trailing numerics
        if len(nums) >= 6:
            wells, cap, gas, cond, pcap, pprod = [float(x) for x in nums[-6:]]
            rec = dict(record_type='field', id=f"{(company_code or '').lower()}/{slug(name)}",
                       company=company_label, company_code=company_code, operator=operator,
                       field=name, producing_wells=int(wells), capacity_mmcfd=cap,
                       gas_mmcfd=gas, condensate_bbld=cond,
                       pct_of_total_capacity=pcap, pct_of_total_production=pprod)
            if is_grand:
                rec.update(record_type='grand_total', company='Grand Total (1+2+3+4+5):',
                           company_code='TOTAL', field='Grand Total (1+2+3+4+5):')
                grand = rec
            elif is_sub:
                rec.update(record_type='subtotal', field='Sub-Total')
                subtotals.append(rec)
            elif name and name.upper() not in ('IOCS',):
                fields.append(rec)
        elif company_code == 'RPGCL' and len(nums) >= 4 and 'RPGCL' in upper:
            # RPGCL line: capacity gas %cap %prod (no wells/condensate separate)
            cap, gas, pcap, pprod = [float(x) for x in nums[-4:]]
            fields.append(dict(record_type='field', id='rpgcl/r-lng-terminal',
                          company='5. RPGCL (R-LNG)', company_code='RPGCL', operator=None,
                          field='R-LNG Terminal', producing_wells=0, capacity_mmcfd=cap,
                          gas_mmcfd=gas, condensate_bbld=0.0,
                          pct_of_total_capacity=pcap, pct_of_total_production=pprod))
    return fields, subtotals, grand


def parse_dist_summary(words):
    """Extract the 'Total :', 'Grand Total' and '% of Total Distribution' rows."""
    total_row = grand_row = pct_row = None

    # The distribution grand total is the LOWER 'Grand' on the page, the
    # production one being higher. But some reports carry no non-grid power
    # block, and therefore no distribution 'Grand Total' row at all — their
    # "Total :" line is the whole distribution total. On those, max() falls back
    # to the PRODUCTION grand row and reads its wells and capacity as demand and
    # supply (119.0 / 3854.0 on 2026-08-01, against a true 2524.9 / 682.3).
    #
    # So anchor on the last 'Grand' that sits below the production section, and
    # when there is none, anchor on the distribution "Total :" row instead.
    #
    # The production 'Grand' must be located with production_band(), not a fixed
    # 98..390: Petrobangla issues these on two page sizes, and on the A4 files
    # the whole production column shifts left — 'Grand' lands at x=92 on the
    # 11-12 Aug 2026 report. A fixed band simply misses it, prod_grand_y falls
    # back to 0, and the production row is then taken as the distribution one,
    # which is the very failure the paragraph above describes. It reappeared
    # verbatim (119.0 / 3854.0 against a true 2524.9 / 783.5).
    prod_x0, prod_x1 = production_band(words)
    prod_grand_y = min((w[1] for w in words
                        if w[4] == 'Grand' and prod_x0 <= w[0] <= prod_x1), default=0)
    dist_grands = [w[1] for w in words if w[4] == 'Grand' and w[1] > prod_grand_y + 50]
    if dist_grands:
        dist_grand_y = max(dist_grands)
    else:
        totals = [w[1] for w in words if w[4] == 'Total' and w[1] > prod_grand_y + 50]
        dist_grand_y = max(totals) if totals else 720

    # Same shift applies to the row scan. Clipped at a fixed 98 it drops the
    # 'Grand' token itself on A4 pages (x=93), so the Grand Total row fails the
    # "'Grand' in toks" test, matches nothing, and the parser silently falls
    # back to the "Total :" row — which excludes Non-Grid Power and understates
    # supply by exactly that block (860.1 against a printed 969.0 on 2026-03-01).
    scan_x0, scan_x1 = map_ref_x(words, 98.0), map_ref_x(words, 520.0)
    for y, ws in rows_in(words, scan_x0, scan_x1, dist_grand_y - 45, dist_grand_y + 18):
        toks = [w[4] for w in ws]
        joined = ' '.join(toks)
        nums = [float(t.rstrip('%')) for t in toks if NUM.match(t.rstrip('%'))]
        if joined.strip().startswith('Total') and 'Non-Grid' not in joined and total_row is None and len(nums) >= 6:
            total_row = nums
        elif 'Grand' in toks and 'Total' in toks and len(nums) >= 6:
            grand_row = nums
        elif '%' in joined and 'Distribution' in joined:
            pct_row = [float(t.rstrip('%')) for t in toks if t.rstrip('%').replace('.', '').isdigit()]
    def pack(nums, extra=None):
        if not nums:
            return None
        n = (nums + [None] * 6)[:6]
        return dict(power_demand_mmcfd=n[0], power_supply_mmcfd=n[1],
                    fertilizer_demand_mmcfd=n[2], fertilizer_supply_mmcfd=n[3],
                    others_supplementary_mmcfd=n[4], total_mmcfd=n[5], extra=extra)
    grand_total = pack(grand_row)
    total_ = pack(total_row, extra=(grand_row[5] if grand_row and len(grand_row) >= 6 else None))
    pct = None
    if pct_row:
        p = (pct_row + [None] * 4)[:4]
        pct = dict(power_demand_mmcfd=None, power_supply_mmcfd=p[0], fertilizer_demand_mmcfd=None,
                   fertilizer_supply_mmcfd=p[1], others_supplementary_mmcfd=p[2],
                   total_mmcfd=p[3], extra=None)
    empty = dict(power_demand_mmcfd=None, power_supply_mmcfd=None, fertilizer_demand_mmcfd=None,
                 fertilizer_supply_mmcfd=None, others_supplementary_mmcfd=None, total_mmcfd=None, extra=None)
    return {'total_': total_ or empty, 'non-grid_power': empty,
            'grand_total': grand_total or total_ or empty, 'pct_of_total_distribution': pct or empty}


def dist_region(words):
    """(top, bottom) y of the II. Distribution table, read off its own landmarks.

    Fixed y bounds do not survive the archive: the reports ship on both Letter
    (612x792) and A4 (595x842) pages, which move the table by 20-45px.
    """
    tops = [w[1] for w in words if w[4].startswith('Distribution') and w[1] > 120]
    if not tops:
        return None, None
    top = min(tops)
    # the table closes on a left-hand "Total :" row below every Sub-Total; the
    # right-hand "Total" belongs to the SGFL panel, so keep to the left columns.
    left = map_ref_x(words, 300.0)
    bots = [w[1] for w in words if w[4] == 'Total' and w[1] > top and w[0] < left]
    return top, (max(bots) if bots else max(w[1] for w in words))


def parse_dist_plants(words):
    """Plant rows of the II. Distribution table, plus each company's Sub-Total.

    Returns (plants, blocks). Every plant carries the company_code of the block it
    sits in; blocks maps that code to the six figures the report prints on the
    company's Sub-Total row.

    The demand/supply columns are located from those Sub-Total rows rather than
    pinned to absolute x. The previous fixed bands were measured on a Letter page
    (demand x 196-216), so on an A4 file — where demand sits at x~179 — every row
    missed the band and was dropped by the `dem is None` guard: 2026-08-11 kept 14
    plants of 69 and lost three of six companies, while still reporting status
    'ok'. Anchoring on the row that closes each block makes the columns
    self-locating on both page sizes, and gives the totals to reconcile against.
    """
    top, bot = dist_region(words)
    if top is None:
        return [], {}

    rows = rows_in(words, 0.0, map_ref_x(words, 420.0), top, bot)
    bounds = []
    for y, ws in rows:
        if ' '.join(w[4] for w in ws).lstrip().startswith('Sub-Total'):
            nums = [v for _, v in sorted((w[0], float(w[4])) for w in ws if NUM.match(w[4]))]
            xs = sorted(w[0] for w in ws if NUM.match(w[4]))
            bounds.append((y, nums, xs))
    anchored = [b for b in bounds if len(b[2]) >= 2]
    if not anchored:
        return [], {}

    def median(vals):
        s = sorted(vals)
        return s[len(s) // 2]

    dem_x = median([b[2][0] for b in anchored])
    sup_x = median([b[2][1] for b in anchored])
    tol = max(6.0, (sup_x - dem_x) / 2.0 - 2.0)

    # a company label sits in the gutter left of the plant names; the lowercase
    # "pgcl" inside "Shahjahanullah pgcl Rent" is a plant name, so match case.
    labels = [(w[1], w[4]) for w in words if w[4] in DIST_CODES]

    def code_for(y0, y1):
        hit = [c for ly, c in labels if y0 < ly <= y1]
        return hit[0] if hit else None

    blocks, plants = {}, []
    prev = top
    for y, nums, _xs in bounds:
        code = code_for(prev, y)
        if code:
            blocks[code] = nums
        for ry, ws in rows:
            if not (prev < ry <= y):
                continue
            name = ' '.join(w[4] for w in ws
                            if w[0] < dem_x - tol and w[4] not in DIST_CODES).strip()
            if not name or name.startswith(('Sub-Total', 'Total', 'Company')):
                continue
            dem = sup = None
            for w in ws:
                if not NUM.match(w[4]):
                    continue
                if abs(w[0] - dem_x) <= tol and dem is None:
                    dem = float(w[4])
                elif abs(w[0] - sup_x) <= tol and sup is None:
                    sup = float(w[4])
            # a row with neither figure is a wrapped label, not a plant
            if dem is None and sup is None:
                continue
            plants.append(dict(name=name, demand_mmcfd=dem, supply_mmcfd=sup or 0.0,
                               company_code=code))
        prev = y
    return plants, blocks



# Month names as Petrobangla writes them, for reading the report's own header.
_MONTHS = {m: i + 1 for i, m in enumerate(
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}


def document_window(page_text):
    """The window the PDF states about ITSELF, or None if it does not say.

    Every date this parser wrote used to be derived from the energy day the
    CALLER asked for — label, start, end, month, even the agent_summary prose.
    The document's own header was never read, so whatever day you asked for was
    the day the report claimed to cover, and the claim was internally
    consistent: `verify:data` reconciles citations by the date our JSON carries,
    so it agreed with itself perfectly and could not see the error.

    It surfaced on 2026-09-07. Petrobangla skipped its 06.09.26 filing slot, so
    the document served under 07.09.26 was the 05->06 Sep window; the
    listing-key-minus-one rule filed it as energy day 2026-09-06 and this
    function's absence let it be labelled "06-07 Sep, 2026" — a window nobody
    published. Four neighbouring documents (listing 09-02..09-05 carrying
    01-02, 02-03, 03-04, 04-05) confirm both the header format and the rule it
    normally satisfies.

    The header reads `Date : 05-06` with the month and year elsewhere on the
    page, so both are searched independently and the day pair is the anchor.
    Returns the START date — the calendar day containing the window's opening
    instant, which is the anchor rule in observation-window.ts.

    A window that crosses a month boundary can also print both months in full:
    the report served under 01.10.26 reads `Date : 30 Sep- 1 Oct 2026`. The
    day-pair pattern below does not match that, so it returned None, the
    caller fell back to the day it had asked for, and on 2026-10-02 the Pi
    filed this 30 Sep -> 1 Oct document as energy day 2026-09-29 too —
    overwriting the genuine 29 -> 30 report already held. That form is read
    first, and its year belongs to the END month, as "31-01 Sep" does below.
    """
    full = re.search(
        r'Date\s*:\s*(\d{1,2})\s*([A-Z][a-z]{2})[a-z]*\.?\s*[-–]\s*'
        r'(\d{1,2})\s*([A-Z][a-z]{2})[a-z]*\.?,?\s*(20\d\d)', page_text)
    if full:
        start_month, end_month = _MONTHS.get(full.group(2)), _MONTHS.get(full.group(4))
        if not start_month or not end_month:
            return None
        year = int(full.group(5))
        if start_month > end_month:     # 31 Dec - 1 Jan 2027
            year -= 1
        try:
            return datetime.date(year, start_month, int(full.group(1)))
        except ValueError:
            return None
    m = re.search(r'Date\s*:\s*(\d{1,2})\s*[-–]\s*(\d{1,2})', page_text)
    if not m:
        return None
    mon = re.search(r'([A-Z][a-z]{2})[a-z]*,?\s*(20\d\d)', page_text)
    if not mon:
        return None
    start_day, end_day = int(m.group(1)), int(m.group(2))
    month, year = _MONTHS.get(mon.group(1)), int(mon.group(2))
    if not month:
        return None
    # A window that crosses a month boundary prints the SECOND month in the
    # header ("31-01 Sep" is the 31 Aug -> 01 Sep window), so a start day above
    # the end day belongs to the month before the one printed.
    if start_day > end_day:
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    try:
        return datetime.date(year, month, start_day)
    except ValueError:
        return None


def main():
    pdf, energy_iso = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else None
    doc = fitz.open(pdf)
    pg = doc[0]
    words = pg.get_text('words')
    raw = open(pdf, 'rb').read()

    fields, subtotals, grand = parse_production(words)
    field_gas_sum = round(sum(f['gas_mmcfd'] for f in fields), 1)
    grand_gas = grand['gas_mmcfd'] if grand else 0.0
    variance = round(abs(field_gas_sum - grand_gas), 1)
    reconciled = variance <= 5.0

    summary = parse_dist_summary(words)
    plants, blocks = parse_dist_plants(words)

    # Each plant already carries the code of the Sub-Total block it sits in, and
    # that Sub-Total is what the rows are checked against below.
    companies, dist_warnings = [], []
    for code in DIST_CODES:
        mine = [dict(name=p['name'], demand_mmcfd=p['demand_mmcfd'],
                     supply_mmcfd=p['supply_mmcfd'])
                for p in plants if p['company_code'] == code]
        if not mine:
            continue
        n = (blocks.get(code, []) + [None] * 6)[:6]
        companies.append(dict(company=code, company_code=code, power_plants=mine,
                              power_demand_mmcfd=n[0], power_supply_mmcfd=n[1],
                              fertilizer=dict(company=None, demand_mmcfd=n[2],
                                              supply_mmcfd=n[3]),
                              others_supplementary_mmcfd=n[4], total_mmcfd=n[5],
                              remarks_shutdown_plants=[]))
        # the report prints each block's totals; rows that silently go missing
        # show up here as a gap rather than as a plausible smaller number.
        for key, idx in (('demand', 0), ('supply', 1)):
            printed = n[idx]
            if printed is None:
                continue
            got = round(sum((p['%s_mmcfd' % key] or 0.0) for p in mine), 1)
            if abs(got - printed) > 0.5:
                dist_warnings.append(
                    f"{code} {key} {got} != printed Sub-Total {printed}")
    plant_count = sum(len(c['power_plants']) for c in companies)
    if len(companies) < len(DIST_CODES):
        missing = [c for c in DIST_CODES if c not in {x['company_code'] for x in companies}]
        dist_warnings.append('no plant rows for ' + ', '.join(missing))

    entities = [dict(type='gas_field', id=f['id'], name=f['field'], company_code=f['company_code'],
                     operator=f['operator'], gas_mmcfd=f['gas_mmcfd'],
                     producing_wells=f['producing_wells'], capacity_mmcfd=f['capacity_mmcfd'])
                for f in fields]
    for c in companies:
        for p in c['power_plants']:
            entities.append(dict(type='power_plant', name=p['name'], distribution_company=c['company_code'],
                                 demand_mmcfd=p['demand_mmcfd'], supply_mmcfd=p['supply_mmcfd']))

    # The window the DOCUMENT states, which outranks the day the caller asked
    # for. Falls back to the request when the header cannot be read — some older
    # scans genuinely do not carry it — and that fallback is recorded rather
    # than assumed, so a day labelled from the request is distinguishable from
    # one labelled from the source.
    requested = datetime.date.fromisoformat(energy_iso)
    stated = document_window(pg.get_text())
    ed = stated or requested
    window_source = 'document' if stated else 'request'
    if stated and stated != requested:
        dist_warnings.append(
            f"window mismatch: this document states {stated.isoformat()}, "
            f"the caller asked for {requested.isoformat()} — filed under the document's own window"
        )
    end = ed + datetime.timedelta(days=1)
    # Within one month the month is written once ("30-31 Jul, 2026"); across a
    # month boundary both are spelled out, matching ingest_bridge.window_label.
    # The one-form version labelled the 31 Aug -> 01 Sep 2026 window
    # "31-01 Aug, 2026", and that string reached the day file, the gas archive,
    # the index and the live week before verify:source caught it.
    if ed.month == end.month:
        label = f"{ed.day:02d}-{end.day:02d} {ed.strftime('%b')}, {ed.year}"
    else:
        label = f"{ed.day:02d} {ed.strftime('%b')} - {end.day:02d} {end.strftime('%b')}, {end.year}"
    doc_json = {
        '$schema': 'petrobangla-daily/v1',
        'meta': dict(schema_version='1.0.0', parser_version='2.0.0-reconstructed',
                     # Split on both separators: this ran on Windows only until
                     # the Pi took over the daily poll, and on POSIX the
                     # backslash-only split left the whole absolute path as the
                     # document's NAME, which then propagated into the day's
                     # sourceFiles citation (2026-09-01, 2026-09-03).
                     source_pdf=pdf, source_filename=pdf.replace('\\', '/').rsplit('/', 1)[-1],
                     parsed_at=None, page_count=doc.page_count,
                     # What the caller asked for, beside what the document says,
                     # so a mis-keyed fetch is visible in the artifact itself.
                     requested_energy_day=energy_iso,
                     window_source=window_source,
                     window_matches_request=(ed == requested),
                     parse_status=('ok' if not dist_warnings else 'partial'),
                     warnings=dist_warnings,
                     content_sha256=hashlib.sha256(raw).hexdigest(),
                     agent_summary=f"Petrobangla daily gas report for {label}. {len(fields)} producing fields, {plant_count} power plants tracked. Grand total gas production {grand_gas} MMCFD.",
                     queryable_collections=['production.fields', 'production.subtotals',
                                            'distribution.companies.power_plants', 'distribution.summary',
                                            'sgfl.products', 'entities']),
        'report': dict(reference_no=None, period='8.00 to 8.00',
                       units=dict(gas='MMCFD', condensate='BBLD', lpg='Kg', products='BBLD'),
                       # `ed`, not `energy_iso`: the window the document states.
                       report_date_label=label, report_date_start=ed.isoformat(),
                       report_date_end=end.isoformat(), month_label=ed.strftime('%b, %Y')),
        'production': dict(fields=fields, subtotals=subtotals, grand_total=grand, field_count=len(fields)),
        'sgfl': dict(products={}, pipeline_metrics={}, pipeline_total=None),
        'distribution': dict(companies=companies, summary=summary, non_grid_power=[], plant_count=plant_count),
        'validation': dict(field_gas_sum_mmcfd=field_gas_sum, grand_total_gas_mmcfd=grand_gas,
                           variance_mmcfd=variance, reconciled=reconciled,
                           distribution_reconciled=not dist_warnings),
        'entities': entities,
    }
    result = json.dumps(dict(ok=reconciled, energy=energy_iso, fields=len(fields), plants=plant_count,
                             companies=len(companies), dist_warnings=dist_warnings,
                             field_gas_sum=field_gas_sum, grand=grand_gas, variance=variance,
                             power_demand=summary['grand_total']['power_demand_mmcfd'],
                             power_supply=summary['grand_total']['power_supply_mmcfd']))
    if out:
        json.dump(doc_json, open(out, 'w', encoding='utf-8'), indent=2)
    print(result)


if __name__ == '__main__':
    main()
