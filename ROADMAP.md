# Phreezer — Roadmap

## Target: Rate limiting + Community tab live before July 4. Phish summer tour starts July 7.
## Last updated: 2026-06-10

---

## SHIPPED ✅

### Core App
- JWT auth, bcrypt passwords, show rating/tracking
- Phish.net import (attendance + reviews), attended/rated toggles
- Scorecard as full-screen overlay with ◀ BACK
- Smart default tab (returning users land on My Shows)
- Avatar tap → ProfileModal

### Security / Auth
- Email verification — register sends email, login hard-blocks unverified (MIKE SAID NO screen)
- Verification email via Resend from noreply@mpgink.com
- RESEND_API_KEY in Vercel shared env
- Neon token exposure resolved, repo clean

### KPI Fix
- SHOWS / TOP VENUE / FIRST SHOW now count from both attendance + user_show_attendance
- Non-import users see populated KPIs after rating

### Scorecard
- Black screen on first star click fixed (posKey in overallAvg, SaveCelebration timer)
- Sandwiched/reprised song bug fixed (posKey keying)
- Full reviews shown (no 300-char truncation)

### MY PHREEZER
- My Shows, My Songs, My Venues, My States, My Phriends, Deep Phreeze — all shipped

### OTD Carousel (rebuilt 2026-06-10)
- Pulls ALL historical Phish shows on today's MM-DD from Phish.net (not just attended)
- 1hr server-side cache via /api/shows/on-this-day
- Tap left/right half to advance — slide animation with snap
- Alternating card tint (cyan even / warm odd) for visual distinction
- Attended: green border + glow + ✓ I WAS THERE badge
- Rated: orange border + glow + ◈ PHROZEN badge
- Color-coded dot indicators; legible N of N counter
- Empty state if Phish never played this date

### Admin Panel (rebuilt 2026-06-10)
- 5-tab layout: USERS / SYSTEM / API / ERRORS / FEEDBACK
- USERS: collapsible cards (tap to expand), mini stat pills always visible, all actions behind expand
- SYSTEM: live DB stat boxes (users, ratings, attendance, cached shows, vibe checks, feedback), Run Migrations + Clear Cache buttons, /api/admin/stats endpoint
- API HEALTH: probes all 15 endpoints on load, response time + status code, color-coded ✓/⚡/✗, summary bar, manual refresh
- ERROR LOG: captures console.error + uncaught exceptions + unhandled promise rejections at module level; expandable stack traces; Copy JSON / Export .txt / Clear
- FEEDBACK: full inbox with type filter tabs, section breakdown, free text quoted, answers inline
- Font sizes bumped throughout for mobile legibility

### Onboarding
- Clean two-path flow: import or skip → questions → proceed
- No guilt trip, clear bypass for non-phish.net users

### Profile
- ProfileModal: MY PHISH / BADGES / ABOUT tabs
- All questions save correctly (stage_side, show_vibe fixed)
- Avatar tappable in sidebar footer

### Desktop Layout
- Three-column: sidebar | main | Ebenezer rail
- Sidebar hierarchy: MY PHREEZER → items, COMMUNITY → items, SCORECARD, FEEDBACK
- Ebenezer rail: persistent, collapsible, shared state with mobile drawer
- Both headers 88px, 2px colored borders, matching collapse tabs
- Song row: desktop grid override prevents name crushing
- Feedback: sidebar nav item only

### AI
- Uncle Ebenezer — desktop rail with matching send button
- Vibe Check — fixed model, tokens, JSON parser

### Community
- Leaderboard, Top Shows (needs more data), Top Songs, Top Venues

### Debt Closed
- /api/debug/reviews.js — confirmed deleted, directory gone
- Admin migrate auth — confirmed has verifyToken + is_admin check
- Top Shows HAVING threshold — already COUNT > 0; blank because no other users have rated yet, not a code bug

---

## NEXT SESSION — START HERE

### 1. Rate Limiting on Auth Endpoints (Priority 1 — security, STILL OPEN)
- /api/auth/register and /api/auth/login have no rate limiting
- 10 attempts/15min per IP, 429 with Retry-After header

### 2. Middle section desktop expansion
- Use the space better — wider content, better typography at desktop scale
- Desktop logo: Matthew to provide Canva version

### 3. Phish Phreeze — band-level Community subtab
- Total shows, songs, hours; breakdowns by day/month/country/state
- Cache in phish_stats_cache table

### 4. Verify sandwiched song fix
- Test on real reprise show (e.g. Mike's Song > something > Mike's Song)

### 5. Desktop UAT continued
- Logo swap when Matthew delivers Canva version
- Further font/spacing pass on middle content

---

## OPEN BUGS / DEBT

- Rate limiting on /api/auth/login and /api/auth/register — Priority 1
- Top Shows blank until more community ratings exist (data problem, not code)
- Deep Phreeze new data fields won't populate until users run full sync
- Onboarding tour guide — deferred post-launch

---

## POST-LAUNCH (after July 4)

- Scheduled phish.net sync via Vercel cron
- Disposable email blocklist
- Welcome + weekly nudge emails via Resend
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Live show mode
- Phantasy Phishball — separate product

---

## Architecture Notes

- **phish.in**: fail gracefully, no key needed
- **phish.net API v5**: artistid=1 filter mandatory. review_text field. Pre-1998 needs limit 2500+.
- **Neon**: Never direct connect from Claude env.
- **GitHub token**: Rotates each session.
- **Vercel**: list_deployments requires projectId AND teamId.
- **CSS**: Always pull full file, rewrite clean, push. Never use attribute selectors for overrides.
- **JSX**: CSS property names are camelCase (writingMode not writing-mode).
- **Postgres**: posKey || song consistently — never mix keys in ratings map.
- **SaveCelebration**: onDone must be a ref, not inline — inline functions reset useEffect timer every render.
- **vercel.json**: Every new API route must be explicitly added to rewrites array before catch-all.
- **OTD cache**: Module-level in on-this-day.js, 1hr TTL, shared across all users.
