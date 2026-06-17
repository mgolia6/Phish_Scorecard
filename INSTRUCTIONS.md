# INSTRUCTIONS — Phreezer

## Project Overview
Full-stack Phish show rating app. Stack: React + Vite frontend (`/client`), Vercel serverless functions (`/api`), Neon Postgres (via `POSTGRES_URL`), JWT auth, Phish.net API v5. Retro terminal aesthetic (green/cyan/orange on dark) with modern polish — Orbitron display font, scanlines, glow effects. Non-negotiable identity.

## Session Kickoff Protocol
At the start of every session, before anything else:
1. Pull this file (INSTRUCTIONS.md) from the repo via GitHub API
2. Pull SESSION_LOG.md from the same repo
3. Pull ROADMAP.md from the same repo
4. Pull LAYOUT.md from the same repo
5. Pull STYLE_GUIDE.md from the same repo (if it exists)
6. Read all of them — weight actual code over session log if there's a conflict
7. Surface current state, open issues, what was last worked on
8. Then ask Matthew where he wants to start — or if he's already said, get into it

**LAYOUT.md is mandatory before any UI work.** Before recommending or making any layout change, tab restructure, navigation change, or component placement decision — read LAYOUT.md first. It records what has been decided, what has been tried and abandoned, and what is explicitly off-limits. Do not recommend things that are already in place or that were explicitly reversed.

## Context Window Management
- At ~75% context window, stop mid-task if needed and write a full SESSION_LOG.md update before continuing
- Never compress, summarize, or drop detail to fit — wrap cleanly instead
- Flag to Matthew when approaching the limit so he can start a fresh session if preferred

## GitHub Access
- Repo: `mgolia6/Phish_Scorecard`
- Token: provided by Matthew at the start of each session — never stored in this file
- Push files directly via GitHub API — no need to ask Matthew to push
- Use python3 scripts with curl + base64 to read/write files
- Always fetch a fresh SHA immediately before any PUT — stale SHAs cause silent failures

## Database Access
- Provider: Neon Postgres (connected to Vercel project)
- POSTGRES_URL: stored in Claude project instructions
- Use psycopg2 to run schema or queries directly from session
- Schema is in `init-db.sql` — tables: users, shows, ratings, vibe_checks, posts, post_replies, post_reactions, user_show_attendance, show_companions, user_badges, email_log

## Vercel
- Project: phish-scorecard under Matthew's Pro account
- Deploys automatically on push to main
- Serverless functions live in /api directory
- Frontend builds from client/ via: cd client && npm install && npm run build
- Output: client/dist

## Architecture
```
/
├── api/
│   ├── _db.js               shared Postgres pool (uses POSTGRES_URL)
│   ├── _auth.js             JWT verify + CORS helpers (CORS locked to phreezer.mpgink.com)
│   ├── _disposable.js       disposable email domain blocklist
│   ├── _ratelimit.js        in-memory rate limiter (login/register)
│   ├── _email.js            Resend email sender + all 5 HTML templates
│   ├── _ai_usage.js         AI token usage logger
│   ├── auth/register.js
│   ├── auth/login.js
│   ├── auth/me.js
│   ├── shows/index.js       search (uses PHISH_NET_API_KEY)
│   ├── shows/[date].js      setlist
│   ├── ratings/[showDate].js
│   ├── user/shows.js
│   ├── user/kpi.js
│   ├── ai/summarize.js      Vibe Check (Haiku, cached in vibe_checks table)
│   ├── ai/ebenezer.js       Uncle Ebenezer AI agent (Sonnet)
│   ├── analytics/songs.js + venues.js
│   ├── admin/health.js       server-side external API health probe
│   ├── admin/seed-ebenezer.js  seeds pinned Uncle Ebenezer post (admin only)
│   ├── admin/seed-founder-badges.js  assigns PHAB PHIVE / EARLY PHREEZE badges
│   ├── users/badges.js         get badges for a user
│   ├── emails/cron.js          daily email cron (onboarding, day3/7/30, milestones)
│   └── emails/onboarding.js    onboarding email trigger (also fires from verify-email)
├── client/src/
│   ├── App.jsx
│   ├── analytics.js         Posthog + Sentry instrumentation, named Analytics events
│   ├── components/          33 component files (incl. PhreezeFeed, PhriendOverlap,
│   │                            DesktopLanding, ShowSlotMachine)
│   ├── index.css            design system — see STYLE_GUIDE.md
│   └── App.css
├── init-db.sql
├── STYLE_GUIDE.md           design tokens, font system, component patterns
├── package.json             backend deps (bcryptjs, jsonwebtoken, pg)
└── vercel.json
```

## Env Vars (all in Vercel dashboard)
- `POSTGRES_URL` — Neon pooled connection string
- `POSTGRES_URL_NON_POOLING` — for direct connections/migrations
- `JWT_SECRET`
- `PHISH_NET_API_KEY`
- `ANTHROPIC_API_KEY`
- `NODE_ENV`
- `PHREEZER_RESEND_API_KEY` — email delivery (Resend)
- `CRON_SECRET` — protects email and etsy cron endpoints (reset via Vercel if lost — not recoverable after set)
- `VITE_SENTRY_DSN` — Sentry error monitoring (client-side, Matthew to add)
- `VITE_POSTHOG_KEY` — Posthog analytics (client-side, Matthew to add)

## Security Notes
- CORS: locked to phreezer.mpgink.com — `cors(res, req)` signature, must pass req
- JWT: explicit HS256, 30d expiry, is_admin baked into token
- Rate limiting: login 10/15min, register 5/60min per IP via _ratelimit.js
- Disposable emails: blocked at register via _disposable.js
- Cron endpoints: protected by CRON_SECRET header
- Admin endpoints: all require verifyToken + is_admin
- Client bundle: VITE_ prefix exposes to browser — only Sentry DSN + Posthog key, both intentional

## Standing Preferences
- No fluff, get to the point
- Push back when something is not right
- Lo-fi, anti-perfectionist — get it working, then polish
- Direct tone, conversational not corporate
- Protect the retro terminal aesthetic — it is the identity
- Built to scale — make space for features as we grow
- Matthew's name is Matthew
- Always read STYLE_GUIDE.md before touching any UI component

## Session Wrap Protocol (REQUIRED — do not skip)

This is a checklist. Execute every step in order. Do not skip steps. Do not summarize or gesture — actually do each one.

### Step 1 — SESSION_LOG.md
Write a new dated entry with:
- Everything that shipped this session (specific files, features, fixes)
- Decisions made and why
- Known issues or open debt introduced this session
- Next session priorities

### Step 2 — ROADMAP.md
- Mark everything completed this session as ✅ with today's date
- Add any new items raised during the session that aren't already there
- Remove anything no longer relevant
- Pull fresh before editing — never edit from memory

### Step 3 — LAYOUT.md
Go section by section and explicitly check each one:
- **Mobile Layout** — did any tab, nav, header, or bottom bar change?
- **Desktop Layout** — did sidebar, right rail, or column structure change?
- **ProfileModal** — did tabs or content sections change?
- **Scorecard Tab** — did song row layout, audio player, or notes change?
- **Community Tab** — did subtabs, features, or content change?
- **Auth Screens** — did any auth flow or error screen change?
- **Key Layout Decisions** — did anything get explicitly decided or reversed? Add it.
- **What's Explicitly NOT There Yet** — update if something shipped or was descoped
If nothing changed in a section, leave it. If anything changed, update it.

### Step 4 — INSTRUCTIONS.md (this file)
Update if any of the following changed this session:
- New API endpoints added → update Architecture section
- New env vars added or renamed → update Env Vars section
- New DB tables or schema changes → update Database Access section
- New conventions established → add to Standing Preferences or Security Notes
- New files added to /api or /client/src/components → update Architecture
This session: `RESEND_API_KEY` → `PHREEZER_RESEND_API_KEY`, new `api/admin/health.js` endpoint added.

### Step 5 — STYLE_GUIDE.md
Update if any of the following changed:
- New component patterns established
- New color usage decisions
- New font/spacing rules applied
- New CSS class patterns added
If no style changes, skip this step explicitly.

### Step 6 — Validate everything against the session
Explicitly ask: is there anything that happened this session that isn't captured in one of the above files? Surface gaps to Matthew before closing.

### Step 7 — Verify latest deploy is healthy
Check Vercel — confirm the most recent deployment is READY and not erroring. If there's a build failure, fix it before wrapping.

### Step 8 — Confirm with Matthew
Say explicitly what was updated and what was skipped (and why). Do not assume the session is done until Matthew confirms.

---

## Roadmap Hygiene Rules
- If Matthew asks about the roadmap mid-session, pull ROADMAP.md fresh from the repo before answering — never answer from memory
- Any feature, fix, or idea raised during a session that isn't already on the roadmap gets added before wrap
- Completed items get marked ✅ with the session date
- Do not let the roadmap drift more than one session behind


