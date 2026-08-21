import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractJsonPayload } from '@/lib/data/ingest-stdout';

/**
 * One way to run the Python side of the ingest and read its answer.
 *
 * Three routes each carried their own `resolvePython()` and their own attempt at
 * finding the JSON object in the script's stdout. Both were subtly wrong in
 * ways that only showed up on this machine:
 *
 *  - `resolvePython()` returned the literal string `python3` without ever
 *    checking it runs. On Windows that name resolves to the Microsoft Store
 *    stub, which prints an advert to stderr and exits 9009, so every route
 *    reported "No Python interpreter found" only *after* a 4-minute timeout, or
 *    failed with a bare exit code. ESB_PYTHON was the documented workaround for
 *    a bug that should not have needed one.
 *
 *  - The JSON extraction used `indexOf('{')` in one route and `lastIndexOf('{')`
 *    in another. The latter cannot work: the payload ends with nested objects
 *    (`"artifacts":{…},"note":null`), so the last `{` is an inner one and
 *    `JSON.parse` always threw. `/admin/data`'s "Run full ingest" therefore
 *    reported failure on every run, including runs where the chain completed.
 *
 * A candidate is only accepted once it has actually executed, so what comes back
 * runs the parsers rather than merely existing on disk.
 */

const execFileAsync = promisify(execFile);

/** Resolved once per server process; interpreters do not appear mid-session. */
let cachedPython: string | null | undefined;

function windowsInstallCandidates(): string[] {
  const out: string[] = [];
  const roots = [
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python'),
    'C:\\',
    path.join(process.env.ProgramFiles ?? '', ''),
  ].filter(Boolean);

  for (const root of roots) {
    let names: string[];
    try {
      names = readdirSync(root);
    } catch {
      continue;
    }
    // Newest first: Python313 should win over Python39.
    for (const name of names.filter((n) => /^Python\d+$/i.test(n)).sort().reverse()) {
      out.push(path.join(root, name, 'python.exe'));
    }
  }
  return out;
}

function candidatePaths(): string[] {
  return [
    process.env.ESB_PYTHON,
    ...windowsInstallCandidates(),
    // Kept from the original list — a venv-style layout some machines use.
    path.join(process.env.LOCALAPPDATA ?? '', 'Python', 'bin', 'python.exe'),
    'python3',
    'python',
    'py',
  ].filter((c): c is string => Boolean(c));
}

/** Does this candidate actually start and report a version? */
async function works(cmd: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(cmd, ['-c', 'import sys; print(sys.version_info[0])'], {
      timeout: 15_000,
      windowsHide: true,
    });
    // The Store stub exits non-zero, but guard the shape too: anything that is
    // not a Python 3 saying "3" is not what the parsers need.
    return stdout.trim().startsWith('3');
  } catch {
    return false;
  }
}

/**
 * The interpreter that runs the parsers, or null if none of the candidates does.
 * Absolute paths are checked for existence first to avoid spawning for nothing.
 */
export async function resolvePython(): Promise<string | null> {
  if (cachedPython !== undefined) return cachedPython;

  for (const cmd of candidatePaths()) {
    const bare = !cmd.includes(path.sep) && !cmd.includes('/');
    if (!bare && !existsSync(cmd)) continue;
    if (await works(cmd)) {
      cachedPython = cmd;
      return cmd;
    }
  }

  cachedPython = null;
  return null;
}

/** Only for tests and for a deliberate re-probe after the operator installs one. */
export function resetPythonCache(): void {
  cachedPython = undefined;
}

export { extractJsonPayload };

export const NO_PYTHON_ERROR =
  'No working Python interpreter found. Install Python 3 and, if it is not on PATH, ' +
  'set ESB_PYTHON to its full path (e.g. C:\\Python314\\python.exe) and restart the dev server.';

export type PythonRun<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

/**
 * Run one of the ingest scripts and return the JSON object it printed.
 *
 * A non-zero exit is not automatically a failure here: `run_daily_ingest.py`
 * exits non-zero when a step failed but still prints its full report, and that
 * report is what the panel needs to show. Only stdout with no payload in it is
 * treated as a hard error.
 */
export async function runPythonJson<T>(
  args: string[],
  opts: { timeout: number; label: string },
): Promise<PythonRun<T>> {
  const python = await resolvePython();
  if (!python) return { ok: false, error: NO_PYTHON_ERROR, status: 503 };

  const spawnOpts = {
    cwd: process.cwd(),
    // cp1252 consoles die on the arrows these scripts print.
    env: { ...process.env, PYTHONUTF8: '1' },
    maxBuffer: 64 * 1024 * 1024,
    timeout: opts.timeout,
    windowsHide: true,
  };

  try {
    const { stdout } = await execFileAsync(python, args, spawnOpts);
    const data = extractJsonPayload<T>(stdout);
    if (data === null) {
      return {
        ok: false,
        error: `${opts.label} produced no JSON. Output: ${stdout.slice(0, 500) || '(empty)'}`,
        status: 500,
      };
    }
    return { ok: true, data };
  } catch (error) {
    const stdout = (error as { stdout?: string })?.stdout ?? '';
    const data = extractJsonPayload<T>(stdout);
    if (data !== null) return { ok: true, data };

    const stderr = ((error as { stderr?: string })?.stderr ?? '').trim();
    const message = error instanceof Error ? error.message : String(error);
    const killed = (error as { killed?: boolean })?.killed;
    return {
      ok: false,
      error: killed
        ? `${opts.label} timed out after ${Math.round(opts.timeout / 1000)}s.`
        : `${opts.label} failed: ${stderr || message}`,
      status: 500,
    };
  }
}
