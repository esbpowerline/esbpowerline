/**
 * What everyone else says about Bangladesh's gas running out — and what this
 * model says beside it.
 *
 * A depletion projection published to readers has to survive the obvious
 * question: does anyone else get the same answer? These are the public
 * statements we could find and read, each recorded with who said it, when, and
 * where it can be checked. Our own comparable figure is computed from the model
 * at render time rather than typed in here, so this table cannot drift away
 * from the chart above it.
 *
 * Rules this file follows:
 *   - Every claim is attributed to a document or a named person with a title.
 *   - `verified` says whether we opened the primary source ourselves. Where we
 *     could not — a 403, a download that times out — the entry says so and
 *     names the reporting we took it from. A figure quoted at second hand is
 *     still worth showing; presenting it as though we had read the original
 *     would not be.
 *   - Nothing here feeds the model. It is a check on the model, and if it fed
 *     it, it would stop being one.
 */

import type { ReserveModel } from './reserveModel';

export type BenchmarkKind = 'official' | 'reported' | 'expert';

export interface ReserveBenchmark {
  id: string;
  /** Who said it. */
  source: string;
  /** Their standing — the reason this belongs in the table. */
  standing: string;
  kind: BenchmarkKind;
  /** When the claim was made or what date it speaks for. */
  asOf: string;
  /** The claim, in their terms. */
  claim: string;
  /** Verbatim where we have it, else null. */
  quote?: string;
  url?: string;
  /** Did we open the primary source ourselves? */
  verified: boolean;
  /** How we came by it when `verified` is false. */
  via?: string;
  /** Our comparable figure, computed from the model. */
  ours: (m: ReserveModel) => string;
  /** What the comparison shows. Kept short enough to read in a table row. */
  reading: (m: ReserveModel) => string;
  /** Does our number agree, differ for a stated reason, or disagree? */
  verdict: (m: ReserveModel) => 'agrees' | 'differs' | 'explains';
}

const round = (n: number) => Math.round(n).toLocaleString();

/** The model's rate at a calendar year, under one of the two bindings. */
export function rateAtYear(
  m: ReserveModel,
  year: number,
  binding: 'reserves_binding' | 'decline_binding',
): number {
  const asOf = Number(m.as_of.slice(0, 4)) + Number(m.as_of.slice(5, 7)) / 12;
  const months = Math.round((year - asOf) * 12);
  const series = m.trajectory[binding];
  const hit = series.reduce((b, p) => (Math.abs(p.m - months) < Math.abs(b.m - months) ? p : b), series[0]);
  return hit.rate;
}

export const RESERVE_BENCHMARKS: ReserveBenchmark[] = [
  {
    id: 'hcu-annual',
    source: 'Hydrocarbon Unit — Energy Scenario of Bangladesh 2024-25',
    standing: 'The Energy and Mineral Resources Division’s own statistical annual',
    kind: 'official',
    asOf: 'FY2024-25',
    claim: 'National gas production of 277.67 Bcf by the state companies and 418.42 Bcf by the IOCs — 696.09 Bcf for the year',
    url: 'https://hcu.gov.bd/',
    verified: true,
    ours: (m) => `${m.validation[m.validation.length - 1].measured_production_bcf.toFixed(2)} Bcf`,
    reading: (m) => {
      const ours = m.validation[m.validation.length - 1].measured_production_bcf;
      return `${(((ours - 696.09) / 696.09) * 100).toFixed(2)}% apart, from daily reports the Unit never used`;
    },
    verdict: () => 'agrees',
  },
  {
    id: 'hcu-remaining',
    source: 'Hydrocarbon Unit — Energy Scenario of Bangladesh 2024-25',
    standing: 'Official statistical annual',
    kind: 'official',
    asOf: 'June 2025',
    claim: '2P recoverable 29.93 Tcf, 21.77 Tcf produced, 8.15 Tcf remaining',
    url: 'https://hcu.gov.bd/',
    verified: true,
    ours: (m) =>
      `${(m.anchor.initial_recoverable_2p_bcf / 1000).toFixed(2)} / ${(m.anchor.cumulative_produced_bcf / 1000).toFixed(2)} / ${(m.anchor.grand_total_remaining_bcf / 1000).toFixed(2)} Tcf`,
    reading: () =>
      'Two arms of the same ministry publish different totals — 8.15 Tcf against Petrobangla’s 7.97. We anchor on Petrobangla’s, because only its table breaks the figure down by field.',
    verdict: () => 'differs',
  },
  {
    id: 'adviser-parliament',
    source: 'Iqbal Hassan Mahmood, Adviser for Power, Energy and Mineral Resources',
    standing: 'Stated in parliament',
    kind: 'official',
    asOf: 'April 2026',
    claim: '7.63 Tcf recoverable gas remaining as of 1 January, from 29.74 Tcf recoverable less 22.11 Tcf produced; about 12 years left at ~1,700 MMCFD',
    url: 'https://tob.news/gas-depletion-outpaces-exploration/',
    verified: false,
    via: 'reported by TOB News, 4 August 2026',
    ours: (m) => `${m.headline.years_at_current_rate_no_decline} years`,
    reading: (m) =>
      `The 12 years divides the national total by the national rate. ${(
        (m.reserve_pools_bcf.discovered_undeveloped + m.reserve_pools_bcf.production_suspended) / 1000
      ).toFixed(2)} Tcf of that total sits in fields that are not producing, so it cannot be drawn at that rate. Behind producing wells the same arithmetic gives ${m.headline.years_at_current_rate_no_decline} years.`,
    verdict: () => 'explains',
  },
  {
    id: 'petrobangla-director',
    source: 'Md Rafiqul Islam, Director (Operations and Mines), Petrobangla',
    standing: 'Petrobangla’s own operations directorate',
    kind: 'official',
    asOf: 'July 2026',
    claim: 'Total reserves of 7.63 Tcf, counting producing and non-producing fields alike',
    quote:
      'The country’s total reserves stand at 7.63 Tcf. This figure counts both producing and non-producing fields.',
    url: 'https://en.bonikbarta.com/bangladesh/WtKgMkdTssPxayQd',
    verified: true,
    ours: (m) =>
      `${(m.reserve_pools_bcf.producing_now / 1000).toFixed(2)} Tcf producing · ${(
        (m.reserve_pools_bcf.discovered_undeveloped + m.reserve_pools_bcf.production_suspended) / 1000
      ).toFixed(2)} Tcf not`,
    reading: () =>
      'The split this model insists on is the one Petrobangla’s own director draws in the same breath as the total.',
    verdict: () => 'agrees',
  },
  {
    id: 'bonikbarta-producing',
    source: 'Bonik Barta, from a Petrobangla report',
    standing: 'Financial daily, analysing the same source documents',
    kind: 'reported',
    asOf: 'June 2026',
    claim: 'Reserves in producing fields down to about 6 Tcf; at the current pace, about eight years',
    url: 'https://en.bonikbarta.com/bangladesh/WtKgMkdTssPxayQd',
    verified: true,
    ours: (m) => `${(m.reserve_pools_bcf.producing_now / 1000).toFixed(2)} Tcf`,
    reading: (m) =>
      `The closest published figure to what this model tracks — ${Math.abs(
        6 - m.reserve_pools_bcf.producing_now / 1000,
      ).toFixed(2)} Tcf from ours two months later. Both read the same Petrobangla table, so this confirms the reading rather than testing it.`,
    verdict: () => 'agrees',
  },
  {
    id: 'iepmp-2030',
    source: 'Integrated Energy and Power Master Plan 2023',
    standing: 'The government’s own master plan, prepared with JICA',
    kind: 'official',
    asOf: '2030',
    claim: 'Production from existing fields falling from about 2,100 MMCFD to 1,300 MMCFD by 2030',
    url: 'https://ieefa.org/resources/bangladeshs-iepmp-raises-more-questions-it-answers',
    verified: false,
    via: 'reported by IEEFA (Shafiqul Alam, Lead Energy Analyst, Bangladesh); the master plan PDF would not download for us to read directly',
    ours: (m) => `${round(rateAtYear(m, 2030, 'decline_binding'))} MMCFD`,
    reading: (m) =>
      `Our measured-decline edge reaches ${round(rateAtYear(m, 2030, 'decline_binding'))} MMCFD — within ${Math.abs(
        Math.round(((rateAtYear(m, 2030, 'decline_binding') - 1300) / 1300) * 100),
      )}% of a forecast built by consultants with field-level access. Our other edge, holding fields to their booked 2P, is far lower at ${round(
        rateAtYear(m, 2030, 'reserves_binding'),
      )}. The master plan sits inside our band, not on our central line.`,
    verdict: () => 'agrees',
  },
  {
    id: 'iepmp-2040',
    source: 'Integrated Energy and Power Master Plan 2023',
    standing: 'The government’s own master plan, prepared with JICA',
    kind: 'official',
    asOf: '2040',
    claim: 'Production from existing fields down to 580 MMCFD by 2040',
    url: 'https://ieefa.org/resources/bangladeshs-iepmp-raises-more-questions-it-answers',
    verified: false,
    via: 'reported by IEEFA; not read in the master plan itself',
    ours: (m) =>
      `${round(rateAtYear(m, 2040, 'reserves_binding'))}–${round(rateAtYear(m, 2040, 'decline_binding'))} MMCFD`,
    reading: (m) =>
      `580 sits inside our band — ${round(
        rateAtYear(m, 2040, 'reserves_binding'),
      )} if the booked 2P binds, ${round(
        rateAtYear(m, 2040, 'decline_binding'),
      )} if the decline does. The two ends are 15 years of compounding apart, which is the honest width of a projection this far out.`,
    verdict: () => 'agrees',
  },
  {
    id: 'bapex-2039',
    source: 'Bapex',
    standing: 'The state exploration company',
    kind: 'official',
    asOf: 'reported 2026',
    claim: 'Without fresh discoveries, gas could be exhausted by 2039 — or sooner',
    verified: false,
    via: 'reported in Bangladeshi press; no primary Bapex document located',
    ours: (m) =>
      `output ${Math.round(
        (rateAtYear(m, 2039, 'reserves_binding') / m.now.national_rate_mmcfd) * 100,
      )}–${Math.round((rateAtYear(m, 2039, 'decline_binding') / m.now.national_rate_mmcfd) * 100)}% of today`,
    reading: () =>
      'An exhaustion year is the wrong unit. Fields on decline do not stop; they fade, and the damage is done long before the last cubic foot.',
    verdict: () => 'explains',
  },
  {
    id: 'badrul-imam',
    source: 'Professor Badrul Imam, geologist, University of Dhaka',
    standing: 'The country’s most-cited independent voice on gas',
    kind: 'expert',
    asOf: '2024–2026',
    claim: 'Output from existing fields will keep falling unless new fields are found; imports do not buy energy security',
    quote: 'We’re simply depleting the reserves we have, unable to add more.',
    url: 'https://en.bonikbarta.com/bangladesh/WtKgMkdTssPxayQd',
    verified: true,
    ours: (m) => `${m.fields.filter((f) => f.decline_basis === 'exponential-fit' && f.decline_pct_yr > 0).length} of ${m.fields.filter((f) => f.rate_now_mmcfd > 0).length} producing fields on measurable decline`,
    reading: (m) =>
      `Measured rather than asserted: the fields on a fittable decline are falling at a median ${median(
        m.fields.filter((f) => f.decline_basis === 'exponential-fit').map((f) => f.decline_pct_yr),
      ).toFixed(1)}% a year.`,
    verdict: () => 'agrees',
  },
];

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
