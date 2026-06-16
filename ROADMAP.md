# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated  
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## ✅ COMPLETED THIS SESSION (2026-06-16 Part 2)

### P0 Fix
- Ebenezer post now shows "Uncle Ebenezer" (author_label display fixed in PhreezeFeed)
- Feed action buttons visible and tappable on desktop
- NewPostBox added — logged-in users can post to feed inline

### API Upgrades
- top-songs: by-set breakdown, first/last rated date, unique shows, user avg delta
- top-shows: song count, set breakdown, DOW, user score + delta
- top-venues: I WAS THERE / I RATED tags, DOW breakdown, user show count
- top-states: coverage %, venue count, total shows in state

### Community UI
- UserDelta component — inline score vs community avg with color-coded delta
- Badge prop on CommExpandCard — user context chip (YOU +0.3, I WAS THERE, etc.)
- SetBreakdown pills — SET 1 / SET 2 / ENCORE counts
- All four community tabs fully upgraded with new data surfaces

### Desktop Pass
- Profile modal 820px wide on desktop (was 560px)
- Profile modal tabs, fonts, header all bumped for desktop
- desktop-card-stats !important removed (was blocking display)
- FeedbackModal wider + bigger fonts + className for CSS targeting
- Global desktop font additions via media query

---

## ✅ COMPLETED PRIOR SESSION (2026-06-16 Full Day)
- All crashes / P0s listed in prior log
- Filter system full rewrite (desktop + mobile)
- DesktopLanding as home tab
- ShowSlotMachine
- Scorecard browse without login
- Companion system
- Phriend Overlap logged-out gate
- Pinned Ebenezer feed system
- Mike Says No error boundary
- Boot sequence
- Desktop card extra stats

---

## 🔴 OPEN — NEXT SESSION PRIORITIES

### P0 — Must fix before beta
- **Rate limiting on auth endpoints** — /api/auth/login and /api/auth/register still unprotected
- **Trigger Ebenezer seed** — POST /api/admin/seed-ebenezer needs to be called once as admin
- **Delete mpgink weaker feed post** — the "early communal feedback" post; admin DB delete

### P1 — Remaining desktop pass
- **Setlist rows** — song name, duration, star row still mobile-sized on desktop
- **Show masthead stats** — PHAN REVIEWS / PHREEZERS RATED numbers too small
- **Notes textarea** — still mobile-sized on desktop
- **Attendance buttons** — too small on desktop

### P2 — Analytics expansion (future)
- **Song duration storage** — add `duration_seconds` to ratings table, populate from Phish.in setlist data at load time. Foundation for avg/median/above-median jam detection.
- **Median song length across catalog** — compare avg vs median to detect outlier jams

### P3 — Pre-launch checklist
- Fix Sentry DSN (malformed org ID in VITE_SENTRY_DSN env var)
- GoDaddy DNS for phreezer.mpgink.com in Resend
- Email triggers: welcome, onboarding nudge, show rating reminder
- iOS Safari UAT pass (not yet confirmed complete)
- Publish Phish.net community forum post (drafted, held)

---

## Architecture Notes
- Shows loaded once on mount (?limit=2000), all filtering client-side — no API spam
- `desktop-filter-block` / `mobile-filter-block` CSS classes gate filter UI per breakpoint
- `desktop-card-stats` class shows extra metrics only on desktop (≥769px) — no !important
- Error boundary in main.jsx → Mike Says No for ALL React render errors
- Pinned Ebenezer post: seed via POST /api/admin/seed-ebenezer (admin only)
- Show companions table: show_companions (user_id, companion_id, show_date)
- Community API: all 4 endpoints accept optional Bearer token for user-specific context
- `author_label` on posts overrides username display in feed (Ebenezer mechanism)
- Song duration: NOT in DB currently — deferred analytics surface
