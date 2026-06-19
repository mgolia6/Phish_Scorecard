# CLAUDE.md — Phreezer / Phish Scorecard

This file is for Claude Code sessions. Read it at the start of every Claude Code session before touching any file.

---

## What This Project Is

**Phreezer** (phreezer.mpgink.com) — a Phish show rating, tracking, and community web app for the Phish fan community. Built by one developer (Matthew, mgolia6). Beta as of June 2026. Summer tour target: July 7.

Honest inspiration: ihoz.com / ZZYZX's Phishtistics.

---

## How Claude Is Used On This Project

**claude.ai (chat)** — mocking, design discussion, copy review, session wrap, roadmap, architectural decisions. This is where Matthew thinks out loud and where layout/UX decisions get made before any code is written.

**Claude Code (you)** — actual implementation. When you get a task, the design decision has usually already been made in claude.ai. Read CLAUDE.md + INSTRUCTIONS.md + LAYOUT.md before building. Don't make UX decisions unilaterally — flag and confirm.

Session logs, roadmap, and layout decisions live in:
- `INSTRUCTIONS.md` — architecture, conventions, env vars, session protocol
- `SESSION_LOG.md` — what shipped each session
- `ROADMAP.md` — what's open, what's done
- `LAYOUT.md` — every layout decision ever made, what's been tried and reversed, what's off-limits
- `STYLE_GUIDE.md` — design tokens, component patterns, CSS conventions

**Read all five before doing any UI work.**

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite (`client/src/`) |
| Backend | Vercel serverless functions (`api/`) |
| Database | Neon Postgres |
| Auth | JWT (HS256, 30d expiry) |
| Email | Resend (`PHREEZER_RESEND_API_KEY`) |
| AI | Anthropic (Claude Sonnet for Ebenezer, Haiku for Vibe Check + moderation) |
| External APIs | Phish.net API v5, Phish.in API v2 |
| Monitoring | Sentry (client + server), Posthog |
| Deployment | Vercel (auto-deploy on push to main) |

---

## File Map

```
/
├── api/
│   ├── _db.js               Postgres pool (POSTGRES_URL)
│   ├── _auth.js             JWT verify + CORS (locked to phreezer.mpgink.com)
│   ├── _email.js            Resend sender + all email templates
│   ├── _ratelimit.js        In-memory rate limiter
│   ├── _disposable.js       Disposable email blocklist
│   ├── _ai_usage.js         AI token usage logger
│   ├── auth/                register, login, me
│   ├── shows/               index (search), [date] (setlist)
│   ├── ratings/[showDate].js
│   ├── user/                shows, kpi, deep-phreeze, sync, badges
│   ├── ai/                  summarize (Vibe Check), ebenezer, ebenezer-moderate, ebenezer-log
│   ├── analytics/           songs, venues
│   ├── admin/               health, seed-*, monitoring
│   ├── emails/              cron, onboarding
│   └── audio/               stream.js (server-side proxy for Phish.in, CORS workaround)
├── client/src/
│   ├── App.jsx              Root — routing, auth state, tab management
│   ├── index.css            Design system (see STYLE_GUIDE.md)
│   ├── App.css
│   ├── analytics.js         Posthog + Sentry instrumentation
│   └── components/          33 components (see below)
├── init-db.sql
├── vercel.json              Route config — every new API route must be added here
├── INSTRUCTIONS.md
├── SESSION_LOG.md
├── ROADMAP.md
├── LAYOUT.md
├── STYLE_GUIDE.md
└── CLAUDE.md                (this file)
```

### Key Components
- `App.jsx` — auth state, tab routing, badge queue wiring
- `ScorecardTab.jsx` — setlist display, song rating, audio player, attendance gate
- `DeepPhreezeTab.jsx` — lifetime stats UI (reads from `user_stats` table, populated by sync)
- `CommunityTab.jsx` — Feed, Phriend Overlap, Leaderboard, Top Shows/Songs/Venues/States
- `PhreezeFeed.jsx` — community feed, pinned posts, post composer
- `BadgeCelebration.jsx` — full-screen badge award animation + BadgeQueue
- `EbenezerDrawer.jsx` — Uncle Ebenezer AI chat, mobile FAB + desktop rail
- `ProfileModal.jsx` — 5 tabs: MY PHISH · BADGES · ABOUT · AI · SHOP
- `WelcomeCelebration.jsx` — boot sequence typewriter + glitch exit
- `AdminTab.jsx` — admin panel (health, monitoring, user management, seed endpoints)

---

## Critical Conventions

### Every new API route needs a vercel.json entry
Before the catch-all. Missing entries = silent 404 in production.

### SHA hygiene
Always fetch a fresh SHA immediately before any GitHub API PUT. Stale SHAs = 409 conflict.

### Never append to CSS across sessions
Always pull the full file, rewrite clean, push.

### String replacement on JSX
Exact whitespace matching required. Silent failures are common. Always include a mismatch check. Print `repr()` of surrounding content when a match fails.

### JSX safety
- Double-quote strings containing apostrophes, or use template literals
- Inline styles must be camelCase (`writingMode` not `writing-mode`)
- esbuild "Expected } but found {" = mismatched conditional wrapper

### File rewrites over surgery
For large JSX files, rewrite entire files rather than brace-counting surgery.

### Phish.net API
- Always filter `artistid: 1` — multiple artists can share a date
- Review text field: `review_text`
- Rate limit aware — batch fetches with delays

### Phish.in audio
- Direct browser-to-Phish.in MP3 = CORS blocked
- Use server-side proxy at `api/audio/stream.js` (supports Range requests)

### Database
- Neon direct connections time out from Claude Code environment — use deployed API endpoints or `CREATE TABLE IF NOT EXISTS` lazy migration patterns
- Dual attendance table pattern: `attendance` (Phish.net import) + `user_show_attendance` (manual) — always UNION both in community queries

### Python heredoc strings
Use `<< 'PYEOF'` for multi-line bash scripts containing JSX — avoids shell escaping issues.

---

## Design System — Non-Negotiable

**Aesthetic:** Retro terminal / synthwave. Dark background, glow effects, scanlines. This is the identity. Do not deviate.

**Colors:**
- `--green`: `#33ff33` — primary accent, section labels
- `--cyan`: `#00e0d0` — interactive elements, active states
- `--orange`: `#ff6600` — CTAs, warnings, Ebenezer
- `--bg`: `#0a0a0a` — page background
- `--bg-panel`: `#0f0f0f` — card/panel background

**Fonts:**
- Display: Orbitron — headings, labels, nav
- Mono: Share Tech Mono — body copy, data, song names

Read `STYLE_GUIDE.md` before touching any UI component.

---

## Layout Rules (abridged — read LAYOUT.md for full detail)

- **Song row mobile:** column layout — do not revert
- **Feed:** default Community landing — do not revert
- **Phriend Overlap:** second in sidebar — do not revert
- **Attendance type gate:** mandatory on first star tap — do not remove
- **Entry animation:** terminal boot, typewriter, glitch exit — do not revert
- **Bottom nav:** fixed, 72px, mobile only (max-width: 768px), 4 tabs
- **Ebenezer FAB:** bottom 88px (clears bottom nav)
- **ProfileModal tabs:** MY PHISH · BADGES · ABOUT · AI · SHOP — do not reorder
- **Error boundary:** Mike Says No for ALL errors

---

## Z-Index Stack
| Layer | Z-index |
|---|---|
| Boot sequence | 2000 |
| Toast | 9500 |
| Ebenezer modal | 8000 |
| BadgeCelebration | 5000 |
| ChangelogModal | 4000 |
| FullPageLoader | 1000 |

---

## Env Vars (all in Vercel dashboard)
- `POSTGRES_URL` — Neon pooled
- `POSTGRES_URL_NON_POOLING` — direct/migrations
- `JWT_SECRET`
- `PHISH_NET_API_KEY`
- `ANTHROPIC_API_KEY`
- `PHREEZER_RESEND_API_KEY`
- `CRON_SECRET`
- `VITE_SENTRY_DSN`
- `VITE_POSTHOG_KEY`

---

## What NOT To Do

- Don't remove the attendance type gate (I WAS THERE / WEBCAST / RECORDING)
- Don't revert song row to side-by-side on mobile
- Don't revert Feed to non-default or move it out of first position
- Don't use left-aligned, instant-pop, or particle animations for the boot sequence
- Don't add routes without vercel.json entries
- Don't append to CSS — always full file rewrite
- Don't make UX decisions without checking LAYOUT.md first
- Don't recommend things already in place or explicitly reversed
- Don't use `localStorage` or `sessionStorage` in artifacts
- Don't hardcode DB connection strings
- Don't push copy Matthew hasn't reviewed — flag it first

---

## Badge System

**Badge keys in use:** `phab_phive`, `early_phreeze`, `ten`, `quarter`, `fifty`, `century`, `rated_1`, `rated_10`, `rated_25`, `rated_50`, `rated_100`, `critic`, `streak_7`, `streak_30`, `first_bug`

New badges need:
1. Entry in `BADGE_CONFIG` in `BadgeCelebration.jsx`
2. DB insert into `user_badges` (user_id, badge_key, badge_label)
3. `notified_at IS NULL` = unseen, shown on login via catch-up flow

---

## Email System

Templates in `api/_email.js`. All use `layout()` wrapper. Log all sends to `email_log` table with `(user_id, email_type)` unique constraint — prevents double-sends.

Email types: `onboarding`, `day3_nudge`, `day7_engage`, `day30_reengage`, `milestone_5/25/50`, `rating_reminder`

Cron fires daily via `api/emails/cron.js`. Protected by `CRON_SECRET`.

---

## Changelog / Versioning

`CHANGELOG_VERSION` in `ChangelogModal.jsx` — bump with every user-facing release. Users see the modal once per version key via localStorage.

Current version: `2.1`
