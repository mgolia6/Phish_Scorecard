# Phreezer — Roadmap

## Target: Community tab live + rate limiting before July 4. Phish summer tour starts July 7.
## Last updated: 2026-06-07 (evening session)

---

## SHIPPED ✅

### Core App
- JWT auth, bcrypt passwords, show rating/tracking
- Phish.net import (attendance + reviews), attended/rated toggles
- Scorecard as full-screen overlay with ◀ BACK
- Smart default tab (returning users land on My Shows)
- Avatar tap → ProfileModal

### MY PHREEZER
- **My Shows** — dual left border, stacked date, favorite in action bar, MY REVIEW in expanded panel, set scores, filter/sort cleaned up, OTD carousel (all matching shows, ‹ N/total › nav)
- **My Songs** — KPI tiles, expand to versions, star removed from rating display
- **My Venues** — consistent headers, score colors, expand with top shows, venue heatmap removed
- **My States** — heatmap kept, consistent styling
- **My Phriends** — show companions, tagging, overlap, bulk fetch
- **Deep Phreeze** — full redesign + this session's pass (see below)

### Deep Phreeze (this session)
- Tap-to-expand factoids on all Hero + Tile cards
- OTD carousel — all matching shows, swipe nav
- Longest show SONGS/TIME toggle
- Most Heard expand — top 5 versions with ▶ + GO TO SHOW
- Encore Patterns — last date/venue + ▶ play
- Rarest Catches — date/venue + ▶ play
- Streak detail — run end, songs heard, unique songs, states
- SYNC/FULL collapsed to single button (long press = full rebuild)
- SYNC visually separated from tab toggles
- Completionism removed
- Set breakdown tiles removed (data in expand)
- YEARS WITH PHISH label + factoid shows full span

### sync.js extended
- Run detail: end date, songs_heard, unique_songs, states
- Rarest: date + venue
- Encore: last_date + last_venue
- Longest tiles: duration_seconds
- Attended versions: top 5 dates+venues per song for Most Heard expand

### Scorecard
- Sandwiched/reprised song bug fixed — keyed by position (posKey) not song name
- ratings API: song_position column, upsert by position

### KPI Cards
- Quick Phreeze, Import button — holographic gradient text

### OTD Card
- RATE button — holographic gradient text

### AI
- Uncle Ebenezer — JADED VET subtitle (own line), holographic on all instances
- Vibe Check — fixed model, tokens, JSON parser

### Community
- Leaderboard — feedback_count + bugs_reported columns
- Top Shows — stats query fixed
- Top Venues — heatmap removed from CommunityTab
- SEARCH buttons — holographic gradient text

### Feedback
- Bug Report added as selectable section in passive feedback

### Profile
- INFO tab — full aesthetic overhaul, tap-to-select questions
- Questions: WHERE DO YOU SIT (Floor/Reserved/Lawn), FAVORITE ERA, MIKE/PAGE SIDE, DANCE/CHILL
- ABOUT tab — origin story, what this is, built by, credits
- BADGES tab — fixed black screen (ALL_BADGES_DEF was missing)
- initialSection prop for programmatic tab targeting
- Easter egg: triple-tap marquee → opens to ABOUT tab
- How-to steps — all 6 rewritten

### Admin
- User management, password reset, cascade delete
- /api/admin/clear-cache

### Security / Infra
- Phishook brand assets deleted
- Neon token exposure resolved
- Repo files clean

---

## NEXT SESSION — START HERE

### 1. Rotate GitHub PAT before anything else

### 2. Phish Phreeze — band-level stats tab (Priority 1 — new feature)
- New subtab in COMMUNITY
- Data from phish.net API: total shows, total songs, unique songs ever played
- Timing from phish.in: total hours of music
- Breakdowns: day of week, month, countries, states
- Cache server-side in new phish_stats_cache table
- Most played songs all time, rarest songs, longest shows

### 3. Rate Limiting on Auth Endpoints (Priority 1 — security)
- /api/auth/register and /api/auth/login have no rate limiting
- 10 attempts/15min per IP, 429 with Retry-After header

### 4. Run Full Sync
- Populate new data fields: rarest date/venue, encore last_date, run detail, attended versions
- Verify sandwiched song fix on a real reprise show

### 5. Top Shows
- Currently blank — needs more community ratings
- Consider lowering HAVING threshold or showing shows with 1+ rater

### 6. Desktop UAT pass
- Still pending — mobile-first but desktop needs a check

### 7. Welcome + Weekly Nudge Emails
- Resend wired, templates need writing

---

## OPEN BUGS / DEBT

- Deep Phreeze new data fields won't populate until users run a full sync
- /api/debug/reviews.js — exposed endpoint, should be deleted
- Admin endpoint /api/admin/migrate has no auth check
- Onboarding tour guide — deferred
- MySongsTab KPI tiles still old design (minor)
- Top Shows blank until more community ratings exist

---

## POST-LAUNCH (after July 4)

- Scheduled phish.net sync via Vercel cron
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Songs never heard (requires full Phish songbook reference)
- Show comments (light, per-show, moderated)
- Live show mode (real-time per-song rating during a show)
- Phantasy Phishball — separate product, scoped not started
- Deep Phreeze: phish.net song play counts for rarity scoring

---

## Architecture Notes

- **phish.in**: `/api/audio/[date].js` proxy — no key needed, fail gracefully
- **phish.net API v5**: artistid=1 filter mandatory. review_text field. Pre-1998 needs limit 2500+. Hiatus 2005-2007 hidden.
- **Neon**: Never direct connect from Claude env. Trigger migrations via deployed endpoints or CREATE TABLE IF NOT EXISTS.
- **show_cache**: Shared across users.
- **GitHub token**: Rotates each session.
- **Vercel**: list_deployments requires projectId AND teamId. Auto-deploys on push to main.
- **CSS**: Always pull full file, rewrite clean, push.
- **Postgres**: SELECT DISTINCT + GROUP BY + ORDER BY COUNT(*) invalid — use GROUP BY alone.
- **JSX**: Ternary false branch can't be short-circuit &&. Use two separate {cond && ()} blocks.
- **Mobile tap targets**: Full div as tap target, not inline button.
- **Session discipline**: Pull fresh from GitHub immediately before EVERY edit. Never patch stale /tmp copies across multiple operations.
