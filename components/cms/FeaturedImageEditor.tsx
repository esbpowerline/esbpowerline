'use client';
import { mediaThumbnailUrl, MEDIA_THUMB_WIDTH, MEDIA_PREVIEW_WIDTH } from '@/lib/media-thumbnail';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Upload, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cmsToast } from '@/lib/cms-toast';
import { optimizeImageToWebP } from '@/lib/image-optimizer';
import { uploadImageHelper } from '@/lib/upload-helper';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { MediaItem } from '@/components/cms/MediaPicker';
import {
  heroImageStyle,
  type HeroImageFilter,
  type HeroImageMeta,
  type HeroFitMode,
} from '@/lib/hero-image';

export type { HeroImageMeta, HeroImageFilter, HeroFitMode };
export { heroImageStyle };

export function FeaturedImageEditor({
  items,
  value,
  onChange,
  meta,
  onMetaChange,
  label = 'Featured image',
}: {
  items: MediaItem[];
  value: string;
  onChange: (url: string) => void;
  meta: HeroImageMeta;
  onMetaChange: (meta: HeroImageMeta) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'checking' | 'compressing' | 'uploading' | 'done'>('idle');
  const [isRepositionMode, setIsRepositionMode] = useState(false);
  const [convertToWebp, setConvertToWebp] = useState(true);
  const images = items.filter((m) => m.type === 'image');

  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const val = localStorage.getItem('esbpowerline_webp_optimize');
      if (val !== null) {
        setConvertToWebp(val === 'true');
      }
    }
  }, [open]);

  const handleToggleWebp = (val: boolean) => {
    setConvertToWebp(val);
    localStorage.setItem('esbpowerline_webp_optimize', String(val));
  };

  async function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!process.env.NEXT_PUBLIC_CDN_URL && !convertToWebp && file.size > 4.5 * 1024 * 1024) {
        cmsToast.error('Upload failed', 'Raw uploads must be under 4.5 MB. Please select "Convert to WebP".');
        return;
      }

      setUploading(true);
      setUploadState('checking');

      try {
        // 1. Simulate checking size/formatting/resolution step
        await new Promise((r) => setTimeout(r, 600));

        // 2. Upload the file using helper (it will compress if convertToWebp is enabled)
        if (convertToWebp) {
          setUploadState('compressing');
        } else {
          setUploadState('uploading');
        }

        const data = await uploadImageHelper(file, convertToWebp);
        
        setUploadState('done');
        onChange(data.url);
        if (convertToWebp) {
          cmsToast.success('Featured image optimized & uploaded', 'Saved as WebP format.');
        } else {
          cmsToast.success('Featured image uploaded', 'Saved as raw format.');
        }
      } catch (err: any) {
        console.error(err);
        cmsToast.error('Upload failed', err.message || 'There was an issue processing the image.');
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadState('idle');
        }, 1500); // Give user time to see the "Done" state
      }
    };
    input.click();
  }

  function updateMeta(patch: Partial<HeroImageMeta>) {
    onMetaChange({ ...meta, ...patch });
  }

  const fitMode = meta.fitMode ?? 'fill';
  const zoom = meta.zoom ?? 100;
  const [zoomDraft, setZoomDraft] = useState(zoom);
  const [zoomDragging, setZoomDragging] = useState(false);

  const panX = meta.panX ?? 50;
  const panY = meta.panY ?? 50;
  const [panDraft, setPanDraft] = useState({ x: panX, y: panY });
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!zoomDragging) setZoomDraft(zoom);
  }, [zoom, zoomDragging]);

  useEffect(() => {
    if (!isPanning) setPanDraft({ x: panX, y: panY });
  }, [panX, panY, isPanning]);

  const previewStyle = heroImageStyle(
    { ...meta, zoom: zoomDraft, panX: panDraft.x, panY: panDraft.y },
    { animate: !zoomDragging && !isPanning }
  );

  const modal = open && mounted ? (
    <div
      className="featured-image-editor__modal fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Choose featured image"
    >
      <div
        className="bg-background rounded-2xl border border-border/60 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="font-semibold text-[15px]">Featured image</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Carousel, cards, and article hero</p>
          </div>
          <div className="flex items-center gap-2">
            {/* WebP Optimizer Toggle Switch */}
            <div className="flex items-center gap-1 bg-muted/40 border border-border/30 p-1 rounded-xl text-[10px] font-bold shadow-sm">
              <button
                type="button"
                onClick={() => handleToggleWebp(true)}
                className={cn(
                  "px-2 py-1 rounded-lg transition-all",
                  convertToWebp 
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-extrabold shadow-sm border border-sky-500/10" 
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Convert to WebP
              </button>
              <button
                type="button"
                onClick={() => handleToggleWebp(false)}
                className={cn(
                  "px-2 py-1 rounded-lg transition-all",
                  !convertToWebp 
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold shadow-sm border border-amber-500/10" 
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Raw
              </button>
            </div>

            <Button type="button" size="sm" variant="outline" onClick={handleUpload} disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? 'Processing…' : 'Upload'}
            </Button>
            <button type="button" onClick={() => setOpen(false)} className="ui-close-btn" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {uploading && uploadState !== 'idle' && (
          <div className="px-5 py-3 border-b border-border/50 bg-sky-500/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-sky-600 dark:text-sky-400">
                {uploadState === 'checking' && 'Checking size & resolution...'}
                {uploadState === 'compressing' && 'Optimizing to WebP format...'}
                {uploadState === 'uploading' && 'Uploading optimized image...'}
                {uploadState === 'done' && 'Optimization complete!'}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {uploadState === 'checking' && '10%'}
                {uploadState === 'compressing' && '45%'}
                {uploadState === 'uploading' && '85%'}
                {uploadState === 'done' && '100%'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500 ease-out rounded-full",
                  uploadState === 'checking' && "w-[10%] bg-sky-500",
                  uploadState === 'compressing' && "w-[45%] bg-sky-500",
                  uploadState === 'uploading' && "w-[85%] bg-sky-500",
                  uploadState === 'done' && "w-[100%] bg-emerald-500"
                )}
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-5">
          {images.length === 0 ? (
            <p className="text-center text-muted-foreground text-[13px] py-12">No images yet. Upload one to get started.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((m) => {
                const selected = value === m.url;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onChange(m.url); setOpen(false); }}
                    className={cn(
                      'relative rounded-lg overflow-hidden border-2 transition-all aspect-square',
                      selected ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-transparent hover:border-border',
                    )}
                  >
                    <img
                      src={mediaThumbnailUrl(m.url, MEDIA_THUMB_WIDTH) ?? m.url}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      <span className="admin-stat-label">{label}</span>
      {value ? (
        <div className="featured-image-editor">
          <div className="featured-image-editor__frame relative rounded-xl overflow-hidden border border-border/60 group">
            <img
              src={mediaThumbnailUrl(value, MEDIA_PREVIEW_WIDTH, 80) ?? value}
              alt={meta.alt ?? ''}
              className={cn(
                'featured-image-editor__img featured-image-editor__img--smooth',
                (zoomDragging || isPanning) && 'featured-image-editor__img--dragging'
              )}
              style={previewStyle}
            />
            <div
              className={cn(
                "absolute inset-0 z-10",
                isRepositionMode ? "bg-transparent cursor-move" : "bg-black/50 opacity-0 group-hover:opacity-100 flex flex-wrap items-center justify-center gap-2 transition-opacity p-2",
                isPanning && "cursor-grabbing"
              )}
              onPointerDown={(e) => {
                if (!isRepositionMode) return;
                e.preventDefault();
                setIsPanning(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isPanning) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const dx = (e.movementX / rect.width) * 100;
                const dy = (e.movementY / rect.height) * 100;
                setPanDraft((prev) => ({
                  x: Math.min(100, Math.max(0, prev.x - dx)),
                  y: Math.min(100, Math.max(0, prev.y - dy)),
                }));
              }}
              onPointerUp={(e) => {
                if (!isPanning) return;
                setIsPanning(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
                updateMeta({ panX: panDraft.x, panY: panDraft.y });
              }}
              onPointerCancel={(e) => {
                if (!isPanning) return;
                setIsPanning(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
                updateMeta({ panX: panDraft.x, panY: panDraft.y });
              }}
              onContextMenu={(e) => isRepositionMode && e.preventDefault()}
            >
              {isRepositionMode ? (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="shadow-xl px-4 font-medium"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setIsRepositionMode(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <Button type="button" size="sm" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(true)}>Change</Button>
                  <Button type="button" size="sm" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => setIsRepositionMode(true)}>
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Reposition
                  </Button>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(''); onMetaChange({}); }}
                    title="Remove image"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="featured-image-editor__adjust mt-2 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-3">
            <div>
              <label className="cms-field__label text-[11px]">Frame fit</label>
              <div className="featured-image-editor__fit-pills mt-1">
                <button
                  type="button"
                  onClick={() => updateMeta({ fitMode: 'fit', zoom: 100 })}
                  className={cn(
                    'featured-image-editor__fit-pill',
                    fitMode === 'fit' && 'featured-image-editor__fit-pill--active',
                  )}
                >
                  Auto fit
                </button>
                <button
                  type="button"
                  onClick={() => updateMeta({ fitMode: 'fill', zoom: 100 })}
                  className={cn(
                    'featured-image-editor__fit-pill',
                    fitMode === 'fill' && 'featured-image-editor__fit-pill--active',
                  )}
                >
                  Auto fill
                </button>
              </div>
              <p className="featured-image-editor__fit-hint text-[10px] text-muted-foreground mt-1.5">
                {fitMode === 'fit'
                  ? 'Shows the full image inside the frame — letterboxing if needed.'
                  : 'Zooms to cover the frame — edges may crop.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label className="cms-field__label text-[11px]">Zoom</label>
                <span className="text-[10px] tabular-nums text-muted-foreground">{zoomDraft}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={200}
                step={1}
                value={zoomDraft}
                onPointerDown={() => setZoomDragging(true)}
                onChange={(e) => setZoomDraft(Number(e.target.value))}
                onPointerUp={(e) => {
                  const value = Number(e.currentTarget.value);
                  setZoomDragging(false);
                  updateMeta({ zoom: value });
                }}
                onPointerCancel={(e) => {
                  const value = Number(e.currentTarget.value);
                  setZoomDragging(false);
                  updateMeta({ zoom: value });
                }}
                className="featured-image-editor__zoom featured-image-editor__zoom--smooth mt-1 w-full"
              />
            </div>

            <div>
              <label className="cms-field__label text-[11px]">Filter</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(['none', 'warm', 'cool', 'mono', 'contrast'] as HeroImageFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => updateMeta({ filter: f })}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize transition-colors',
                      (meta.filter ?? 'none') === f
                        ? 'border-sky-500/50 bg-sky-500/15 text-sky-600'
                        : 'border-border/60 text-muted-foreground hover:border-border',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="cms-field__label text-[11px]">Alt text</label>
              <Input
                value={meta.alt ?? ''}
                onChange={(e) => updateMeta({ alt: e.target.value })}
                className="cms-field__input mt-1"
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div>
              <label className="cms-field__label text-[11px]">Caption</label>
              <Textarea
                value={meta.caption ?? ''}
                onChange={(e) => updateMeta({ caption: e.target.value })}
                className="cms-field__input mt-1 resize-y min-h-[3rem]"
                rows={2}
                placeholder="Optional caption on the article page"
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(true)}
          className="featured-image-editor__empty w-full aspect-video rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <ImageIcon className="h-6 w-6 opacity-60" />
          <span className="text-[12px] font-medium">Choose from library or upload</span>
        </button>
      )}

      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}