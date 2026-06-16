# ROADMAP

## Beta Launch Criteria
- 50 registered users
- 500 shows rated  
- 14 consecutive days with no P0 bugs
- Target: before July 7 summer tour start

---

## ✅ COMPLETED THIS SESSION (2026-06-16)

### Crashes / P0
- Fixed `selectedDow is not defined` crash on scorecard (missing useState)
- Fixed `donations is not defined` crash on Top Venues/Songs expand (two occurrences)
- Fixed `setState during render` in filter IIFE → proper useEffect
- Fixed `__filter__` leaking into search input display
- Fixed shows API ignoring `?limit=2000` param (was always returning 20 shows)
- Fixed DesktopLanding apostrophe JSX build errors (x3)
- Fixed EbenezerRail dead space when logged out (flexShrink:0)

### Features
- DesktopLanding as own `home` tab (not tied to scorecard)
- Sidebar logo click → home for logged-out users
- ShowSlotMachine — 3-reel animation on RANDOM SHOW
- Scorecard browse without login (auth gate on star/submit only)
- Filter system: ERA/YEAR/MONTH/DAY/DOW — stacked, all independent
  - Desktop: full button grid (YEAR 10×4, MONTH 6×2, DAY 8×4, DOW 4×2)
  - Mobile: 4 independent dropdowns with terminal styling
  - ERA 2×2 grid with big labels
  - Match count orange box + CLEAR ALL
  - Filters collapse when show loads
- Companion system (show_companions table, API, mutual detection)
- Phriend Overlap: companion buttons, mutual state, venue fallback, tap-to-rate
- Phriend Overlap logged-out gate (⚇ icon, login CTA)
- PHRIEND OVERLAP moved to #2 after FEED in sidebar + mobile
- Pinned Ebenezer post system (columns, seed endpoint, badge, orange border)
- Feed pinned post copy: "We are still workshopping this new song..."
- Boot sequence: centered, large fonts, breathing space, snowflake
- Error boundary: ALL React errors now show Mike Says No (not Ebenezer)
- Desktop logo updated from Canva (white text, transparent bg)
- Snowflake asset updated from Canva
- Show masthead desktop data panel (reviews, raters, phriends, score)
- Community card extra stats on desktop (raters, show count, total ratings)
- Desktop font scale-up (community rows, cards, KPIs, result items)
- Desktop filter CSS gating (desktop-filter-block / mobile-filter-block)

---

## 🔴 OPEN — NEXT SESSION PRIORITIES

### P0 — Must fix before beta
- **Ebenezer post showing as mpgink not Uncle Ebenezer** — the seed inserts with admin user_id, need to either: (a) create a dedicated system user for Ebenezer, or (b) store author_label and override username display in feed. Feed currently shows `post.username` even when `author_label` is set — the display logic needs to check `author_label` first and render it differently (different color, no avatar initials from username).
- **Rate limiting on auth endpoints** — still top security priority before launch

### P1 — Desktop layout pass (BIG session)
- **Global font bump** — everything is too small on desktop. Need systematic 1.2–1.4× scale across: feed posts, profile modal, feedback modal, community cards, top shows/songs/venues/states rows, scorecard results, show masthead, setlist rows, attendance buttons, notes.
- **Feed built for mobile** — reply/upvote buttons not visible on desktop. Need desktop layout: wider post body, buttons visible inline not hidden.
- **Profile modal built for mobile** — on desktop should be a wider panel (700–900px), not a narrow mobile modal. Tabs should be horizontal, font larger.
- **Feedback modal too small** — font up, modal wider on desktop.
- **Delete mpgink's earlier weaker feed post** — the one about "early communal feedback." Admin delete via DB or admin panel.

### P2 — Community card data expansion (desktop)
- **Top Shows**: currently has rater count. ADD: song count, set count, set lengths, day of week the show fell on.
- **Top Songs**: remove duplicate ratings display. ADD: times played total, times played by set (Set 1 / Set 2 / Encore), average slot in set, first/last played date.
- **Top Venues**: ADD: total shows at venue, number of users who attended (Phreezer + Phish.net deduped estimate), "I WAS THERE" / "I RATED" tag per logged-in user, day-of-week breakdown (what day are shows at this venue most often).
- **Top States**: similar treatment — show count, top venue in state, day-of-week breakdown.
- All extra stats desktop-only via `.desktop-card-stats` class pattern already in place.

### P3 — My Section desktop pass
- Profile modal → desktop panel (wider, bigger fonts, better tab layout)
- Stats page: same data expansion treatment as community cards
- Attendance history: use desktop space better

### P4 — Pre-launch checklist
- Fix Sentry DSN (org ID malformed in VITE_SENTRY_DSN env var)
- GoDaddy DNS for phreezer.mpgink.com in Resend
- Email triggers: welcome, onboarding nudge, show rating reminder
- iOS Safari UAT pass
- Publish Phish.net community forum post (drafted, held)
- Rate limiting on /api/auth/* endpoints

---

## Architecture Notes
- Shows loaded once on mount (?limit=2000), all filtering client-side — no API spam
- `desktop-filter-block` / `mobile-filter-block` CSS classes gate filter UI per breakpoint
- `desktop-card-stats` class shows extra metrics only on desktop (≥769px)
- Error boundary in main.jsx → Mike Says No for ALL React render errors
- API try/catch errors → Mike Says No via showError()
- Pinned Ebenezer post: seed via POST /api/admin/seed-ebenezer (admin only, re-seeds on every call)
- Show companions table: show_companions (user_id, companion_id, show_date)
