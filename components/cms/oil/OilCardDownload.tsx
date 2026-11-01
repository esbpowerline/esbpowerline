'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { getOilCard } from '@/lib/actions/oil-card';
import type { OilCardModel } from '@/lib/data/oil/oil-card';
import { OilCard } from '@/components/cms/oil/OilCard';

/**
 * "Download .png" — today's fuel-price card, drawn in the editor's browser
 * exactly as the year-on-year card is (components/cms/yoy/YoyCardDownload.tsx):
 * mounted off-screen at its real 1080×1350 only while it is captured, faces
 * and pictures awaited first, rasterised at 2×.
 */
export function OilCardDownload({ className }: { className?: string }) {
  const [model, setModel] = useState<OilCardModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      setModel(await getOilCard());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!model) return;
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
        const blob = await toBlob(node, { width: 1080, height: 1350, pixelRatio: 2, cacheBust: true });
        if (!blob) throw new Error('The browser could not draw the card.');
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = model.filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
  }, [model]);

  return (
    <>
      <button type="button" onClick={start} disabled={busy} className={className}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        {busy ? 'Drawing…' : 'Download .png'}
      </button>
      {error && <p className="pt-2 text-[12px] text-[hsl(var(--staff-warn))]">{error}</p>}
      {model && (
        <div ref={host} aria-hidden style={{ position: 'fixed', left: -20000, top: 0, width: 1080, height: 1350, pointerEvents: 'none' }}>
          <OilCard model={model} />
        </div>
      )}
    </>
  );
}
