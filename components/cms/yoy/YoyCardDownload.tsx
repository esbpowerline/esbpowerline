'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { generateYoySheet } from '@/lib/actions/yoy-comparison';
import { buildYoyCardModel, type YoyCardModel } from '@/lib/data/grid/yoy-card';
import { YoyCard } from '@/components/cms/yoy/YoyCard';

/**
 * "Download .png" — the day's sheet as the designed social card.
 *
 * Drawn in the editor's browser rather than on the server, so nothing new runs
 * on Vercel. The card is always built from the English sheet, whatever the
 * panel's output language, because the design is English.
 *
 * The card is mounted off-screen only for the moment it is being captured, at
 * its real 1080×1350 (4:5) size, and rasterised at 2× so it stays sharp on a
 * phone.
 */
export function YoyCardDownload({
  date,
  disabled,
  className,
  save,
}: {
  date: string;
  disabled?: boolean;
  className?: string;
  save: (filename: string, blob: Blob) => void;
}) {
  const [model, setModel] = useState<YoyCardModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const sheet = await generateYoySheet(date, 'en');
      if (!sheet.ok) throw new Error(sheet.reason);
      setModel(buildYoyCardModel(sheet));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  // Runs once the card is in the DOM: wait for its faces and pictures, capture,
  // hand the file over, unmount.
  useEffect(() => {
    if (!model) return;
    let cancelled = false;
    (async () => {
      try {
        const node = host.current?.querySelector<HTMLElement>('.yoyc');
        if (!node) throw new Error('The card did not mount.');
        await document.fonts.ready;
        // A face that has not been asked for yet is not loading yet: request
        // it explicitly so the capture can never fall back to a system font.
        await document.fonts.load("900 46px 'YoyCardInter'");
        await Promise.all(
          Array.from(node.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)),
        );
        const blob = await toBlob(node, { width: 1080, height: 1350, pixelRatio: 2, cacheBust: true });
        if (!blob) throw new Error('The browser could not draw the card.');
        if (!cancelled) save(model.filename, blob);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) {
          setModel(null);
          setBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [model, save]);

  return (
    <>
      <button type="button" onClick={start} disabled={disabled || busy} className={className}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        {busy ? 'Drawing…' : 'Download .png'}
      </button>
      {error && (
        <span className="basis-full pb-1 text-[12px] text-[hsl(var(--staff-warn))]">{error}</span>
      )}
      {model && (
        <div
          ref={host}
          aria-hidden
          style={{ position: 'fixed', left: -20000, top: 0, width: 1080, height: 1350, pointerEvents: 'none' }}
        >
          <YoyCard model={model} />
        </div>
      )}
    </>
  );
}
