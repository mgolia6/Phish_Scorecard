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

## Session 13 — 2026-06-06

### Build Fixes
- Resolved persistent Vercel build error — duplicate ProfileSetupModal body (189 lines of orphaned JSX sitting outside function scope) caused `Unexpected "}"` at line 778. Used Node.js brace-depth analysis to locate, surgically removed lines 589-778.
- Admin user.js — `clear-data` and `reset-onboarding` now wipe profile fields (phishnet_username, favorite_song, favorite_venue, favorite_show_date) in addition to attendance/ratings/reviews. Also clears user_stats and show_companions.

### Auth Fix
- Root cause of logout-on-refresh: `avatar_icon` column missing from Neon DB — auth/me query crashed, returned 500, token got cleared. Fixed by running `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_icon VARCHAR(10)` in Neon SQL console.
- JWT secret was 15 chars — rotated to 74-char random string in Vercel env vars.
- Switched auth/me load to raw fetch — only clears token on explicit 401, not network errors or cold starts.

### Navigation Overhaul (SHIPPED)
- Tab order: MY PHREEZER | COMMUNITY | SCORECARD
- Smart default: returning users (tandc_accepted) land on My Shows; new users land on Scorecard
- Scorecard as full-screen overlay — any RATE button opens overlay with ◀ BACK, user stays in context
- Avatar tap → ProfileModal directly (no dropdown)
- After onboarding LET'S GO → lands on My Shows (was Scorecard)

### KPI Section
- Collapsed to compact 4-stat row (ATT / RATED / AVG / REV + streak)
- DIVE DEEP moved below stats row as full-width glowing cyan tab
- "❄ DIVE DEEP — TAP FOR FULL STATS" collapsed, "▲ CLOSE" expanded

### OTD Card
- Rebuilt as standalone hero card — pulsing dot, large date, venue/city, score, ▶ + ◈ RATE
- Expandable "VIBE CHECK" — fetches phish.net reviews, AI synthesis via Claude API
- Note: AI call goes browser → Anthropic directly (works in Claude.ai, needs proxy for standalone)
- Reviews showing "NO REVIEWS" for Jun 6 2009 — PHISH_NET_API_KEY confirmed set in Vercel, may be genuine no-review show. Debug next session.

### Deep Phreeze (SHIPPED)
- DB: show_cache + user_stats tables (created in Neon)
- API: /api/user/sync.js — fetches phish.net setlist for all attended shows, caches, computes stats
- API: /api/user/deep-phreeze.js — serves from user_stats
- UI: DeepPhreezeTab under MY PHREEZER → DEEP PHREEZE sub-tab
- ATTENDED toggle: longest show/set, streaks, most heard, rarest caught
- RATED toggle: highest song, perfect 5s, best/lowest show, set swing viz, completionism bar, most versions
- UAT confirmed: 188 shows synced, stats computing correctly (Boardwalk Hall Oct 31 2010 = longest at 37 songs, longest run 10 consecutive starting May 26 2011, longest gap 3.9y Sep 2019 → Jul 2023)

### Onboarding Rewrite (SHIPPED)
- Import-first flow: username field + locked/dimmed song/venue fields ("import first to unlock")
- SKIP IMPORT → guilt screen: greyed ❄, "DON'T SUCK AT PHISH.", three consequences, ARE YOU SURE?
- GO BACK AND IMPORT (primary) | PROCEED WITHOUT IMPORTING (red, dim)
- Manual step: red guilt banner, free-text fields
- Success step: ❄ PHROZEN IN., import counts, unlocked dropdowns, LET'S GO ◈
- Onboarding modal: max-height 88vh, overflow-y auto (was going full screen)
- BMC copy changed to "KEEP THE PHREEZER STOCKED", moved to secondary button

### FullPageLoader
- Already existed — spun up to 4rem, 1.8s spin (was 3s), cyan glow text-shadow
- KPI loading now uses FullPageLoader instead of plain text

### Logo Snowflake
- Rebuilt SVG — old version had V-tips only at spoke ends (read as arrows)
- New version: 2 pairs of branches per spoke at 1/3 and 2/3 of length, symmetric at 60°, center dot
- Proper crystalline structure

### Farmhouse Lyric
- Fixed: "We're glad, glad, glad" (was "Glad glad glad")

### Open Items for Next Session
- OTD Vibe Check reviews — debug why Jun 6 2009 returns no reviews (PHISH_NET_API_KEY is set)
- Contrast/legibility pass — profile setup modal labels, locked field text, button text
- Avatar icon set replacement
- Community tabs — populate with phish.net public data
- Anthropic proxy for Vibe Check (/api/ai/vibe-check.js)
- Desktop layout UAT
- Logo snowflake UAT — confirm new SVG reads correctly at small size
- Deep Phreeze: longest show toggle (song count vs duration from phish.in)
- Delete /api/debug/reviews.js
- SESSION_LOG already updated ✓
