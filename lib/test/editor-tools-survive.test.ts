import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml } from '@/lib/sanitize-article-html';

/**
 * Every toolbar tool, checked end to end against the sanitiser.
 *
 * The editor is one half of a contract and `sanitizeArticleHtml` is the other:
 * the body is sanitised before it reaches the article page AND before it
 * reaches the CMS preview, so anything the sanitiser drops is a tool that
 * appears to work while the writer is typing and silently does nothing
 * afterwards. Nothing checked that the two agreed (2026-09-20).
 *
 * Each case is the markup TipTap actually emits for that tool — taken from the
 * mark and extension definitions in `components/editor/TipTapEditor.tsx` — and
 * asserts the formatting survives, not merely the text.
 */

/** What the tool has to leave behind for the reader to see any effect. */
interface ToolCase {
  tool: string;
  html: string;
  /** Substrings that must all still be present after sanitising. */
  survives: string[];
}

const CASES: ToolCase[] = [
  { tool: 'bold', html: '<p><strong>bold</strong></p>', survives: ['<strong>'] },
  { tool: 'italic', html: '<p><em>italic</em></p>', survives: ['<em>'] },
  { tool: 'underline', html: '<p><u>under</u></p>', survives: ['<u>'] },
  { tool: 'strike', html: '<p><s>struck</s></p>', survives: ['<s>'] },
  { tool: 'subscript', html: '<p>H<sub>2</sub>O</p>', survives: ['<sub>'] },
  { tool: 'superscript', html: '<p>m<sup>3</sup></p>', survives: ['<sup>'] },
  { tool: 'inline code', html: '<p><code>MMCFD</code></p>', survives: ['<code>'] },
  { tool: 'code block', html: '<pre><code>line</code></pre>', survives: ['<pre>', '<code>'] },
  { tool: 'blockquote', html: '<blockquote><p>quoted</p></blockquote>', survives: ['<blockquote>'] },
  { tool: 'heading 1', html: '<h1>Head</h1>', survives: ['<h1>'] },
  { tool: 'heading 2', html: '<h2>Head</h2>', survives: ['<h2>'] },
  { tool: 'heading 3', html: '<h3>Head</h3>', survives: ['<h3>'] },
  { tool: 'bullet list', html: '<ul><li><p>one</p></li></ul>', survives: ['<ul>', '<li>'] },
  { tool: 'ordered list', html: '<ol><li><p>one</p></li></ol>', survives: ['<ol>', '<li>'] },
  { tool: 'divider', html: '<p>a</p><hr><p>b</p>', survives: ['<hr'] },
  { tool: 'line break', html: '<p>a<br>b</p>', survives: ['<br'] },
  { tool: 'link', html: '<p><a href="https://example.com">src</a></p>', survives: ['href="https://example.com"'] },
  { tool: 'image', html: '<img src="https://x.test/a.png" alt="a">', survives: ['<img', 'src="https://x.test/a.png"'] },
  { tool: 'table', html: '<table><tbody><tr><td><p>c</p></td></tr></tbody></table>', survives: ['<table>', '<td>'] },

  // The six custom marks, as their renderHTML writes them.
  { tool: 'font size', html: '<p><span style="font-size: 18px">big</span></p>', survives: ['font-size'] },
  { tool: 'font family', html: '<p><span style="font-family: Georgia">serif</span></p>', survives: ['font-family'] },
  { tool: 'text colour', html: '<p><span style="color: #dc2626">red</span></p>', survives: ['color'] },
  { tool: 'highlight', html: '<p><span style="background-color: #fef08a">hl</span></p>', survives: ['background-color'] },

  // Image alignment, stored as a class the stylesheet owns.
  { tool: 'image full width', html: '<img src="https://x.test/a.png" alt="a" class="article-img--full">', survives: ['article-img--full'] },
  { tool: 'image left', html: '<img src="https://x.test/a.png" alt="a" class="article-img--left">', survives: ['article-img--left'] },
  { tool: 'image centre', html: '<img src="https://x.test/a.png" alt="a" class="article-img--center">', survives: ['article-img--center'] },
  { tool: 'image right', html: '<img src="https://x.test/a.png" alt="a" class="article-img--right">', survives: ['article-img--right'] },
  { tool: 'image alt text', html: '<img src="https://x.test/a.png" alt="A gas plant at dusk">', survives: ['alt="A gas plant at dusk"'] },
  {
    tool: 'image caption and credit',
    html: '<figure class="article-figure"><img src="https://x.test/a.png" alt="a"><figcaption class="article-figure__caption">Gas field at dusk<span class="article-figure__credit">Photo: BGFCL</span></figcaption></figure>',
    survives: ['<figure class="article-figure">', 'article-figure__caption', 'Gas field at dusk', 'article-figure__credit', 'Photo: BGFCL'],
  },

  // Alignment, which TextAlign applies to paragraphs AND headings.
  { tool: 'align paragraph', html: '<p style="text-align: center">mid</p>', survives: ['text-align'] },
  { tool: 'align heading 1', html: '<h1 style="text-align: center">mid</h1>', survives: ['text-align'] },
  { tool: 'align heading 2', html: '<h2 style="text-align: center">mid</h2>', survives: ['text-align'] },
  { tool: 'align heading 3', html: '<h3 style="text-align: right">mid</h3>', survives: ['text-align'] },
];

describe('every editor tool survives sanitising', () => {
  for (const c of CASES) {
    it(c.tool, () => {
      const out = sanitizeArticleHtml(c.html);
      for (const needle of c.survives) {
        expect(out, `${c.tool}: "${needle}" was stripped from ${out}`).toContain(needle);
      }
    });
  }
});

describe('the sanitiser still refuses what it should', () => {
  it('drops script', () => {
    expect(sanitizeArticleHtml('<p>a</p><script>alert(1)</script>')).not.toContain('script');
  });

  it('drops event handlers', () => {
    expect(sanitizeArticleHtml('<p onclick="alert(1)">a</p>')).not.toContain('onclick');
  });

  it('drops javascript: links', () => {
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('drops a data: image', () => {
    expect(sanitizeArticleHtml('<img src="data:image/png;base64,AAA">')).not.toContain('data:');
  });

  it('still drops a style attribute on an image', () => {
    // Only a class is allowed there; free-form CSS on an image is not.
    const out = sanitizeArticleHtml('<img src="https://x.test/a.png" style="position:fixed">');
    expect(out).not.toContain('style');
  });

  it('drops position and url() styles', () => {
    const out = sanitizeArticleHtml('<p style="position: fixed; background-image: url(x)">a</p>');
    expect(out).not.toContain('position');
    expect(out).not.toContain('url(');
  });
});
