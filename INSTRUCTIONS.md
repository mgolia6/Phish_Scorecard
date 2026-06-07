# INSTRUCTIONS — Phreezer

## Project Overview
Full-stack Phish show rating app. Stack: React + Vite frontend (`/client`), Vercel serverless functions (`/api`), Neon Postgres (via `POSTGRES_URL`), JWT auth, Phish.net API v5. Retro terminal aesthetic (green/cyan/orange on dark) with modern polish — Orbitron display font, scanlines, glow effects. Non-negotiable identity.

## Session Kickoff Protocol
At the start of every session, before anything else:
1. Pull this file (INSTRUCTIONS.md) from the repo via GitHub API
2. Pull SESSION_LOG.md from the same repo
3. Pull STYLE_GUIDE.md from the same repo
4. Read all three — weight actual code over session log if there's a conflict
5. Surface current state, open issues, what was last worked on
6. Then ask Matthew where he wants to start — or if he's already said, get into it

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
- Schema is in `init-db.sql` — tables: users, shows, ratings, vibe_checks

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
│   ├── _auth.js             JWT verify + CORS helpers
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
│   └── analytics/songs.js + venues.js
├── client/src/
│   ├── App.jsx
│   ├── components/          26 component files (refactored from monolith)
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

## Standing Preferences
- No fluff, get to the point
- Push back when something is not right
- Lo-fi, anti-perfectionist — get it working, then polish
- Direct tone, conversational not corporate
- Protect the retro terminal aesthetic — it is the identity
- Built to scale — make space for features as we grow
- Matthew's name is Matthew
- Always read STYLE_GUIDE.md before touching any UI component

## What to Log Each Session
After each session, update SESSION_LOG.md with:
- What was actually done
- Decisions made and why
- Known issues or open debt
- Next session priorities
