/**
 * Reading the JSON object an ingest script printed.
 *
 * Pure string handling, kept out of the server-only runner so it can be tested
 * directly — this is where the bug lived that made `/admin/data`'s "Run full
 * ingest" report failure on every run, including runs where the chain finished.
 *
 * Two routes each had their own attempt at this. One took `indexOf('{')`, the
 * other `lastIndexOf('{')`. The second cannot work: the payload ends with
 * nested objects (`"artifacts":{…},"note":null`), so the last brace is an inner
 * one and `JSON.parse` threw on the trailing text every time.
 */

/**
 * The JSON object a bridge script printed, taken from stdout that may also
 * carry parser chatter, or null if there is none.
 *
 * Scanned from the end so the payload wins over anything logged before it, and
 * whole lines are tried rather than brace positions — the payload is one line,
 * and the braces inside it are not candidates.
 */
export function extractJsonPayload<T = unknown>(stdout: string): T | null {
  const lines = stdout.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('{') || !line.endsWith('}')) continue;
    try {
      return JSON.parse(line) as T;
    } catch {
      // Not the payload — a log line that happens to look like one.
    }
  }

  // Fallback for a payload printed across several lines (json.dumps(indent=2)):
  // take everything from the first brace and let JSON.parse decide.
  const first = stdout.indexOf('{');
  if (first !== -1) {
    try {
      return JSON.parse(stdout.slice(first)) as T;
    } catch {
      /* nothing usable */
    }
  }
  return null;
}
