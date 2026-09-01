'use client';
import { mediaThumbnailUrl, MEDIA_THUMB_WIDTH, MEDIA_PREVIEW_WIDTH } from '@/lib/media-thumbnail';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cmsToast } from '@/lib/cms-toast';
import { optimizeImageToWebP } from '@/lib/image-optimizer';
import { uploadImageHelper } from '@/lib/upload-helper';


export type MediaItem = {
  id: string;
  name: string;
  url: string;
  type: string;
};

export function MediaPicker({
  items,
  value,
  onChange,
  label = 'Featured image',
}: {
  items: MediaItem[];
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [convertToWebp, setConvertToWebp] = useState(true);
  const images = items.filter((m) => m.type === 'image');

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
      try {
        const data = await uploadImageHelper(file, convertToWebp);
        onChange(data.url);
        cmsToast.success('Image uploaded', 'The file is ready to use as your featured image.');
        setOpen(false);
      } catch (err: any) {
        cmsToast.error('Upload failed', err.message || 'Check the file type and size, then try again.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  return (
    <div className="space-y-2">
      <span className="admin-stat-label">{label}</span>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border/60 group">
          <img src={mediaThumbnailUrl(value, MEDIA_PREVIEW_WIDTH, 80) ?? value} alt="" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>Change</Button>
            <button
              type="button"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/95 hover:bg-red-500/25 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              onClick={() => onChange('')}
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full aspect-video rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <ImageIcon className="h-6 w-6 opacity-60" />
          <span className="text-[12px] font-medium">Choose from library or upload</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-background rounded-2xl border border-border/60 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div>
                <h3 className="font-semibold text-[15px]">Media library</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Select an image for your article</p>
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
                  {uploading ? 'Uploading…' : 'Upload new'}
                </Button>
                <button type="button" onClick={() => setOpen(false)} className="ui-close-btn" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
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
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}