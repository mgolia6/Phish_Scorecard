# CLAUDE.md — Phishook

## What This Is
Full-stack Phish show rating app. Stack: React + Vite frontend (`/client`), Vercel serverless functions (`/api`), Neon Postgres (via `POSTGRES_URL`), JWT auth, Phish.net API v5.

Retro terminal aesthetic: green/cyan/orange on dark, Orbitron display font, scanlines, glow effects. **Non-negotiable identity — don't touch it.**

App name: **Phishook** (renamed from Phishow Scorecard — rename pass not yet applied to codebase as of Session 6)

---

## Session Kickoff Protocol
At the start of every session:
1. Read this file (CLAUDE.md)
2. Read SESSION_LOG.md
3. Weight actual code over the session log if they conflict
4. Surface current state, open issues, what was last worked on
5. Ask Matthew where he wants to start — or if he's already said, get into it

---

## Architecture
```
/
├── api/
│   ├── _db.js               shared Postgres pool (uses POSTGRES_URL)
│   ├── _auth.js             JWT verify + CORS helpers
│   ├── auth/register.js
│   ├── auth/login.js
│   ├── auth/me.js
│   ├── shows/index.js       search (uses PHISH_NET_API_KEY)
│   ├── shows/[date].js      setlist
│   ├── ratings/[showDate].js
│   ├── user/shows.js
│   └── analytics/songs.js + venues.js
├── client/src/
│   ├── App.jsx
│   ├── index.css            design system — DO NOT APPEND, always rebuild clean
│   └── App.css
├── init-db.sql
├── package.json             backend deps (bcryptjs, jsonwebtoken, pg)
├── SESSION_LOG.md
└── vercel.json
```

---

## Database
- Provider: Neon Postgres (Vercel integration)
- Connection via `POSTGRES_URL` env var (pooled) or `POSTGRES_URL_NON_POOLING` (direct/migrations)
- Schema in `init-db.sql` — tables: users, shows, ratings
- Use psycopg2 or the pg client to run queries/migrations directly

---

## Env Vars (all in Vercel dashboard — never hardcode)
- `POSTGRES_URL` — Neon pooled
- `POSTGRES_URL_NON_POOLING` — direct connection
- `JWT_SECRET`
- `PHISH_NET_API_KEY`
- `NODE_ENV`

For local dev: `.env.local` in root (gitignored)

---

## Vercel
- Project: phish-scorecard under Matthew's Pro account
- Auto-deploys on push to main
- Serverless functions: `/api`
- Frontend build: `cd client && npm install && npm run build` → output: `client/dist`

---

## CSS Rules (critical)
- `index.css` must NEVER be appended to — always rebuild clean
- Last clean rebuild: 460 lines (Session 6)
- Sidebar uses `sidebar-wrapper + sidebar-tab` pattern — toggle lives outside `<aside>` (Firefox overflow:hidden fix — do not change this)
- Desktop: `desktop-layout` (flex row, sidebar + main-area)
- Mobile: `mobile-layout` (hidden on desktop) — original header + tab nav, untouched

---

## Standing Preferences
- No fluff. Direct. Push back when something's off.
- Lo-fi, anti-perfectionist — get it working, then polish
- Protect the retro terminal aesthetic — it is the identity
- Built to scale — make space for features as we grow
- Matthew's name is Matthew

---

## What to Log Each Session
After each session, update SESSION_LOG.md:
- What was actually done
- Decisions made and why
- Known issues or open debt
- Next session priorities
