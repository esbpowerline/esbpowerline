# Remote access — running everything from any computer

How to get full control of the **Pi**, **Vercel** and **Supabase** from a machine
that has never touched this project, without a single secret living in this repo.

> **Nothing in this file is a secret.** Hostnames, tailnet IPs and project names are
> identifiers, not credentials — they are useless to anyone who is not already
> signed in as you. That is deliberate: this file is committed to git, so it must
> stay safe to publish. See [What is deliberately not here](#what-is-deliberately-not-here).

## The principle

A gitignored secrets file keeps things out of GitHub, but it **does not travel** —
so it cannot be the answer to "from any computer". Every credential below is
instead either **obtained by signing in** (browser SSO) or **pulled down from
Vercel**, which already holds them. Nothing is copied by hand between machines.

---

## 1. The Pi — over Tailscale

The Pi (`esb-pi`) sits behind home NAT with **no port forwarded** and nothing
exposed to the public internet. It is reached over a private WireGuard mesh.

```bash
# Windows
winget install Tailscale.Tailscale
# macOS
brew install --cask tailscale
# Debian/Ubuntu
curl -fsSL https://tailscale.com/install.sh | sudo sh
```

Then sign in with the **Google account that owns the tailnet** (the same one used
for Vercel and Supabase). No key file, no password, nothing to carry.

Once connected:

| What | Address |
|---|---|
| SSH | `ssh pi@esb-pi.tailfb4ffe.ts.net` (user `pi`) |
| qBittorrent WebUI | <http://esb-pi:8800> |
| Jellyfin | <http://esb-pi:8096> |
| VNC desktop | `esb-pi:5900` |
| Tailnet IP (if MagicDNS misbehaves) | `100.126.244.2` |

Auth is **Tailscale SSH** — your tailnet identity *is* the credential, so a new
machine needs no SSH key generated, copied or authorised. Optional shorthand, in
`~/.ssh/config` (this file holds no secret and can be copied anywhere):

```
Host esb-pi
    HostName esb-pi.tailfb4ffe.ts.net
    User pi
    ServerAliveInterval 30
    ServerAliveCountMax 4
```

To edit files on the Pi: VS Code → **Remote-SSH: Connect to Host** → `esb-pi`.

`esb-pi` has **key expiry disabled**, so it stays on the tailnet indefinitely
without anyone re-authenticating it. Client machines still expire on the normal
schedule, which is fine — you are sitting at those.

## 2. Vercel

```bash
npm i -g vercel
vercel login          # browser / email, no stored token needed
vercel link           # pick the esbpowerline project
```

Deploys are driven by git, not by the CLI: pushing `main` triggers a production
build automatically. `vercel.json` sets `git.deploymentEnabled.authenticating =
false`, so **pushing the working branch deploys nothing** — that is intentional.

## 3. Supabase — and the whole `.env`

This is the step that removes the need to carry secrets at all:

```bash
vercel env pull .env.local
```

**It does not reconstruct a working `.env.local` on its own.** That was the claim here,
and a fresh clone on 2026-09-11 proved it false: `vercel env pull` downloads the
**`development`** environment, and that environment holds only the cPanel FTP keys,
`NEXT_PUBLIC_CDN_URL`, the four `POSTGRES_*` values and `VERCEL_OIDC_TOKEN`. There is no
`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `CRON_SECRET` or Supabase URL/key in it,
so the result starts, serves static pages, and 500s every dynamic route (see the last
paragraph of this section). The rest are scoped to Production and Preview only.

Until someone adds those keys to Development in the Vercel dashboard, the missing
names have to come from an existing checkout on the **same machine**, merged in by
name. Check them against what Vercel did send rather than trusting their age:
`DATABASE_URL` should carry the same user, password and host as `POSTGRES_URL`, and
`DIRECT_URL` the same as `POSTGRES_URL_NON_POOLING`. `vercel env pull
--environment=production` is not the shortcut it looks like; it also writes
`VERCEL_ENV=production` and the `VERCEL_GIT_*` set into a dev environment.

**Do not copy `.env` between machines by hand**, and never paste it into a chat, an
issue or a commit.

For the Supabase dashboard, SQL editor and logs, sign in at
<https://supabase.com/dashboard> with the same Google account.

## 4. The repo

```bash
git clone --filter=blob:none https://github.com/esbpowerline/esbpowerline.git
cd esbpowerline
npm install
vercel env pull .env.local
npm run dev            # or npm run dev:all for the three surfaces
```

`--filter=blob:none` is not optional advice on a slow connection: `public/data` is about
11,600 files and 413 MB, and a full clone fetches every historical revision of all of it.

Work happens on the **`authenticating`** branch, not `main`. See `CLAUDE.md`.

**`vercel env pull` is for people who deploy this site, not for everyone who builds it.**
The `DATABASE_URL` it writes points at the PRODUCTION Supabase instance, so a local CMS
signed in against it edits, publishes and revokes on the live site. A contributor who only
needs the UI should fill `.env.example` against their own Supabase project instead. Note
that a *missing* key does not degrade: the env guard turns any unset name into a 500 on
every dynamic route while the build and the static pages stay green, so a half-filled
`.env.local` looks like a catastrophic breakage rather than a configuration gap.

The repo moved from `chiefhamim/esbpowerline` to the `esbpowerline` org on 2026-09-09.
HTTPS git operations against the old path still redirect; deploy keys do not. If a machine
authenticates with one — the Pi does — point its remote at the new path explicitly.

---

## What is deliberately not here

**One credential cannot be fetched by signing in: the Pi's `pi` user password**,
needed for `sudo` on the Pi. It belongs in a password manager — that is the only
store that is both off GitHub *and* available from any computer. Do not put it in
this repo, in a gitignored file (which will not travel), or in any chat transcript.

If you would rather not need it at all, the alternative is a `NOPASSWD` sudoers
rule for specific commands on the Pi. That trades a secret for a standing
privilege; it has not been done, because it is a real security decision.

## Rules that keep this safe

- `.env`, `.env.*` and `.vercel/` are gitignored. Verify before committing:
  `git ls-files | grep -iE '(^|/)\.env|secret|credential'` should return only
  `.env.example` and the dev-only `lib/seed-credentials.ts`.
- **Never commit `.env*`.** `AUTH_SECRET` in git makes session-handoff tokens
  forgeable. This has happened once already — the keys were rotated, and the old
  Postgres role still wants confirming as revoked.
- Rotate any credential that has been pasted into a chat, a terminal transcript or
  a screenshot. Treat exposure as certain, not likely.
- The tailnet is the security boundary for the Pi's services. qBittorrent, Jellyfin
  and VNC have **no public exposure**; keep it that way. In particular never run
  `tailscale funnel` against them — that publishes to the whole internet, which is
  the opposite of what this setup is for. `tailscale serve` (tailnet-only) is fine.
