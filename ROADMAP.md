# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## ✅ COMPLETED THIS SESSION (2026-06-16 Part 3)

- Feed: body truncation, compact new post box, bottom padding
- Boot sequence: typewriter effect, glitch exit, snowflake sizing, DON'T SUCK split, z-index fix
- Email cron: onboarding pass added, rate limiting, copy rewritten
- Welcome emails sent to existing users confirmed
- Founder badges: PHAB PHIVE (#1-5), EARLY PHREEZE (#6-20), admin seed button
- AI tab: full copy, responsible AI opener, three data layers, accurate feature descriptions
- Ebenezer: Phish.net live data injection (setlists, reviews, jamcharts, song histories)
- Ebenezer: Phreezer community aggregates in every session context
- Ebenezer: intent detection for show, song, recommendation queries
- FullPageLoader: restored everywhere, z-index fixed

---

## ✅ COMPLETED PRIOR (2026-06-16 Parts 1 & 2)
- All crashes, filter rewrite, DesktopLanding, SlotMachine, scorecard browse without login
- Companion system, Phriend Overlap gate, Ebenezer pinned post
- Mike Says No, boot sequence initial, desktop card stats
- 4 community APIs upgraded, CommunityTab rewrite, profile modal desktop, feed desktop

---

## 🔴 OPEN — NEXT SESSION

### P0
- **Seed founder badges** — one tap in admin SYSTEM tab
- **Confirm desktop layout** — unconfirmed, Matthew was on mobile all day

### P1 — Pre-beta checklist
- **GoDaddy DNS** — phreezer.mpgink.com subdomain in Resend
- **iOS Safari UAT** — not yet confirmed complete
- **Publish Phish.net forum post** — drafted, held pending readiness

### P2 — Ebenezer improvements
- **Song intent detection expansion** — currently ~40 songs hardcoded, switch to fuzzy match against shows DB or expand list
- **Show-specific Phreezer ratings in context** — when user asks about a show they rated, include their song-level scores

### P3 — Analytics
- **duration_seconds on ratings** — add column, populate from Phish.in at setlist load time
- **Avg song length in top-songs API** — foundation for jam detection (above/below median)
- **Median song length across catalog** — compare avg vs median to flag outlier jams

### P4 — Email
- **Show rating reminder** — cron: if user attended a show 7+ days ago and hasn't rated it, nudge
- **Milestone emails** — 25 and 50 shows rated (5 already wired)

---

## Architecture Notes
- Boot sequence: celebrate-overlay z-index 2000, fullpage-loader z-index 1000 — boot always wins
- Ebenezer context: [USER DATA] + [PHREEZER AGGREGATES] + [PHISH.NET LIVE DATA] every call
- Intent detection in ebenezer.js — date regex, ~40 song names, recommendation keywords
- Founder badges: user_badges table, idempotent seed, door closes at signup #20
- email_log table: deduplication key (user_id, email_type), 300ms between sends
- Song duration: NOT stored in DB — deferred analytics surface
- PHISH_NET_API_KEY env var used for all Phish.net API calls
- PHREEZER_RESEND_API_KEY env var for all email sends
