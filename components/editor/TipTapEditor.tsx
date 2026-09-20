'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
// Aliased: a bare `Node` import shadows the DOM's Node type, which this file
// uses for `contains(e.target as Node)` click handling.
import { Mark, Node as TipTapNode, mergeAttributes } from '@tiptap/core';
import { AD_SLOT_CLASS } from '@/lib/article-ad-split';
import { Button } from '@/components/ui/button';
import { cn, smartRearrangeText } from '@/lib/utils';
import { optimizeImageToWebP } from '@/lib/image-optimizer';
import { useEditorPreferences } from '@/components/cms/EditorPreferencesProvider';

import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { EditorFindReplace } from '@/components/editor/EditorFindReplace';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Table as TableIcon, Minus, RemoveFormatting,
  Pilcrow, Code2, CornerDownLeft, IndentIncrease, IndentDecrease, ChevronDown,
  Palette, Highlighter, Subscript, Superscript,
  Rows3, Columns3, Trash2, TableRowsSplit, PanelTop, Megaphone, Maximize2, Type, Search, Captions,
} from 'lucide-react';



/**
 * The in-article ad slot, placed by the desk.
 *
 * Without it the page picked the midpoint by itself, which is a guess about
 * someone else's copy: it lands where the paragraph count says, not where the
 * story can stand a break. An editor who wants the ad after the standfirst, or
 * after the table rather than before it, had no way to say so.
 *
 * An atom, so it is one thing to select and delete rather than a box you can
 * type inside, and a block, so it only ever sits between paragraphs — the one
 * place `splitBodyForAd` is able to cut. It carries no content of its own; it
 * is an instruction, and the reader never sees it.
 */
/** The alignment classes the stylesheet owns, and the sanitiser permits. */
export const IMAGE_ALIGNMENTS = {
  full: 'article-img--full',
  left: 'article-img--left',
  center: 'article-img--center',
  right: 'article-img--right',
} as const;

export type ImageAlignment = keyof typeof IMAGE_ALIGNMENTS;

const ALIGNMENT_BY_CLASS = new Map<string, ImageAlignment>(
  Object.entries(IMAGE_ALIGNMENTS).map(([k, v]) => [v, k as ImageAlignment]),
);

/**
 * The body image, with somewhere to sit.
 *
 * A picture could only ever be full column width, so a portrait shot or a
 * small chart had to be full width or nothing. Alignment is stored as one of
 * four fixed classes rather than inline CSS: the sanitiser then has a list of
 * names to check instead of a stylesheet to parse, and the page keeps control
 * of what each one means.
 */
const AlignableImage = Image.extend({
  /**
   * A picture in a story usually needs a line saying what it is and who took
   * it. The node had neither, so a caption could only be typed as a paragraph
   * underneath — which reads as body copy, is styled as body copy, and comes
   * apart the moment the image is moved.
   *
   * With a caption or a credit the node renders as a `figure` with a
   * `figcaption`; without, it stays a bare `img`, so nothing already published
   * changes shape. Both forms parse back, so the round trip through the
   * sanitiser and the editor is stable.
   */
  parseHTML() {
    return [
      {
        tag: 'figure.article-figure',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const img = el.querySelector('img');
          if (!img) return false;
          const cap = el.querySelector('figcaption');
          const credit = cap?.querySelector('.article-figure__credit');
          // The credit lives inside the caption, so remove it before reading
          // the caption's own text or it would be counted twice.
          const captionText = (() => {
            if (!cap) return '';
            const clone = cap.cloneNode(true) as HTMLElement;
            clone.querySelector('.article-figure__credit')?.remove();
            return clone.textContent?.trim() ?? '';
          })();
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            caption: captionText,
            credit: credit?.textContent?.replace(/^Photo:\s*/i, '').trim() ?? '',
          };
        },
      },
      { tag: 'img[src]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const caption = String(node.attrs.caption ?? '').trim();
    const credit = String(node.attrs.credit ?? '').trim();
    const { caption: _c, credit: _r, ...imgAttrs } = HTMLAttributes as Record<string, unknown>;
    if (!caption && !credit) return ['img', mergeAttributes(imgAttrs)];
    const figcaption: unknown[] = ['figcaption', { class: 'article-figure__caption' }];
    if (caption) figcaption.push(caption);
    if (credit) figcaption.push(['span', { class: 'article-figure__credit' }, `Photo: ${credit}`]);
    return ['figure', { class: 'article-figure' }, ['img', mergeAttributes(imgAttrs)], figcaption];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        // Rendered by renderHTML into the figcaption, never as an attribute.
        renderHTML: () => ({}),
        parseHTML: () => '',
      },
      credit: {
        default: '',
        renderHTML: () => ({}),
        parseHTML: () => '',
      },
      align: {
        default: 'full' as ImageAlignment,
        parseHTML: (element) => {
          for (const cls of element.classList) {
            const found = ALIGNMENT_BY_CLASS.get(cls);
            if (found) return found;
          }
          return 'full';
        },
        renderHTML: (attributes) => {
          const align = (attributes.align ?? 'full') as ImageAlignment;
          return { class: IMAGE_ALIGNMENTS[align] ?? IMAGE_ALIGNMENTS.full };
        },
      },
    };
  },
});

export const AdSlotNode = TipTapNode.create({
  name: 'adSlot',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: `div.${AD_SLOT_CLASS}` }];
  },

  renderHTML() {
    // No attributes beyond the class: the class is what the sanitiser keeps
    // and what splitBodyForAd matches on.
    return ['div', { class: AD_SLOT_CLASS }];
  },
});

export const FontSizeMark = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.size) {
            return {};
          }
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

export const TextColorMark = Mark.create({
  name: 'textColor',
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="color"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

export const HighlightMark = Mark.create({
  name: 'highlightColor',
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `background-color: ${attributes.color}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="background-color"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

export const SubscriptMark = Mark.create({
  name: 'subscript',
  parseHTML() {
    return [{ tag: 'sub' }, { style: 'vertical-align: sub' }];
  },
  renderHTML() {
    return ['sub', 0];
  },
});

export const SuperscriptMark = Mark.create({
  name: 'superscript',
  parseHTML() {
    return [{ tag: 'sup' }, { style: 'vertical-align: super' }];
  },
  renderHTML() {
    return ['sup', 0];
  },
});

export const FontFamilyMark = Mark.create({
  name: 'fontFamily',
  addAttributes() {
    return {
      font: {
        default: null,
        parseHTML: (element) => element.style.fontFamily,
        renderHTML: (attributes) => {
          if (!attributes.font) return {};
          return { style: `font-family: ${attributes.font}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="font-family"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});



interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minBodyHeight?: number;
}

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

const TOOLBAR_ITEMS: Record<string, { label: string; hint: string; shortcut?: string }> = {
  bold: { label: 'Bold', hint: 'Emphasize key terms', shortcut: `${MOD}+B` },
  italic: { label: 'Italic', hint: 'Subtle emphasis or attribution', shortcut: `${MOD}+I` },
  underline: { label: 'Underline', hint: 'Highlight linked phrasing', shortcut: `${MOD}+U` },
  strike: { label: 'Strikethrough', hint: 'Mark revised or withdrawn text', shortcut: `${MOD}+Shift+S` },
  h1: { label: 'Heading 1', hint: 'Major section break', shortcut: `${MOD}+Alt+1` },
  h2: { label: 'Heading 2', hint: 'Sub-section within the story', shortcut: `${MOD}+Alt+2` },
  h3: { label: 'Heading 3', hint: 'Minor heading or sidebar note', shortcut: `${MOD}+Alt+3` },
  alignLeft: { label: 'Align left', hint: 'Default body alignment' },
  alignCenter: { label: 'Align center', hint: 'Center pull quotes or captions' },
  alignRight: { label: 'Align right', hint: 'Right-align callouts' },
  alignJustify: { label: 'Justify', hint: 'Even edges for dense copy' },
  bulletList: { label: 'Bullet list', hint: 'Unordered key points' },
  orderedList: { label: 'Numbered list', hint: 'Sequential steps or rankings' },
  blockquote: { label: 'Blockquote', hint: 'Quoted source or pull quote' },
  codeBlock: { label: 'Code block', hint: 'Technical snippets or data' },
  link: { label: 'Insert link', hint: 'Add hyperlinks to sources' },
  image: { label: 'Insert image', hint: 'Upload inline visuals' },
  table: { label: 'Insert table', hint: 'Structured figures or comparisons' },
  adSlot: { label: 'Ad slot', hint: 'Put the in-article ad here instead of the middle' },
  find: { label: 'Find & replace', hint: 'Search the story and replace across it', shortcut: `${MOD}+F` },
  imgFull: { label: 'Full width', hint: 'Image spans the column' },
  imgLeft: { label: 'Float left', hint: 'Image sits left, text wraps beside it' },
  imgCenter: { label: 'Centre', hint: 'Image centred at half width' },
  imgRight: { label: 'Float right', hint: 'Image sits right, text wraps beside it' },
  imgAlt: { label: 'Alt text', hint: 'Describe the image for readers who cannot see it' },
  imgCaption: { label: 'Caption & credit', hint: 'The line under the picture, and who took it' },
  // A table could be inserted at a fixed 3x3 and then never changed: no row,
  // no column, no way to remove it. Published pieces carry five- and nine-row
  // tables, so the desk was building them outside the editor (2026-09-20).
  addRowAfter: { label: 'Add row', hint: 'Insert a row below the cursor' },
  deleteRow: { label: 'Delete row', hint: 'Remove the row under the cursor' },
  addColumnAfter: { label: 'Add column', hint: 'Insert a column to the right' },
  deleteColumn: { label: 'Delete column', hint: 'Remove the column under the cursor' },
  toggleHeaderRow: { label: 'Header row', hint: 'Turn the top row into headers' },
  mergeOrSplit: { label: 'Merge / split cells', hint: 'Merge the selection, or split a merged cell' },
  deleteTable: { label: 'Delete table', hint: 'Remove the whole table' },
  hr: { label: 'Divider', hint: 'Separate story sections' },
  inlineCode: { label: 'Inline code', hint: 'Mark a short code fragment' },
  hardBreak: { label: 'Line break', hint: 'Insert a line break within a paragraph' },
  indent: { label: 'Indent list item', hint: 'Nest the current list item' },
  outdent: { label: 'Outdent list item', hint: 'Move list item up one level' },
  clear: { label: 'Clear formatting', hint: 'Strip styles from selection' },
  undo: { label: 'Undo', hint: 'Revert last change', shortcut: `${MOD}+Z` },
  redo: { label: 'Redo', hint: 'Reapply undone change', shortcut: `${MOD}+Shift+Z` },
  paragraph: { label: 'Paragraph', hint: 'Return selection to body text', shortcut: `${MOD}+Alt+0` },
  subscript: { label: 'Subscript', hint: 'Lowered text (for chemical formulas)' },
  superscript: { label: 'Superscript', hint: 'Raised text (for footnotes/math)' },
};


function ToolbarButton({
  onClick,
  active,
  disabled,
  toolKey,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  toolKey: keyof typeof TOOLBAR_ITEMS;
  children: React.ReactNode;
}) {
  const meta = TOOLBAR_ITEMS[toolKey];
  const hint = meta.shortcut ? `${meta.hint} · ${meta.shortcut}` : meta.hint;
  return (
    <ModernTooltip
      label={meta.label}
      hint={hint}
      variant="editor"
      fast
      side="top"
      showDelayMs={120}
      className="tiptap-toolbar__item"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn('tiptap-toolbar__btn', active && 'tiptap-toolbar__btn--active')}
        aria-label={meta.label}
      >
        {children}
      </Button>
    </ModernTooltip>
  );
}

function runEditorShortcut(editor: Editor, event: KeyboardEvent): boolean {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return false;

  const key = event.key.toLowerCase();
  const shift = event.shiftKey;
  const alt = event.altKey;

  const run = (fn: () => void) => {
    event.preventDefault();
    fn();
    return true;
  };

  if (!shift && !alt && key === 'b') return run(() => { editor.chain().focus().toggleBold().run(); });
  if (!shift && !alt && key === 'i') return run(() => { editor.chain().focus().toggleItalic().run(); });
  if (!shift && !alt && key === 'u') return run(() => { editor.chain().focus().toggleUnderline().run(); });
  if (shift && !alt && key === 's') return run(() => { editor.chain().focus().toggleStrike().run(); });
  if (!shift && key === 'z') return run(() => { editor.chain().focus().undo().run(); });
  if (shift && key === 'z') return run(() => { editor.chain().focus().redo().run(); });
  if (alt && key === '1') return run(() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); });
  if (alt && key === '2') return run(() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); });
  if (alt && key === '3') return run(() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); });
  if (alt && key === '0') return run(() => { editor.chain().focus().setParagraph().run(); });

  return false;
}

function FontSizeSelector({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fontSizes = [
    { label: '8px', value: '8px', desc: 'Micro' },
    { label: '10px', value: '10px', desc: 'Mini' },
    { label: '12px', value: '12px', desc: 'Tiny' },
    { label: '14px', value: '14px', desc: 'Small' },
    { label: '16px', value: 'default', desc: 'Default' },
    { label: '18px', value: '18px', desc: 'Medium' },
    { label: '20px', value: '20px', desc: 'Large' },
    { label: '24px', value: '24px', desc: 'X-Large' },
    { label: '30px', value: '30px', desc: 'XX-Large' },
  ];

  const activeSize = editor.getAttributes('fontSize').size || '16px';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <ModernTooltip
        label="Font Size"
        hint="Scale story typography size"
        variant="editor"
        fast
        side="top"
        showDelayMs={120}
        className="tiptap-toolbar__item"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="h-8 px-2 text-xs font-semibold gap-1.5 rounded-md border border-border/30 bg-background/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-between"
        >
          <span className="min-w-[28px] text-left">{activeSize === 'default' ? '16px' : activeSize}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </ModernTooltip>


      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[130px] rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100 overflow-hidden">


          <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">
            Size
          </div>
          {fontSizes.map((size) => {
            const isActive = activeSize === size.value || (size.value === 'default' && (activeSize === '16px' || !activeSize));
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => {
                  if (size.value === 'default') {
                    editor.chain().focus().unsetMark('fontSize').run();
                  } else {
                    editor.chain().focus().setMark('fontSize', { size: size.value }).run();
                  }
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1 rounded-md text-xs flex items-center justify-between transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{size.label}</span>
                <span className="text-[10px] opacity-40">{size.desc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TextColorSelector({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const colors = [
    { label: 'Default', value: 'default', color: 'inherit' },
    { label: 'Red', value: '#ef4444', color: '#ef4444' },
    { label: 'Orange', value: '#f97316', color: '#f97316' },
    { label: 'Yellow', value: '#eab308', color: '#eab308' },
    { label: 'Green', value: '#22c55e', color: '#22c55e' },
    { label: 'Blue', value: '#3b82f6', color: '#3b82f6' },
    { label: 'Purple', value: '#a855f7', color: '#a855f7' },
    { label: 'Gray', value: '#6b7280', color: '#6b7280' },
  ];

  const activeColor = editor.getAttributes('textColor').color || 'Default';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <ModernTooltip
        label="Text Color"
        hint="Apply custom color to selected text"
        variant="editor"
        fast
        side="top"
        showDelayMs={120}
        className="tiptap-toolbar__item"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center relative"
        >
          <Palette className="h-4 w-4" />
          {activeColor !== 'Default' && (
            <span 
              className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-background"
              style={{ backgroundColor: activeColor }}
            />
          )}
        </Button>
      </ModernTooltip>


      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100 overflow-hidden">
          <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">
            Text Color
          </div>
          {colors.map((c) => {
            const isActive = activeColor === c.value || (c.value === 'default' && activeColor === 'Default');
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  if (c.value === 'default') {
                    editor.chain().focus().unsetMark('textColor').run();
                  } else {
                    editor.chain().focus().setMark('textColor', { color: c.value }).run();
                  }
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1 rounded-md text-xs flex items-center gap-2 transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: c.color }} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HighlightSelector({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const highlights = [
    { label: 'None', value: 'default', color: 'transparent' },
    { label: 'Yellow', value: 'rgba(234, 179, 8, 0.25)', color: 'rgba(234, 179, 8, 0.6)' },
    { label: 'Green', value: 'rgba(34, 197, 94, 0.25)', color: 'rgba(34, 197, 94, 0.6)' },
    { label: 'Blue', value: 'rgba(59, 130, 246, 0.25)', color: 'rgba(59, 130, 246, 0.6)' },
    { label: 'Red', value: 'rgba(239, 68, 68, 0.25)', color: 'rgba(239, 68, 68, 0.6)' },
    { label: 'Purple', value: 'rgba(168, 85, 247, 0.25)', color: 'rgba(168, 85, 247, 0.6)' },
  ];

  const activeHighlight = editor.getAttributes('highlightColor').color || 'None';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <ModernTooltip
        label="Highlight Color"
        hint="Highlight text backdrop"
        variant="editor"
        fast
        side="top"
        showDelayMs={120}
        className="tiptap-toolbar__item"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center relative"
        >
          <Highlighter className="h-4 w-4" />
          {activeHighlight !== 'None' && (
            <span 
              className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-background"
              style={{ backgroundColor: activeHighlight }}
            />
          )}
        </Button>
      </ModernTooltip>


      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100 overflow-hidden">
          <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">
            Highlight Color
          </div>
          {highlights.map((h) => {
            const isActive = activeHighlight === h.value || (h.value === 'default' && activeHighlight === 'None');
            return (
              <button
                key={h.value}
                type="button"
                onClick={() => {
                  if (h.value === 'default') {
                    editor.chain().focus().unsetMark('highlightColor').run();
                  } else {
                    editor.chain().focus().setMark('highlightColor', { color: h.value }).run();
                  }
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1 rounded-md text-xs flex items-center gap-2 transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="w-2.5 h-2.5 rounded border border-border" style={{ backgroundColor: h.color }} />
                <span>{h.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FontFamilySelector({ editor }: { editor: any }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fonts = [
    { label: 'Default', value: 'default', font: 'inherit', desc: 'Theme Font' },
    { label: 'Georgia', value: 'Georgia, serif', font: 'Georgia, serif', desc: 'News Serif' },
    { label: 'Merriweather', value: 'Merriweather, serif', font: 'Merriweather, serif', desc: 'Readability Serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif', font: '"Playfair Display", serif', desc: 'Editorial Serif' },
    { label: 'Helvetica / Arial', value: '"Helvetica Neue", Helvetica, Arial, sans-serif', font: '"Helvetica Neue", Helvetica, Arial, sans-serif', desc: 'Classic Sans' },
    { label: 'Inter', value: 'Inter, sans-serif', font: 'Inter, sans-serif', desc: 'Modern Sans' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace', font: '"Courier New", Courier, monospace', desc: 'Data Mono' },
  ];

  const activeFont = editor.getAttributes('fontFamily').font || 'Default';

  // Find user-friendly label for currently active font
  const displayLabel = fonts.find(f => activeFont.includes(f.label) || activeFont === f.value)?.label || 'Font';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <ModernTooltip
        label="Font Family"
        hint="Choose an editorial font family"
        variant="editor"
        fast
        side="top"
        showDelayMs={120}
        className="tiptap-toolbar__item"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="h-8 px-2 text-xs font-semibold gap-1.5 rounded-md border border-border/30 bg-background/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-between"
        >
          <span className="min-w-[64px] text-left truncate max-w-[80px]">{displayLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </ModernTooltip>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[170px] rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100 overflow-hidden">
          <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-muted-foreground/60 font-bold">
            Font Family
          </div>
          {fonts.map((f) => {
            const isActive = activeFont === f.value || (f.value === 'default' && (activeFont === 'Default' || !activeFont));
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  if (f.value === 'default') {
                    editor.chain().focus().unsetMark('fontFamily').run();
                  } else {
                    editor.chain().focus().setMark('fontFamily', { font: f.value }).run();
                  }
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
                style={{ fontFamily: f.value !== 'default' ? f.value : undefined }}
              >
                <span>{f.label}</span>
                <span className="text-[10px] opacity-40 font-sans">{f.desc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  minBodyHeight = 360,
}: TipTapEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const syncBodyHeightRef = useRef<(() => void) | null>(null);
  const { preferences } = useEditorPreferences();
  const isSticky = preferences.stickyTipTapToolbar;
  const [findOpen, setFindOpen] = useState(false);

  // Ctrl/Cmd-F opens ours rather than the browser's, but only while the story
  // body has focus: a writer looking for text in the sidebar, or anywhere else
  // on the page, should still get the browser's find.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.key === 'f' && (e.metaKey || e.ctrlKey))) return;
      const root = editorRef.current?.view.dom;
      if (!root || !root.contains(document.activeElement)) return;
      e.preventDefault();
      setFindOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: false }),
      Underline,
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      AlignableImage.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      AdSlotNode,
      FontSizeMark,
      TextColorMark,
      HighlightMark,
      SubscriptMark,
      SuperscriptMark,
      FontFamilyMark,



    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
      syncBodyHeightRef.current?.();
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none',
        style: `min-height: ${minBodyHeight}px`,
      },
      handlePaste: () => {
        requestAnimationFrame(() => syncBodyHeightRef.current?.());
        return false;
      },
      transformPastedHTML: (html) => {
        return html;
      },
      transformPastedText: (text) => {
        return text;
      },
      handleKeyDown: (_view, event) => {
        const ed = editorRef.current;
        if (!ed) return false;
        return runEditorShortcut(ed, event);
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);



  useEffect(() => {
    if (!editor) return;

    const proseMirror = editor.view.dom;

    const syncBodyHeight = () => {
      const nextHeight = Math.max(minBodyHeight, proseMirror.scrollHeight);
      proseMirror.style.minHeight = `${nextHeight}px`;
    };

    syncBodyHeightRef.current = syncBodyHeight;
    syncBodyHeight();

    const resizeObserver = new ResizeObserver(() => syncBodyHeight());
    resizeObserver.observe(proseMirror);

    editor.on('create', syncBodyHeight);
    editor.on('transaction', syncBodyHeight);

    return () => {
      resizeObserver.disconnect();
      editor.off('create', syncBodyHeight);
      editor.off('transaction', syncBodyHeight);
      syncBodyHeightRef.current = null;
    };
  }, [editor, minBodyHeight]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
      requestAnimationFrame(() => syncBodyHeightRef.current?.());
    }
  }, [content, editor]);

  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      try {
        const convertToWebp = localStorage.getItem('esbpowerline_webp_optimize') !== 'false';
        const fileToUpload = convertToWebp && file.type.startsWith('image/') && file.type !== 'image/gif' && file.type !== 'image/svg+xml'
          ? await optimizeImageToWebP(file)
          : file;
        const form = new FormData();
        form.append('file', fileToUpload);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) return;
        const { url } = await res.json();
        // Alt text, asked for once at the point of insert.
        //
        // `setImage({ src })` wrote no alt at all, so every inline image ever
        // added through this toolbar reached the page unlabelled — invisible to
        // a screen reader and to image search, on a site whose hero images all
        // carry one (2026-09-20). Empty is accepted and stored as empty, which
        // is the correct markup for an image that genuinely carries no
        // information; it is a decision the writer makes, not a field we can
        // fill for them.
        const alt = window.prompt('Describe this image for readers who cannot see it (leave blank if decorative):', '') ?? '';
        editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
      } catch (err) {
        console.error('Editor image upload failed:', err);
      }
    };
    input.click();
  }, [editor]);


  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Does the body already carry a slot? A plain walk on each render rather
  // than a memo: the doc changes on every keystroke and a stale memo would
  // leave the button enabled after a slot was added, or disabled after one was
  // deleted. The walk stops at the first hit.
  const hasAdSlot = (() => {
    if (!editor) return false;
    let found = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'adSlot') found = true;
      return !found;
    });
    return found;
  })();

  /**
   * Alt text is asked for on insert, but that is one chance and the desk
   * revises. This edits it on a selected image, seeded with whatever is there.
   */
  const editImageAlt = useCallback(() => {
    if (!editor) return;
    const current = (editor.getAttributes('image').alt as string | undefined) ?? '';
    const next = window.prompt('Describe this image for readers who cannot see it (leave blank if decorative):', current);
    if (next === null) return;
    editor.chain().focus().updateAttributes('image', { alt: next.trim() }).run();
  }, [editor]);

  /** The line under the picture, and who took it. Blank clears either. */
  const editImageCaption = useCallback(() => {
    if (!editor) return;
    const attrs = editor.getAttributes('image');
    const caption = window.prompt('Caption — the line printed under the picture:', String(attrs.caption ?? ''));
    if (caption === null) return;
    const credit = window.prompt('Credit — who took or supplied it (leave blank for none):', String(attrs.credit ?? ''));
    if (credit === null) return;
    editor.chain().focus().updateAttributes('image', { caption: caption.trim(), credit: credit.trim() }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="tiptap-editor" aria-busy="true" aria-label="Loading editor">
        <div className="tiptap-toolbar tiptap-toolbar--loading" />
        <div className="tiptap-editor__body tiptap-editor__body--loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const Divider = () => <span className="tiptap-toolbar__divider" aria-hidden />;

  return (
    <div className={cn("tiptap-editor", isSticky && "tiptap-editor--sticky-toolbar")}>
      <div className={cn("tiptap-toolbar tiptap-toolbar--ribbon", isSticky && "tiptap-toolbar--sticky")}>
        <div className="tiptap-toolbar__group" role="group" aria-label="Text style">
          <ToolbarButton toolKey="bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="subscript" active={editor.isActive('subscript')} onClick={() => {
            if (editor.isActive('subscript')) {
              editor.chain().focus().unsetMark('subscript').run();
            } else {
              editor.chain().focus().unsetMark('superscript').setMark('subscript').run();
            }
          }}>
            <Subscript className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="superscript" active={editor.isActive('superscript')} onClick={() => {
            if (editor.isActive('superscript')) {
              editor.chain().focus().unsetMark('superscript').run();
            } else {
              editor.chain().focus().unsetMark('subscript').setMark('superscript').run();
            }
          }}>
            <Superscript className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <Divider />
        <div className="tiptap-toolbar__group" role="group" aria-label="Font settings">
          <FontFamilySelector editor={editor} />
          <FontSizeSelector editor={editor} />
        </div>
        <Divider />

        <div className="tiptap-toolbar__group" role="group" aria-label="Color style">
          <TextColorSelector editor={editor} />
          <HighlightSelector editor={editor} />
        </div>
        <Divider />


        <div className="tiptap-toolbar__group" role="group" aria-label="Structure">
          <ToolbarButton toolKey="paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="h1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="h2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="h3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <Divider />
        <div className="tiptap-toolbar__group" role="group" aria-label="Alignment">
          <ToolbarButton toolKey="alignLeft" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="alignCenter" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="alignRight" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="alignJustify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <Divider />
        <div className="tiptap-toolbar__group" role="group" aria-label="Lists">
          <ToolbarButton toolKey="bulletList" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="orderedList" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
            <IndentIncrease className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="outdent" onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
            <IndentDecrease className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <Divider />
        <div className="tiptap-toolbar__group" role="group" aria-label="Rich blocks">
          <ToolbarButton toolKey="blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="codeBlock" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="inlineCode" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="hardBreak" onClick={() => editor.chain().focus().setHardBreak().run()}>
            <CornerDownLeft className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <Divider />
        <div className="tiptap-toolbar__group" role="group" aria-label="Insert">
          <ToolbarButton toolKey="link" active={editor.isActive('link')} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="image" onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="table" onClick={insertTable}>
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="hr" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          {/* One slot per story: a second marker would be ignored by
              splitBodyForAd, which takes the first, so the button turns off
              rather than letting the desk place one that does nothing. */}
          <ToolbarButton
            toolKey="adSlot"
            active={editor.isActive('adSlot')}
            disabled={hasAdSlot}
            onClick={() => editor.chain().focus().insertContent({ type: 'adSlot' }).run()}
          >
            <Megaphone className="h-4 w-4" />
          </ToolbarButton>
        </div>
        {/* Image controls, only with an image selected. Same reasoning as the
            table group below: these are no-ops otherwise, and a row of dead
            buttons is how a toolbar stops being read. */}
        {editor.isActive('image') && (
          <>
            <Divider />
            <div className="tiptap-toolbar__group" role="group" aria-label="Image">
              {(
                [
                  ['imgFull', 'full', Maximize2],
                  ['imgLeft', 'left', AlignLeft],
                  ['imgCenter', 'center', AlignCenter],
                  ['imgRight', 'right', AlignRight],
                ] as const
              ).map(([key, align, Icon]) => (
                <ToolbarButton
                  key={key}
                  toolKey={key}
                  active={editor.getAttributes('image').align === align}
                  onClick={() => editor.chain().focus().updateAttributes('image', { align }).run()}
                >
                  <Icon className="h-4 w-4" />
                </ToolbarButton>
              ))}
              <ToolbarButton toolKey="imgAlt" onClick={editImageAlt}>
                <Type className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="imgCaption"
                active={Boolean(editor.getAttributes('image').caption || editor.getAttributes('image').credit)}
                onClick={editImageCaption}
              >
                <Captions className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </>
        )}

        {/* Table controls, only while the cursor is in a table.
            Contextual rather than always-on: every one of these is a no-op
            outside a table, and a row of permanently dead buttons is how a
            toolbar stops being read. `editor.can()` still guards each one, so
            a control that cannot apply here is disabled rather than silently
            doing nothing (for example splitting a cell that was never merged). */}
        {editor.isActive('table') && (
          <>
            <Divider />
            <div className="tiptap-toolbar__group" role="group" aria-label="Table">
              <ToolbarButton
                toolKey="addRowAfter"
                disabled={!editor.can().addRowAfter()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Rows3 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="deleteRow"
                disabled={!editor.can().deleteRow()}
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <TableRowsSplit className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="addColumnAfter"
                disabled={!editor.can().addColumnAfter()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <Columns3 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="deleteColumn"
                disabled={!editor.can().deleteColumn()}
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <Columns3 className="h-4 w-4 rotate-180 opacity-70" />
              </ToolbarButton>
              {/* No `active` state: `isActive('tableHeader')` describes the
                  cell the cursor is in, not whether the table has a header
                  row, so it would read as "off" from any body cell of a table
                  that does have one. A lit indicator that is wrong half the
                  time is worse than none. */}
              <ToolbarButton
                toolKey="toggleHeaderRow"
                disabled={!editor.can().toggleHeaderRow()}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              >
                <PanelTop className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="mergeOrSplit"
                disabled={!editor.can().mergeOrSplit()}
                onClick={() => editor.chain().focus().mergeOrSplit().run()}
              >
                <TableIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                toolKey="deleteTable"
                disabled={!editor.can().deleteTable()}
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <Trash2 className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </>
        )}
        <Divider />
        <div className="tiptap-toolbar__group tiptap-toolbar__group--end" role="group" aria-label="History">
          <ToolbarButton toolKey="find" active={findOpen} onClick={() => setFindOpen((v) => !v)}>
            <Search className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="clear" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton toolKey="redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {findOpen && <EditorFindReplace editor={editor} onClose={() => setFindOpen(false)} />}

      <EditorContent editor={editor} className="tiptap-editor__body" />
    </div>
  );
}