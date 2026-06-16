# Phreezer — Roadmap

## Target: Beta launch to Phish.net community. Phish summer tour starts July 7.
## Last updated: 2026-06-17

---

## BETA SUCCESS CRITERIA

**Beta is done when all three are true:**
- **50 registered users** with verified email addresses
- **500 shows rated** (aggregate across all users)
- **14 consecutive days** with no P0 bugs (app down, data loss, auth broken, security issue)

**P0 definition:** App is unreachable · User data is lost or corrupted · Auth is bypassed or broken · Security vulnerability actively exploited

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
- Rate limiting — login (10/15min), register (5/60min) per IP
- CORS locked to phreezer.mpgink.com
- Explicit HS256 algorithm in JWT sign + verify
- Disposable email blocklist
- All 45 API handlers updated for origin-aware CORS

### Analytics + Error Monitoring
- Sentry client + server ✅ ACTIVE
- Posthog ✅ ACTIVE
- analytics.js — 20+ named events

### Email System
- Onboarding, Day 3/7/30 nudge, milestone emails
- Daily cron at 2pm UTC
- email_log table prevents duplicates

### Privacy Policy
- PrivacyModal.jsx — plain-language, retro styled

### Onboarding Tour
- 9-step centered modal, server-side tour_completed flag

### Shop + Donations
- Shop tab in ProfileModal — 3 Etsy listings
- Mockingbird Foundation donation tracker
- Etsy OAuth built — pending Etsy app review

### AI Usage Logging
- ai_usage_log table, admin AI USAGE tab

### Admin Panel
- USERS, SYSTEM, API, EXTERNAL, AI USAGE, ERRORS, FEEDBACK, DONATIONS, MONITORING tabs

### Audio
- Audio proxy endpoint + InlineAudioPlayer ✅ UAT confirmed

### Scorecard
- Song card redesign (column layout mobile) ✅ UAT confirmed
- Notes auto-expanding textarea ✅ UAT confirmed
- **Attendance type mandatory** — prompt modal on first star tap (2026-06-17) ✅

### Community
- Leaderboard, Top Shows, Top Songs, Top Venues, Top States
- Mockingbird donation banner

### Phriend Overlap (2026-06-17) ✅
- Autocomplete dropdown with attendance-based suggestions
- Suggestions union attendance + Phish.net import + ratings
- Tap to select, no handle memorization required
- Fixed column name bug + dual-table blind spot

### Phish Phreeze Feed (2026-06-17) ✅
- `PhreezeFeed.jsx` component
- Posts API: GET (paginated, category-filtered) + POST
- Replies API: GET + POST
- React (upvote toggle) API
- Tables: posts, post_replies, post_reactions (auto-created on first request)
- Categories: GENERAL / SHOW / SONG / VENUE / FEEDBACK
- FEED is first/default COMMUNITY subtab
- Sidebar updated

### Entry animation (2026-06-17) ✅
- Terminal boot sequence replaces particle fireworks
- 8-line rotating Phish joke pool (2 picked per login)
- 5.8s runtime, tap to skip

### Forum Post
- Posted 2026-06-15 ✅
- First real users signed up same day ✅

### Email Verification (fixed 2026-06-16) ✅
### Admin Panel improvements (2026-06-16) ✅
### Error handling audit (2026-06-16) ✅
### Wrap protocol overhaul (2026-06-16) ✅

---

## PENDING / IN PROGRESS

### Etsy OAuth Integration
- Built and ready — pending Etsy developer app review

### GitHub Repo — Make Private
- Matthew to do in GitHub Settings → Danger Zone tomorrow

---

## OPEN BUGS / DEBT

- Feed: no moderation UI in admin panel yet (soft delete exists in DB)
- Feed: no reply notifications
- Top Shows blank until more community ratings exist (data problem)
- Deep Phreeze new data fields won't populate until users run full sync
- In-memory rate limiter: less effective across multiple Vercel instances
- Dual attendance table pattern — other queries may have same blind spot (companions, deep-phreeze era data, etc.)
- Frontend error messages: some still show raw API error strings

---

## PROJECT MANAGEMENT PRIORITIES

### 🔴 IMMEDIATE
1. **Monitor** — signups, errors (Sentry), usage (Posthog), Feed posts
2. **Feed moderation** — admin surface to soft-delete posts/replies
3. **Attendance query audit** — other endpoints that join on attendance for dual-table blind spot

### 🟠 WEEK 1 POST-LAUNCH
4. **Enable GitHub Issues** — Matthew flips switch in repo settings
5. **Etsy OAuth activation** — once Etsy approves
6. **Watch for STTF reply**

### 🟡 MONTH 1
7. **In-App Changelog** — "What's New" modal on version bump
8. **Feature Flags** — feature_flags table, admin toggle
9. **Backup / Disaster Recovery** — document Neon recovery, verify PITR
10. **Data Retention Policy** — define before 1000 users
11. **Feed notifications** — reply alerts

---

## POST-LAUNCH (after beta stabilizes)

- Desktop logo — Matthew to deliver Canva version
- Middle section desktop expansion
- Scheduled phish.net sync via Vercel cron
- Tour grouping in My Shows
- Export ratings to CSV
- Jam chart filter in setlist view
- Live show mode
- More Etsy listings as created
- Feed: category filtering, user profile pages, pinned posts, mod tools

---

## Architecture Notes

- **phish.in**: fail gracefully, audio proxy via /api/audio/stream
- **phish.net API v5**: artistid=1 filter mandatory
- **Neon**: Never direct connect from Claude env
- **GitHub token**: Rotates each session
- **Vercel**: list_deployments requires projectId AND teamId
- **CSS**: Always pull full file, rewrite clean, push. Never append
- **JSX**: CSS property names are camelCase
- **Postgres**: posKey consistently — never mix keys in ratings map
- **SaveCelebration**: onDone must be a ref, not inline
- **vercel.json**: Every new API route must be explicitly added before catch-all
- **ProfileModal**: return must be wrapped in fragment
- **Feed tables**: auto-created via CREATE TABLE IF NOT EXISTS — no separate migration needed
- **Attendance suggestions**: union all three sources (user_show_attendance + attendance + ratings)
- **Boot joke pool**: in Celebrations.jsx JOKE_LINES array — add new lines there
