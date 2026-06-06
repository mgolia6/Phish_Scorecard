## Session 10 — 2026-06-03

### What Was Built
- **Profile setup modal** — fires after T&C for new users. phish.net handle + confirmation checkbox, inline import (attendance + reviews together), favorite song/venue dropdowns from DB, first show auto-set to earliest attended. Scroll-gated T&C (button disabled until bottom reached).
- **Streaks** — login streak calculated server-side on every login. Consecutive days increment, gap resets to 1. Displayed in KPI as ⚡ N-DAY LOGIN STREAK when > 1.
- **Badges** — computed from existing data in `/api/user/kpi`. Attendance milestones (10/25/50/100), rating milestones (1/10/25/50/100 shows), review badges, streak badges. Shown as chips in KPI section.
- **Leaderboard** — `/api/community/leaderboard` endpoint. Ranked by shows rated then avg score. Your row highlighted cyan. Top 3 get ★/◈/◉ glyphs.
- **Nav restructure (mobile)** — top-level: SCORECARD | MY PHREEZER | COMMUNITY | PROFILE. Second-level sub-tabs: MY PHREEZER → MY SHOWS / ANALYTICS. COMMUNITY → LEADERBOARD.
- **Profile tab** — standalone tab. Displays phish.net handle, favorite song/venue/show. Edit mode with DB-backed dropdowns. BMC link at bottom.
- **Star ratings** — replaced 1-5 number buttons with ☆/★. 38×38px, orange bordered, fills on selection.
- **Play button inline** — ▶ sits inline left of stars, same height, cyan bordered. Songs without audio get a spacer for alignment.
- **Notes collapsible** — + NOTE toggle below rating row. Expands to input, collapses on blur if empty. Shows preview if note exists.
- **Attendance auto-detect** — show load checks `user_show_attendance` first, then `attendance` table (phish.net import) as fallback. Shows you attended auto-select ATTENDED.
- **Attendance selector moved to top** — appears right after show masthead, before setlist.
- **Song row cleanup** — number inline with name and duration. More visible colors. Tighter padding.
- **Soundcheck HTML stripped** — `<p>` tags removed server-side before sending.
- **Community reviews** — filters empty reviews, shows ▲ upvote count (not stars — phish.net scores are upvotes not ratings).
- **MY REVIEW label** — show cards now show ✎ icon for your review, not a confusing number count. Added ✎ REVIEW ON .NET link that goes to phish.net add-review anchor.
- **Random show** — fixed to query DB with `ORDER BY RANDOM()` instead of cold-starting a phish.net API fetch.
- **How To Use** — rewritten with personality. Ends with "Don't suck at Phish. Or at least try not to."
- **Buy Me a Coffee** — buymeacoffee.com/mpgink added to onboarding last step, sidebar footer (expanded), KPI section, and Profile tab.
- **Migration modal** — admin migrate action now shows a full modal with per-migration results (✓/✗ per column) instead of toast.
- **First Phreeze** — badge renamed from First Freeze.
- **Post-onboarding prompt** — "LET'S GO BACKWARDS" modal fires after onboarding completes. Prompts user to rate their first attended show.
- **profile-options endpoint** — `/api/user/profile-options` returns user's rated songs, attended venues, attended shows for profile setup dropdowns.
- **DB migrations** — added phishnet_username, favorite_song, favorite_venue, favorite_show_date, last_login_date, login_streak columns to users table.
- **Mobile fixed header** — marquee + header + tab-nav fixed to top of viewport. Content body padded below (132px standard, 166px with sub-tabs).

### Decisions Made
- Favorite show = auto-set to first attended (chronologically earliest), not a picker.
- Community reviews show upvote count (▲ N) not star rating — phish.net score field is upvotes on the review, not a show rating.
- Nav: no second-level page loads — sub-tabs appear below the top nav row when parent is active.
- Profile is top-level tab, not nested under MY PHREEZER.
- Import in profile setup does attendance + reviews simultaneously.
- "REVIEWS N" on show cards was confusing — replaced with ✎ icon. Count removed.
- Mobile-first for all UX changes this session. Desktop sidebar unchanged.

---

## Session 11 — 2026-06-05

### What Was Built

#### Design System v2 (Phase 4)
- **Playfair Display** imported — `--font-serif` token, `.show-date-serif` classes. Used on show date in My Shows cards — the single serif moment that differentiates the app.
- **Contrast overhaul** — all text opacity floors lifted. Nothing below `0.42`. Named tokens: `--text-label` (0.58), `--text-muted` (0.42), `--white` (#f0fff0).
- **New component CSS classes** — `.kpi-grid`, `.kpi-card`, `.kpi-value`, `.kpi-label`, `.pcard`, `.expand-card`, `.expand-toggle`, `.play-btn`, `.btn-glow-orange/cyan/red`, `.set-bars`, `.heatmap-*`, `.badge-chip`, `.badge-card`, `.inner-row`, `.sec-label`, `.field-label`, `.prog-bar-*`, `.on-this-day`, `.sync-bar`, `.profile-modal-*`, `.leaderboard-row`, `.mini-bar-*`.
- **GlowBtn** — orange and cyan glow buttons with ambient shadow always on, full glow on hover.
- **Desktop KPI grid** — 4-column on `min-width: 769px`, 2-column on mobile.
- **Profile modal desktop** — centered overlay with max-width 560px, not full-screen.
- **State heatmap CSS** — `.heatmap-abbr` white text with dark text-shadow so initials visible on any cell color.

#### Navigation Restructure (Phase 1)
- **3 main tabs** — SCORECARD | MY PHREEZER | COMMUNITY. Profile removed from tab bar.
- **My Phreezer sub-tabs** — MY SHOWS | MY SONGS | MY VENUES | MY STATES
- **Community sub-tabs** — LEADERBOARD | TOP SHOWS | TOP SONGS | TOP VENUES | TOP STATES
- **Avatar → Profile modal** — tapping avatar now opens ProfileModal (full-screen on mobile, centered overlay on desktop). Profile tab removed.
- **Support The Phreezer** — moved to avatar dropdown menu. Removed from My Shows KPI section. "BUY A COFFEE" language removed everywhere.
- **Sidebar** (desktop) — My Songs, My Venues, My States added as nav items.

#### My Shows Redesign
- **Show card v2** — Playfair italic serif date, big glow score right-aligned (orange 4.7+, cyan otherwise), left border accent color-coded to score, circular play button (▶ → Phish.in), review toggle (✎).
- **Action bar** — 3 items: ◈ RATE / PHISH.NET / RELISTEN. Collapsed from 5+ buttons.
- **Controls bar** — ATTENDED/RATED toggle + IMPORT on one row. Filter pills (ALL/REVIEWED/RATED/UNRATED) + sort dropdown on second row.

#### My Songs Tab
- Wired to `/analytics/songs` endpoint. KPI grid (songs rated, unique songs, avg score, perfect 5s). Ranked list with mini progress bars and rating counts.

#### My Venues Tab
- Wired to `/analytics/venues` endpoint. KPI grid (unique venues, top venue avg, total shows, top venue). Ranked list with color-coded accent borders for top 3, score glow. TOP VENUE KPI shows full name at smaller font size.

#### My States Tab
- Derives from venues data — aggregates by state. KPI grid + ranked state list with mini bar chart showing relative avg score.

#### Profile Modal
- Fetches `/user/profile` on mount to populate phishnet_username, favorite_song, favorite_venue, first_show (previously showed dashes — was reading from auth/me which doesn't return those fields).
- INFO / BADGES / SETTINGS tabs. SETTINGS has Edit Profile + Support The Phreezer glow buttons + Sign Out.
- Badges tab placeholder (Phase 2).

#### Community Tabs
- Sub-tabs now branch correctly — leaderboard shows real data, others show "COMING SOON — PHASE 3" placeholder.
- Leaderboard layout fixed — username and "◈ YOU" tag properly separated.
- KPI quick stats (TOP SONG / MOST VISITED) now render as proper label/value rows with separators.
- Badge chips compact — inline pills, hover shows description via `title`. No more oversized chips.

#### Bug Fixes
- KPI grid was rendering single column — fixed from `kpi-row` to `kpi-grid` with proper 2×2 layout.
- Attendance endpoint broke when pnet_score/tour_name columns referenced — reverted to safe query (those columns don't exist on shows table yet).
- Community sub-tabs all showed leaderboard — fixed branching logic, each tab now routes to correct placeholder/component.

### Decisions Made
- Playfair serif used ONLY on show dates. One contrast moment, not a font system overhaul.
- `.net community score` on show cards deferred — needs `pnet_score` column on shows table first. DB migration + show-load cache needed (Phase 3).
- Tour name not stored in DB — comes from phish.net API response only. Not attempting to persist it yet.
- Support link lives in avatar menu only. No floating buttons or repeated CTAs.
- My States aggregates from venues data (no separate endpoint needed) — works well for current data volume.

### Open Technical Debt
- `pnet_score` column on shows table — needed for community score on show cards. Migration + populate on show load.
- `/api/debug/reviews.js` still in repo — DELETE before launch (pre-launch blocker).
- `tour_name` not stored in DB — phish.net API returns it but we don't persist it. Could be added to shows table.
- Profile modal BADGES tab — placeholder only. Needs to pull from `/user/kpi` badges array.
- Community TOP SHOWS / SONGS / VENUES / STATES — all placeholder. Phase 3 work.
- My Shows "On This Day" card — designed in mock, not yet implemented.
- My Shows streak + milestone progress bars — designed in mock, not yet implemented.
- Favorites (★) on show cards — designed in mock, not yet implemented.
- Show card expand (set scores + song list) — designed in mock, not yet implemented.
- Desktop layout parity check needed — sidebar nav updated but full desktop UAT not done.
- Changelog system — scoped but not built.

### Next Session Priorities
1. **Phase 2 — My Shows full redesign** — On This Day card, streak + milestone bars, favorites, expandable show cards with set scores + song list
2. **Phase 3 — Community tabs** — real endpoints for top shows/songs/venues/states
3. **pnet_score migration** — add column to shows table, populate on show load, surface on show cards
4. **Profile modal badges** — wire to KPI badges array
5. **Delete /api/debug/reviews.js** — overdue
6. **Desktop UAT** — full walkthrough of desktop layout with new nav
