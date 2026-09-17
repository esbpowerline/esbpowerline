"""The Power Stations parsers, pinned against real PGCB sheets.

Fixtures under fixtures/ are cut from held workbooks with
`ingest_bridge.xlsx_to_md` — whole rows, never edited:

  pgcb-2019-01-18-p2-yesterdaygen.md   Daily Report 19-01-19.xlsm
  pgcb-2016-02-06-p2.md                Daily Report07-02-16.xls
  pgcb-2014-01-02-p2.md                Daily_Report03-01-14_.xls

  python -m unittest scripts/tests/test_power_stations.py
"""

import os
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

from parse_daily_reports import (  # noqa: E402
    parse_p2_stations,
    parse_yesterday_gen,
    station_float,
)


def fixture(name):
    return (HERE / 'fixtures' / name).read_text(encoding='utf-8')


P2_2019 = fixture('pgcb-2019-01-18-p2-yesterdaygen.md')
P2_2016 = fixture('pgcb-2016-02-06-p2.md')
P2_2014 = fixture('pgcb-2014-01-02-p2.md')


def by_name(parsed):
    return {s['name']: s for s in parsed['stations']}


class StationFloat(unittest.TestCase):
    def test_a_blank_is_not_a_zero(self):
        for cell in ('', '   ', '-', 'N/A', 'MW', None):
            self.assertIsNone(station_float(cell), cell)

    def test_a_printed_zero_is_kept(self):
        self.assertEqual(station_float('0'), 0.0)
        self.assertEqual(station_float('1,674,000'), 1674000.0)


class P2(unittest.TestCase):
    def test_header_row_is_not_folded_into_the_first_station(self):
        # "Unit No. X Capacity | MW | MW | MW" passed as an unnamed unit and put
        # "Unit No. X Capacity+2*55" on 1,519 days of 2018-2024.
        first = parse_p2_stations(P2_2019)['stations'][0]
        self.assertEqual(first['name'], 'Ghorasal ST: Unit-1,2')
        self.assertEqual(first['installedCapacity'], '2*55')
        self.assertEqual((first['presentCapacityMw'], first['eveningPeakMw'], first['energyKwh']),
                         (85.0, 35.0, 686000.0))

    def test_a_blank_energy_cell_is_null(self):
        unit6 = by_name(parse_p2_stations(P2_2016))['Ghorasal ST: Unit-6']
        self.assertEqual(unit6['eveningPeakMw'], 0.0)   # printed 0
        self.assertIsNone(unit6['energyKwh'])            # printed nothing

    def test_a_printed_zero_capacity_is_kept(self):
        # "Contract Expired" plants state 0 MW; that used to be turned into null.
        pagla = by_name(parse_p2_stations(P2_2019))['Pagla (DPA )']
        self.assertEqual(pagla['presentCapacityMw'], 0.0)
        self.assertEqual(pagla['remarks'], 'Contract Expired')

    def test_remarks_on_the_2016_layout(self):
        # The header prints "Remarks" a column right of where remarks are typed.
        stations = by_name(parse_p2_stations(P2_2016))
        self.assertEqual(stations['Ghorasal ST: Unit-6']['remarks'], 'Long term maint.')
        self.assertEqual(stations['Ghorasal ST: Unit-4']['remarks'], 'Under maint')

    def test_a_unit_never_crosses_an_area_total(self):
        # 2014 centres a station's name among its units, so Ashugonj's units 1
        # and 2 are printed straight after the Chittagong Area Total. They were
        # filed under Malancha, the last Chittagong station: 76 MW published
        # against a printed 26. Checked against the workbook's raw cells.
        stations = by_name(parse_p2_stations(P2_2014))
        self.assertEqual(stations['Malancha, Ctg EPZ']['eveningPeakMw'], 26.0)
        self.assertEqual(stations['Malancha, Ctg EPZ']['installedCapacity'], '')
        ashugonj = stations['Ashugonj Power Station']
        self.assertEqual(ashugonj['installedCapacity'], '1+2+3+4+5+GT-1+GT-2+ST.')
        self.assertEqual(ashugonj['eveningPeakMw'], 372.0)

    def test_centred_name_still_takes_the_unit_above_it(self):
        # Ghorasal's unit 1 sits above its centred name, inside the Dhaka area.
        ghorasal = by_name(parse_p2_stations(P2_2014))['Ghorasal Power Station']
        self.assertEqual(ghorasal['installedCapacity'], '1+2+3+4+5+6')
        self.assertEqual(ghorasal['eveningPeakMw'], 524.0)

    def test_reads_every_station_row_in_the_excerpt(self):
        # 40 non-empty lines: six of heading, 34 station rows.
        self.assertEqual(len(parse_p2_stations(P2_2019)['stations']), 34)


class YesterdayGen(unittest.TestCase):
    def test_placeholder_columns_are_not_stations(self):
        log = parse_yesterday_gen(P2_2019)
        names = [s['name'] for s in log['stations']]
        self.assertFalse([n for n in names if 'blank' in n.lower() or 'removed' in n.lower()])

    def test_no_capacity_row_means_no_capacity(self):
        log = parse_yesterday_gen(P2_2019)
        self.assertTrue(all(s['capacityMw'] is None for s in log['stations']))

    def test_blank_hour_is_null_not_zero(self):
        text = P2_2019.replace('| 01:00 | 35 |', '| 01:00 |  |', 1)
        self.assertNotEqual(text, P2_2019)
        log = parse_yesterday_gen(text)
        self.assertIsNone(log['stations'][0]['hourlyMw'][0])


if __name__ == '__main__':
    unittest.main()
