#!/usr/bin/env node
/**
 * Headless-browser REPL driver for ESB PowerLine — no dependencies.
 *
 * Drives the system Edge/Chrome over the Chrome DevTools Protocol using
 * Node's built-in WebSocket (Node >= 22). Playwright and chromium-cli are not
 * installed on the operator's Windows machine and installing a 150 MB browser
 * bundle for a smoke run is the wrong trade; Edge ships with Windows 11.
 *
 * Usage (agent path):
 *   node .claude/skills/run-esbpowerline/driver.mjs <<'EOF'
 *   nav http://localhost:3000/
 *   wait-for .masthead__wordmark
 *   ss home
 *   quit
 *   EOF
 *
 * Commands (one per line on stdin):
 *   nav <url>               navigate and wait for the load event
 *   wait-for <css> [ms]     poll until the selector exists (default 30000 ms)
 *   wait-text <text> [ms]   poll until document.body contains the text
 *   click <css>             DOM .click() on the first match
 *   click-text <text>       click the first link/button whose text includes <text>
 *   fill <css> <value>      set value the React way (native setter + input event)
 *   text <css>              print textContent of the first match (trimmed)
 *   count <css>             print how many elements match
 *   eval <js>               evaluate an expression in the page, print JSON
 *   ss [name]               screenshot -> scratch/shots/<name>.png (default: shot-N)
 *   errors                  print console errors and uncaught exceptions so far
 *   title / url             print document.title / location.href
 *   quit                    close the browser and exit
 *
 * Environment:
 *   BROWSER   path to msedge.exe/chrome.exe (auto-detected on Windows)
 *   SHOTS     screenshot directory (default scratch/shots)
 *   VIEWPORT  WxH (default 1280x900); use 393x852 for the phone check
 *   DEBUG=1   trace every CDP frame on stderr
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';

const CANDIDATES = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);

const SHOTS = path.resolve(process.env.SHOTS ?? 'scratch/shots');
const [VW, VH] = (process.env.VIEWPORT ?? '1280x900').split('x').map(Number);
const PORT = 9222 + Math.floor(Math.random() * 500);
const DEBUG = !!process.env.DEBUG;

let browser = null;
let ws = null;
let sessionId = null;
let nextId = 1;
const pending = new Map();
const consoleErrors = [];
let shotN = 0;

const log = (...a) => console.log(...a);
const die = (why, code = 2) => { console.error('FATAL:', why); try { browser?.kill(); } catch {} console.error('exiting', code); process.exit(code); };

function send(method, params = {}, withSession = true) {
  const id = nextId++;
  const frame = { id, method, params };
  if (withSession && sessionId) frame.sessionId = sessionId;
  if (DEBUG) console.error('->', id, method);
  ws.send(JSON.stringify(frame));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function onFrame(ev) {
  const msg = JSON.parse(ev.data);
  if (DEBUG) console.error('<-', msg.id ?? msg.method, msg.error ? JSON.stringify(msg.error) : '');
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    return;
  }
  switch (msg.method) {
    // Attaching to Edge's INITIAL about:blank page kills that page (every
    // variant of flags tried on 2026-09-01 ended in Inspector.targetCrashed
    // before the first command). Hence the browser-level attach below plus a
    // fresh target; a crash after that is real and worth stopping on.
    case 'Inspector.targetCrashed': die('the page target crashed (Inspector.targetCrashed)');
    case 'Runtime.exceptionThrown':
      consoleErrors.push('exception: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text)); break;
    case 'Runtime.consoleAPICalled':
      if (msg.params.type === 'error') consoleErrors.push('console.error: ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      break;
  }
}

async function launch() {
  const bin = CANDIDATES.find((p) => existsSync(p));
  if (!bin) die('no browser found; set BROWSER=<path to msedge.exe or chrome.exe>');
  const userData = path.join(process.env.TEMP ?? '/tmp', `esb-driver-${process.pid}`);
  browser = spawn(bin, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    // Edge loads enterprise/system extensions and opens edge://sync-confirmation-dialog
    // even in a throwaway profile; both are noise at best and crash suspects at
    // worst, and Crashpad writes minidumps under the profile that block cleanup.
    '--disable-extensions', '--disable-sync', '--disable-background-networking', '--disable-component-update',
    '--disable-default-apps', '--disable-breakpad', '--disable-features=Translate,MediaRouter,msEdgeSync,msSmartScreenProtection',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${userData}`, `--window-size=${VW},${VH}`,
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 100 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); }
    catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  if (!version) die('browser did not expose the DevTools endpoint');

  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = onFrame;

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, false);
  ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }, false));

  await send('Page.enable');
  await send('Runtime.enable');
  // middleware.ts blocks bot user agents, and headless Chromium announces
  // itself as "HeadlessChrome" — every page came back "Access Denied: Request
  // blocked by security policy" until the UA was overridden.
  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: VW < 600 });
  log(`launched ${path.basename(bin)} headless, viewport ${VW}x${VH}, CDP :${PORT}`);
}

async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}

async function waitFor(pred, ms, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await evalJs(pred)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timeout after ${ms}ms waiting for ${what}`);
}

const q = (s) => JSON.stringify(s);

const commands = {
  async nav(url) {
    const loaded = new Promise((res) => {
      const h = (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', h); res(); } };
      ws.addEventListener('message', h);
    });
    await send('Page.navigate', { url });
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 60000))]);
    log('nav', url, '->', await evalJs('document.readyState'));
  },
  async 'wait-for'(sel, ms = '30000') { await waitFor(`!!document.querySelector(${q(sel)})`, +ms, sel); log('ok', sel); },
  async 'wait-text'(...rest) {
    const ms = /^\d+$/.test(rest[rest.length - 1]) ? +rest.pop() : 30000;
    const text = rest.join(' ');
    await waitFor(`document.body.innerText.includes(${q(text)})`, ms, JSON.stringify(text)); log('ok text', text);
  },
  async click(sel) { log('click', sel, '->', await evalJs(`(()=>{const e=document.querySelector(${q(sel)});if(!e)return 'NOT FOUND';e.click();return 'OK '+e.tagName;})()`)); },
  async 'click-text'(...rest) {
    const text = rest.join(' ');
    log('click-text', text, '->', await evalJs(`(()=>{const t=${q(text)};const el=[...document.querySelectorAll('a,button,[role=button],[role=tab],summary,label')].find(e=>e.textContent.trim().includes(t));if(!el)return 'NOT FOUND';el.click();return 'OK '+el.tagName;})()`));
  },
  async fill(sel, ...rest) {
    const value = rest.join(' ');
    log('fill', sel, '->', await evalJs(`(()=>{const e=document.querySelector(${q(sel)});if(!e)return 'NOT FOUND';const p=Object.getPrototypeOf(e);const d=Object.getOwnPropertyDescriptor(p,'value');d.set.call(e,${q(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 'OK';})()`));
  },
  async text(sel) { log(await evalJs(`(document.querySelector(${q(sel)})?.textContent ?? 'NOT FOUND').trim().replace(/\\s+/g,' ')`)); },
  async count(sel) { log(await evalJs(`document.querySelectorAll(${q(sel)}).length`)); },
  async eval(...expr) { log(JSON.stringify(await evalJs(expr.join(' ')))); },
  async ss(name) {
    mkdirSync(SHOTS, { recursive: true });
    const file = path.join(SHOTS, `${name ?? `shot-${++shotN}`}.png`);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    log('screenshot ->', file);
  },
  async errors() { log(consoleErrors.length ? consoleErrors.join('\n') : 'no console errors'); },
  async title() { log(await evalJs('document.title')); },
  async url() { log(await evalJs('location.href')); },
  async help() { log(Object.keys(commands).join(', ')); },
  async quit() { await shutdown(); process.exit(0); },
};

async function shutdown() {
  try { await Promise.race([send('Browser.close', {}, false), new Promise((r) => setTimeout(r, 1500))]); } catch {}
  try { ws?.close(); } catch {}
  try { browser?.kill(); } catch {}
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
await launch();
for await (const raw of rl) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [cmd, ...args] = line.split(/\s+/);
  const fn = commands[cmd];
  if (!fn) { log('unknown command:', cmd, '(try help)'); continue; }
  try { await fn(...args); } catch (e) { log('ERROR', cmd, '-', e.message); }
}
await shutdown();
process.exit(0);
