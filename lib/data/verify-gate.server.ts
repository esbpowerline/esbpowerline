import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export type VerifyFinding = {
  check: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  day: string;
  message: string;
};

export type VerifyReport = {
  days: number;
  from: string | null;
  to: string | null;
  counts: { ERROR: number; WARN: number; INFO: number };
  findings: VerifyFinding[];
};

export type VerifyGateResult =
  | { ok: true; report: VerifyReport }
  | { ok: false; report: VerifyReport; blocking: VerifyFinding[] }
  | { ok: false; report: null; error: string };

/**
 * Run `verify:data` over a single day and decide whether it may be published.
 *
 * The schema is the only thing that stood between a parse and the live site.
 * `DataDraft.validation` is documented as "reconciliation results, warnings,
 * and anything the reviewer **must see** before approving", and the publish
 * route guarded `data.publish` correctly and then never read it — so there was
 * no server-side condition under which a publish could be refused for failing
 * its own reconciliation. The architecture describes parse → review → publish;
 * what it enforced was parse → publish, with review as a convention.
 *
 * The severity split does the deciding, and it is the project's own:
 *
 *   ERROR — the archive asserts something no source said. **Blocks.**
 *   WARN  — the source disagrees with itself. Never blocks: that disagreement
 *           is a true fact about the document, and refusing to publish it
 *           would be the silent repair the whole doctrine forbids.
 *   INFO  — a known-incomplete day, e.g. grid filed before its gas. Normal.
 *
 * Runs against the files already written to disk, so it checks exactly the
 * bytes about to be released rather than a copy of them.
 */
export async function verifyDayBeforePublish(date: string): Promise<VerifyGateResult> {
  const script = path.join(process.cwd(), 'scripts', 'verify-data.mjs');

  let stdout: string;
  try {
    const result = await execFileAsync(
      process.execPath,
      [script, '--from', date, '--to', date, '--json'],
      { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024, timeout: 120_000 },
    );
    stdout = result.stdout;
  } catch (err: unknown) {
    // A non-zero exit is how the script reports ERRORs, and it still writes the
    // JSON — so only treat this as a failure if nothing parseable came back.
    const e = err as { stdout?: string; message?: string };
    if (!e?.stdout) {
      return { ok: false, report: null, error: `verify:data could not run — ${e?.message ?? String(err)}` };
    }
    stdout = e.stdout;
  }

  let report: VerifyReport;
  try {
    report = JSON.parse(stdout.trim()) as VerifyReport;
  } catch {
    return { ok: false, report: null, error: 'verify:data produced no readable report' };
  }

  const blocking = report.findings.filter((f) => f.severity === 'ERROR');
  if (blocking.length) return { ok: false, report, blocking };
  return { ok: true, report };
}

/** One line per blocking finding, for the operator who has to fix them. */
export function describeBlockingFindings(findings: VerifyFinding[]): string {
  return findings.map((f) => `${f.day} ${f.check}: ${f.message}`).join('; ');
}
