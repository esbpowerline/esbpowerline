"use client";

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload, Trash2, FileImage, FileText, Lock, Copy, ExternalLink, Pencil, X, Check, Newspaper, SlidersHorizontal, Camera, RefreshCw, ChevronDown
} from 'lucide-react';
import { cn, formatEditorialTimestamp } from '@/lib/utils';
import { publicArticleUrl } from '@/lib/public-site-url';
import { deleteMedia, updateMedia, replaceMediaAndFeaturedImage, type MediaLibraryItem } from '@/lib/actions/media';
import { optimizeImageToWebP } from '@/lib/image-optimizer';
import { uploadImageHelper } from '@/lib/upload-helper';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { heroImageStyle } from '@/lib/hero-image';
import { getSavedSiteTheme, type SiteTheme } from '@/lib/site-theme';
import { normalizeArticleImageUrl } from '@/lib/article-image';
import { mediaThumbnailUrl, MEDIA_THUMB_WIDTH, MEDIA_PREVIEW_WIDTH } from '@/lib/media-thumbnail';

function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileFormat(mime: string | null | undefined, name: string, url: string, type: string) {
  if (mime && mime.split('/')[1] && mime.split('/')[1] !== 'octet-stream') {
    const ext = mime.split('/')[1].toUpperCase();
    if (ext === 'JPEG') return 'JPG';
    return ext;
  }
  const urlMatch = url ? url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/) : null;
  if (urlMatch && urlMatch[1]) {
    const ext = urlMatch[1].toUpperCase();
    if (ext === 'JPEG') return 'JPG';
    return ext;
  }
  const nameMatch = name ? name.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/) : null;
  if (nameMatch && nameMatch[1]) {
    const ext = nameMatch[1].toUpperCase();
    if (ext === 'JPEG') return 'JPG';
    return ext;
  }
  return type.toUpperCase();
}

function ReplaceMediaModal({
  item,
  open,
  onClose,
  onUpdated,
}: {
  item: MediaLibraryItem;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(item.name);
  const [newUrl, setNewUrl] = useState<string>('');
  const [newSize, setNewSize] = useState<number | undefined>(undefined);
  const [newMimeType, setNewMimeType] = useState<string | undefined>(undefined);

  // Article featured image options (loaded from the first article using this media)
  const article = item.usedInArticles[0];
  const [imageCredit, setImageCredit] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [fitMode, setFitMode] = useState('fill');
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(50);
  const [filter, setFilter] = useState('none');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName(item.name);
    setNewUrl('');
    setNewSize(undefined);
    setNewMimeType(undefined);

    if (article) {
      setImageCredit(article.imageCredit ?? '');
      let seoObj = article.seo;
      if (seoObj) {
        if (typeof seoObj === 'string') {
          try { seoObj = JSON.parse(seoObj); } catch (e) {}
        }
        const hero = seoObj.heroImage || {};
        setAltText(hero.alt ?? item.altText ?? '');
        setCaption(hero.caption ?? item.caption ?? '');
        setFitMode(hero.fitMode ?? 'fill');
        setZoom(hero.zoom ?? 100);
        setPanX(hero.panX ?? 50);
        setPanY(hero.panY ?? 50);
        setFilter(hero.filter ?? 'none');
      } else {
        setAltText(item.altText ?? '');
        setCaption(item.caption ?? '');
        setFitMode('fill');
        setZoom(100);
        setPanX(50);
        setPanY(50);
        setFilter('none');
      }
    } else {
      setImageCredit('');
      setAltText(item.altText ?? '');
      setCaption(item.caption ?? '');
      setFitMode('fill');
      setZoom(100);
      setPanX(50);
      setPanY(50);
      setFilter('none');
    }
  }, [open, item, article]);

  if (!open || !mounted) return null;

  async function handleUploadReplacement() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const convertToWebp = localStorage.getItem('esbpowerline_webp_optimize') !== 'false';
      if (!process.env.NEXT_PUBLIC_CDN_URL && !convertToWebp && file.size > 4.5 * 1024 * 1024) {
        toast.error('Raw uploads must be under 4.5 MB. Enable "Convert to WebP" to upload this file.');
        return;
      }

      setUploading(true);
      try {
        const data = await uploadImageHelper(file, convertToWebp);
        setNewUrl(data.url);
        setNewSize(data.size);
        setNewMimeType(data.mimeType);
        toast.success('Replacement file uploaded successfully');
      } catch (err: any) {
        toast.error(err.message || 'Replacement upload failed');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    setSaving(true);
    try {
      await replaceMediaAndFeaturedImage(item.id, {
        name,
        altText,
        caption,
        newUrl: newUrl || undefined,
        newSize,
        newMimeType,
        imageCredit,
        zoom,
        fitMode,
        filter,
        panX,
        panY,
      });
      toast.success('Featured image options replaced successfully');
      onUpdated();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="admin-secure-dialog-backdrop" onClick={onClose}>
      <div
        className="admin-secure-dialog max-w-lg bg-background border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-secure-dialog-header border-b border-border/40 p-4">
          <div>
            <h3 className="admin-secure-dialog-title flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-sky-400" />
              Replace featured image details
            </h3>
            <p className="admin-secure-dialog-desc">
              Directly edit image parameters across referencing stories.
            </p>
          </div>
          <button type="button" className="admin-secure-dialog-close ui-close-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Real-time Large Preview Panel */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Real-time Image Preview (Edit & Confirm)</span>
            <div className="relative aspect-video w-full rounded-xl border border-border/60 bg-neutral-950 overflow-hidden shadow-inner flex items-center justify-center">
              <img
                src={newUrl || mediaThumbnailUrl(item.url, MEDIA_PREVIEW_WIDTH, 80) || normalizeArticleImageUrl(item.url) || item.url}
                alt="Staged replacement preview"
                style={heroImageStyle({
                  fitMode: fitMode as any,
                  zoom,
                  panX,
                  panY,
                  filter: filter as any,
                }, { animate: true })}
                className="w-full h-full"
              />
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[9px] uppercase tracking-wider backdrop-blur border border-white/5">
                {newUrl ? 'Staged Replacement' : 'Current Source'}
              </div>
            </div>
          </div>

          {/* File replacement controls */}
          <div className="bg-muted/15 border border-border/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Image source</span>
                <span className="text-xs font-semibold text-foreground truncate block mt-0.5">{item.name}</span>
                {newUrl && <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">New replacement file staged</span>}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-[11px]"
                onClick={handleUploadReplacement}
                disabled={uploading || saving}
              >
                <Upload className="h-3 w-3 mr-1" />
                {uploading ? 'Staging…' : 'Upload file'}
              </Button>
            </div>
            <div>
              <label className="admin-secure-dialog-label text-[10px]">Media record name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs bg-background"
                placeholder="Enter file name"
              />
            </div>
          </div>

          <div className="space-y-3">
            {item.usedInArticles.length > 0 ? (
              <div className="border border-border/40 rounded-xl bg-sky-500/5 p-3">
                <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block mb-1">Referenced in</span>
                <ul className="space-y-1.5">
                  {item.usedInArticles.map((story: any) => (
                    <li key={story.baseSlug} className="text-xs font-medium flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-foreground/80 flex-1 min-w-0">{story.titleEn || story.titleBn || story.title}</span>
                      <div className="flex gap-1.5 shrink-0">
                        {story.idEn && (
                          <Link href={`/cms/articles/${story.idEn}/edit`} className="text-sky-400 hover:underline shrink-0 text-[10px]">Edit EN</Link>
                        )}
                        {story.idBn && (
                          <Link href={`/cms/articles/${story.idBn}/edit`} className="text-purple-400 hover:underline shrink-0 text-[10px]">Edit BN</Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="border border-border/40 rounded-xl bg-neutral-500/5 p-3">
                <span className="text-[10px] font-medium text-muted-foreground block">
                  This image is not currently used as a featured image in any articles, but you can configure its default styles and metadata here.
                </span>
              </div>
            )}

            {/* Adjustments */}
            <div className="space-y-3.5">
              <div>
                <label className="admin-secure-dialog-label text-[10px]">Image Credit</label>
                <Input
                  value={imageCredit}
                  onChange={(e) => setImageCredit(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="e.g., Reuters / John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-secure-dialog-label text-[10px]">Alt text</label>
                  <Input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Alt text for accessibility"
                  />
                </div>
                <div>
                  <label className="admin-secure-dialog-label text-[10px]">Caption</label>
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Optional image caption"
                  />
                </div>
              </div>

              <div className="border-t border-border/40 my-3" />

              <div className="flex items-center justify-between">
                <label className="admin-secure-dialog-label text-[10px] m-0">Frame fit</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setFitMode('fit'); setZoom(100); }}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded border border-border/60 transition-colors',
                      fitMode === 'fit' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'text-muted-foreground hover:border-border'
                    )}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFitMode('fill'); setZoom(100); }}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded border border-border/60 transition-colors',
                      fitMode === 'fill' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'text-muted-foreground hover:border-border'
                    )}
                  >
                    Fill
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold mb-1">
                  <span>ZOOM</span>
                  <span>{zoom}%</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={200}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold mb-1">
                    <span>PAN X</span>
                    <span>{panX}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={panX}
                    onChange={(e) => setPanX(Number(e.target.value))}
                    className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold mb-1">
                    <span>PAN Y</span>
                    <span>{panY}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={panY}
                    onChange={(e) => setPanY(Number(e.target.value))}
                    className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="admin-secure-dialog-label text-[10px]">Filter</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['none', 'warm', 'cool', 'mono', 'contrast'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[9px] font-bold capitalize transition-colors',
                        filter === f
                          ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                          : 'border-border/60 text-muted-foreground hover:border-border',
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-secure-dialog-actions border-t border-border/40 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/30"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? 'Replacing…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface LightboxItem {
  url: string;
  name: string;
  dims: string | null;
  size: number | null;
}

function ImageLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>('midnight');

  useEffect(() => {
    setMounted(true);
    setTheme(getSavedSiteTheme());

    // Sync theme dynamically if user changes it
    const observer = new MutationObserver(() => {
      setTheme(getSavedSiteTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-site-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Listen for Escape key
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item || !mounted) return null;

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleCopyImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(normalizeArticleImageUrl(item.url) ?? item.url)}`;
      
      // Fetch the image blob first
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch image proxy');
      const blob = await response.blob();
      
      let pngBlob: Blob;

      if (blob.type === 'image/png') {
        pngBlob = blob;
      } else {
        // Perform canvas conversion on the main thread
        const img = new Image();
        img.src = proxyUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');
        ctx.drawImage(img, 0, 0);

        const converted = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
        if (!converted) throw new Error('Format conversion failed');
        pngBlob = converted;
      }

      // Write the resolved static blob to the clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob
        })
      ]);

      setImageCopied(true);
      toast.success('Image copied to clipboard');
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      toast.error('Failed to copy image: secure context required or unsupported format');
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(normalizeArticleImageUrl(item.url) ?? item.url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch image proxy');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch {
      // Fallback: open in new tab
      window.open(normalizeArticleImageUrl(item.url) ?? item.url, '_blank');
    }
  };

  const isWhiteTheme = theme === 'white';

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 media-lightbox-overlay cursor-zoom-out backdrop-blur-md transition-all duration-300",
        isWhiteTheme ? "bg-slate-100/90 text-slate-900 light theme-white" : "bg-background/80 text-foreground dark theme-midnight"
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "absolute top-4 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-md active:scale-95 cursor-pointer",
          isWhiteTheme 
            ? "text-slate-500 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-300/90 border border-slate-300"
            : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 border border-border/30"
        )}
        aria-label="Close Preview"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main Container */}
      <div className="relative flex flex-col items-center max-w-[90vw] max-h-[85vh] select-none media-lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* The Image */}
        <div className={cn(
          "relative overflow-hidden rounded-xl border shadow-2xl flex items-center justify-center",
          isWhiteTheme ? "border-slate-200 bg-slate-200/30" : "border-border/40 bg-muted/20"
        )}>
          <img
            src={mediaThumbnailUrl(item.url, MEDIA_PREVIEW_WIDTH, 80) ?? normalizeArticleImageUrl(item.url) ?? item.url}
            alt={item.name}
            className="max-w-[90vw] max-h-[70vh] object-contain transition-all duration-300 transform scale-100 ease-out select-none"
            draggable={false}
          />
        </div>

        {/* Glassmorphic Metadata & Actions Panel */}
        <div className={cn(
          "w-full max-w-2xl mt-4 border backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4",
          isWhiteTheme 
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-card/85 border-border/40 text-foreground"
        )}>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h4 className={cn(
              "text-sm font-bold truncate",
              isWhiteTheme ? "text-slate-800" : "text-foreground"
            )}>{item.name}</h4>
            <div className={cn(
              "flex items-center justify-center md:justify-start gap-2 mt-1 text-[11px] font-semibold",
              isWhiteTheme ? "text-slate-500" : "text-muted-foreground"
            )}>
              {item.dims && <span>{item.dims.split('·')[0].trim()}</span>}
              {item.dims && <span className="opacity-40">•</span>}
              <span>{formatBytes(item.size)}</span>
              {item.dims && <span className="opacity-40">•</span>}
              {item.dims && <span>{item.dims.split('·')[1].trim()}</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                isWhiteTheme
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200"
                  : "bg-muted/40 hover:bg-muted/60 text-foreground/90 hover:text-foreground border border-border/40"
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyImage}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                isWhiteTheme
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200"
                  : "bg-muted/40 hover:bg-muted/60 text-foreground/90 hover:text-foreground border border-border/40"
              )}
            >
              {imageCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <FileImage className="h-3.5 w-3.5" />}
              <span>{imageCopied ? 'Copied Image' : 'Copy Image'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer",
                isWhiteTheme
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-primary hover:bg-primary/95 text-primary-foreground"
              )}
            >
              <Upload className="h-3.5 w-3.5 rotate-180" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function UsedInArticlesModal({
  item,
  open,
  onClose,
}: {
  item: MediaLibraryItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !item || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-[4px] transition-all duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-[1.5rem] p-6 shadow-2xl relative border bg-card text-card-foreground border-border/50 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all duration-200 hover:bg-muted/10 text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-border/40 pb-4">
          <Newspaper className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base tracking-tight text-foreground">
              Article Usage Details
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[340px]" title={item.name}>
              {item.name}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground/90 font-medium">
            This asset is referenced in the following {item.usedInArticles.length} active {item.usedInArticles.length === 1 ? 'story' : 'stories'}:
          </p>

          <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {item.usedInArticles.map((story: any) => {
              const displayTitle = story.titleEn || story.titleBn || story.title;
              return (
                <li
                  key={story.baseSlug}
                  className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/20 bg-muted/10 hover:bg-muted/20 transition-all duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <ModernTooltip label={displayTitle} variant="editor" alwaysShow>
                      <span className="font-semibold text-foreground text-sm block leading-snug tracking-tight">
                        {displayTitle}
                      </span>
                    </ModernTooltip>
                    {story.imageCredit && (
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Credit: {story.imageCredit}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-medium text-muted-foreground">Placement:</span>
                      {story.isCover && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Cover</span>
                      )}
                      {story.isBody && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Body</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* EN translation */}
                      {story.idEn && (
                        <div className="flex items-center gap-1 bg-blue-500/5 border border-blue-500/10 rounded-lg p-0.5">
                          <span className="text-[9px] font-bold text-blue-500 px-1.5">EN</span>
                          <ModernTooltip label="Edit English translation" variant="editor" alwaysShow>
                            <Link
                              href={`/cms/articles/${story.idEn}/edit`}
                              className="h-6 px-2 rounded-md flex items-center justify-center font-bold text-[9px] bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </Link>
                          </ModernTooltip>
                          <ModernTooltip label="View live" variant="editor" alwaysShow>
                            <a
                              href={publicArticleUrl(story.slugEn)}
                              target="_blank"
                              rel="noreferrer"
                              className="h-6 w-6 rounded-md flex items-center justify-center border border-border/40 hover:bg-muted/10 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </ModernTooltip>
                        </div>
                      )}

                      {/* BN translation */}
                      {story.idBn && (
                        <div className="flex items-center gap-1 bg-purple-500/5 border border-purple-500/10 rounded-lg p-0.5">
                          <span className="text-[9px] font-bold text-purple-500 px-1.5">BN</span>
                          <ModernTooltip label="Edit Bangla translation" variant="editor" alwaysShow>
                            <Link
                              href={`/cms/articles/${story.idBn}/edit`}
                              className="h-6 px-2 rounded-md flex items-center justify-center font-bold text-[9px] bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                            >
                              Edit
                            </Link>
                          </ModernTooltip>
                          <ModernTooltip label="View live" variant="editor" alwaysShow>
                            <a
                              href={publicArticleUrl(story.slugBn)}
                              target="_blank"
                              rel="noreferrer"
                              className="h-6 w-6 rounded-md flex items-center justify-center border border-border/40 hover:bg-muted/10 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </ModernTooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex justify-end">
          <Button type="button" size="sm" onClick={onClose} className="h-8 cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MediaCard({
  item,
  onDelete,
  onUpdated,
  pending,
  onPreviewImage,
  onShowUsage,
}: {
  item: MediaLibraryItem;
  onDelete: (id: string) => void;
  onUpdated: () => void;
  pending: boolean;
  onPreviewImage: (url: string, name: string, dims: string | null, size: number | null) => void;
  onShowUsage?: (item: MediaLibraryItem) => void;
}) {
  const [dims, setDims] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [altText, setAltText] = useState(item.altText ?? '');
  const [saving, setSaving] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      const aspect = ratio >= 1.2 ? 'Landscape' : ratio <= 0.85 ? 'Portrait' : 'Square';
      setDims(`${img.naturalWidth}×${img.naturalHeight} · ${aspect}`);
    }
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(normalizeArticleImageUrl(item.url) ?? item.url);
      toast.success('URL copied');
    } catch {
      toast.error('Could not copy URL');
    }
  }

  async function saveEdits() {
    setSaving(true);
    try {
      await updateMedia(item.id, { name, altText });
      toast.success('Media updated');
      setEditing(false);
      onUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="media-library-card media-library-card--v2">
      <div className="media-library-card__preview">
        {item.type === 'image' ? (
          <img
            src={mediaThumbnailUrl(item.url, MEDIA_THUMB_WIDTH) ?? normalizeArticleImageUrl(item.url) ?? item.url}
            alt={item.altText ?? item.name}
            className="media-library-card__image"
            /* Below the fold there may be hundreds of these; without this the
               browser requests every one the moment the grid mounts. */
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
          />
        ) : (
          <div className="media-library-card__file">
            <FileText className="h-9 w-9 opacity-45" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-[4px] border border-white/10 shadow-sm">
            {getFileFormat(item.mimeType, item.name, item.url, item.type)}
          </div>
          <div className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white backdrop-blur-[6px] shadow-sm border",
            item.placementType === 'cover' ? "bg-blue-600/75 border-blue-500/20" :
            item.placementType === 'body' ? "bg-amber-600/75 border-amber-500/20" :
            item.placementType === 'both' ? "bg-purple-600/75 border-purple-500/20" :
            "bg-neutral-600/75 border-neutral-500/20"
          )}>
            {item.placementType === 'cover' ? 'Cover Image' :
             item.placementType === 'body' ? 'Body Image' :
             item.placementType === 'both' ? 'Cover + Body' : 'Unused'}
          </div>
        </div>
      </div>

      <div className="media-library-card__body flex-1 flex flex-col">
        <div className="media-library-card__head">
          <div className="min-w-0 flex-1">
            <ModernTooltip label={`Uploaded by ${item.uploadedByName ?? 'System'}`} variant="editor" alwaysShow>
              <h3 className="media-library-card__name">
                {item.name}
              </h3>
            </ModernTooltip>
            <div className="flex items-center gap-1 mt-1 truncate">
              <span className="text-[10px] text-muted-foreground/75">by</span>
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                item.uploadedByRole === 'SUPER_ADMIN' || item.uploadedByRole === 'ADMIN'
                  ? "text-rose-500 bg-rose-500/5 border-rose-500/12 dark:border-rose-500/20"
                  : item.uploadedByRole === 'EDITOR'
                  ? "text-blue-500 bg-blue-500/5 border-blue-500/12 dark:border-blue-500/20"
                  : item.uploadedByRole === 'AUTHOR'
                  ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/12 dark:border-emerald-500/20"
                  : item.uploadedByRole === 'CONTRIBUTOR'
                  ? "text-purple-500 bg-purple-500/5 border-purple-500/12 dark:border-purple-500/20"
                  : "text-muted-foreground bg-muted/10 border-border/12"
              )}>
                {item.uploadedByName ?? 'System'}
              </span>
            </div>
          </div>
          <span className="media-library-card__size shrink-0 ml-2">{formatBytes(item.size)}</span>
        </div>

        <dl className="media-library-card__facts">
          <div><dt>Uploaded</dt><dd>{formatEditorialTimestamp(item.createdAt)}</dd></div>
          {dims && <div><dt>Dimensions</dt><dd>{dims}</dd></div>}
        </dl>

        {item.usedInArticles.length > 0 && (
          <ModernTooltip label="View which stories reference this asset" variant="editor" alwaysShow>
            <button
              type="button"
              onClick={() => onShowUsage?.(item)}
              className={cn(
                "media-library-card__usage-pill flex items-center justify-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-all border w-full cursor-pointer",
                item.usageCount <= 1 ? "text-blue-500 bg-blue-500/5 border-blue-500/12 hover:bg-blue-500/10" :
                item.usageCount === 2 ? "text-violet-500 bg-violet-500/5 border-violet-500/12 hover:bg-violet-500/10" :
                item.usageCount === 3 ? "text-amber-500 bg-amber-500/5 border-amber-500/12 hover:bg-amber-500/10" :
                "text-rose-500 bg-rose-500/5 border-rose-500/12 hover:bg-rose-500/10"
              )}
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Used in {item.usageCount} {item.usageCount === 1 ? 'story' : 'stories'}</span>
            </button>
          </ModernTooltip>
        )}

        {editing ? (
          <div className="media-library-card__edit mt-auto">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" placeholder="File name" />
            {item.type === 'image' && (
              <Input value={altText} onChange={(e) => setAltText(e.target.value)} className="h-8 text-xs" placeholder="Alt text" />
            )}
            <div className="media-library-card__edit-actions">
              <button
                type="button"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </button>
              <Button type="button" size="sm" className="h-7 px-2" onClick={saveEdits} disabled={saving}>
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="media-library-card__action-row">
            <ModernTooltip label="Copy URL" variant="editor" alwaysShow>
              <button
                type="button"
                className="media-library-card__action-btn media-library-card__action-btn--copy"
                onClick={copyUrl}
              >
                <Copy className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
              </button>
            </ModernTooltip>
            <ModernTooltip label="Open file" variant="editor" alwaysShow>
              {item.type === 'image' ? (
                <button
                  type="button"
                  className="media-library-card__action-btn media-library-card__action-btn--open"
                  onClick={() => onPreviewImage(normalizeArticleImageUrl(item.url) ?? item.url, item.name, dims, item.size)}
                >
                  <ExternalLink className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
                </button>
              ) : (
                <a
                  href={normalizeArticleImageUrl(item.url) ?? item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="media-library-card__action-btn media-library-card__action-btn--open"
                >
                  <ExternalLink className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
                </a>
              )}
            </ModernTooltip>
            <ModernTooltip label="Edit details" variant="editor" alwaysShow>
              <button
                type="button"
                className="media-library-card__action-btn media-library-card__action-btn--edit"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
              </button>
            </ModernTooltip>
            {item.type === 'image' && (
              <ModernTooltip label="Replace image/details" variant="editor" alwaysShow>
                <button
                  type="button"
                  className="media-library-card__action-btn media-library-card__action-btn--replace"
                  onClick={() => setReplaceOpen(true)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
                </button>
              </ModernTooltip>
            )}
            {item.canDelete ? (
              <ModernTooltip label="Delete file" variant="editor" alwaysShow>
                <button
                  type="button"
                  className="media-library-card__action-btn media-library-card__action-btn--delete"
                  onClick={() => onDelete(item.id)}
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
                </button>
              </ModernTooltip>
            ) : (
              <ModernTooltip label={item.usageCount > 0 ? 'In use by articles' : 'Cannot delete'} variant="editor" alwaysShow>
                <span className="media-library-card__action-btn media-library-card__action-btn--lock cursor-not-allowed">
                  <Lock className="h-3.5 w-3.5 md:h-[1.125rem] md:w-[1.125rem]" />
                </span>
              </ModernTooltip>
            )}
          </div>
        )}
      </div>

      <ReplaceMediaModal
        item={item}
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        onUpdated={onUpdated}
      />
    </article>
  );
}

export function MediaUpload({ items }: { items: MediaLibraryItem[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'file'>('all');
  const [datePreset, setDatePreset] = useState<'all' | '24h' | '7d' | '30d' | '365d'>('all');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<{
    url: string;
    name: string;
    dims: string | null;
    size: number | null;
  } | null>(null);
  const [usageModalItem, setUsageModalItem] = useState<MediaLibraryItem | null>(null);
  const [convertToWebp, setConvertToWebp] = useState(true);

  useEffect(() => {
    const val = localStorage.getItem('esbpowerline_webp_optimize');
    if (val !== null) {
      setConvertToWebp(val === 'true');
    }
  }, []);

  const handleToggleWebp = (val: boolean) => {
    setConvertToWebp(val);
    localStorage.setItem('esbpowerline_webp_optimize', String(val));
  };

  async function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!process.env.NEXT_PUBLIC_CDN_URL && !convertToWebp && file.size > 4.5 * 1024 * 1024) {
        toast.error('Raw uploads must be under 4.5 MB. Enable "Convert to WebP" to upload this file.');
        return;
      }

      setUploading(true);
      try {
        await uploadImageHelper(file, convertToWebp);
        toast.success('Uploaded');
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this file permanently?')) return;
    setPending(true);
    try {
      await deleteMedia(id);
      toast.success('Deleted');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setPending(false);
    }
  }

  const filteredItems = items.filter((item) => {
    // 1. Filter by image/file type
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // 2. Filter by upload date presets
    if (datePreset !== 'all') {
      const createdDate = new Date(item.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      if (datePreset === '24h' && diffMs > 24 * 60 * 60 * 1000) return false;
      if (datePreset === '7d' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
      if (datePreset === '30d' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      if (datePreset === '365d' && diffMs > 365 * 24 * 60 * 60 * 1000) return false;
    }

    // 3. Filter by search text (filename, alt text, caption, date string, or linked articles)
    if (query.trim() !== '') {
      const q = query.toLowerCase().trim();
      const nameMatch = item.name.toLowerCase().includes(q);
      const altMatch = (item.altText ?? '').toLowerCase().includes(q);
      const captionMatch = (item.caption ?? '').toLowerCase().includes(q);
      const articleMatch = item.usedInArticles.some((art) => art.title.toLowerCase().includes(q));

      const dateString = new Date(item.createdAt).toLocaleDateString().toLowerCase();
      const dateIso = new Date(item.createdAt).toISOString().toLowerCase();
      const dateMatch = dateString.includes(q) || dateIso.includes(q);

      if (!nameMatch && !altMatch && !captionMatch && !articleMatch && !dateMatch) {
        return false;
      }
    }

    return true;
  });

  const images = items.filter((m) => m.type === 'image').length;
  const files = items.length - images;

  return (
    <div className="media-library media-library--v2">
      <div className="media-library__toolbar">
        <div className="media-library__summary">
          <span className="media-library__summary-icon">
            <FileImage className="h-4 w-4" />
          </span>
          <div>
            <p className="media-library__summary-title">{items.length} asset{items.length !== 1 ? 's' : ''}</p>
            <p className="media-library__summary-sub">
              {images > 0 && `${images} image${images !== 1 ? 's' : ''}`}
              {images > 0 && files > 0 && ' · '}
              {files > 0 && `${files} document${files !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* WebP Optimizer Toggle Switch */}
          <div className="flex items-center gap-1 bg-muted/40 border border-border/30 p-1 rounded-xl text-[10px] font-bold shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleWebp(true)}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
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
                "px-2.5 py-1 rounded-lg transition-all",
                !convertToWebp 
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold shadow-sm border border-amber-500/10" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              Raw Upload
            </button>
          </div>

          <Button onClick={handleUpload} disabled={uploading} size="sm" className="media-library__upload-btn">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="media-library__search-panel flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between pb-4 border-b border-border/30 mb-5 mt-2 bg-muted/5 p-3 rounded-2xl border border-border/20 shadow-inner">
          <div className="relative flex-1 min-w-[280px]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search filename, alt text, or connected articles..."
              className="w-full h-10 text-xs bg-background border border-border/60 rounded-xl pl-9 pr-9 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 placeholder:text-muted-foreground/60 transition-all text-foreground"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/60 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            {/* Same-sized Select Buttons for Type Filter */}
            <div className="flex items-center gap-1 bg-background border border-border/60 rounded-xl p-1 h-10 shadow-sm">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={cn(
                  'h-8 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  typeFilter === 'all' 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                All Files
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('image')}
                className={cn(
                  'h-8 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  typeFilter === 'image' 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('file')}
                className={cn(
                  'h-8 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  typeFilter === 'file' 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                Documents
              </button>
            </div>

            {/* Same-sized Dropdown for Date Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="h-10 min-w-[140px] flex items-center justify-between gap-2.5 px-4 text-xs font-bold bg-background hover:bg-muted/20 border border-border/60 hover:border-border rounded-xl transition-all text-muted-foreground hover:text-foreground shadow-sm focus:outline-none cursor-pointer"
              >
                <span>{
                  datePreset === 'all' ? 'All Dates' :
                  datePreset === '24h' ? 'Last 24 Hours' :
                  datePreset === '7d' ? 'Last 7 Days' :
                  datePreset === '30d' ? 'Last 30 Days' :
                  'Last Year'
                }</span>
                <ChevronDown className={cn('h-4 w-4 opacity-75 transition-transform duration-300', dateDropdownOpen && 'rotate-180 text-sky-400')} />
              </button>

              {dateDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-card border border-border/60 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                    {[
                      { value: 'all', label: 'All Dates' },
                      { value: '24h', label: 'Last 24 Hours' },
                      { value: '7d', label: 'Last 7 Days' },
                      { value: '30d', label: 'Last 30 Days' },
                      { value: '365d', label: 'Last Year' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDatePreset(opt.value as any);
                          setDateDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer',
                          datePreset === opt.value
                            ? 'bg-sky-500/10 text-sky-400 font-bold'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                      >
                        <span>{opt.label}</span>
                        {datePreset === opt.value && <Check className="h-3.5 w-3.5 text-sky-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="media-library__empty">
          <FileImage className="h-10 w-10 opacity-30" />
          <p>No media uploaded yet</p>
          <Button onClick={handleUpload} disabled={uploading} variant="outline" size="sm">
            Upload your first file
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="media-library__empty py-12 border border-dashed border-border/40 rounded-2xl bg-muted/5 flex flex-col items-center justify-center text-center">
          <FileImage className="h-10 w-10 opacity-30 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground mt-2">No matching assets found</p>
          <p className="text-xs text-muted-foreground/60 max-w-[280px] mt-1">Adjust your search terms or filters to locate the media items.</p>
          <Button
            onClick={() => { setQuery(''); setTypeFilter('all'); setDatePreset('all'); }}
            variant="outline"
            size="sm"
            className="mt-3.5 h-8 text-xs"
          >
            Reset all filters
          </Button>
        </div>
      ) : (
        <div className="media-library__grid media-library__grid--v2">
          {filteredItems.map((m) => (
            <MediaCard
              key={m.id}
              item={m}
              onDelete={handleDelete}
              onUpdated={() => router.refresh()}
              pending={pending}
              onPreviewImage={(url, name, dims, size) => setLightboxItem({ url, name, dims, size })}
              onShowUsage={(item) => setUsageModalItem(item)}
            />
          ))}
        </div>
      )}

      <p className="media-library__hint">
        Each file links directly to stories that use it. Edit metadata, copy URLs, or delete when not in use.
      </p>

      {/* Professional Lightbox Image Preview Popup */}
      <ImageLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      {/* Used In Articles List Popup */}
      <UsedInArticlesModal
        item={usageModalItem}
        open={usageModalItem !== null}
        onClose={() => setUsageModalItem(null)}
      />
    </div>
  );
}