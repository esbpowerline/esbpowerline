"""The window a Petrobangla report states about itself, pinned per header style.

`document_window` is what keeps a report from being filed under the day the
caller asked for. When it returns None the caller falls back to that request,
so a header it cannot read is a mis-filing waiting for a skipped slot — on
2026-10-02 the 30 Sep -> 1 Oct report was filed as 2026-09-29 that way.

  python -m unittest scripts/tests/test_petrobangla_window.py
"""

import datetime
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parse_petrobangla_archive import document_window  # noqa: E402


class DocumentWindow(unittest.TestCase):
    def test_day_pair_with_month_elsewhere(self):
        # Slot 30.09.26: the ordinary header, month and year printed apart.
        self.assertEqual(document_window('Date : 28-29\nSep, 2026'), datetime.date(2026, 9, 28))

    def test_day_pair_crossing_a_month_prints_the_second_month(self):
        self.assertEqual(document_window('Date : 31-01\nSep, 2026'), datetime.date(2026, 8, 31))

    def test_both_months_in_full(self):
        # Slot 01.10.26, as pypdf and PyMuPDF both extract it.
        self.assertEqual(document_window('Date : 30 Sep- 1 Oct 2026 '), datetime.date(2026, 9, 30))

    def test_both_months_across_a_year(self):
        self.assertEqual(document_window('Date : 31 Dec - 1 Jan 2027'), datetime.date(2026, 12, 31))

    def test_no_header_is_none_not_a_guess(self):
        self.assertIsNone(document_window('Daily Gas Intake & Offtake Report'))


if __name__ == '__main__':
    unittest.main()
