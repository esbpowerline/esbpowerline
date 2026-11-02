'use client';

/**
 * Gas Reserve Depletion.
 *
 * How much gas Bangladesh has left in the fields it is producing from, how fast
 * that is changing, and what has to be true for each answer. Both halves come
 * from documents Petrobangla publishes — its field-wise reserve statement and
 * its daily production reports — joined field by field.
 *
 * The page is three tiers on purpose. The finding first, in figures a reader can
 * carry away. Then the chart. Then the evidence — method, field detail, and the
 * comparison against everyone else who has published a number — folded into one
 * panel with three views, because all of it matters and none of it should be
 * shouting at someone who came for the number.
 *
 * The previous version projected three editorial scenarios (2033/2038/2040) as
 * straight lines and scaled the archive by a constant so its integral would land
 * on an uncited figure. See scripts/build_reserve_model.py for what replaced it.
 */

import { useEffect, useMemo, useState } from 'react';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import {
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Droplet,
  ExternalLink,
  Layers,
  Recycle,
  Search,
} from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { GridChartExternalLegend } from '@/components/news/PowerGridChartUI';
import {
  RESERVE_MODEL_PATH,
  RESERVE_SENSITIVITY_PATH,
  yearOf,
  type ReserveField,
  type ReserveModel,
  type ReserveSensitivity,
} from '@/lib/data/macro/reserveModel';
import { RESERVE_BENCHMARKS } from '@/lib/data/macro/reserveBenchmarks';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import { PetrobanglaBootstrapProvider } from './PetrobanglaBootstrap';
import { GridCardFooter, GridProvenanceTag, GridSourceFiles } from './GridExplorerUI';
import { PetrobanglaMacroGasSection } from './PetrobanglaMacroGasSection';
import { ReserveTrajectoryCanvas } from './ReserveTrajectoryCanvas';
import { MobileFold } from './MobileFold';
import { SERIES_COLORS } from '@/lib/data/grid/chart-palette';

interface Props {
  selectedDate: string;
  systemStatsDate: string;
  pgcbGasTotal?: number;
  chartsReady: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * When the external sources in this panel were last opened and checked.
 *
 * Stated because a citation without a retrieval date is not a citation: the
 * press pages move, the ministry portals go down — one of them was down when
 * this was compiled — and a reader deserves to know how old the check is.
 */
const RETRIEVED = '18 Aug 2026';

function formatGasDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

type EvidenceView = 'method' | 'fields' | 'checks';

export function GasReserveDepletionTab(props: Props) {
  return (
    <PetrobanglaBootstrapProvider>
      <GasReserveDepletionContent {...props} />
    </PetrobanglaBootstrapProvider>
  );
}

function GasReserveDepletionContent({ selectedDate, systemStatsDate, pgcbGasTotal }: Props) {
  const chartTheme = useChartTheme();
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('simple');
  const [model, setModel] = useState<ReserveModel | null>(null);
  const [sensitivity, setSensitivity] = useState<ReserveSensitivity | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<EvidenceView[]>([]);

  const toggle = (id: EvidenceView) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]));

  useEffect(() => {
    let alive = true;
    // Manifest-aware, so a model rerun published since the last deploy is the
    // one charted here.
    fetchDataJson<ReserveModel>(RESERVE_MODEL_PATH)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setModel(res.data);
        else setFailed(true);
      })
      .catch(() => { if (alive) setFailed(true); });
    // The sensitivity run is optional: if it is missing the panel simply does
    // not claim anything about how much the choices are worth.
    fetchDataJson<ReserveSensitivity>(RESERVE_SENSITIVITY_PATH)
      .then((res) => { if (alive && res.ok) setSensitivity(res.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const openChecks = () => {
    setOpen((cur) => (cur.includes('checks') ? cur : [...cur, 'checks']));
    // Let the section render before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById('reserve-evidence-checks')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const colors = useMemo(
    () => ({
      axis: chartTheme.axisTick,
      grid: chartTheme.gridStroke,
      measured: chartTheme.primary,
      // Amber has no token in the chart theme, so it is stated once here rather
      // than repeated down the file; red comes from the theme so it tracks the
      // rest of the site in both modes.
      reserves: SERIES_COLORS.bdGasTariff,
      decline: chartTheme.destructive,
      flat: chartTheme.axisTick,
      palette: (i: number) => chartTheme.categorical(i),
    }),
    [chartTheme],
  );

  return (
    <div className="gas-reserve-tab grid-explorer-subpanel">
      <section className="gas-reserve-hero card">
        <div className="gas-reserve-hero__head">
          <div className="gas-reserve-hero__icon">
            <Database className="h-6 w-6 shrink-0 text-sky-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="gas-reserve-zone-eyebrow">Macro reserves</p>
            <h2 className="gas-reserve-hero__title">Gas Reserve Depletion</h2>
            <p className="gas-reserve-hero__sub">
              {model ? (
                <>
                  Once a year Petrobangla says how much gas is left in each field. Every morning it
                  says how much came out. Put the two together, field by field, and you can watch the
                  country&apos;s gas run down in real time — {model.archive_days.toLocaleString()}
                  {' '}daily reports against the reserve statement of {formatGasDay(model.anchor.as_of)}.
                </>
              ) : (
                'Domestic recoverable gas is finite, and both halves of that — how much is left, and how fast it is leaving — are published.'
              )}
            </p>
          </div>
          <span className="grid-explorer-chip text-destructive border-destructive/25 bg-destructive/10 shrink-0">
            Structural risk
          </span>
        </div>

        {model ? <HeroMetrics model={model} /> : null}
        {model ? <ConfidenceStrip model={model} onOpenChecks={openChecks} /> : null}
        {model ? <ViewLadder model={model} /> : null}
      </section>

      <div className="grid-explorer-chart-card card gas-reserve-depletion">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Layers className="h-5 w-5 text-sky-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="grid-explorer-chart-card__title">Reserve depletion trajectory</h3>
            <p className="grid-explorer-chart-card__sub">
              {model
                ? `Production stacked by field, history and forecast, with what is left above it · ${model.profile.named_share_pct}% of today's output is the six fields named`
                : 'Production stacked by field, with the reserve balance above it'}
            </p>
          </div>
        </div>

        <div className="gas-reserve-depletion__body">
          {model ? (
            <>
              <GridChartExternalLegend
                items={model.profile.fields.map((name, i) => ({
                  id: `field-${name}`,
                  label: name,
                  color: chartTheme.categorical(i),
                  variant: 'area' as const,
                }))}
              />
              <GridChartExternalLegend
                items={[
                  { id: 'measured', label: 'Measured — published reserve, metered production',
                    color: colors.measured, variant: 'line', provenance: 'P' },
                  { id: 'reserves', label: 'Reserve left if the booked 2P holds',
                    color: colors.reserves, variant: 'line', provenance: 'D' },
                  { id: 'decline', label: 'Reserve left if the measured decline holds',
                    color: colors.decline, variant: 'dashed', provenance: 'D' },
                  { id: 'flat', label: 'Straight-line answer (for contrast)',
                    color: colors.flat, variant: 'dashed', provenance: 'D' },
                ]}
              />
              <ReserveTrajectoryCanvas model={model} colors={colors} />
              <HowToRead model={model} />
            </>
          ) : (
            <div className="grid-explorer-skeleton h-[30rem] w-full rounded-xl" aria-hidden />
          )}
          {failed && !model ? (
            <p className="text-xs text-muted-foreground px-1 py-6 text-center">
              The reserve model could not be loaded. Nothing is shown rather than a trajectory built
              from something else.
            </p>
          ) : null}
        </div>

        {model ? (
          <Evidence model={model} sensitivity={sensitivity} open={open} onToggle={toggle} />
        ) : null}

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold">
              Petrobangla
            </a>
            {model
              ? ` — ${model.anchor.table}, pp. ${model.anchor.pages.join('–')}; daily gas reports ${model.history.monthly_rate[0]?.month.slice(0, 4)}–present`
              : ''}
          </span>
          {model ? (
            <GridSourceFiles
              files={[
                { label: 'Petrobangla', name: model.anchor.document },
                { label: 'Archive', name: `${model.archive_days.toLocaleString()} daily gas reports` },
              ]}
            />
          ) : null}
          <span>
            Reserve and production figures as published <GridProvenanceTag kind="P" />; the balance,
            the fits and every projection are ours <GridProvenanceTag kind="D" />. Not independently
            audited, and not put to Petrobangla for comment.
          </span>
          {model ? (
            <span className="font-medium">
              Model as of {formatGasDay(model.as_of)} · sources retrieved {RETRIEVED}
            </span>
          ) : null}
        </GridCardFooter>
      </div>

      <PetrobanglaMacroGasSection
        selectedDate={selectedDate}
        systemStatsDate={systemStatsDate}
        pgcbGasTotal={pgcbGasTotal}
        embedded
        audienceMode={audienceMode}
        onAudienceModeChange={setAudienceMode}
      />
    </div>
  );
}

/* ── the four figures worth carrying away ─────────────────────────────────── */

function HeroMetrics({ model }: { model: ReserveModel }) {
  const h = model.headline;
  const halves = yearOf(model, h.years_until_rate_halves);
  const rrr = h.reserve_replacement_pct_latest;
  const needed = h.new_gas_needed_to_hold_flat_10y_bcf;
  const bibiyana = model.fields.find((f) => f.field === 'Bibiyana');

  const items = [
    {
      icon: Droplet,
      tone: 'text-sky-500',
      kind: 'D' as const,
      label: 'Left in producing fields',
      value: (model.reserve_pools_bcf.producing_now / 1000).toFixed(2),
      unit: 'Tcf',
      hint: `${(model.anchor.producing_remaining_bcf / 1000).toFixed(2)} Tcf booked on ${formatGasDay(model.anchor.as_of)}, less ${Math.round(model.now.drawn_since_anchor_bcf)} BCF metered since`,
    },
    {
      icon: Recycle,
      tone: rrr != null && rrr < 100 ? 'text-red-500' : 'text-emerald-500',
      kind: 'D' as const,
      label: 'Reserve replacement',
      value: rrr != null ? rrr.toFixed(0) : '—',
      unit: '%',
      hint: 'of what was produced was added back, latest full year. Below 100% an operator is living off its balance sheet',
    },
    {
      icon: ArrowDownRight,
      tone: 'text-amber-500',
      kind: 'D' as const,
      label: 'Output halves by',
      value: halves ? String(halves) : '—',
      unit: '',
      hint: `${Math.round(model.now.national_rate_mmcfd).toLocaleString()} → ${Math.round(h.rate_in_5_years_mmcfd).toLocaleString()} MMCFD in five years, if the booked reserve is right`,
    },
    {
      icon: Search,
      tone: 'text-violet-500',
      kind: 'D' as const,
      label: 'New gas needed to hold flat',
      value: (needed / 1000).toFixed(2),
      unit: 'Tcf',
      hint: bibiyana
        ? `over ten years — ${(needed / bibiyana.remaining_now_bcf).toFixed(1)}× what is left in Bibiyana`
        : 'over ten years',
    },
  ];

  return (
    <div className="gas-reserve-metric-band">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="gas-reserve-metric">
            <div className="gas-reserve-metric__top">
              <span className={`gas-reserve-metric__icon ${m.tone}`}>
                <Icon className="shrink-0 text-background" />
              </span>
              <span className="gas-reserve-metric__label">{m.label}</span>
              <GridProvenanceTag kind={m.kind} className="ml-auto" />
            </div>
            <span className={`gas-reserve-metric__value ${m.tone}`}>
              {m.value}
              {m.unit ? (
                // A percent sign belongs against its number; a unit word does not.
                <span className={`gas-reserve-metric__unit${m.unit === '%' ? ' is-tight' : ''}`}>
                  {m.unit}
                </span>
              ) : null}
            </span>
            <span className="gas-reserve-metric__hint">{m.hint}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * How the three gas views on this page differ.
 *
 * A projection, a six-year measured history and a live operational panel sit
 * one under the other, all built from the same daily reports, and a reader is
 * entitled to know which one answers their question rather than working it out
 * from the headings. Stated once, here, at the top.
 */
function ViewLadder({ model }: { model: ReserveModel }) {
  const first = model.history.monthly_rate[0]?.month.slice(0, 4) ?? '2020';
  return (
    <MobileFold title="Which view answers which question">
    <div className="reserve-ladder">
      <div className="reserve-ladder__item">
        <span className="reserve-ladder__num">1</span>
        <span>
          <span className="reserve-ladder__title">This panel — what is left, and for how long</span>
          <span className="reserve-ladder__body">
            The only view that looks forward. Published reserves joined to measured production, field
            by field, and projected. Answers &ldquo;how long&rdquo;.
          </span>
        </span>
      </div>
      <div className="reserve-ladder__item">
        <span className="reserve-ladder__num">2</span>
        <span>
          <span className="reserve-ladder__title">National Timeline — what has actually happened</span>
          <span className="reserve-ladder__body">
            Every gas-day since {first}, domestic against imported. No modelling at all. Answers
            &ldquo;is the decline real, and when did it start&rdquo;.
          </span>
        </span>
      </div>
      <div className="reserve-ladder__item">
        <span className="reserve-ladder__num">3</span>
        <span>
          <span className="reserve-ladder__title">Field evidence — what happened this week</span>
          <span className="reserve-ladder__body">
            The operational view: field, plant and sector detail from the latest reports. Answers
            &ldquo;who is short of gas right now&rdquo;.
          </span>
        </span>
      </div>
    </div>
    </MobileFold>
  );
}

/** One line on the credibility of the measurement, with the detail a click away. */
function ConfidenceStrip({ model, onOpenChecks }: { model: ReserveModel; onOpenChecks: () => void }) {
  const worst = model.validation.reduce(
    (w, v) => (Math.abs(v.difference_pct) > Math.abs(w.difference_pct) ? v : w),
    model.validation[0],
  );
  return (
    <button type="button" className="reserve-confidence" onClick={onOpenChecks}>
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      <span>
        Add up the daily reports and you get Petrobangla&apos;s own annual production figure back to
        within <strong className="text-foreground">{Math.abs(worst.difference_pct).toFixed(2)}%</strong>,
        and the Hydrocarbon Unit&apos;s separately published total to within{' '}
        <strong className="text-foreground">0.10%</strong>. Nothing in this model is tuned to make that
        happen.
      </span>
      <span className="reserve-confidence__cta">See the checks →</span>
    </button>
  );
}

/* ── how to read the two forward edges ────────────────────────────────────── */

function HowToRead({ model }: { model: ReserveModel }) {
  const h = model.headline;
  return (
    <div className="reserve-read">
      <div className="reserve-read__col">
        <span className="reserve-read__tag reserve-read__tag--reserves">If the booked 2P holds</span>
        <p>
          Take the reserve figures at face value. Any field whose current decline would produce more
          gas than it has booked must therefore fall faster than it has been. National output goes{' '}
          {Math.round(model.now.national_rate_mmcfd).toLocaleString()} →{' '}
          {Math.round(h.rate_in_5_years_mmcfd).toLocaleString()} MMCFD in five years, and{' '}
          {Math.round(h.rate_in_10_years_mmcfd).toLocaleString()} in ten.
        </p>
      </div>
      <div className="reserve-read__col">
        <span className="reserve-read__tag reserve-read__tag--decline">If the measured decline holds</span>
        <p>
          Take the production trend at face value instead: every field keeps falling at the rate it
          has been falling. Output holds up better —{' '}
          {Math.round(h.rate_in_5_years_at_measured_decline_mmcfd).toLocaleString()} MMCFD in five
          years — but by year ten these fields have produced{' '}
          {Math.round(h.unbooked_gas_needed_by_10_years_bcf)} BCF that nobody has booked. Someone is
          going to have to find it, or revise it into the accounts.
        </p>
      </div>
      <div className="reserve-read__col">
        <span className="reserve-read__tag reserve-read__tag--muted">The straight-line answer</span>
        <p>
          Divide what is left by today&apos;s rate and you get{' '}
          {h.years_at_current_rate_no_decline} years at full output, then a cliff. It is the version
          you will read almost everywhere, it is on the chart as a faint dotted line for comparison,
          and no gas field in history has ever behaved like that.
        </p>
      </div>
    </div>
  );
}

/* ── the evidence, in one panel with three views ──────────────────────────── */

const VIEWS: { id: EvidenceView; label: string; hint: string }[] = [
  {
    id: 'method',
    label: 'Method',
    hint: 'the documents, the decline law, and what is deliberately left out',
  },
  {
    id: 'fields',
    label: 'Field by field',
    hint: 'all 20 producing fields, each measured against what it has booked',
  },
  {
    id: 'checks',
    label: 'Checks & comparisons',
    hint: 'the back-test, and how this lands against everyone else’s numbers',
  },
];

/**
 * The evidence, folded away.
 *
 * All three sections start closed. Someone who came for the number gets the
 * number and the chart; someone who wants to know whether to believe it opens
 * the drawer. They open independently rather than as tabs, because comparing
 * the field table against the method is a reasonable thing to want to do.
 */
function Evidence({
  model, sensitivity, open, onToggle,
}: {
  model: ReserveModel;
  sensitivity: ReserveSensitivity | null;
  open: EvidenceView[];
  onToggle: (v: EvidenceView) => void;
}) {
  return (
    <div className="reserve-evidence">
      <p className="reserve-evidence__intro">
        Everything behind the chart — what went in, what each field is doing, and how this compares
        with every other published figure.
      </p>

      {VIEWS.map((v) => {
        const isOpen = open.includes(v.id);
        return (
          <section
            key={v.id}
            id={`reserve-evidence-${v.id}`}
            className={`reserve-drawer${isOpen ? ' is-open' : ''}`}
          >
            <h4 className="reserve-drawer__heading">
              <button
                type="button"
                className="reserve-drawer__toggle"
                aria-expanded={isOpen}
                aria-controls={`reserve-panel-${v.id}`}
                onClick={() => onToggle(v.id)}
              >
                <span className="reserve-drawer__label">{v.label}</span>
                <span className="reserve-drawer__hint">{v.hint}</span>
                {/* The site's own chevron rather than a hand-drawn one. The
                    path this replaced was the only icon in the panel not
                    coming from the shared set, and it drew a slightly
                    different stroke weight and cap from every other
                    disclosure control on the page. */}
                <span className="reserve-drawer__chev" aria-hidden>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </span>
              </button>
            </h4>
            {isOpen ? (
              <div className="reserve-drawer__body" id={`reserve-panel-${v.id}`} role="region">
                {v.id === 'method' ? <MethodView model={model} sensitivity={sensitivity} /> : null}
                {v.id === 'fields' ? <FieldsView model={model} /> : null}
                {v.id === 'checks' ? <ChecksView model={model} /> : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

/* ── view 1: method ───────────────────────────────────────────────────────── */

function MethodView({
  model, sensitivity,
}: {
  model: ReserveModel;
  sensitivity: ReserveSensitivity | null;
}) {
  const fitted = model.fields.filter((f) => f.decline_basis === 'exponential-fit');
  const held = model.fields.filter(
    (f) => f.rate_now_mmcfd > 0 && f.decline_basis !== 'exponential-fit',
  );

  return (
    <div className="reserve-method">
      <section className="reserve-method__step">
        <h4><span className="reserve-method__num">1</span> What goes in <GridProvenanceTag kind="P" /></h4>
        <ul>
          <li>
            <strong>{model.anchor.table}</strong> — {model.anchor.document.replace('.pdf', '')},
            p{model.anchor.pages.join('–')}. Every one of the 29 discovered fields, with how much gas
            was there to begin with, how much has come out, and how much is left, as of{' '}
            {formatGasDay(model.anchor.as_of)}. Our reader of that table will not save a single number
            unless the rows add up to the printed subtotals, the subtotals add up to the printed grand
            total, and the BCF total matches the TCF total beside it.
          </li>
          <li>
            <strong>The daily gas reports</strong> — {model.archive_days.toLocaleString()} of them
            since 2020, each listing what every field produced that day. The reserve table is the
            bank balance; this is the spending.
          </li>
          <li>
            <strong>Two older reserve statements</strong> — the 2022-23 and 2023-24 Annual Reports.
            They are used to check the arithmetic, never to build it.
          </li>
          <li>
            <strong>What is missing, and why the top of the chart starts later.</strong> Petrobangla
            has published reserve figures for years — the FY2020-21 report put 9.30 Tcf in the ground
            — but this archive only holds the field-wise statement from 2022-23 on, and a national
            total cannot be split back into fields. So the reserve line begins in 2023 while the
            production stack below it begins in 2020, where the daily reports begin. Finding the
            earlier statements would extend the top half; nothing about the projection would change,
            because it is anchored on the newest one.
          </li>
        </ul>
      </section>

      <section className="reserve-method__step">
        <h4><span className="reserve-method__num">2</span> The pattern: Arps exponential decline <GridProvenanceTag kind="D" /></h4>
        <p>
          A field past plateau loses a roughly constant <em>fraction</em> of its rate each year, not a
          constant volume. That is the Arps decline curve with b=0, the standard form in reservoir
          engineering for a field on stable decline:
        </p>
        <code className="reserve-method__eq">q(t) = q&#8320; &middot; e<sup>&minus;D&middot;t</sup></code>
        <p>
          In logs that is a straight line, so D comes out of a least-squares fit on each field&apos;s
          last 36 months. Every fit is shown with its R&sup2; in the field view, so you can see which
          ones are worth anything: {fitted.length} fields fit cleanly,{' '}
          {held.length}{' '}are flat, rising, or too noisy to fit and are simply held at today&apos;s rate.
          A decline you cannot fit is not a decline worth forecasting.
        </p>
      </section>

      <section className="reserve-method__step">
        <h4><span className="reserve-method__num">3</span> Why there are two answers <GridProvenanceTag kind="D" /></h4>
        <p>
          An exponential decline from q&#8320; delivers q&#8320;/D in total. Setting that equal to a
          field&apos;s booked remaining reserve gives the decline its booking implies:
        </p>
        <code className="reserve-method__eq">
          D<sub>required</sub> = q&#8320; &times; 365.25 &divide; remaining reserve
        </code>
        <p>
          Comparing the two is the whole model. Titas is falling at 7.7% a year and its reserve implies
          7.3% — two separate statements about the same rock, agreeing. Bibiyana is falling at 11.9%
          and its reserve implies 27.9%. Something there has to give, and rather than pick, the chart
          draws both endings.
        </p>
      </section>

      <section className="reserve-method__step">
        <h4><span className="reserve-method__num">4</span> What is chosen, and what it is worth <GridProvenanceTag kind="D" /></h4>
        <p>
          Nothing here is tuned. There is no constant anywhere that scales the data to make it agree
          with anything — the reserve balance is a published number minus a measured one, and each
          field&apos;s decline is fitted to that field&apos;s own history. But a forecast still has
          choices in it, and the fair question is how much of the answer is ours rather than the
          data&apos;s. So we ran the model again with each choice changed:
        </p>
        {sensitivity ? <SensitivityTable model={model} sensitivity={sensitivity} /> : null}
        <p>
          Every variation lands <em>above</em>{' '}the published projection, so the version on the chart
          is the most conservative of them. And the whole spread is smaller than the gap between the
          chart&apos;s own two edges — which is the point: what is uncertain here is not our
          arithmetic, it is whether the booked reserves or the observed decline is the thing that
          gives.
        </p>
      </section>

      <section className="reserve-method__step">
        <h4><span className="reserve-method__num">5</span> Not modelled</h4>
        <ul className="reserve-method__plain">
          {model.method.not_modelled.map((n) => <li key={n}>{n}</li>)}
          <li>
            demand — this is a supply projection. What the country wants is a separate question, and
            letting a demand scenario set a reservoir&apos;s output is the mistake the previous version
            of this panel made.
          </li>
        </ul>
      </section>
    </div>
  );
}

/**
 * The five choices, each varied on its own, with what it does to the answer.
 *
 * Reported against the measured-decline edge because that is the one the
 * choices actually move: the reserve-binding edge is pinned by a published
 * figure and barely notices.
 */
function SensitivityTable({
  model, sensitivity,
}: {
  model: ReserveModel;
  sensitivity: ReserveSensitivity;
}) {
  const base = sensitivity.base.decline;
  const delta = (v: number, ref: number) =>
    ref ? `${v - ref > 0 ? '+' : ''}${Math.round(((v - ref) / ref) * 100)}%` : '—';

  return (
    <div className="reserve-sens">
      <div className="grid-explorer-table-wrap grid-explorer-table-wrap--compact">
        <table className="grid-explorer-table grid-explorer-datatable">
          <thead>
            <tr>
              <th>Choice</th>
              <th className="text-right">Output at +5 yr</th>
              <th className="text-right">at +10 yr</th>
              <th className="text-right">vs published</th>
            </tr>
          </thead>
          <tbody>
            <tr className="reserve-sens__base">
              <td className="font-semibold text-foreground">
                Published model
                <span className="reserve-sens__note">
                  36-month window · R² 0.5 · exponential (Arps b=0) · 1 MMCFD floor
                </span>
              </td>
              <td className="text-right tabular-nums">{base.y5.toLocaleString()}</td>
              <td className="text-right tabular-nums">{base.y10.toLocaleString()}</td>
              <td className="text-right tabular-nums text-muted-foreground">—</td>
            </tr>
            {sensitivity.variants.map((v) => (
              <tr key={v.variant}>
                <td>
                  {v.variant}
                  <span className="reserve-sens__note">{v.note}</span>
                </td>
                <td className="text-right tabular-nums">{v.decline.y5.toLocaleString()}</td>
                <td className="text-right tabular-nums">{v.decline.y10.toLocaleString()}</td>
                <td className="text-right tabular-nums">{delta(v.decline.y10, base.y10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="reserve-sens__foot">
        Across every variation output at +10 years runs{' '}
        {sensitivity.spread.y10[0].toLocaleString()}–{sensitivity.spread.y10[1].toLocaleString()} MMCFD,
        a spread of {sensitivity.spread.y10_pct}%. The two edges of the chart are{' '}
        {Math.round(
          ((model.headline.rate_in_10_years_at_measured_decline_mmcfd -
            model.headline.rate_in_10_years_mmcfd) /
            model.headline.rate_in_10_years_mmcfd) * 100,
        )}
        % apart at the same date. The reserve balance itself has no choices in it at all.
      </p>
    </div>
  );
}

/* ── view 2: fields ───────────────────────────────────────────────────────── */

function verdictOf(f: ReserveField): { label: string; tone: string } {
  if (f.beyond_published_reserve) return { label: 'past its booking', tone: 'red' };
  if (f.decline_basis !== 'exponential-fit') return { label: 'no usable fit', tone: 'muted' };
  if (f.decline_required_by_2p_pct_yr == null) return { label: '—', tone: 'muted' };
  const ratio = f.decline_pct_yr / f.decline_required_by_2p_pct_yr;
  if (ratio < 0.6) return { label: 'booking needs a steeper fall', tone: 'amber' };
  if (ratio > 1.6) return { label: 'falling faster than booked', tone: 'blue' };
  return { label: 'consistent', tone: 'green' };
}

/** The three numbers that explain why one field decides the national answer. */
function ConcentrationCallout({ model }: { model: ReserveModel }) {
  const producing = model.fields.filter((f) => f.rate_now_mmcfd > 0);
  const top3 = producing.slice(0, 3).reduce((s, f) => s + f.share_of_national_pct, 0);
  const big = producing[0];
  return (
    <div className="reserve-callout">
      <span className="reserve-callout__title">How concentrated this is</span>
      <span className="reserve-callout__row">
        {big.field}, share of national output <strong>{big.share_of_national_pct.toFixed(1)}%</strong>
      </span>
      <span className="reserve-callout__row">
        Top three fields <strong>{top3.toFixed(1)}%</strong>
      </span>
      <span className="reserve-callout__row">
        {big.field} at today&apos;s rate <strong>{big.years_left_at_current_rate ?? '—'} yr</strong>
      </span>
      <span className="reserve-callout__row">
        Fields carrying the other half <strong>{producing.length - 3}</strong>
      </span>
    </div>
  );
}

function FieldsView({ model }: { model: ReserveModel }) {
  const rows = model.fields.filter((f) => f.rate_now_mmcfd > 0);
  return (
    <div className="reserve-fields">
      <div className="reserve-note-row">
        <p className="reserve-fields__intro">
          Two numbers describe every field here, and they come from different places. What Petrobangla
          books as its remaining reserve, and what the daily meters say it is actually doing. Where the
          two line up, the forecast for that field is on solid ground. Where they pull apart, that gap
          is the story — and almost all of it sits in one field.
        </p>
        <ConcentrationCallout model={model} />
      </div>

      <div className="grid-explorer-table-wrap grid-explorer-table-wrap--compact">
        <table className="grid-explorer-table grid-explorer-datatable">
          <thead>
            <tr>
              <th>Field</th>
              <th className="text-right">Now <span className="reserve-th-unit">MMCFD</span> <GridProvenanceTag kind="P" /></th>
              <th className="text-right">Share</th>
              <th className="text-right">Booked left <span className="reserve-th-unit">BCF</span> <GridProvenanceTag kind="P" /></th>
              <th className="text-right">Measured decline <span className="reserve-th-unit">%/yr</span> <GridProvenanceTag kind="D" /></th>
              <th className="text-right">Fit <span className="reserve-th-unit">R²</span></th>
              <th className="text-right">2P implies <span className="reserve-th-unit">%/yr</span> <GridProvenanceTag kind="D" /></th>
              <th>Reading</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const v = verdictOf(f);
              return (
                <tr key={f.field}>
                  <td className="font-semibold text-foreground whitespace-nowrap">
                    {f.field}
                    {f.section !== 'producing' ? <span className="reserve-fields__flag">suspended</span> : null}
                  </td>
                  <td className="text-right tabular-nums">{f.rate_now_mmcfd.toFixed(0)}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{f.share_of_national_pct.toFixed(1)}%</td>
                  <td className="text-right tabular-nums">
                    {f.remaining_now_bcf > 0 ? f.remaining_now_bcf.toFixed(0) : 'nil'}
                  </td>
                  <td className="text-right tabular-nums">
                    {f.decline_basis === 'exponential-fit'
                      ? f.decline_pct_yr.toFixed(1)
                      : <span className="text-muted-foreground">{f.decline_basis === 'flat-or-rising-held-flat' ? 'flat/rising' : 'unfittable'}</span>}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {f.decline_basis === 'exponential-fit' && f.decline_r2 != null ? f.decline_r2.toFixed(2) : '—'}
                  </td>
                  <td className="text-right tabular-nums">
                    {f.decline_required_by_2p_pct_yr != null ? f.decline_required_by_2p_pct_yr.toFixed(1) : '—'}
                  </td>
                  <td>
                    <span className={`reserve-verdict reserve-verdict--${v.tone}`}>{v.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="reserve-fields__foot">
        {model.now.rate_from_fields_beyond_published_reserve_mmcfd > 0 ? (
          <>
            <strong className="text-foreground">
              {Math.round(model.now.rate_from_fields_beyond_published_reserve_mmcfd)} MMCFD is produced
              from fields booked at nil remaining reserve.
            </strong>{' '}
            Habiganj is the bulk of it: its cumulative production is printed as equal to its 2P reserve,
            and Petrobangla&apos;s own footnote on that table asks for the field to be re-evaluated.
            Their output is kept in the rate, where it is metered, and excluded from the reserve
            balance, where nothing published supports a figure.
          </>
        ) : null}
      </p>
    </div>
  );
}

/* ── view 3: checks and comparisons ───────────────────────────────────────── */

const INDEPENDENCE: Record<string, { label: string; tone: string; note: string }> = {
  shared: {
    label: 'same source',
    tone: 'muted',
    note: 'Draws on the same Petrobangla documents this model does, so agreement confirms the reading, not the reading’s truth.',
  },
  publication: {
    label: 'separate publication',
    tone: 'blue',
    note: 'A different agency compiling from the same underlying meter readings — a check on our parsing and integration.',
  },
  method: {
    label: 'independent method',
    tone: 'green',
    note: 'Built by other people by other means; the strongest comparison available.',
  },
};

/** Which benchmarks are genuinely independent of this model, and which are not. */
const BENCHMARK_INDEPENDENCE: Record<string, keyof typeof INDEPENDENCE> = {
  'hcu-annual': 'publication',
  'hcu-remaining': 'publication',
  'adviser-parliament': 'shared',
  'petrobangla-director': 'shared',
  'bonikbarta-producing': 'shared',
  'iepmp-2030': 'method',
  'iepmp-2040': 'method',
  'bapex-2039': 'method',
  'badrul-imam': 'method',
};

function ChecksView({ model }: { model: ReserveModel }) {
  return (
    <div className="reserve-checks">
      <section>
        <h4 className="reserve-checks__head">The back-test <GridProvenanceTag kind="D" /></h4>
        <p className="reserve-checks__lead">
          Each reserve statement records how much gas Petrobangla charged against reserves that year.
          Adding up our daily reports over the same period gets the same answer — so we can carry the
          balance forward on measured production, with nothing tuned to make it land anywhere.
        </p>
        <div className="grid-explorer-table-wrap grid-explorer-table-wrap--compact">
          <table className="grid-explorer-table grid-explorer-datatable">
            <thead>
              <tr>
                <th>Fiscal year</th>
                <th className="text-right">Petrobangla booked <GridProvenanceTag kind="P" /></th>
                <th className="text-right">This archive <GridProvenanceTag kind="D" /></th>
                <th className="text-right">Difference</th>
                <th className="text-right">Reserve replacement <GridProvenanceTag kind="D" /></th>
              </tr>
            </thead>
            <tbody>
              {model.validation.map((v, i) => {
                const rev = model.revisions[i];
                return (
                  <tr key={v.fiscal_year}>
                    <td className="font-semibold text-foreground">{v.fiscal_year}</td>
                    <td className="text-right tabular-nums">{v.published_production_bcf.toFixed(2)} BCF</td>
                    <td className="text-right tabular-nums">{v.measured_production_bcf.toFixed(2)} BCF</td>
                    <td className="text-right tabular-nums text-emerald-600 dark:text-emerald-500">
                      {v.difference_pct > 0 ? '+' : ''}{v.difference_pct.toFixed(2)}%
                    </td>
                    <td className="text-right tabular-nums">
                      {rev?.reserve_replacement_pct != null ? `${rev.reserve_replacement_pct.toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="reserve-checks__note">
          The last column is the reserve replacement ratio: reserves added against reserves produced.{' '}
          {model.revisions.map((r, i) => (
            <span key={r.from}>
              {i > 0 ? ' ' : ''}
              {formatMonthYear(r.from)}–{formatMonthYear(r.to)}: 2P revised{' '}
              {r.reserve_revision_bcf > 0 ? '+' : ''}{Math.round(r.reserve_revision_bcf)} BCF against{' '}
              {Math.round(r.production_bcf)} BCF produced.
            </span>
          ))}{' '}
          A revision larger than a year&apos;s production is why the remaining balance rose in FY2023-24
          while the country burned gas — and why nothing here forecasts the next revision.
        </p>
      </section>

      <section>
        <h4 className="reserve-checks__head">Against everyone else who has published a number</h4>
        <p className="reserve-checks__lead">
          None of these feeds the model. And a number agreeing with ours only counts for something if
          it came from somewhere else — so the last column says, for each one, how independent it
          really is.
        </p>
        <div className="grid-explorer-table-wrap">
          <table className="grid-explorer-table grid-explorer-datatable reserve-bench-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Their figure <GridProvenanceTag kind="P" /></th>
                <th>This model <GridProvenanceTag kind="D" /></th>
                <th>Independence</th>
              </tr>
            </thead>
            <tbody>
              {RESERVE_BENCHMARKS.map((b) => {
                const ind = INDEPENDENCE[BENCHMARK_INDEPENDENCE[b.id] ?? 'shared'];
                return (
                  <tr key={b.id}>
                    <td>
                      <span className="reserve-bench-source">
                        {b.url ? (
                          <a href={b.url} target="_blank" rel="noopener noreferrer">
                            {b.source} <ExternalLink className="inline h-3 w-3 -mt-0.5" />
                          </a>
                        ) : b.source}
                      </span>
                      <span className="reserve-bench-meta">
                        {b.asOf} · {b.verified ? 'primary source read' : `not read at source — ${b.via}`}
                      </span>
                    </td>
                    <td className="reserve-bench-claim">
                      {b.claim}
                      {b.quote ? <em className="reserve-bench-quote">“{b.quote}”</em> : null}
                    </td>
                    <td>
                      <strong className="reserve-bench-ours">{b.ours(model)}</strong>
                      <span className="reserve-bench-meta">{b.reading(model)}</span>
                    </td>
                    <td>
                      <span className={`reserve-verdict reserve-verdict--${ind.tone}`}>{ind.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="reserve-checks__note">
          {INDEPENDENCE.method.note} {INDEPENDENCE.publication.note} {INDEPENDENCE.shared.note}{' '}The
          reserve-life figures in circulation — eight years, ten, twelve — all divide a stock by
          today&apos;s rate, and none survives contact with a decline curve: on this model output halves
          around{' '}
          {yearOf(model, model.headline.years_until_rate_halves)}{' '}
          with several Tcf still in the ground.
        </p>
      </section>

      <ReplacementSection model={model} />
      <LimitsSection model={model} />
      <SourcesSection model={model} />
    </div>
  );
}

/**
 * Every document this panel rests on, cited properly.
 *
 * Built from the artifacts rather than typed, so a citation cannot drift from
 * the figure it supports: the anchor's document and pages come from the model,
 * the archive's span and count from its own history, and the external sources
 * from the same list the comparison table renders. Each says whether we opened
 * it ourselves.
 */
function SourcesSection({ model }: { model: ReserveModel }) {
  const first = model.history.monthly_rate[0]?.month ?? '';
  const last = model.as_of;
  const primary = [
    {
      cite: `Petrobangla. ${model.anchor.table}. ${model.anchor.document.replace('.pdf', '')}, pp. ${model.anchor.pages.join('–')}.`,
      role: `Reserve anchor — remaining reserve by field, stated for ${formatGasDay(model.anchor.as_of)}. Totals re-derived from the rows before use.`,
      read: true,
    },
    ...model.history.anchors.slice(0, -1).map((a) => ({
      // The older anchors carry the publisher in their own document string;
      // prefixing it again gave "Petrobangla. Petrobangla Annual Report…".
      cite: a.document.startsWith('Petrobangla') ? `${a.document}.` : `Petrobangla. ${a.document}.`,
      role: `Back-test only — producing-section subtotal at ${formatGasDay(a.as_of)}. Its per-field cells render in a CID font whose digits do not extract, so only the printed subtotal is used.`,
      read: true,
    })),
    {
      cite: `Petrobangla. Daily gas production reports, ${first.slice(0, 4)}–${last.slice(0, 4)}.`,
      role: `Production — ${model.archive_days.toLocaleString()} issues held in this archive, ${first} to ${last.slice(0, 7)}, each metering every field and the LNG terminals.`,
      read: true,
    },
  ];

  return (
    <section>
      <h4 className="reserve-checks__head">Sources</h4>
      <p className="reserve-checks__lead">
        Everything this panel rests on, and whether we opened it ourselves. External sources retrieved{' '}
        {RETRIEVED}.
      </p>
      <ol className="reserve-cites">
        {primary.map((c) => (
          <li key={c.cite}>
            <span className="reserve-cites__cite">{c.cite}</span>
            <span className="reserve-cites__role">{c.role}</span>
          </li>
        ))}
        {RESERVE_BENCHMARKS.filter((b, i, all) => all.findIndex((x) => x.source === b.source) === i)
          .map((b) => (
            <li key={b.id}>
              <span className="reserve-cites__cite">
                {b.url ? (
                  <a href={b.url} target="_blank" rel="noopener noreferrer">{b.source}</a>
                ) : b.source}
                {b.asOf ? `. ${b.asOf}.` : '.'}
              </span>
              <span className="reserve-cites__role">
                Comparison only, never an input.{' '}
                {b.verified ? 'Primary source opened and read.' : `Not read at source — ${b.via}.`}
              </span>
            </li>
          ))}
      </ol>
    </section>
  );
}

/**
 * What is already replacing the gas, and how much more would have to.
 *
 * The depletion is only half a story; the other half is what fills the hole,
 * and the same daily reports answer it. Volumes only — a cargo price is a claim
 * this archive cannot support, and putting a taka figure on it would be exactly
 * the kind of number this panel exists to avoid.
 */
function ReplacementSection({ model }: { model: ReserveModel }) {
  const mix = model.supply_mix ?? [];
  if (!mix.length) return null;
  const first = mix[0];
  const last = mix[mix.length - 1];
  const r = model.replacement;

  return (
    <section>
      <h4 className="reserve-checks__head">What is replacing it <GridProvenanceTag kind="P" /></h4>
      <p className="reserve-checks__lead">
        The same daily reports that meter the fields also meter the LNG terminals. While domestic
        output fell from {Math.round(first.domestic_mmcfd).toLocaleString()} to{' '}
        {Math.round(last.domestic_mmcfd).toLocaleString()} MMCFD, imported gas went from{' '}
        {Math.round(first.rlng_mmcfd).toLocaleString()} to{' '}
        {Math.round(last.rlng_mmcfd).toLocaleString()}{' '}— so the share of the country&apos;s gas that
        arrives by ship has gone from {first.import_share_pct}% to {last.import_share_pct}% in{' '}
        {Number(last.year) - Number(first.year)} years. None of this feeds the depletion model; it is
        the consequence of it, measured.
      </p>

      <div className="grid-explorer-table-wrap grid-explorer-table-wrap--compact">
        <table className="grid-explorer-table grid-explorer-datatable">
          <thead>
            <tr>
              <th>Year</th>
              <th className="text-right">
                Domestic <span className="reserve-th-unit">MMCFD</span> <GridProvenanceTag kind="P" />
              </th>
              <th className="text-right">
                Imported (RLNG) <span className="reserve-th-unit">MMCFD</span> <GridProvenanceTag kind="P" />
              </th>
              <th className="text-right">Imported share <GridProvenanceTag kind="D" /></th>
              <th className="text-right">Days metered</th>
            </tr>
          </thead>
          <tbody>
            {mix.map((row) => (
              <tr key={row.year}>
                <td className="font-semibold text-foreground">{row.year}</td>
                <td className="text-right tabular-nums">{Math.round(row.domestic_mmcfd).toLocaleString()}</td>
                <td className="text-right tabular-nums">{Math.round(row.rlng_mmcfd).toLocaleString()}</td>
                <td className="text-right tabular-nums">{row.import_share_pct}%</td>
                <td className="text-right tabular-nums text-muted-foreground">{row.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="reserve-checks__note">
        <strong className="text-foreground">
          And the hole still to fill: {Math.round(r.gap_10y_mmcfd.decline_binding).toLocaleString()}–
          {Math.round(r.gap_10y_mmcfd.reserves_binding).toLocaleString()} MMCFD by year ten
        </strong>{' '}
        <GridProvenanceTag kind="D" /> — the shortfall against today&apos;s domestic output under the
        chart&apos;s two edges, drawn as the shaded band on the production plot. At the wider end that
        is{' '}
        {r.today_rlng_mmcfd
          ? `${(r.gap_10y_mmcfd.reserves_binding / r.today_rlng_mmcfd).toFixed(1)} times everything the LNG terminals import today`
          : 'more than the terminals import today'}
        . It is arithmetic on our own projection, not a forecast of imports: it says how much gas has
        to come from somewhere, not where from or at what price.
      </p>
    </section>
  );
}

/**
 * The questions this panel does not answer.
 *
 * Published alongside the ones it does, because a projection that lists only
 * its strengths is advocacy. Everything here is a real limit someone will find.
 */
function LimitsSection({ model }: { model: ReserveModel }) {
  const notch = (model.anomalies ?? [])[0];
  const limits = [
    {
      q: 'What will the replacement cost?',
      a: 'Volumes only, here. A taka or dollar figure needs cargo prices this archive does not hold, and an LNG price forecast is not something the daily reports can support.',
    },
    {
      q: 'What if new gas is found?',
      a: `Not modelled. The panel says what it would take — ${(model.headline.new_gas_needed_to_hold_flat_10y_bcf / 1000).toFixed(2)} Tcf to hold output flat for a decade — but nothing here forecasts the offshore rounds, Bhola, or any discovery.`,
    },
    {
      q: 'Can they not just drill more wells?',
      a: 'Infill drilling and workovers raise deliverability from the same reserve. That changes the shape of the curve, pulling gas forward, not the total underneath it — and the reserve constraint in this model still binds.',
    },
    {
      q: 'Why 2P and not proved reserves?',
      a: 'Because 2P is what Petrobangla publishes field by field. A 1P (proved only) basis would give a materially shorter runway; the statement does not break it out, so this model cannot either.',
    },
    {
      q: 'What does it mean for power cuts or tariffs?',
      a: 'Out of scope. This is a supply projection; what it does to generation, industry or prices depends on demand and policy, neither of which belongs in a reservoir model.',
    },
    {
      q: 'Has Petrobangla been asked to comment?',
      a: 'No. Every figure here comes from documents it published, and the arithmetic is set out in full so it can be checked — but nobody at Petrobangla has been shown this projection or responded to it.',
    },
  ];

  return (
    <section>
      <h4 className="reserve-checks__head">What this panel does not answer</h4>
      <p className="reserve-checks__lead">
        Six questions a reader will reasonably have, and the honest position on each.
        {notch ? (
          <>
            {' '}A seventh worth naming: the notch at {formatMonthYear(notch.month)} on the production
            plot is a {Math.round(notch.drop_pct)}% fall for a single month, back to normal by{' '}
            {formatMonthYear(notch.recovered_by)}. A drop that reverses completely is demand or an outage,
            never depletion — the model detects it and the chart marks it, rather than leaving a
            reader to wonder whether the data is broken.
          </>
        ) : null}
      </p>
      <dl className="reserve-limits">
        {limits.map((l) => (
          <div key={l.q} className="reserve-limits__item">
            <dt>{l.q}</dt>
            <dd>{l.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
