# Phreezer — Roadmap

## Target: Beta launch to Phish.net community. Phish summer tour starts July 7.
## Last updated: 2026-06-13 (evening, final)

---

## BETA SUCCESS CRITERIA

**Beta is done when all three are true:**
- **50 registered users** with verified email addresses
- **500 shows rated** (aggregate across all users)
- **14 consecutive days** with no P0 bugs (app down, data loss, auth broken, security issue)

**P0 definition:** App is unreachable · User data is lost or corrupted · Auth is bypassed or broken · Security vulnerability actively exploited

**What happens after beta:**
- Forum post closes / transitions to permanent listing
- v1.0 tag on repo
- Feature development resumes (Phish Phreeze subtab, mini player, tour grouping, etc.)

---
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
- Rate limiting — login (10/15min), register (5/60min) per IP — MIKE SAYS NO screen on 429
- Verification email via Resend from noreply@mpgink.com
- RESEND_API_KEY in Vercel shared env

### Email System (2026-06-13)
- Onboarding email — fires after email verification, Uncle Ebenezer voice
- Day 3 nudge — fires if zero ratings after 3 days
- Day 7 engage — fires if 1+ ratings after 7 days, shows count
- Day 30 re-engage — fires if inactive 30+ days, resets every 60 days
- Milestone emails — 5, 25, 50 shows phrozen
- Daily cron at 2pm UTC via Vercel cron
- email_log table prevents duplicates
- All from: Phreezer Support <phreezer.support@mpgink.com>

### Analytics + Error Monitoring (2026-06-13)
- Sentry wired in — ErrorBoundary, browser tracing, session replay (activates on VITE_SENTRY_DSN)
- Posthog wired in — 20+ named events, identified users, explicit tracking (activates on VITE_POSTHOG_KEY)
- analytics.js module — tab views, auth, scorecard opens, Ebenezer, tour, shop, feedback

### Privacy Policy (2026-06-13)
- PrivacyModal.jsx — plain-language, retro styled
- Linked from T&C modal (registration) and About tab (ProfileModal)

### Onboarding Tour (2026-06-13)
- 9-step centered modal — Ebenezer intro + 7 feature stops + outro
- No DOM targeting — works on mobile and desktop
- Server-side tour_completed flag — admin can RESET TOUR per user
- Fires after any onboarding path completes

### Shop + Donations (2026-06-13)
- Shop tab in ProfileModal — 3 Etsy listings (t-shirt, logo sticker, DSAP sticker)
- $1/item donated to Mockingbird Foundation
- Donation tracker — admin DONATIONS tab to log sales, public display in Shop + Community tabs
- Etsy OAuth integration built and ready — pending Etsy app review

### AI Usage Logging (2026-06-13)
- ai_usage_log table — logs every Ebenezer + Vibe Check call
- Tracks model, input/output tokens, estimated cost per call
- Admin AI USAGE tab — totals, by feature, by model, last 30 days, recent calls

### Admin Panel
- USERS: collapsible cards, all actions — Reset Onboarding, Reset Tour, Reset Password, Clear Data, Delete
- Clear Data now wipes user_show_attendance (Albany show bug fixed)
- SYSTEM: live DB stats, Run Migrations, Clear Cache
- API HEALTH: probes all internal endpoints
- EXTERNAL: probes Phish.net, Phish.in, Anthropic, Resend
- AI USAGE: full token/cost dashboard
- ERRORS: console capture, export
- FEEDBACK: full inbox
- DONATIONS: items sold input, total donated display

### Audio (2026-06-13)
- Audio proxy endpoint — pipes Phish.in MP3s server-side (CORS bypass)
- Inline audio player in scorecard — expandable drop-down per song row
- Play/pause, scrubber, seek, duration — no external navigation

### Profile / About (2026-06-13)
- ProfileModal: MY PHISH / BADGES / ABOUT / SHOP tabs
- About section: ihoz.com origin story, Phish.net foundation, Excel → app journey
- Shop tab: 3 Etsy listings + DonationCard

### Ebenezer (2026-06-13)
- System prompt rewritten — loving jaded vet character
- Sees 400+ shows, dry/weary but genuine love underneath
- Token usage logged after every call

### UX
- Avatar pulses cyan → orange on every login until tapped
- OTD Carousel — all historical shows on today's date
- Deep Phreeze — full stats engine
- Uncle Ebenezer — desktop rail + mobile drawer

### KPI / Scorecard Fixes
- SHOWS / TOP VENUE / FIRST SHOW count from both attendance tables
- posKey keying throughout — sandwiched/reprised songs correct
- SaveCelebration black screen fixed

### Community
- Leaderboard, Top Shows, Top Songs, Top Venues
- Mockingbird donation banner at top

### Security Hardening (2026-06-13)
- CORS locked to phreezer.mpgink.com (was wildcard *)
- Explicit HS256 algorithm in JWT sign + verify
- Disposable email blocklist — ~40 providers blocked at registration
- All 45 API handlers updated to pass req for origin-aware CORS
- Open unauthenticated migration endpoint on feedback/submit removed
- All admin endpoints confirmed auth-gated (migrate.js was already correct)
- Client bundle audited — no secrets exposed


---

## PENDING / IN PROGRESS

### Etsy OAuth Integration
- Built and ready: api/etsy/auth.js, api/etsy/callback.js, api/etsy/sync.js
- Pending: Etsy developer app review (1-3 business days)
- Once approved: visit /api/etsy/auth once to authorize, cron handles rest

### Phish.net Profile Import Test
- Waiting on buddy to test .net profile + data upload
- Username pre-fill from .net handle on import (built, needs UAT)

---

## OPEN BUGS / DEBT

- Tour guide UAT needed after reset — confirm 9-step flow works end to end
- ~~Username required at registration~~ ✅ confirmed — backend enforces, frontend has required attribute
- Top Shows blank until more community ratings exist (data problem, not code)
- Deep Phreeze new data fields won't populate until users run full sync
- ~~phreezer.mpgink.com subdomain~~ — confirmed live, mpgink.com domain already configured in Resend ✅

---


---

## PROJECT MANAGEMENT PRIORITIES

### 🔴 IMMEDIATE — Before Forum Post Goes Live

**1. Error Monitoring — Sentry** ✅ (2026-06-13 — code shipped, Matthew adds VITE_SENTRY_DSN to Vercel to activate)

**2. Discord Server** — deferred until post-launch or if beta volume warrants it

**3. Beta Success Criteria** ✅ (2026-06-13 — 50 users · 500 shows rated · 14 days no P0 — documented above)

---

### 🟠 WEEK 1 POST-LAUNCH

**4. Analytics — Posthog** ✅ (2026-06-13 — code shipped, Matthew adds VITE_POSTHOG_KEY to Vercel to activate)

**5. Bug Tracking — GitHub Issues**
- Enable Issues on the Phish_Scorecard repo (Matthew flips switch in repo settings)
- Label taxonomy: P0-critical / P1-high / P2-medium / P3-low + feature/bug/ux
- Triage weekly — move from in-app feedback → GitHub Issue
- Replaces the current "lives in session logs" approach

**6. Privacy Policy Page** ✅ (2026-06-13 — PrivacyModal component, linked from T&C modal + About tab)

---

### 🟡 MONTH 1

**7. In-App Changelog**
- Version bump triggers a "What's New" modal on next login
- Simple: `app_version` in env var, `seen_version` on user record
- Shows last 3–5 changes in Ebenezer voice
- Builds trust, makes updates feel intentional

**8. Feature Flags**
- `feature_flags` table: `user_id`, `flag_name`, `enabled`
- Admin panel toggle per user or globally
- Lets you test features on subset of users before rolling out
- Especially useful for anything controversial or experimental

**9. Backup / Disaster Recovery**
- Document: Neon recovery tier, how to restore, RTO/RPO
- Verify point-in-time recovery is enabled on current plan
- 30 min to document, could save the app if something goes wrong

**10. Data Retention Policy**
- Define: inactive user data after 2 years → anonymized or deleted
- Define: account deletion → what gets wiped, what gets aggregated
- Document before you have 1000 users — much harder to retrofit

---

## POST-LAUNCH (after beta stabilizes)

- In-app Phish.in streaming polish — mini persistent player bar across full scorecard
- Desktop logo — Matthew to deliver Canva version
- Middle section desktop expansion
- Phish Phreeze — band-level community subtab (total shows, songs, hours, era breakdowns)
- Scheduled phish.net sync via Vercel cron
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Live show mode
- Community feed — chronological post stream in Community tab (short takes, one-level replies, no threading)
- More Etsy listings as created — add to Shop tab

---

## Architecture Notes

- **phish.in**: fail gracefully, no key needed. Audio proxy via /api/audio/stream (CORS bypass)
- **phish.net API v5**: artistid=1 filter mandatory. review_text field. Pre-1998 needs limit 2500+
- **Neon**: Never direct connect from Claude env
- **GitHub token**: Rotates each session
- **Vercel**: list_deployments requires projectId AND teamId
- **CSS**: Always pull full file, rewrite clean, push. Never append
- **JSX**: CSS property names are camelCase (writingMode not writing-mode)
- **Postgres**: posKey || song consistently — never mix keys in ratings map
- **SaveCelebration**: onDone must be a ref, not inline
- **vercel.json**: Every new API route must be explicitly added to rewrites before catch-all
- **Etsy listings**: 4521118995 (logo sticker), 4521116067 (t-shirt), 4521316287 (DSAP sticker)
- **CRON_SECRET**: Set in Vercel env vars — required for cron endpoint auth
- **Tour state**: Server-side (tour_completed on users table) — admin can reset
- **donation_tracker**: Single row (id=1), cumulative items_sold, $1.00/item


