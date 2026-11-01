'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Check, Copy, FileImage, FileSpreadsheet, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { GridDatePicker } from '@/components/cms/yoy/GridDatePicker';
import { OilCard } from '@/components/cms/oil/OilCard';
import { createArchiveIndex } from '@/lib/data/grid/archive-coverage';
import { getOilCard, getOilHistoryCsv, type OilCalendar } from '@/lib/actions/oil-card';
import { oilCaption, oilCardCsv, type OilCardModel } from '@/lib/data/oil/oil-card';

/**
 * CMS → Fuel Prices. Pick any day the archive can answer — today by default,
 * or a day that was missed — see the card, and take it away as:
 *
 * - **.png** — the card at 2160×2700, for Facebook;
 * - **.jpg** — the same card at a fraction of the size, for WhatsApp/Messenger;
 * - **caption .txt** (or copy it) — the post text with the same figures and
 *   the instruments named;
 * - **data .csv** — every figure with the contract, settlement and baseline
 *   days and the EMRD memo it was read from;
 * - **settlements .csv** — front-month settlements for any range of days.
 *
 * The calendar is the Grid Comparison one: it offers only days with a complete
 * card behind them, so a greyed day is a day the archive cannot answer.
 * The card is drawn in the editor's browser, as the year-on-year card is.
 */

const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40';
const btnGhost =
  'inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-semibold transition hover:bg-muted/60 disabled:opacity-40';

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type Capture = 'png' | 'jpg';

export function OilCardPanel({ calendar, initial }: { calendar: OilCalendar; initial: OilCardModel }) {
  const archive = useMemo(() => createArchiveIndex(calendar.coverage), [calendar.coverage]);
  const [day, setDay] = useState(initial.day);
  const [model, setModel] = useState<OilCardModel>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [copied, setCopied] = useState(false);
  const host = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState(calendar.coverage.first ?? initial.day);
  const [to, setTo] = useState(calendar.latest ?? initial.day);

  function choose(d: string) {
    setDay(d);
    setError(null);
    startTransition(async () => {
      try {
        setModel(await getOilCard(d));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  // Runs once the full-size card is mounted off-screen: wait for its faces and
  // pictures, capture, hand the file over, unmount.
  useEffect(() => {
    if (!capture) return;
    let cancelled = false;
    (async () => {
      try {
        const node = host.current?.querySelector<HTMLElement>('.oilc');
        if (!node) throw new Error('The card did not mount.');
        await document.fonts.ready;
        // A face nobody has asked for is not loading yet: ask for all three.
        await Promise.all([
          document.fonts.load("800 68px 'OilCardInter'"),
          document.fonts.load("400 56px 'OilCardSerif'"),
          document.fonts.load("700 28px 'OilCardBengali'", '৳'),
        ]);
        await Promise.all(Array.from(node.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)));
        const blob = await toBlob(node, {
          width: 1080,
          height: 1350,
          pixelRatio: 2,
          cacheBust: true,
          ...(capture === 'jpg' ? { type: 'image/jpeg', quality: 0.9, backgroundColor: '#7e1229' } : {}),
        });
        if (!blob) throw new Error('The browser could not draw the card.');
        if (!cancelled) saveBlob(`${model.filename}.${capture}`, blob);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setCapture(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [capture, model]);

  const caption = oilCaption(model);
  const incomplete = !model.world || model.pump.tiles.some((t) => t.value == null);

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function saveHistory() {
    setError(null);
    startTransition(async () => {
      try {
        const csv = await getOilHistoryCsv(from, to);
        saveBlob(`ESB_Oil_Settlements_${from}_to_${to}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* The card at half size. Its own px are fixed; the box around it scales. */}
      <div
        className={`overflow-hidden rounded-xl border border-border/60 transition-opacity ${pending ? 'opacity-60' : ''}`}
        style={{ width: 540, height: 675 }}
      >
        <div style={{ transform: 'scale(0.5)', transformOrigin: '0 0', width: 1080, height: 1350 }}>
          <OilCard model={model} />
        </div>
      </div>

      <div className="w-full max-w-md space-y-5 text-[13px]">
        <section className="space-y-3">
          <GridDatePicker
            label="Card day"
            id="oil-card-day"
            value={day}
            onChange={choose}
            archive={archive}
            disabled={pending}
            unselectableHint="A day is offered when EMRD's instrument for it is archived and every world series had settled within five days before it."
          />
          <p className="text-muted-foreground">
            {day === calendar.today ? 'Today' : 'A past day'} · pump: <span className="font-medium text-foreground">{model.pump.chip}</span> · world:{' '}
            <span className="font-medium text-foreground">
              {model.world ? `settlement of ${model.world.settlement}` : 'no settlement held'}
            </span>
          </p>
          {incomplete && (
            <p className="text-[12px] text-[hsl(var(--staff-warn))]">
              This day is incomplete: the card shows a dash where no source states the figure. Do not post it as it is.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Card</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!!capture || pending} onClick={() => setCapture('png')}>
              {capture === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              Download .png
            </button>
            <button type="button" className={btnGhost} disabled={!!capture || pending} onClick={() => setCapture('jpg')}>
              {capture === 'jpg' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
              .jpg (smaller)
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Post text and data</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={pending} onClick={copyCaption}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy caption'}
            </button>
            <button
              type="button"
              className={btnGhost}
              disabled={pending}
              onClick={() => saveBlob(`${model.filename}_caption.txt`, new Blob([caption], { type: 'text/plain;charset=utf-8' }))}
            >
              <FileText className="h-4 w-4" />
              Caption .txt
            </button>
            <button
              type="button"
              className={btnGhost}
              disabled={pending}
              onClick={() => saveBlob(`${model.filename}_data.csv`, new Blob([oilCardCsv(model)], { type: 'text/csv;charset=utf-8' }))}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Card data .csv
            </button>
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3 text-[12px] leading-relaxed">
            {caption}
          </pre>
        </section>

        <section className="space-y-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">World settlements, any range</h3>
          <div className="flex flex-wrap items-end gap-2">
            <GridDatePicker label="First day" id="oil-from" value={from} onChange={setFrom} archive={archive} disabled={pending} />
            <GridDatePicker label="Last day" id="oil-to" value={to} onChange={setTo} archive={archive} disabled={pending} />
            <button type="button" className={btnGhost} disabled={pending || from > to} onClick={saveHistory}>
              <FileSpreadsheet className="h-4 w-4" />
              Settlements .csv
            </button>
          </div>
        </section>

        {error && <p className="text-[12px] text-[hsl(var(--staff-warn))]">{error}</p>}
      </div>

      {capture && (
        <div ref={host} aria-hidden style={{ position: 'fixed', left: -20000, top: 0, width: 1080, height: 1350, pointerEvents: 'none' }}>
          <OilCard model={model} />
        </div>
      )}
    </div>
  );
}
