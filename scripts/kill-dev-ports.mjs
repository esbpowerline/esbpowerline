#!/usr/bin/env node
import { execSync } from 'node:child_process';

const ports = [3000, 3001, 3002, 3010];

for (const port of ports) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[kill-dev-ports] Stopped PID ${pid} on :${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* no listener */
  }
}