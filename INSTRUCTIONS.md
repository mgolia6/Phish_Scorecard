# INSTRUCTIONS — Phishow Scorecard

## Project Overview
Full-stack Phish show rating app. Built incrementally over ~1 month with GitHub Copilot (Matthew did all code pushes). Stack: React + Vite frontend (`/client`), Express backend (`server.js`), PostgreSQL, JWT auth, Phish.net API integration. Retro terminal aesthetic (green/cyan/orange on dark) is intentional and non-negotiable.

**Note**: The existing `SESSION_LOG.md` was written by an AI agent (Manus) and may not accurately reflect actual code state. Do not treat it as ground truth.

## Session Kickoff Protocol
At the start of every session, before anything else:
1. Pull this file (INSTRUCTIONS.md) from the repo via GitHub API
2. Pull SESSION_LOG.md from the same repo
3. Read both — but weight the code over the session log if there's a conflict
4. Surface: current state of the app, open issues, what was last worked on
5. Then ask Matthew where he wants to start — or if he's already said, get into it

## Project Status
- **As of first Claude session**: Undeployed. Code exists, audit needed before assuming anything works.
- The `/public` directory contains an older static version — likely stale, do not prioritize it
- The `/client` directory is the active React frontend
- `server.js` is the active Express backend

## First Session Priority (do this before anything else)
Audit the actual codebase honestly:
1. Read `server.js`, `client/src/App.jsx`, and `init-db.sql` in full
2. Report what's actually implemented vs. incomplete or broken
3. Flag anything that would block local development
4. Do not assume the Manus session log is accurate

## Core Goals (in order)
1. Get the app running locally
2. Confirm Phish.net API integration works
3. Confirm auth works end to end
4. Confirm ratings save and retrieve correctly
5. Deploy (Railway or Render — PostgreSQL required)
6. Then iterate on features

## Standing Preferences (Matthew)
- No fluff, get to the point
- Push back when something isn't right
- Lo-fi, anti-perfectionist — get it working, then polish
- Direct tone, conversational not corporate
- Protect the retro terminal aesthetic — it's the identity of this app

## What to Log Each Session
After each session, update SESSION_LOG.md with:
- What was actually done (not what was planned)
- Decisions made and why
- Known issues or open debt
- Next session priorities

## Note
These instructions may need refinement after the first session once the real state of the codebase is known.
