# API & Data Gotchas — Phreezer

## Vercel.json — CRITICAL

Every new API route must have an entry in `vercel.json` BEFORE the catch-all rewrite.
Missing entry = silent 404 in production. Check before every deploy.

Pattern:
```json
{ "src": "/api/your-new-route", "dest": "/api/your-new-route.js" }
```

## Phish.net API

- Always filter `artistid: 1` — multiple artists can share a date
- Review text field: `review_text`
- Rate limit aware — batch fetches with delays

## Phish.in Audio

- Direct browser-to-Phish.in MP3 = CORS blocked
- Always use server-side proxy at `api/audio/stream.js` (supports Range requests)
- Never make Phish.in requests from the client directly

## Database

- Neon direct connections time out from Claude Code environment
- Use deployed API endpoints or `CREATE TABLE IF NOT EXISTS` lazy migration patterns for schema work
- Dual attendance table pattern — always UNION both in community queries:
  - `attendance` (Phish.net import)
  - `user_show_attendance` (manual)

## JWT Auth

- HS256, 30-day expiry
- CORS locked to phreezer.mpgink.com in `api/_auth.js`

## AI Usage

- Anthropic API for Ebenezer (Sonnet) and Vibe Check + moderation (Haiku)
- Track all AI usage via `api/_ai_usage.js`
- Models in use: `claude-sonnet-4-6` (Ebenezer), `claude-haiku-4-5` (Vibe Check, moderation)

## Email

- All templates in `api/_email.js` using `layout()` wrapper
- Log all sends to `email_log` table with `(user_id, email_type)` unique constraint
- Prevents double-sends

## JSX Safety

- Double-quote strings containing apostrophes, or use template literals
- Inline styles must be camelCase (`writingMode` not `writing-mode`)
- esbuild "Expected } but found {" = mismatched conditional wrapper
- Large JSX files: rewrite entire file rather than brace-counting surgery
- Python heredoc strings: use `<< 'PYEOF'` for multi-line bash scripts containing JSX

## CSS Convention

- Never append to CSS across sessions
- Always pull full file, rewrite clean, push
- Appending creates drift and conflicts

## Monitoring

- Sentry: client + server (VITE_SENTRY_DSN)
- PostHog: analytics (VITE_POSTHOG_KEY)
- Admin health endpoint: `api/admin/monitoring`
