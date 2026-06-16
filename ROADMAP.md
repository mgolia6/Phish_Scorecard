# Phreezer — Roadmap

## Target: Beta launch to Phish.net community. Phish summer tour starts July 7.
## Last updated: 2026-06-16

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
- CORS locked to phreezer.mpgink.com
- Explicit HS256 algorithm in JWT sign + verify
- Disposable email blocklist — ~40 providers blocked at registration
- All 45 API handlers updated for origin-aware CORS
- Client bundle audited — no secrets exposed

### Analytics + Error Monitoring
- Sentry client — VITE_SENTRY_DSN added to Vercel ✅ ACTIVE
- Sentry server — SENTRY_DSN added to Vercel ✅ ACTIVE
- Posthog — VITE_POSTHOG_KEY added to Vercel ✅ ACTIVE
- Sentry wired into: audio/stream, ai/ebenezer, ai/summarize, auth/login, auth/register
- analytics.js — 20+ named events, identified users

### Email System
- Onboarding, Day 3 nudge, Day 7 engage, Day 30 re-engage, milestone (5/25/50) emails
- Daily cron at 2pm UTC via Vercel cron
- email_log table prevents duplicates
- All from: Phreezer Support <phreezer.support@mpgink.com>

### Privacy Policy
- PrivacyModal.jsx — plain-language, retro styled
- Linked from T&C modal and About tab

### Onboarding Tour
- 9-step centered modal — works on mobile and desktop
- Server-side tour_completed flag — admin can RESET TOUR per user

### Shop + Donations
- Shop tab in ProfileModal — 3 Etsy listings (t-shirt, logo sticker, DSAP sticker)
- $1/item donated to Mockingbird Foundation
- Donation tracker — admin DONATIONS tab
- Etsy OAuth integration built and ready — pending Etsy app review

### AI Usage Logging
- ai_usage_log table — logs every Ebenezer + Vibe Check call
- Admin AI USAGE tab — totals, by feature, by model, last 30 days

### Admin Panel
- USERS, SYSTEM, API, EXTERNAL, AI USAGE, ERRORS, FEEDBACK, DONATIONS, MONITORING tabs

### Audio
- Audio proxy endpoint — pipes Phish.in MP3s server-side (CORS bypass, ES module, Web Streams)
- InlineAudioPlayer — full-width, play/pause, scrubber, seek, duration ✅ UAT confirmed

### Scorecard — Song Card Redesign
- Mobile: title full width row 1, controls row 2 (▶ · duration · badges · stars) ✅ UAT confirmed
- Notes: auto-expanding textarea, green glow on focus, ▲ COLLAPSE ✅ UAT confirmed

### Profile / About
- ProfileModal: MY PHISH / BADGES / ABOUT / SHOP tabs
- About section: ihoz.com origin story, Phish.net foundation, Excel → app journey

### UX
- Avatar pulses cyan → orange on every login until tapped
- OTD Carousel, Deep Phreeze, Uncle Ebenezer (desktop + mobile)

### Community
- Leaderboard, Top Shows, Top Songs, Top Venues
- Mockingbird donation banner

### Phish.net Import
- Matthew's own import confirmed working ✅
- Buddy UAT: deemed not a blocker

### Forum Post
- Posted 2026-06-15 ✅
- First real users signed up same day ✅

### STTF Outreach
- Email sent to Christy at Surrender to the Flow — pitching Phreezer mention
- Awaiting reply

### Email Verification (fixed 2026-06-16) ✅
- Root cause was broken `RESEND_API_KEY` — replaced with `PHREEZER_RESEND_API_KEY`
- `sendVerificationEmail` now throws properly on Resend failure
- End-to-end verified working

### Admin Panel improvements (2026-06-16) ✅
- USERS tab: KPI bar (TOTAL / VERIFIED / RATED / .NET LINKED)
- USERS tab: RESEND VERIFY button on unverified users
- USERS tab: VERIFIED stat in expanded user card
- EXTERNAL tab: Phish.net / Anthropic / Resend now proxied server-side via `api/admin/health.js`

### Phriend Overlap (fixed 2026-06-16) ✅
- Fixed `s.showdate` → `s.show_date` column name bug
- Fixed attendance query to union `attendance` + `user_show_attendance` for both users

### Error handling (2026-06-16) ✅
- try/catch added to `companions.js`, `deep-phreeze.js`, `phriend-overlap.js`
- All high-traffic endpoints now protected

### Floating button label (2026-06-16) ✅
- Updated from "ASK" to "ASK EBENEZER"

### Wrap protocol overhaul (2026-06-16) ✅
- INSTRUCTIONS.md rewritten with explicit 8-step checklist

---

## PENDING / IN PROGRESS

### Etsy OAuth Integration
- Built and ready: api/etsy/auth.js, api/etsy/callback.js, api/etsy/sync.js
- Pending: Etsy developer app review
- Once approved: visit /api/etsy/auth once to authorize, cron handles rest

---

## OPEN BUGS / DEBT

- Top Shows blank until more community ratings exist (data problem, not code)
- Deep Phreeze new data fields won't populate until users run full sync
- In-memory rate limiter: less effective across multiple Vercel function instances (not a crash risk)
- Dual attendance table pattern (`attendance` + `user_show_attendance`) — other queries may have same blind spot as Phriend Overlap had; audit needed
- Frontend error messages: some still show raw API error strings — needs standardization pass

---

## PROJECT MANAGEMENT PRIORITIES

### 🔴 IMMEDIATE
1. **Monitor** — signups, errors (Sentry), usage (Posthog), feedback tab ← live users now
2. **Attendance query audit** — check other endpoints that join on attendance for dual-table blind spot
3. **Frontend error message standardization** — replace raw API errors with friendly messages

### 🟠 WEEK 1 POST-LAUNCH
3. **Enable GitHub Issues** — Matthew flips switch in repo settings, set up label taxonomy
4. **Etsy OAuth activation** — once Etsy approves
5. **Watch for STTF reply**

### 🟡 MONTH 1
6. **In-App Changelog** — "What's New" modal on version bump
7. **Feature Flags** — feature_flags table, admin toggle per user/globally
8. **Backup / Disaster Recovery** — document Neon recovery, verify PITR enabled
9. **Data Retention Policy** — define before 1000 users

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
