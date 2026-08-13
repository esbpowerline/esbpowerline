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


def parse_dist_plants(words):
    """Left plant column: name + demand (x~198-216) + supply (x~216-236).
    Supply frequently wraps to the next y; pair by nearest y within 8px."""
    demands, supplies, names = {}, {}, {}
    for w in words:
        x, y, txt = w[0], round(w[1]), w[4]
        if 240 <= y <= 700:
            if 98 <= x <= 196 and not NUM.match(txt):
                names.setdefault(y, []).append((x, txt))
            elif 196 < x <= 216 and NUM.match(txt):
                demands[y] = float(txt)
            elif 216 < x <= 240 and NUM.match(txt):
                supplies[y] = float(txt)
    plants = []
    for y in sorted(names):
        nm = ' '.join(t for _, t in sorted(names[y]))
        nm = nm.strip()
        if not nm or nm.startswith('Sub-Total') or 'Company' in nm or 'Power' in nm.split()[:1]:
            continue
        dem = demands.get(y)
        # supply: same row, else nearest within +/-8px
        sup = supplies.get(y)
        if sup is None:
            for dy in (3, -3, 5, -5, 8, -8):
                if y + dy in supplies and (y + dy) not in names:
                    sup = supplies[y + dy]; break
        if dem is None:
            continue
        plants.append(dict(name=nm, demand_mmcfd=dem, supply_mmcfd=sup if sup is not None else 0.0))
    return plants


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
    plants = parse_dist_plants(words)

    # group plants under distribution companies by y-order of DIST_CODES labels
    label_y = {}
    for w in words:
        u = w[4].upper()
        if u in DIST_CODES and w[0] < 200:
            label_y.setdefault(u, w[1])
    # assign each plant to the company whose label-y is closest-below its first plant;
    # simpler: split plant list into 6 groups by the label y boundaries
    companies = []
    # Fallback: keep all plants but tag by nearest company code above
    # Build companies list preserving DIST_CODES order
    for code in DIST_CODES:
        companies.append(dict(company=code, company_code=code, power_plants=[],
                              power_demand_mmcfd=None, power_supply_mmcfd=None,
                              fertilizer=None, others_supplementary_mmcfd=None,
                              total_mmcfd=None, remarks_shutdown_plants=[]))
    # distribute plants: pymupdf gives them top-to-bottom; use label ys to bucket
    ordered = sorted(label_y.items(), key=lambda kv: kv[1]) if label_y else []
    def code_for_y(py):
        best = DIST_CODES[0]
        for code, ly in ordered:
            if py >= ly - 60:  # label sits within the company's block
                best = code
        return best
    # re-run plant extraction carrying y
    plant_y = {}
    tmpnames = defaultdict(list)
    for w in words:
        if 240 <= round(w[1]) <= 700 and 98 <= w[0] <= 196 and not NUM.match(w[4]):
            tmpnames[round(w[1])].append((w[0], w[4]))
    for p in plants:
        # find its y by name match
        for y, toks in tmpnames.items():
            if ' '.join(t for _, t in sorted(toks)).strip() == p['name']:
                plant_y[p['name']] = y; break
    cmap = {c['company_code']: c for c in companies}
    for p in plants:
        code = code_for_y(plant_y.get(p['name'], 999))
        cmap[code]['power_plants'].append(p)
    companies = [c for c in companies if c['power_plants']]
    plant_count = sum(len(c['power_plants']) for c in companies)

    entities = [dict(type='gas_field', id=f['id'], name=f['field'], company_code=f['company_code'],
                     operator=f['operator'], gas_mmcfd=f['gas_mmcfd'],
                     producing_wells=f['producing_wells'], capacity_mmcfd=f['capacity_mmcfd'])
                for f in fields]
    for c in companies:
        for p in c['power_plants']:
            entities.append(dict(type='power_plant', name=p['name'], distribution_company=c['company_code'],
                                 demand_mmcfd=p['demand_mmcfd'], supply_mmcfd=p['supply_mmcfd']))

    ed = datetime.date.fromisoformat(energy_iso)
    end = ed + datetime.timedelta(days=1)
    label = f"{ed.day:02d}-{end.day:02d} {ed.strftime('%b')}, {ed.year}"
    doc_json = {
        '$schema': 'petrobangla-daily/v1',
        'meta': dict(schema_version='1.0.0', parser_version='2.0.0-reconstructed',
                     source_pdf=pdf, source_filename=pdf.split('\\')[-1],
                     parsed_at=None, page_count=doc.page_count, parse_status='ok', warnings=[],
                     content_sha256=hashlib.sha256(raw).hexdigest(),
                     agent_summary=f"Petrobangla daily gas report for {label}. {len(fields)} producing fields, {plant_count} power plants tracked. Grand total gas production {grand_gas} MMCFD.",
                     queryable_collections=['production.fields', 'production.subtotals',
                                            'distribution.companies.power_plants', 'distribution.summary',
                                            'sgfl.products', 'entities']),
        'report': dict(reference_no=None, period='8.00 to 8.00',
                       units=dict(gas='MMCFD', condensate='BBLD', lpg='Kg', products='BBLD'),
                       report_date_label=label, report_date_start=energy_iso,
                       report_date_end=end.isoformat(), month_label=ed.strftime('%b, %Y')),
        'production': dict(fields=fields, subtotals=subtotals, grand_total=grand, field_count=len(fields)),
        'sgfl': dict(products={}, pipeline_metrics={}, pipeline_total=None),
        'distribution': dict(companies=companies, summary=summary, non_grid_power=[], plant_count=plant_count),
        'validation': dict(field_gas_sum_mmcfd=field_gas_sum, grand_total_gas_mmcfd=grand_gas,
                           variance_mmcfd=variance, reconciled=reconciled),
        'entities': entities,
    }
    result = json.dumps(dict(ok=reconciled, energy=energy_iso, fields=len(fields), plants=plant_count,
                             field_gas_sum=field_gas_sum, grand=grand_gas, variance=variance,
                             power_demand=summary['grand_total']['power_demand_mmcfd'],
                             power_supply=summary['grand_total']['power_supply_mmcfd']))
    if out:
        json.dump(doc_json, open(out, 'w', encoding='utf-8'), indent=2)
    print(result)


if __name__ == '__main__':
    main()
