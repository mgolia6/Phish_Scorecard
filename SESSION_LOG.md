## Session 12 — 2026-06-06

### Bug Fixes
- Duplicate song position numbers — switched from phish.net position (resets per set) to set-local idx+1
- On This Day — no date showing — fixed to format full date (AUG 26, 2023)
- On This Day — no rate button — added orange RATE button that calls loadShow + switches to SCORECARD tab

### Phriend Tagging Feature
- DB: show_companions table live in Neon (user_id, show_date, companion_user_id, constraints, indexes)
- API: /api/shows/companions — GET/POST/DELETE for tagging on a show
- API: /api/community/phriend-overlap — shared attendance + scores between two users
- API: /api/user/companions — bulk fetch all companions keyed by show_date
- Scorecard: PHRIENDS AT THIS SHOW panel (shown when ATTENDED) — search/tag/untag, auto-detected also_attended section
- My Shows cards: phriend chips inline (up to 3, overflow +N MORE)
- MY PHREEZER: MY PHRIENDS sub-tab — overlap search with stats + per-show score comparison
- COMMUNITY: PHRIEND OVERLAP sub-tab — same search, community framing
- useApi: added delete method

### Decisions
- Auto-detect shows all Phreezers who marked attended — no opt-in gate
- Phriend scores visible in tagged/overlap views only
- MY PHRIENDS in MY PHREEZER (intentional), PHRIEND OVERLAP in COMMUNITY (unintentional)

### Open Debt
- pnet_score column on shows table
- /api/debug/reviews.js — DELETE before launch
- Profile modal BADGES tab
- Community TOP SHOWS/SONGS/VENUES/STATES placeholder
- My Shows: On This Day card, streak bars, favorites — not yet built
- Desktop UAT

### Next Session
1. UAT phriend feature on mobile
2. My Shows Phase 2 — On This Day, streak bars, favorites
3. pnet_score migration
4. Profile modal badges
5. Delete /api/debug/reviews.js
