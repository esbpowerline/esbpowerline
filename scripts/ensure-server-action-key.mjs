#!/usr/bin/env node
/**
 * Ensures NEXT_SERVER_ACTIONS_ENCRYPTION_KEY exists in .env.local so all
 * split-surface dev servers (:3000 / :3001 / :3002) share the same action IDs.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const KEY = 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY';
const envPath = path.join(process.cwd(), '.env.local');

if (process.env[KEY]?.trim()) {
  process.exit(0);
}

let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
if (new RegExp(`^${KEY}=`, 'm').test(content)) {
  process.exit(0);
}

const encryptionKey = randomBytes(32).toString('base64');
const block = [
  '',
  '# Shared across dev:public / dev:cms / dev:admin — prevents UnrecognizedActionError',
  `${KEY}="${encryptionKey}"`,
  '',
].join('\n');

writeFileSync(envPath, content.trimEnd() + block, 'utf8');
console.log(`[dev-env] Wrote ${KEY} to .env.local — restart dev servers after this.`);