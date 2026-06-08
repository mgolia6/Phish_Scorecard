# Phreezer — Roadmap

## Target: Community tab live + rate limiting before July 4. Phish summer tour starts July 7.
## Last updated: 2026-06-08 (daytime session)

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
- OTD carousel — swipe nav, all matching shows

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

### Admin
- User management, password reset, cascade delete, clear-cache

---

## NEXT SESSION — START HERE

### 1. Middle section desktop expansion
- Use the space better — wider content, better typography at desktop scale
- Desktop logo: Matthew to provide Canva version

### 2. Rate Limiting on Auth Endpoints (Priority 1 — security)
- /api/auth/register and /api/auth/login have no rate limiting
- 10 attempts/15min per IP, 429 with Retry-After header

### 3. Phish Phreeze — band-level Community subtab
- Total shows, songs, hours; breakdowns by day/month/country/state
- Cache in phish_stats_cache table

### 4. Top Shows threshold
- Currently blank — lower HAVING count or show 1+ rater

### 5. Verify sandwiched song fix
- Test on real reprise show (e.g. Mike's Song > something > Mike's Song)

### 6. Desktop UAT continued
- Logo swap when Matthew delivers Canva version
- Further font/spacing pass on middle content

---

## OPEN BUGS / DEBT

- /api/debug/reviews.js — exposed endpoint, should be deleted
- Admin endpoint /api/admin/migrate has no auth check
- Onboarding tour guide — deferred
- Top Shows blank until more community ratings exist
- Deep Phreeze new data fields won't populate until users run full sync

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
