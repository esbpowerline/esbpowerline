"""The Voltage sheet and the L-Curve's East/West split, pinned per layout.

Every excerpt below is copied from a held PGCB workbook, converted with
`ingest_bridge.xlsx_to_md` — trimmed, never edited. The traps each one pins
were found by sweeping the parsers over the archive, not by reading the code:

  python -m unittest scripts/tests/test_voltage_lcurve.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parse_daily_reports import parse_load_curve_grids, parse_voltage  # noqa: E402


# Daily Report 29-05-2026_.xlsx — energy day 2026-05-28. No leading column,
# the evening peak's 19:30 logged, the other half hours interpolated.
LCURVE_2026 = """## Sheet: L-Curve
|  |  |  |  |  |  |  |  |  |  |  |  | QF-LDC-11 |
| Date | 28-05-2026 |  |  |  | Power Grid Bangladesh PLC |
| TIME | EAST GRID | WEST GRID | TOTAL |  | National Load Dispatch Center (NLDC) |
| 00:00 | 4912 | 4682 | 9594 |  | DAILY GENERATION CURVE |
| 00:30 | 4866.5 | 4579 | 9445.5 |
| 01:00 | 4821 | 4476 | 9297 |  | 28-05-2026 |
| 18:00 | 5707.46 | 4528.32 | 10235.78 |
| 18:30 | 6040.23 | 4874.66 | 10914.89 |
| 19:00 | 6373 | 5221 | 11594 |
| 19:30 | 6826 | 5533 | 12359 |
| 20:00 | 6729 | 5314 | 12043 |
| 20:30 | 6940.35 | 5263.5 | 12203.85 |  |  |  |  |  |  |     Executive Engineer  |
| 21:00 | 7151.7 | 5213 | 12364.7 |  |  |  |  |  |  | Network Operation Division |
## Sheet: En-Curve
| TIME | Gas |
"""

# Daily Report01-03-16.xls — energy day 2016-02-29. The interconnector has a
# column of its own, the East comes after it, and the sheet closes on 24:00.
LCURVE_2016 = """## Sheet: L.curve
| Date | 2016-02-29 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | QF-LDC-11 |
| TIME | E-W INT. | EAST GRID | WEST GRID | TOTAL |  | Demand | Hour |
| 00:00 | -320 | 4620 | 1417 | 6037 | -320 | 6037 | 00:00 |  |  |  |  | DAILY  LOAD  CURVE |
| 00:30 | -320 | 4455.5 | 1376.5 | 5832 | -320 | 5832 | 01:00 |
| 01:00 | -320 | 4291 | 1336 | 5627 | -280 | 5627 | 02:00 |
| 23:30 | -325 | 4809.5 | 1544 | 6353.5 |  | 6353.5 |
| 24:00 | -250 | 4627 | 1530 | 6157 |  | 6157 |
"""

# Daily Report 29-05-2026_.xlsx — two blocks, no leading column, N/A cells.
VOLTAGE_2026 = """## Sheet: Voltage
| Power Grid Bangladesh PLC |
| National Load Dispatch Center (NLDC) |
| Maximum & Minimum Voltages of Grid Sub-Stations |
| Date: | 28-05-2026 |
| Substation | Maximum Voltage | Time | Minimum Voltage | Time | Substation | Maximum Voltage | Time | Minimum Voltage | Time |
| 400 kV | KV |  | KV |  | 400 kV | KV |  | KV |
| Aminbazar | 412 | 09:00 | 398 | 19:00 | Madunaghat | 413 | 09:00 | 402 | 17:00 |
| BIPTC | 409 | 06:00 | 395 | 21:00 |
| 132 kV | KV |  | KV |  | 132 kV | KV |  | KV |
| Mongla | 134 | 09:00 | 114 | 19:00 | Rampur | N/A | N/A | N/A | N/A |
| Ashuganj | 145 | 08:00:00 | 137 | 18:30:00 |
"""

# Daily Report 01.03.2021_.xlsm — energy day 2021-02-28. A leading empty
# column, a two-row header, a typo, placeholder zeros, a listed substation with
# nothing filled in, and 24:00.
VOLTAGE_2021 = """## Sheet: Voltage
| e |
|  |  | MAXIMUM & MINIMUM VOLTAGES OF DIFFERENT GRID SUB-STATIONS: |
|  | Date: | 2021-02-28 00:00:00 |  |  |  |  |  |  |  | QF-LDC-10 |
|  | Sub-Station | Max Voltage | Hour | Min | Hour | Sub-Station | Maxm | Hour | Min | Hour |
|  |  |  |  | Voltage |  |  | Voltage |  | Voltage |
|  | 400 KV | KV | Hour | KV |  |  | KV |  | KV |
|  | Bibiyana | 412 | 08:00:00 | 405 | 03:00:00 | Kaliakoir | 402 | 7:00:00 | 393 | 15:00:00 |
|  | Bheramara | 4052 | 09:00:00 | 397 | 19:00:00 | Bhulta | 397 | 8:00:00 | 382 | 16:00:00 |
|  | 230 KV | KV |  | KV |  | 230 KV | KV |  | KV |
|  | Serajganj | 234 | 24:00 | 227 | 11:00:00 | Siddhirganj | 239 | 08:00:00 | 231 | 12:00:00 |
|  |    132 kV | KV |  | KV |  |     132 kV | KV |  | KV |
|  | Sreenagar |  |  |  |  | Kaptai | 0 | 1:00:00 | 0 | 2:00:00 |
|  | Ullon | 134 | 04:00:00 | 128 | 12:00:00 | Modern Steel | 0 | 1:00:00 | 0 | 2:00:00 |
|  | Hasnabad | 135 | 09:00:00 | 128 | 15:00:00 |  Executive Engineer |
"""

# Daily Report 28-08-2023_.xlsm — the right block's "132 kV" overtyped with a
# station name, 2023-03..2024-01.
VOLTAGE_2023 = """## Sheet: Voltage
|  | Date: | 2023-08-27 |
|  | Sub-Station | Max Voltage | Hour | Min | Hour | Sub-Station | Maxm | Hour | Min | Hour |
|  | 230 KV | KV |  | KV |  | 230 KV | KV |  | KV |
|  | Tongi | 238 | 08:00 | 233 | 23:00 | Kaliakoir | 239 | 09:00 | 231 | 17:00 |
|  | 132 kV | KV |  | KV |  | Tongi |
|  | AKS | 134 | 21:00 | 129 | 11:00 | Madaripur | 130 | 03:00 | 127 | 12:00 |
"""

# Daily Report01-03-16.xls — the 2014-2018 name for the sheet.
VOLT_2016 = """## Sheet: volt
| Date: | 2016-02-29 |
| Sub-Station | Maxm | Hour | Minm | Hour | Sub-Station | Maxm | Hour | Minm | Hour |
| 230 KV | KV |  | KV |  | 230 KV | KV |  | KV |
| Ghorasal | 230 | 01:00 | 225 | 15:00 | Hathazari | 221 | 03:00 | 218 | 13:00 |
"""


class LoadCurveGrids(unittest.TestCase):
    def test_splits_east_and_west_as_printed(self):
        lc = parse_load_curve_grids(LCURVE_2026)
        self.assertEqual(lc['sheetDate'], '2026-05-28')
        self.assertEqual(lc['series'], ['east', 'west', 'total'])
        self.assertEqual(lc['rows'][0], {'time': '00:00', 'east': 4912.0, 'west': 4682.0, 'total': 9594.0})
        self.assertEqual(lc['checks'], [])

    def test_names_interpolated_half_hours_and_not_the_evening_peak(self):
        # 19:30 totals 12,359 MW; its neighbours average 11,818.5. Claiming
        # the whole sheet interpolated would call a logged peak a straight line.
        lc = parse_load_curve_grids(LCURVE_2026)
        self.assertEqual(lc['interpolatedHalfHours'], ['00:30', '18:30', '20:30'])

    def test_locates_columns_on_the_old_layout(self):
        # A fixed index here returns the interconnector as the East Grid.
        lc = parse_load_curve_grids(LCURVE_2016)
        self.assertEqual(lc['series'], ['east', 'west', 'total', 'eastWestInterchange'])
        self.assertEqual(lc['rows'][0],
                         {'time': '00:00', 'east': 4620.0, 'west': 1417.0, 'total': 6037.0,
                          'eastWestInterchange': -320.0})

    def test_leaves_out_the_closing_24_00(self):
        lc = parse_load_curve_grids(LCURVE_2016)
        self.assertEqual(lc['rows'][-1]['time'], '23:30')

    def test_reports_a_total_the_halves_do_not_sum_to(self):
        broken = LCURVE_2026.replace('| 01:00 | 4821 | 4476 | 9297 |', '| 01:00 | 4821 | 4476 | 9397 |')
        lc = parse_load_curve_grids(broken)
        self.assertEqual(len(lc['checks']), 1)
        self.assertEqual(lc['checks'][0]['scope'], '01:00')
        # Reported, never corrected.
        self.assertEqual(lc['rows'][2]['total'], 9397.0)

    def test_a_blank_cell_is_none_not_zero(self):
        lc = parse_load_curve_grids(LCURVE_2026.replace('| 00:00 | 4912 |', '| 00:00 |  |'))
        self.assertIsNone(lc['rows'][0]['east'])

    def test_absent_sheet_is_none(self):
        self.assertIsNone(parse_load_curve_grids('## Sheet: P1\n| a | b |\n'))


class Voltage(unittest.TestCase):
    def rows(self, text):
        return {(r['level'], r['substation']): r for r in parse_voltage(text)['rows']}

    def test_reads_both_blocks_in_printed_order(self):
        v = parse_voltage(VOLTAGE_2026)
        self.assertEqual(v['sheetDate'], '2026-05-28')
        self.assertEqual([r['substation'] for r in v['rows']],
                         ['Aminbazar', 'BIPTC', 'Madunaghat', 'Mongla', 'Ashuganj', 'Rampur'])
        self.assertEqual(v['rows'][0], {'level': 400, 'substation': 'Aminbazar', 'max': 412.0,
                                        'maxTime': '09:00', 'min': 398.0, 'minTime': '19:00'})

    def test_n_a_is_none(self):
        rampur = self.rows(VOLTAGE_2026)[(132, 'Rampur')]
        self.assertEqual([rampur[k] for k in ('max', 'maxTime', 'min', 'minTime')], [None] * 4)

    def test_right_block_without_its_own_heading_takes_the_rows_level(self):
        # 2021 leaves the right block's 400 KV heading blank; Kaliakoir and
        # Bhulta were dropped until the heading row applied to both blocks.
        rows = self.rows(VOLTAGE_2021)
        self.assertIn((400, 'Kaliakoir'), rows)
        self.assertIn((400, 'Bhulta'), rows)

    def test_overtyped_heading_does_not_misfile_the_level(self):
        rows = self.rows(VOLTAGE_2023)
        self.assertIn((132, 'Madaripur'), rows)
        self.assertNotIn((230, 'Madaripur'), rows)
        # The overtyped heading is not a reading; the real Tongi 230 kV row is.
        self.assertEqual([k for k in rows if k[1] == 'Tongi'], [(230, 'Tongi')])
        self.assertEqual(parse_voltage(VOLTAGE_2023)['checks'], [])

    def test_publishes_typos_and_zeros_as_printed_and_reports_them(self):
        v = parse_voltage(VOLTAGE_2021)
        rows = self.rows(VOLTAGE_2021)
        self.assertEqual(rows[(400, 'Bheramara')]['max'], 4052.0)
        self.assertEqual(rows[(132, 'Kaptai')]['max'], 0.0)
        scopes = [c['scope'] for c in v['checks']]
        self.assertIn('Bheramara 400 kV', scopes)
        self.assertEqual(scopes.count('Kaptai 132 kV'), 2)
        self.assertEqual(scopes.count('Modern Steel 132 kV'), 2)

    def test_keeps_a_listed_substation_with_nothing_filled_in(self):
        sreenagar = self.rows(VOLTAGE_2021)[(132, 'Sreenagar')]
        self.assertIsNone(sreenagar['max'])

    def test_drops_the_footer(self):
        self.assertNotIn((132, 'Executive Engineer'), self.rows(VOLTAGE_2021))

    def test_times_normalised_and_24_00_kept(self):
        rows = self.rows(VOLTAGE_2021)
        self.assertEqual(rows[(400, 'Kaliakoir')]['maxTime'], '07:00')
        self.assertEqual(rows[(230, 'Serajganj')]['maxTime'], '24:00')

    def test_reads_the_sheet_date_from_a_datetime_cell(self):
        self.assertEqual(parse_voltage(VOLTAGE_2021)['sheetDate'], '2021-02-28')

    def test_reads_the_old_sheet_name(self):
        rows = self.rows(VOLT_2016)
        self.assertIn((230, 'Hathazari'), rows)

    def test_absent_sheet_is_none(self):
        self.assertIsNone(parse_voltage('## Sheet: P1\n| a | b |\n'))


if __name__ == '__main__':
    unittest.main()
