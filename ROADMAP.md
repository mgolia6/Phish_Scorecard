# Phreezer — Roadmap

## Target: Beta launch to Phish.net community. Phish summer tour starts July 7.
## Last updated: 2026-06-14

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
- CORS locked to phreezer.mpgink.com (was wildcard *)
- Explicit HS256 algorithm in JWT sign + verify
- Disposable email blocklist — ~40 providers blocked at registration
- All 45 API handlers updated to pass req for origin-aware CORS
- Client bundle audited — no secrets exposed

### Email System
- Onboarding email — fires after email verification, Uncle Ebenezer voice
- Day 3 nudge, Day 7 engage, Day 30 re-engage, milestone (5/25/50) emails
- Daily cron at 2pm UTC via Vercel cron
- email_log table prevents duplicates
- All from: Phreezer Support <phreezer.support@mpgink.com>

### Analytics + Error Monitoring (2026-06-13 / 2026-06-14)
- Sentry client wired in `main.jsx` — activates on `VITE_SENTRY_DSN` ⚠️ KEY NEEDED
- Sentry server wired in `api/_sentry.js` — activates on `SENTRY_DSN` ⚠️ KEY NEEDED
- Sentry wired into: audio/stream, ai/ebenezer, ai/summarize, auth/login, auth/register
- Posthog wired in — 20+ named events, identified users (activates on `VITE_POSTHOG_KEY`) ⚠️ KEY NEEDED
- analytics.js module — tab views, auth, scorecard opens, Ebenezer, tour, shop, feedback

### Privacy Policy
- PrivacyModal.jsx — plain-language, retro styled
- Linked from T&C modal (registration) and About tab (ProfileModal)

### Onboarding Tour
- 9-step centered modal — Ebenezer intro + 7 feature stops + outro
- No DOM targeting — works on mobile and desktop
- Server-side tour_completed flag — admin can RESET TOUR per user
- Fires after any onboarding path completes

### Shop + Donations
- Shop tab in ProfileModal — 3 Etsy listings (t-shirt, logo sticker, DSAP sticker)
- $1/item donated to Mockingbird Foundation
- Donation tracker — admin DONATIONS tab to log sales, public display in Shop + Community tabs
- Etsy OAuth integration built and ready — pending Etsy app review

### AI Usage Logging
- ai_usage_log table — logs every Ebenezer + Vibe Check call
- Tracks model, input/output tokens, estimated cost per call
- Admin AI USAGE tab — totals, by feature, by model, last 30 days, recent calls

### Admin Panel
- USERS, SYSTEM, API, EXTERNAL, AI USAGE, ERRORS, FEEDBACK, DONATIONS tabs
- MONITORING tab (2026-06-14) — activation status, user growth, rating activity, AI usage, email activity, feedback + donations

### Audio (2026-06-13 / fixed 2026-06-14)
- Audio proxy endpoint — pipes Phish.in MP3s server-side (CORS bypass)
- ES module streaming — Web Streams reader, no require()
- URL validation via hostname check — allows phish.in and CDN domains
- InlineAudioPlayer — full-width, play/pause, scrubber, seek, duration

### Scorecard — Song Card Redesign (2026-06-14)
- Mobile: title full width row 1 with green glow, controls row 2 (▶ · duration · badges · stars)
- Notes: auto-expanding textarea, green glow on focus, ▲ COLLAPSE button
- Song number: brighter orange, letter-spacing

### Profile / About
- ProfileModal: MY PHISH / BADGES / ABOUT / SHOP tabs
- About section: ihoz.com origin story, Phish.net foundation, Excel → app journey
- Shop tab: 3 Etsy listings + DonationCard

### UX
- Avatar pulses cyan → orange on every login until tapped
- OTD Carousel — all historical shows on today's date
- Deep Phreeze — full stats engine
- Uncle Ebenezer — desktop rail + mobile drawer

### Community
- Leaderboard, Top Shows, Top Songs, Top Venues
- Mockingbird donation banner at top

---

## PENDING / IN PROGRESS

### Monitoring Activation — Matthew action needed
- Create Sentry account → add `VITE_SENTRY_DSN` + `SENTRY_DSN` to Vercel
- Create Posthog account → add `VITE_POSTHOG_KEY` to Vercel
- Both no-op until keys added — no code changes needed

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
- Top Shows blank until more community ratings exist (data problem, not code)
- Deep Phreeze new data fields won't populate until users run full sync

---

## PROJECT MANAGEMENT PRIORITIES

### 🔴 IMMEDIATE — Before Forum Post Goes Live

**1. Monitoring activation** — add VITE_SENTRY_DSN, SENTRY_DSN, VITE_POSTHOG_KEY to Vercel

**2. UAT pass** — scorecard song cards, audio player, notes textarea on iOS Safari

**3. Forum post** — ready to publish, waiting on UAT confirmation

---

### 🟠 WEEK 1 POST-LAUNCH

**4. Bug Tracking — GitHub Issues**
- Enable Issues on the Phish_Scorecard repo (Matthew flips switch in repo settings)
- Label taxonomy: P0-critical / P1-high / P2-medium / P3-low + feature/bug/ux
- Triage weekly — move from in-app feedback → GitHub Issue

**5. Etsy OAuth activation** (once Etsy approves)

---

### 🟡 MONTH 1

**6. In-App Changelog**
- Version bump triggers a "What's New" modal on next login
- Simple: `app_version` in env var, `seen_version` on user record
- Shows last 3–5 changes in Ebenezer voice

**7. Feature Flags**
- `feature_flags` table: `user_id`, `flag_name`, `enabled`
- Admin panel toggle per user or globally

**8. Backup / Disaster Recovery**
- Document: Neon recovery tier, how to restore, RTO/RPO
- Verify point-in-time recovery is enabled on current plan

**9. Data Retention Policy**
- Define: inactive user data after 2 years → anonymized or deleted
- Document before you have 1000 users

---

## POST-LAUNCH (after beta stabilizes)

- Desktop logo — Matthew to deliver Canva version
- Middle section desktop expansion
- Phish Phreeze — band-level community subtab
- Scheduled phish.net sync via Vercel cron
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Live show mode
- Community feed — chronological post stream
- More Etsy listings as created

---

## Architecture Notes

- **phish.in**: fail gracefully, no key needed. Audio proxy via /api/audio/stream (ES module, Web Streams, hostname validation)
- **phish.net API v5**: artistid=1 filter mandatory. review_text field. Pre-1998 needs limit 2500+
- **Neon**: Never direct connect from Claude env
- **GitHub token**: Rotates each session
- **Vercel**: list_deployments requires projectId AND teamId
- **CSS**: Always pull full file, rewrite clean, push. Never append
- **JSX**: CSS property names are camelCase (writingMode not writing-mode)
- **Postgres**: posKey || song consistently — never mix keys in ratings map
- **SaveCelebration**: onDone must be a ref, not inline
- **vercel.json**: Every new API route must be explicitly added to rewrites before catch-all
- **ProfileModal**: return must be wrapped in `<>` fragment — PrivacyModal is a sibling
- **Etsy listings**: 4521118995 (logo sticker), 4521116067 (t-shirt), 4521316287 (DSAP sticker)
- **CRON_SECRET**: Set in Vercel env vars — required for cron endpoint auth
- **Tour state**: Server-side (tour_completed on users table) — admin can reset
- **donation_tracker**: Single row (id=1), cumulative items_sold, $1.00/item
- **Sentry**: VITE_SENTRY_DSN (client) + SENTRY_DSN (server) — same DSN, both needed
- **Audio player**: InlineAudioPlayer is named export from AudioPlayer.jsx (not separate file)
- **Song row keying**: Always posKey, never song name — sandwiched songs break name-based lookups
