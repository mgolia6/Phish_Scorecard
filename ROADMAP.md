# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## 🔴 OPEN — NEXT SESSION

### P0
- **Desktop UAT pass** — Matthew to do full recorded walkthrough. Known issues: font sizes, visual polish, scorecard overlay goes full-screen hiding sidebar/rail (needs proper fix during UAT pass). Blocking beta.

### P1 — Pre-beta
- **iOS Safari UAT** — not yet confirmed complete (mobile chrome/safe-area pass done 2026-06-25)
- **Light-mode logo asset** — light mode is RELEASED (gate removed 2026-06-25). Remaining: the tagline under the PHREEZER wordmark is baked into the (light-colored) logo PNG and washes out on light. Need a dark-ink logo for light theme, or render wordmark+tagline as live text. Plus a final sweep for stray hardcoded hex literals.
- **GoDaddy DNS** — phreezer.mpgink.com subdomain in Resend (polish, not blocking)
- **Sentry DSN fix** — malformed org ID in Vercel env var, Matthew to correct

### P2 — Engagement / Retention
- **Show rating reminder email** ✅ 2026-06-18 — ships on tomorrow's cron
- **Phriend activity feed** — what your phriends rated this week. Low lift, high engagement for tight beta community.
- **Show of the week** — admin-pinned show, everyone rates it, creates shared moment.
- **Milestone emails** — 25 and 50 shows rated

### P3 — Ebenezer: Show Links in Responses
1. Date parser — regex on response text
2. Wrap dates in tappable orange links in chat renderer
3. Tap → preview card (venue, date, setlist highlights, Phreezer rating)
4. Preview has OPEN SCORECARD button
5. Conversation persists via sessionStorage

### P4 — Ebenezer: Remaining
- Song intent fuzzy match vs pn_songs DB
- Show-specific Phreezer ratings in context
- pn_rating — reach out to Phish.net; re-add when confirmed
- Expand review seed beyond top 600 shows

### P5 — Badge System: Remaining Triggers
- Attendance badges (ten/quarter/fifty/century) — wire into import endpoint
- CRITIC badge — wire into Phish.net link flow
- Streak badges (streak_7/streak_30) — Vercel cron, daily login tracking
- Era badges (future) — 10+ shows per era

### P6 — Analytics
- duration_seconds on ratings — populate from Phish.in at setlist load
- Avg song length in top-songs API
- Median song length — flag outlier jams

---

## ✅ COMPLETED

### 2026-06-25
- **Light mode** — full theme system (admin-gated sandbox): theme.js + `[data-theme="light"]` token overrides; Phases 2a–2e (RGB hue tokens, inset/hairline tokens, `--ink-rgb` dimmed-white text, low-alpha colored-text 0.7 floor sweep); readability passes (`--card-deep` cards, `#fff`→`--white`, darker text tokens, AI/Shop ink lifts, avatar tiles, SHOW NOTES, masthead labels). Dark mode byte-identical.
- **My Phriends dropdown** — pick a phriend from the overlap-suggestions list / typeahead instead of recalling a username
- **Email admin triggers** — `/api/admin/send-email` (en masse + per-user); fixed lifecycle emails not sending (cron Bearer auth + direct `runLifecycleEmails`); weekly reminders (Tuesdays, ISO-week-stamped); RFC-8058 one-click unsubscribe (`/api/emails/unsubscribe`); per-user Claude cost; Haiku pricing fix; moderation-call logging
- **Admin user cards** — dedupe, button grid, per-user email nudge; admin fonts bumped; AI-usage dates formatted
- **Scorecard** — "ANOTHER RANDOM SHOW" re-roll on loaded show; phriend-tag input autofill hardening
- **PHAN ROLL** — Leaderboard renamed (non-competitive) + bigger fonts
- **Mobile chrome** — `viewport-fit=cover` (activated all safe-area insets); bottom-nav label-clipping fix; header bottom-up gradient + notch fill; top-overscroll reveal fix
- **Cache** — no-cache headers on index.html (vercel.json) — fixes recurring stale-bundle
- **Boot/loader** — bigger melt→puddle→cascading-wake snowflake before glitch; loading-line "TASK..... OK" on one line; FullPageLoader snowflake enlarged
- **Font audit** — too-small subtext bumped app-wide (KPIs left as-is)

### 2026-06-18
- Tweezerfest dedupe fix — Deep Phreeze MOST HEARD now counts shows, not raw setlist rows
- 1ST BUG badge (🐛 IT DOES MATTER) — added to BadgeCelebration, awarded to lbag420
- Rating reminder email — template + cron pass, fires tomorrow to attended-but-unrated users
- CLAUDE.md — Claude Code handoff doc added to repo root

### 2026-06-17 (Part 2)
- Deep Phreeze promoted to second in mobile + desktop nav
- Primary tabs moved to fixed bottom nav on mobile
- Boot sequence: single joke line, OK pause, cleaner flow
- Changelog modal (v2.1) — shows once per version
- Badge celebration system — full-screen, sequential queue, real-time + login catch-up
- seed-founder-badges bulk upsert fix

### 2026-06-17 (Part 1)
- Ebenezer full knowledge base (songs, shows, reviews, jamcharts)
- Content moderation + anonymous logging + opt-out
- Expand modal on desktop, export conversation
- Admin SYSTEM tab reorganized, MONITORING knowledge base panel
- Toast z-index + position fix
- Rate limiting on auth endpoints
- Phish.net forum post published
- Founder badges seeded

### 2026-06-16
- All P0 crashes, filter rewrite, desktop landing, boot sequence
- Companion system, Ebenezer intent detection
- Email cron, founder badges, AI tab
- Community tab rewrite, desktop CSS pass

---

## Architecture Notes
- Boot: z-index 2000 | FullPageLoader: 1000 | Toast: 9500 | Ebenezer modal: 8000 | BadgeCelebration: 5000 | ChangelogModal: 4000
- Bottom nav: fixed, 72px, mobile only (max-width: 768px)
- Ebenezer FAB: bottom 88px (clears bottom nav) | Drawer: bottom 72px
- Badge notified_at: NULL = unseen. Fetched on login, marked seen via POST /api/user/badges
- Real-time badge trigger: ratings save → checks milestones → returns new_badges → fires 2.8s after save celebration
- CHANGELOG_VERSION in ChangelogModal.jsx — bump per release with user-facing changes
- Ebenezer context order: [USER DATA] → [PHREEZER COMMUNITY] → [PHISH.NET LIVE DATA]
- Phish.net v5 API: no show ratings endpoint confirmed
- Jamchart cron: Monday 6am UTC
- reviewer badge key deprecated — use critic
- Theme: `[data-theme="light"]` on `<html>` via theme.js; tokens flip, dark values == originals. Toggle admin-gated until release.
- `viewport-fit=cover` is required for `env(safe-area-inset-*)` to be non-zero — header/modal/bottom-nav safe-area handling depends on it
- vercel.json sets `Cache-Control: no-cache` on `/` and `/index.html` (SPA HTML always revalidates; hashed assets stay cached)
- Weekly reminder email type: `weekly_YYYY-Www` (ISO week) — dedup via email_log unique (user_id, email_type)
