# Phishow Scorecard — Roadmap to July 4, 2026

## Target: Live and shareable before July 4th. Phish summer tour starts July 7.
## Post on Phish.net message board: ~June 16

---

## WEEK 1 — June 2–8: Fix the Foundation ✅ IN PROGRESS

- [x] Autocomplete search (type-ahead, debounced, no button, no jostling)
- [x] Filter future shows from recent list
- [x] Rating buttons (1–5 tap, tap again to clear) replacing stars
- [x] Fix search bar border rendering
- [x] Relisten links replacing PhishTracks everywhere
- [x] Mike Says No error handling (full-screen red modal)
- [x] Dopamine animation on save (particles + "RATINGS LOCKED IN")
- [x] phish.in API integration: per-song ▶ play button + duration
- [x] Random Show button (phish.in with phish.net fallback)
- [ ] Attendance type field (attended / webcast / listened after)

---

## WEEK 2 — June 9–15: Make It Feel Like a Real App

- [ ] Sign-in welcome animation (trippy/nerdy)
- [ ] Profile page (bio, interests, Phish.net handle, Buy Me a Coffee)
- [ ] Phish.net attended shows import (pull user's show history as rating backlog)
- [ ] Show detail from My Shows (click a show → see full song breakdown)
- [ ] Notable links hub (Relisten, Phish.net, Phish.com, Phish.in, LivePhish)
- [ ] Show comments (light, per-show, moderated)

---

## WEEK 3 — June 16–22: Community Layer + Post on .net

- [ ] Shared/community ratings view
- [ ] Show comments backend (new DB table, basic moderation flag)
- [ ] My Space vs Shared Space distinction
- [ ] Post on Phish.net message board ~June 16
- [ ] Mobile polish pass (based on Week 1–2 feedback)

---

## WEEK 4 — June 23–July 4: Polish + Stretch

- [ ] Live show mode (real-time notes + per-song rating during a show)
- [ ] In-app messaging (stretch — may push to post-launch)
- [ ] Bug triage from .net community feedback
- [ ] Phantasy Phishball MVP (separate build — draft setlist + auto-score vs tour)
- [ ] Hard stop July 4th 🎆

---

## PRE-LAUNCH POLISH (before post on Phish.net)

- [ ] **Admin panel user card** — labels running into values, no spacing or separators. Needs proper grid layout: label left (muted), value right (white), divider rows between fields. Match the rest of the app's panel aesthetic.
- [ ] Delete `/api/debug/reviews.js` — exposed endpoint, pre-launch blocker
- [ ] Profile modal BADGES tab — wire to KPI badges array (currently placeholder if not loading)
- [ ] Desktop layout UAT — full walkthrough with new nav, sidebar, all sub-tabs
- [ ] Deep Phreeze tab — stat lover section: longest song rated, highest single rating, most versions heard, biggest set gap, most complete show, rarest song, longest attendance streak, longest gap between shows

- [ ] **OTD Vibe Check — Anthropic proxy** — AI review synthesis calls Anthropic directly from browser (works in Claude.ai artifacts, fails on standalone deploy). Need: (1) add `ANTHROPIC_API_KEY` to Vercel env vars from console.anthropic.com, (2) `npm install @anthropic-ai/sdk`, (3) create `/api/ai/vibe-check.js` proxy endpoint, (4) update OTDCard to call `/api/ai/vibe-check` instead of hitting Anthropic directly.

- [ ] **Nav overhaul** — Tab order becomes MY PHREEZER | COMMUNITY | SCORECARD. My Phreezer is the home for returning users. Smart default: if user has no shows, land on Scorecard; if they have shows, land on My Phreezer. Scorecard moves to utility tab on the right.

- [ ] **Scorecard as full-screen overlay** — Any RATE button in the app (My Shows, OTD card, Community, phriend overlap) opens Scorecard as a full-screen overlay with ◀ BACK button instead of navigating away. User stays in context. Overlay slides in, X/back returns to origin. Scorecard tab still works for direct nav. All `setTab('scorecard')` + `setRateShowDate()` calls replaced with `openScorecardOverlay(date)`.

- [ ] **Avatar menu cleanup** — Currently: PROFILE / SUPPORT THE PHREEZER / SIGN OUT. Simplify: avatar opens ProfileModal directly (no dropdown). Support link lives in Profile modal Settings tab only. Sign out in Profile modal Settings tab only. Removes one tap and clutter from the header.

---

## POST-LAUNCH (after July 4)

- [ ] Global leaderboard / community ratings
- [ ] Tour grouping in My Shows
- [ ] Export ratings to CSV
- [ ] Jam chart filter in setlist view
- [ ] In-app messaging
- [ ] Phantasy Phishball full build

---

## Architecture Notes

- phish.in v2 proxy: `api/audio/[date].js` — no key needed, fail gracefully
- Random show: `api/random-show.js` — phish.in first, phish.net fallback
- phish.in attribution added to scorecard footer
- All credentials in Vercel env vars + Claude memory, never in repo
