import 'server-only';

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Font } from '@react-pdf/renderer';

/**
 * Report typography — Adobe Source Sans 3 (OFL), the professional report/UI
 * grotesque, registered from public/fonts as base64 data URIs (works on
 * serverless regardless of cwd/file-url quirks). Falls back to Helvetica if the
 * font files are missing so a broken deploy never kills exports.
 */
function fontDataUri(file: string): string | null {
  try {
    const p = join(process.cwd(), 'public', 'fonts', file);
    if (!existsSync(p)) return null;
    return `data:font/ttf;base64,${readFileSync(p).toString('base64')}`;
  } catch {
    return null;
  }
}

const regular = fontDataUri('SourceSans3-Regular.ttf');
const semibold = fontDataUri('SourceSans3-Semibold.ttf');
const bold = fontDataUri('SourceSans3-Bold.ttf');

const available = Boolean(regular && semibold && bold);

if (available) {
  Font.register({ family: 'SS3', src: regular! });
  Font.register({ family: 'SS3SB', src: semibold! });
  Font.register({ family: 'SS3B', src: bold! });
}

/** Body text family. */
export const F = available ? 'SS3' : 'Helvetica';
/** Semibold — caps labels, table heads, chips. */
export const FM = available ? 'SS3SB' : 'Helvetica-Bold';
/** Bold — titles, values, emphasis. */
export const FB = available ? 'SS3B' : 'Helvetica-Bold';
