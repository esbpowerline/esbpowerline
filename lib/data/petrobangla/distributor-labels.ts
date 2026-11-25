/**
 * Display names for the six gas distributors, keyed by the label the archive
 * stores in `gasDistributionData[].company`.
 *
 * The parsers write "BGDCL (Cumilla & Sylhet)" (`parse_daily_reports.py`,
 * `daily_extractor/config.py`, `ingest_bridge.py`), and every day in the archive
 * carries it — 2,415 of them on 2026-11-25. The region is wrong: BGDCL's plant
 * rows in the Petrobangla report (22-23 Nov 2026) are Ashuganj, Chandpur,
 * Comilla, Feni and Mohipal — greater Cumilla and Noakhali — while the Sylhet
 * plants (Shahjibazar, Fenchuganj, Kumargaon) sit under JGTDSL, the next block
 * down. Corrected here, at display, so the archive keeps
 * the string it was filed with and a matcher keyed on it (`distributionCompanyForLabel`
 * reads the code before the bracket) is untouched.
 */
const DISTRIBUTOR_DISPLAY: Record<string, string> = {
  'BGDCL (Cumilla & Sylhet)': 'BGDCL (Cumilla & Noakhali)',
};

export function distributorDisplayLabel(label: string): string {
  return DISTRIBUTOR_DISPLAY[label] ?? label;
}
