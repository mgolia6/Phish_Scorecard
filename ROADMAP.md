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
- **iOS Safari UAT** — not yet confirmed complete
- **GoDaddy DNS** — phreezer.mpgink.com subdomain in Resend (polish, not blocking)

### P2 — Engagement / Retention
- **Show rating reminder email** — cron: user attended 7+ days ago, hasn't rated, send nudge. 12/16 users have zero ratings — highest leverage item.
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
