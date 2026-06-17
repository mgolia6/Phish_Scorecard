# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## ✅ COMPLETED THIS SESSION (2026-06-17)

- Ebenezer: syntax error fixed (formatPhreezeerContext broken multiline strings)
- Ebenezer: jamchart hallucination fix — never claims missing data when it's in context
- Ebenezer: hard ban on "see live" / future show recommendations
- Ebenezer: intent detection expanded (cow funk, funk, nasty, type ii, find me, etc.)
- Ebenezer: full Phish.net knowledge base — songs (3,171), shows (4,082), reviews (1,847), jamcharts (2,500+)
- Ebenezer: DB search for vibe queries — pulls jamcharts + reviews by keyword + era
- Ebenezer: song facts (play count, debut, gap), show context (venue, tour, teases, guests)
- Admin SYSTEM tab: reorganized with groups, always-visible descriptions, no tooltips
- Admin SYSTEM tab: SEED PHISH.NET FULL CATALOG button
- Admin MONITORING tab: Ebenezer knowledge base panel with counts + refresh status
- Admin MONITORING tab: fixed email_verified column, added shows_rated + raters
- Toast notification: z-index 9500, bottom-center, clears header and tab bar
- Seed result modal: full diagnostic output (shows_processed, errors, field names)
- pn_rating display: hidden pending Phish.net API inquiry (not in v5 API)
- Rate limiting on auth endpoints: confirmed complete
- Phish.net forum post: confirmed published

---

## ✅ COMPLETED PRIOR (2026-06-16)

- All crashes, filter rewrite, DesktopLanding, SlotMachine, scorecard browse without login
- Companion system, Phriend Overlap gate, Ebenezer pinned post
- Boot sequence, desktop card stats, community APIs, CommunityTab rewrite
- Founder badges: PHAB PHIVE (#1-5), EARLY PHREEZE (#6-20), admin seed button
- Email cron: onboarding pass, rate limiting, copy rewritten, welcome emails confirmed
- AI tab: full copy, responsible AI opener, three data layers

---

## 🔴 OPEN — NEXT SESSION

### P0
- **Confirm desktop layout** — unconfirmed, Matthew has been on mobile

### P1 — Pre-beta checklist
- **iOS Safari UAT** — not yet confirmed complete
- **GoDaddy DNS** — phreezer.mpgink.com subdomain in Resend (polish, not blocking)

### P2 — Ebenezer improvements
- **pn_rating** — reach out to Phish.net about show rating API access; re-add to scorecard when available
- **Song intent detection** — fuzzy match against songs DB vs hardcoded ~40 names
- **Show-specific Phreezer ratings in context** — include user's song scores when asking about a show they rated
- **Expand review seed** — currently top 600 shows; consider broader pass after confirmed working

### P3 — Analytics
- **duration_seconds on ratings** — add column, populate from Phish.in at setlist load
- **Avg song length in top-songs API** — foundation for jam detection
- **Median song length across catalog** — flag outlier jams

### P4 — Email
- **Show rating reminder** — cron: user attended 7+ days ago, hasn't rated, send nudge
- **Milestone emails** — 25 and 50 shows rated

---

## Architecture Notes
- Boot sequence: celebrate-overlay z-index 2000, fullpage-loader z-index 1000
- Toast: z-index 9500, bottom: 100px, bottom-center
- Ebenezer context: [USER DATA] + [PHREEZER AGGREGATES] + [PHISH.NET LIVE DATA] every call
- Ebenezer DB: pn_songs, pn_shows, pn_reviews, jamchart_entries — seeded via admin
- Ebenezer intent: date regex, song names, recommendation keywords, vibe keywords
- Founder badges: user_badges table, idempotent seed, door closes at signup #20
- email_log table: deduplication key (user_id, email_type), 300ms between sends
- Phish.net v5 API: songs, shows, setlists, jamcharts, reviews — NO show ratings endpoint
- PHISH_NET_API_KEY + PHREEZER_RESEND_API_KEY env vars
- Jamchart refresh: Monday 6am UTC cron via /api/admin/refresh-jamcharts
