# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## 🔴 OPEN — NEXT SESSION

### P0
- **Confirm desktop layout** — unconfirmed, Matthew has been on mobile all session

### P1 — Pre-beta
- **iOS Safari UAT** — not yet confirmed complete
- **GoDaddy DNS** — phreezer.mpgink.com subdomain in Resend (polish, not blocking)

### P2 — Ebenezer: Show Links in Responses
Full design decided this session. Build order:
1. Date parser — regex on response text, find dates like 11/17/97, 12/7/97, 1999-12-31
2. Wrap dates in tappable orange links in the chat renderer
3. Tap → show preview card appears at bottom of modal/drawer (venue, date, setlist highlights, Phreezer community rating)
4. Preview has OPEN SCORECARD button → navigates to show, collapses modal to rail
5. Conversation persists via sessionStorage — survives navigation, cleared on tab close
6. Song names in responses: lower priority, consider linking to MY SONGS filtered view

### P3 — Ebenezer: Remaining Improvements
- **Song intent detection** — fuzzy match against pn_songs DB vs ~40 hardcoded names
- **Show-specific Phreezer ratings in context** — include user song scores when asking about a show they've rated
- **pn_rating** — reach out to Phish.net about show rating API access; re-add to scorecard when confirmed
- **Expand review seed** — currently top 600 shows; consider broader pass

### P4 — Analytics
- **duration_seconds on ratings** — add column, populate from Phish.in at setlist load
- **Avg song length in top-songs API** — foundation for jam detection
- **Median song length across catalog** — flag outlier jams above/below median

### P5 — Email
- **Show rating reminder** — cron: user attended 7+ days ago, hasn't rated, send nudge
- **Milestone emails** — 25 and 50 shows rated

---

## ✅ COMPLETED

### 2026-06-17
- Ebenezer full knowledge base (songs, shows, reviews, jamcharts)
- Content moderation + anonymous logging + opt-out
- Expand modal on desktop
- Export conversation
- Admin SYSTEM tab reorganized with descriptions
- Admin MONITORING knowledge base panel
- Toast z-index + position fix
- Rate limiting on auth endpoints ✓
- Phish.net forum post published ✓
- Founder badges seeded ✓

### 2026-06-16
- All P0 crashes, filter rewrite, desktop landing
- Boot sequence, companion system, Ebenezer intent detection
- Email cron, founder badges, AI tab
- Community tab rewrite, desktop CSS pass

---

## Architecture Notes
- Boot: z-index 2000 | FullPageLoader: 1000 | Toast: 9500 | Ebenezer modal: 8000
- Ebenezer context order: [USER DATA] → [PHREEZER COMMUNITY] → [PHISH.NET LIVE DATA]
- Ebenezer DB: pn_songs, pn_shows, pn_reviews, jamchart_entries
- Anonymous log: ebenezer_log table — intent, era, keywords, lengths only. No user ID, no text.
- Phish.net v5 API: songs, shows, setlists, jamcharts, reviews — NO show ratings endpoint
- Jamchart cron: Monday 6am UTC via /api/admin/refresh-jamcharts
- Review seed: per-show endpoint /reviews/showdate/{date} — bulk endpoint has no text
- ebenezer_opt_out: stored on users table, synced to localStorage, checked server-side before logging
