# Phreezer — Roadmap to July 4, 2026

## Target: Live and shareable before July 4th. Phish summer tour starts July 7.
## Post on Phish.net message board: ~June 16

---

## COMPLETED THIS SESSION ✅

- [x] Nav overhaul — MY PHREEZER | COMMUNITY | SCORECARD tab order
- [x] Smart default tab — returning users land on My Shows
- [x] Scorecard as full-screen overlay — RATE button stays in context, ◀ BACK to return
- [x] Avatar tap → ProfileModal directly (no dropdown)
- [x] KPI section collapsible — compact 4-stat row, DIVE DEEP ▼ to expand
- [x] OTD card redesign — standalone hero, expandable Vibe Check with AI review synthesis
- [x] Deep Phreeze tab — sync engine, phish.net setlist fetch, stats computation, ATTENDED/RATED toggle
- [x] show_cache + user_stats DB tables
- [x] New onboarding flow — import-first, locked fields, guilt screen, dopamine success modal
- [x] Admin clear-data + reset-onboarding now wipe profile fields too
- [x] Auth persistence fix — only clear token on explicit 401
- [x] Logout moved to Profile modal → Settings tab
- [x] Farmhouse lyric fix — "We're glad glad glad"

---

## PRE-LAUNCH POLISH (before post on Phish.net ~June 16)

- [ ] **Contrast / legibility pass** — Profile setup modal labels barely visible, locked field text too dim, IMPORT button low contrast, SKIP IMPORT nearly invisible. Need full app contrast audit — check all labels, muted text, button text against backgrounds.
- [ ] **Avatar icon set** — Current icons need replacing. Matthew to decide new set (currently: ❄ ◈ ⚡ ✦ ⬡ ◉ ▦ ✎ 🔥 🐟 🌀 🎸 💯 ★ ✍ 🏔)
- [ ] **Community tabs — phish.net public data** — TOP SHOWS / TOP SONGS / TOP VENUES / TOP STATES currently show only Phreezer user data (just Matthew). Populate with phish.net community ratings via on-demand fetch + 24hr cache. Label clearly as "phish.net community rating." Same pattern as show_cache.
- [ ] **OTD Vibe Check — Anthropic proxy** — AI synthesis hits Anthropic directly from browser (fails on standalone deploy). Need: (1) `ANTHROPIC_API_KEY` in Vercel env vars, (2) `npm install @anthropic-ai/sdk`, (3) `/api/ai/vibe-check.js` proxy endpoint, (4) update OTDCard to call proxy.
- [ ] **Deep Phreeze UAT** — Clear Matthew's data, re-import from phish.net, run sync, verify all stats compute correctly for 188 shows.
- [ ] **Admin panel user card** — Labels running into values, no spacing. Needs proper grid layout.
- [ ] **Profile modal BADGES tab** — Wire to KPI badges array (currently placeholder).
- [ ] **Desktop layout UAT** — Full walkthrough with new nav, sidebar, all sub-tabs.
- [ ] Delete `/api/debug/reviews.js` — exposed endpoint, pre-launch blocker.
- [ ] **Phishook / Phreezer rename cleanup** — App is called Phreezer but some internal references still say Phishook. Logo assets exist but not integrated. Roadmap.md still says "Phishow Scorecard" in places.
- [ ] **Onboarding scroll bug** — T&C modal may still have scroll-to-enable issue on some devices.
- [ ] **SESSION_LOG.md** — Update to reflect current session work.

---

## POST-LAUNCH (after July 4)

- [ ] Global leaderboard / community ratings
- [ ] Tour grouping in My Shows
- [ ] Export ratings to CSV
- [ ] Jam chart filter in setlist view
- [ ] In-app messaging
- [ ] Phantasy Phishball full build
- [ ] Live show mode (real-time notes + per-song rating during a show)
- [ ] Deep Phreeze v2 — phish.net song play counts for rarity scoring
- [ ] Attendance type field (attended / webcast / listened after)
- [ ] Show comments (light, per-show, moderated)

---

## Architecture Notes

- phish.in v2 proxy: `api/audio/[date].js` — no key needed, fail gracefully
- Random show: `api/random-show.js` — phish.in first, phish.net fallback
- phish.in attribution added to scorecard footer
- All credentials in Vercel env vars, never in repo
- GitHub token rotates each session — never store in memory
- CSS rule: never append across sessions — always pull full file, rewrite clean, push
- Postgres: SELECT DISTINCT + GROUP BY + ORDER BY COUNT(*) is invalid — use GROUP BY alone
