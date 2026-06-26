# Reality Check Rule — Phreezer

**Apply before any code change, every time.**

## The Rule

Before modifying any file:

1. **Prove the file exists** — list the directory or read it, not from memory
2. **Prove every component, API route, or function you reference actually exists** — search the codebase
3. **Prove every new API route has a `vercel.json` entry** — missing entries = silent 404 in production
4. **Prove every DB column you write to exists in the schema** — check CLAUDE.md env vars section or INSTRUCTIONS.md
5. **If anything can't be verified** — stop and flag it before proceeding

## Common Traps in This Repo

- **Every new API route needs a vercel.json entry** — this has burned you before. Do it before deploying.
- **Neon direct connections time out from Claude Code** — use deployed API endpoints or `CREATE TABLE IF NOT EXISTS` patterns
- **JSX surgery on large files fails silently** — prefer full file rewrites over brace-counting
- **CSS: never append across sessions** — always pull full file, rewrite clean, push
- **String replacement on JSX** — exact whitespace match required; print `repr()` of surrounding content when match fails
- **Phish.net API** — always filter `artistid: 1`; multiple artists can share a date
- **Audio** — direct browser-to-Phish.in = CORS blocked; always use `api/audio/stream.js` proxy
- **Dual attendance tables** — `attendance` (Phish.net import) + `user_show_attendance` (manual); always UNION both in community queries

## Before Any UI Change
Read `LAYOUT.md` first. Non-negotiable layout decisions are listed there. Many things have been tried and explicitly reversed — don't repeat them.

## Before Any New Component
Read `STYLE_GUIDE.md`. Retro terminal / synthwave aesthetic is non-negotiable. Do not deviate.
