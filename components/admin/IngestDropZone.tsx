'use client';

import React, { useCallback, useId, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drop the day's two documents here; this machine does the rest.
 *
 * The panel used to show two separate `<input type="file">` rows, each with
 * three paragraphs of explanation about which file belonged in which — and the
 * two files are trivially distinguishable by extension, so asking the operator
 * to sort them was work the screen could do itself. A workbook (.xlsx/.xls/
 * .xlsm, or a .docx/.pdf copy of the same report) is the grid day; a PDF is the
 * gas report. Both can be dropped together, in either order.
 *
 * The one genuine ambiguity is a `.pdf`, which either publisher's document may
 * be: PGCB's daily report is occasionally circulated as a PDF, and
 * Petrobangla's always is. A lone PDF is read as the gas report — overwhelmingly
 * the common case, and it is what the file name usually says — and the operator
 * can move it across with one click when it is not.
 */

export type DroppedFiles = { pgcb: File | null; pb: File | null };

const WORKBOOK_EXT = ['.xlsx', '.xls', '.xlsm', '.docx'];
const ALL_EXT = [...WORKBOOK_EXT, '.pdf'];

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

function kb(bytes: number): string {
  return bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Sort what was dropped into the two slots, leaving anything already held. */
function route(files: File[], current: DroppedFiles): { next: DroppedFiles; rejected: string[] } {
  const next: DroppedFiles = { ...current };
  const rejected: string[] = [];
  for (const file of files) {
    const ext = extOf(file.name);
    if (WORKBOOK_EXT.includes(ext)) {
      next.pgcb = file;
    } else if (ext === '.pdf') {
      // A PDF fills the gas slot unless that is taken and the grid slot is
      // free — which is how a PGCB report circulated as a PDF lands correctly
      // when it arrives second.
      if (!next.pb) next.pb = file;
      else if (!next.pgcb) next.pgcb = file;
      else next.pb = file;
    } else {
      rejected.push(file.name);
    }
  }
  return { next, rejected };
}

function Slot({
  kind,
  file,
  onClear,
  onSwap,
  canSwap,
}: {
  kind: 'pgcb' | 'pb';
  file: File;
  onClear: () => void;
  onSwap: () => void;
  canSwap: boolean;
}) {
  const Icon = kind === 'pgcb' ? FileSpreadsheet : FileText;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold">{file.name}</p>
        <p className="text-[10.5px] text-muted-foreground">
          {kind === 'pgcb'
            ? 'PGCB daily report → grid day, energy curve, station detail'
            : 'Petrobangla gas report → Gas & LNG Supply'}
          <span className="tabular-nums"> · {kb(file.size)}</span>
        </p>
      </div>
      {canSwap && (
        <button
          type="button"
          onClick={onSwap}
          className="shrink-0 rounded-md border border-border/60 px-2 py-1 text-[10.5px] font-semibold text-muted-foreground transition hover:bg-muted"
          title={
            kind === 'pb'
              ? 'This is actually PGCB’s daily report'
              : 'This is actually Petrobangla’s gas report'
          }
        >
          {kind === 'pb' ? 'It’s PGCB’s' : 'It’s Petrobangla’s'}
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${file.name}`}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function IngestDropZone({
  files,
  onChange,
  disabled,
}: {
  files: DroppedFiles;
  onChange: (next: DroppedFiles) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const accept = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const { next, rejected: bad } = route([...list], files);
      setRejected(bad);
      onChange(next);
    },
    [files, onChange],
  );

  const swap = () => onChange({ pgcb: files.pb, pb: files.pgcb });
  const any = Boolean(files.pgcb || files.pb);

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          over
            ? 'border-primary bg-primary/[0.06]'
            : 'border-border/70 bg-muted/20 hover:border-border',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <UploadCloud
          className={cn('mx-auto h-7 w-7', over ? 'text-primary' : 'text-muted-foreground')}
        />
        <p className="mt-2 text-[13px] font-semibold">
          Drop the day&rsquo;s report{any ? 's' : 's'} here
        </p>
        <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-muted-foreground">
          PGCB&rsquo;s workbook, Petrobangla&rsquo;s gas PDF, or both together — they are sorted by
          file type, in any order. Everything is parsed on this machine; nothing is uploaded to the
          site until you publish.
        </p>
        <label
          htmlFor={inputId}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background px-3.5 py-1.5 text-[12px] font-semibold transition hover:bg-muted"
        >
          Choose files
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          accept={ALL_EXT.join(',')}
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files);
            // Clearing lets the same file be re-picked after a remove.
            e.target.value = '';
          }}
        />
      </div>

      {rejected.length > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Ignored {rejected.join(', ')} — the daily report is .xlsx, .xls, .xlsm, .docx or .pdf, and
          the gas report is .pdf.
        </p>
      )}

      {any && (
        <div className="space-y-2">
          {files.pgcb && (
            <Slot
              kind="pgcb"
              file={files.pgcb}
              canSwap={extOf(files.pgcb.name) === '.pdf'}
              onSwap={swap}
              onClear={() => onChange({ ...files, pgcb: null })}
            />
          )}
          {files.pb && (
            <Slot
              kind="pb"
              file={files.pb}
              canSwap={extOf(files.pb.name) === '.pdf'}
              onSwap={swap}
              onClear={() => onChange({ ...files, pb: null })}
            />
          )}
          {/* The pairing rule that trips everyone, said once, where it applies. */}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {files.pgcb && !files.pb
              ? 'No gas report: the day will publish with its gas figures blank, and the Gas & LNG Supply tab stays on the previous day. Add it later and the day fills in.'
              : !files.pgcb && files.pb
                ? 'Gas report alone: it is filed by its own printed 08:00–08:00 window, and fills in that day’s gas figures whether or not the workbook has arrived.'
                : 'Both halves of the day. The gas report must be the one whose 08:00–08:00 window starts on the energy day the workbook describes.'}
          </p>
        </div>
      )}
    </div>
  );
}
