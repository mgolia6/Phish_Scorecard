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

### Open Technical Debt
- Debug endpoint /api/debug/reviews.js still in repo — DELETE before launch
- Community rating per show (phish.net avg) not yet cached — needs `pnet_community_score` column on shows table
- Mobile header padding-top may need device-specific tuning (currently 132px / 166px)
- Changelog system scoped but not built — two tables (admin/public), release types (silent/banner/major), last_seen_changelog_id on users
- Tour guide not built — replaces static onboarding slideshow
- Streaks + badges display in leaderboard (only streak shown, no badge icons yet)
- Share cards not built
- Subdomain phreezer.mpgink.com not configured
- Analytics tab — top songs needs expandable versions list, top venues needs attended/rated toggle
- Top songs and venues should probably be their own KPIs or tab section

### Next Session Priorities
1. **Verify sticky header** — check padding-top on device, adjust if content hidden or gap visible
2. **Delete /api/debug/reviews.js** — overdue, pre-launch blocker
3. **Changelog system** — admin-facing log + user-facing release notes with major modal trigger
4. **Analytics overhaul** — top songs with version expandable, top venues with attended/phrozen toggle
5. **Community rating caching** — pnet_community_score on shows table, populate on show load
6. **Subdomain** — phreezer.mpgink.com CNAME → Vercel

