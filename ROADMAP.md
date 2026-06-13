# Phreezer — Roadmap

## Target: Beta launch to Phish.net community. Phish summer tour starts July 7.
## Last updated: 2026-06-13

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
- Username required at registration — field exists in form, confirm it's enforced
- Top Shows blank until more community ratings exist (data problem, not code)
- Deep Phreeze new data fields won't populate until users run full sync
- phreezer.mpgink.com subdomain not yet configured in GoDaddy for Resend

---


---

## PROJECT MANAGEMENT PRIORITIES

### 🔴 IMMEDIATE — Before Forum Post Goes Live

**1. Error Monitoring — Sentry**
- Free tier, ~30 min to wire in
- Client-side: `@sentry/react` in main.jsx
- Server-side: `@sentry/node` in Vercel functions
- Without this: zero visibility into production errors once real users hit it
- DSN goes in Vercel env vars as `SENTRY_DSN`

**2. Discord Server**
- Matthew creates server, I help structure channels
- Suggested channels: #announcements, #feedback, #bugs, #show-ratings, #general
- Gives beta users a place to talk to each other and to you
- Post invite link in the app (About tab + onboarding outro)

**3. Beta Success Criteria — Define It**
- Proposed: 50 users · 500 shows rated · no P0 bugs for 14 consecutive days
- Without a definition you can't tell when beta is done
- Document in ROADMAP once agreed

---

### 🟠 WEEK 1 POST-LAUNCH

**4. Analytics — Posthog**
- Free tier, privacy-friendly, built for product analytics
- Track: feature usage, drop-off points, rating completion rate, tab engagement
- Self-hostable if privacy becomes a concern later
- ~2 hours to wire in

**5. Bug Tracking — GitHub Issues**
- Enable Issues on the Phish_Scorecard repo
- Label taxonomy: P0-critical / P1-high / P2-medium / P3-low + feature/bug/ux
- Triage weekly — move from Discord #bugs → GitHub Issue
- Replaces the current "lives in feedback and session logs" approach

**6. Privacy Policy Page**
- In-app route: `/privacy`
- Covers: what data is collected, how it's used, phish.net handle storage, email, ratings
- Links to it from footer, onboarding T&C screen, and About tab
- Does NOT need a lawyer — plain language is fine for beta

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
- Disposable email blocklist
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Live show mode
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

