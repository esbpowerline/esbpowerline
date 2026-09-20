import sanitizeHtml from 'sanitize-html';

const ARTICLE_ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  'img',
  'h1',
  'h2',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'span',
  'div',
  'sub',
  'sup',
];

const ARTICLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ARTICLE_ALLOWED_TAGS,
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'name', 'target', 'rel'],
    td: ['colspan', 'rowspan', 'align'],
    th: ['colspan', 'rowspan', 'align'],
    table: ['class'],
    span: ['class', 'style'],
    div: ['class', 'style'],
    p: ['class', 'style'],
    // `style` as well as `class`, or alignment on a heading is thrown away.
    // TextAlign is configured for `['heading', 'paragraph']`
    // (`TipTapEditor.tsx`) and writes `style="text-align: …"`; paragraphs
    // allowed style and headings did not, so centring a heading worked in the
    // editor, vanished from the preview and never reached the page — a tool
    // that silently did nothing (2026-09-20). StarterKit enables h1–h6, so all
    // six are listed rather than the three the toolbar exposes; pasted copy
    // carries the rest. `allowedStyles` below is what actually bounds this: it
    // permits five presentation properties and nothing else, so this widens
    // which elements may be aligned, not what may be done to them.
    h1: ['class', 'style'],
    h2: ['class', 'style'],
    h3: ['class', 'style'],
    h4: ['class', 'style'],
    h5: ['class', 'style'],
    h6: ['class', 'style'],
  },
  allowedStyles: {
    // Only allow safe, presentation-only CSS properties — no url(), expressions, or JS
    '*': {
      'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/],
      'font-family': [/^[a-zA-Z0-9 ,'"_-]+$/],
      color: [/^(#[0-9a-fA-F]{3,8}|rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)|[a-zA-Z]+)$/],
      'background-color': [/^(#[0-9a-fA-F]{3,8}|rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)|[a-zA-Z]+)$/],
      'text-align': [/^(left|right|center|justify)$/],
    },
  },
  // Block data: and javascript: URIs in all attributes
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'], // no data: URIs in images
  },
  transformTags: {
    // Force external links to open safely
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
  disallowedTagsMode: 'discard',
};

/** Strip scripts, event handlers, and other XSS vectors from rich article HTML. */
export function sanitizeArticleHtml(html: string): string {
  if (!html?.trim()) return '<p></p>';
  return sanitizeHtml(html, ARTICLE_SANITIZE_OPTIONS);
}