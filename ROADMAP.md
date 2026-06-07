# Phreezer — Roadmap

## Target: Community tab live + rate limiting before July 4. Phish summer tour starts July 7.
## Last updated: 2026-06-07

---

## SHIPPED ✅

### Core App
- JWT auth, bcrypt passwords, show rating/tracking
- Phish.net import (attendance + reviews), attended/rated toggles
- Scorecard as full-screen overlay with ◀ BACK
- Smart default tab (returning users land on My Shows)
- Avatar tap → ProfileModal

### MY PHREEZER
- **My Shows** — dual left border (cyan=rated, orange=reviewed), stacked date, favorite in action bar, MY REVIEW in expanded panel (bbcode stripped, deduped), set scores space-evenly with differentiated colors, FILTER/SORT cleaned up (removed UNPHROZEN, SORT label)
- **My Songs** — KPI tiles, expand to versions with ▶ links and star rendering fixed
- **My Venues** — consistent headers, score colors, expand with top shows
- **My States** — heatmap, consistent styling, venue show count in expand
- **My Phriends** — show companions, tagging, overlap, bulk fetch
- **Deep Phreeze** — full redesign (see below)

### Deep Phreeze (major this session)
- phish.in duration fetch per show — real timing stored in show_cache
- Per-set duration calculated proportionally from phish.in data
- Avg show length, avg set I/II, avg encore — real times when available
- Era breakdown (1.0/2.0/3.0/4.0)
- Set preference (YOU'RE A SET I/II PERSON from rating history)
- Day-of-week bar chart + month bar chart
- Days since first show, show density, consecutive years streak
- First/last song ever heard, first/last show → tap opens Scorecard overlay
- Longest show/set/encore tiles → tap opens Scorecard overlay
- Song version dropdown: MOST RATED VERSIONS expands to top 5 with ▶ links
- FULL sync button: wipes cache + rebuilds in one motion
- SYNC button: incremental update only
- /api/admin/clear-cache endpoint (used internally by FULL)
- All song names link to phish.net song page
- Shows by month/day charts

### KPI Cards
- Quick Phreeze background fixed
- Progress bars → next milestone format
- Deep Phreeze CTA formatting consistent

### OTD Card
- Vibe Check fixed: model alias, max_tokens 1500, resilient JSON parser, cache validation
- Typography hierarchy fixed

### AI
- Uncle Ebenezer — Claude Sonnet, 10-turn memory, floating ❄ button
- Vibe Check — Claude Haiku, cached per show in vibe_checks table
- Both routed server-side via /api/ai/

### Community
- Leaderboard, Top Shows/Songs/Venues/States from Phreezer ratings

### Admin
- User management, password reset, cascade delete
- /api/admin/clear-cache — wipes show_cache + user_stats, leaves ratings intact

### Security / Infra
- Phishook brand assets deleted (not our IP)
- Neon token exposure resolved — password auto-rotated, Vercel auto-updated
- Repo files clean — no hardcoded credentials
- GitHub PAT rotates each session

---

## NEXT SESSION — START HERE

### 1. Rotate GitHub PAT before anything else

### 2. Community Tab (Priority 1 — biggest visible gap)
- Still placeholder
- Top Shows / Top Songs / Top Venues / Top States from Phreezer community ratings
- Consider phish.net public data for shows with no Phreezer ratings yet (24hr cache)
- Leaderboard already exists — wire it in cleanly
- Label data sources clearly (Phreezer vs phish.net)

### 3. Rate Limiting on Auth Endpoints (Priority 1 — security)
- /api/auth/register and /api/auth/login have no rate limiting
- Implement: in-memory or KV-backed counter, 10 attempts/15min per IP
- Block + return 429 with Retry-After header
- This is the #1 security gap, has been on the list too long

### 4. Welcome + Weekly Nudge Emails
- Resend already wired (re_aPxWcAKa key in env)
- Welcome email: trigger on /api/auth/register, on-brand, personalized
- Weekly nudge: "You have X unrated shows" — Vercel cron, Sundays
- Templates need writing — keep the terminal aesthetic

### 5. Profile Tap-to-Select Questions
- DB: ALTER TABLE users ADD COLUMN vantage_point, show_style, era_preference
- API: /api/user/profile PATCH endpoint
- UI: tap-to-select buttons in ProfileModal → INFO tab
- Data improves Uncle Ebenezer context and future personalization

### 6. Verify Deep Phreeze phish.in timing
- After FULL sync, check precise_show_count in result message
- If 0: phish.in response shape doesn't match parser — need to log one raw response to diagnose
- Can't test phish.in from Claude environment (blocked) — needs live UAT

---

## OPEN BUGS / DEBT

- Song version dropdown in Deep Phreeze needs fresh FULL sync to populate (versions field added this session)
- Set I/II avg time shows song count only until phish.in data confirmed working
- /api/debug/reviews.js — exposed endpoint, should be deleted
- Admin endpoint /api/admin/migrate has no auth check — low priority but noted
- Onboarding tour guide — deferred (replaced 4-step slideshow, not rebuilt yet)
- Desktop UAT pass still pending
- MySongsTab KPI tiles still old design (minor)

---

## POST-LAUNCH (after July 4)

- Scheduled phish.net sync via Vercel cron (currently manual)
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Songs never heard (requires full Phish songbook reference)
- Attendance type field (attended / webcast / listened after)
- Show comments (light, per-show, moderated)
- Live show mode (real-time per-song rating during a show)
- Phantasy Phishball — separate product, scoped not started
- Deep Phreeze: phish.net song play counts for rarity scoring

---

## Architecture Notes

- **phish.in**: `/api/audio/[date].js` proxy — no key needed, fail gracefully. Also hit directly in sync.js for duration data.
- **phish.net API v5**: artistid=1 filter mandatory. review_text field (not review/body/text). Pre-1998 shows need limit 2500+. Hiatus years 2005-2007 hidden.
- **Neon**: Never attempt direct connection from Claude environment. Trigger migrations via deployed endpoints or CREATE TABLE IF NOT EXISTS in serverless startup.
- **show_cache**: Shared across users. clear-cache deletes only rows matching user's attended dates.
- **GitHub token**: Rotates each session — never store in memory or repo files.
- **Vercel**: list_deployments requires both projectId AND teamId. Auto-deploys on push to main.
- **CSS rule**: Never append across sessions — always pull full file, rewrite clean, push.
- **Postgres gotcha**: SELECT DISTINCT + GROUP BY + ORDER BY COUNT(*) is invalid — use GROUP BY alone.
- **JSX gotcha**: Ternary false branch cannot be short-circuit &&. Use two separate {cond && (...)} blocks.
- **Mobile tap targets**: Inline button inside flex row unreliable on iOS — make full div the tap target.
