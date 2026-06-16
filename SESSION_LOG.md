# SESSION LOG

## Session: 2026-06-16 Part 2 (Desktop Pass)

### Shipped

**P0 fixes**
- Ebenezer author_label display fixed in PhreezeFeed — `displayName(post)` helper checks `author_label` first, falls back to `username`. Ebenezer posts now show "Uncle Ebenezer" in orange with matching avatar color.
- Feed action buttons (▲ react, ◈ replies, + reply) bumped from 0.36rem to 0.42rem and always visible on desktop
- NewPostBox added to PhreezeFeed — logged-in users can create posts inline (category selector + body + char count)
- `currentUser` prop threaded through CommunityTab → PhreezeFeed for auth-gated post box

**API upgrades — all 4 community analytics endpoints enhanced**
- `top-songs.js`: by-set breakdown (set1/set2/encore rating counts + avgs), first/last rated date, unique shows rated, user avg per song (optional auth)
- `top-shows.js`: song count, set breakdown (S1·S2·Encore counts), day of week, user's own score + delta vs community (optional auth)
- `top-venues.js`: "I WAS THERE" / "I RATED" tags per logged-in user, weekend DOW breakdown (Fri/Sat/Sun counts), user show count at venue
- `top-states.js`: coverage % (rated shows / total shows in state from shows table), venue count, total_shows_in_state

**CommunityTab full rewrite**
- `UserDelta` component: shows user score vs community avg with color-coded delta (orange=above, red=below, green=neutral)
- Badge prop on CommExpandCard: shows user context chip inline (YOU +0.3, I WAS THERE, I RATED)
- SetBreakdown pill row: SET 1 / SET 2 / ENCORE count chips with color coding
- Top Shows: extraStats = RATERS · SONGS · DAY · S1·S2·E breakdown
- Top Songs: extraStats = RATERS · VERSIONS · HOME SET · FIRST RATED year; first/last rated dates in expanded view; set breakdown pills
- Top Venues: extraStats = SHOWS · RATERS · RATINGS · DOW; I WAS THERE / I RATED badge; weekend DOW breakdown in expanded view
- Top States: extraStats = RATED · VENUES · RATERS · COVERAGE%; Phreezer Coverage bar in expanded view
- CommShowRows: DOW label added inline on each show row

**Desktop CSS pass**
- Profile modal widened: 560px → 820px on desktop
- Profile modal tab font bumped: 0.49rem → 0.62rem, padding 10px → 14px
- Profile modal header/username/email/stat fonts all bumped on desktop
- `desktop-card-stats` !important removed — was blocking flex display
- FeedbackModal: maxWidth 480 → 520, textarea font 0.75rem → 0.82rem, minHeight 72 → 80, className for CSS targeting
- Desktop media query additions: feedback modal wider (640px), body text bumps

### Decisions Made
- Song duration/avg length deferred — not stored in our DB (no `duration` column on ratings). Will need to store at rating time or pull from Phish.in. Flagged as future analytics surface.
- "I WAS THERE" for venues queries `user_show_attendance` table — gracefully handles if table doesn't exist (try/catch with fallback). Will silently return false until that table has data.
- User score delta: optional auth on API — unauthenticated requests just skip user_score/user_delta fields, no error.

### Open Debt Introduced
- Ebenezer seed still not triggered — need to call POST /api/admin/seed-ebenezer as admin to make pinned post live
- `user_show_attendance` table join in top-venues.js may be no-op if table is empty — that's fine, will populate as users mark attendance
- Rate limiting on auth endpoints still P0 — not touched this session
- Sentry DSN still malformed — not touched this session
- mpgink weaker feed post still live — needs deletion
- Desktop font pass is partially done via CSS classes — some inline JSX font sizes still mobile-sized (setlist rows, show masthead stats, notes textarea)

### Next Session Priorities
1. Trigger Ebenezer seed (1 fetch call from admin console)
2. Rate limiting on /api/auth/* — P0 before beta
3. Delete mpgink weaker feed post
4. Remaining desktop font pass: setlist rows, show masthead, notes textarea, attendance buttons
5. Sentry DSN fix
6. Song duration storage — add `duration_seconds` column to ratings, populate from Phish.in setlist data at load time

## Session: 2026-06-16 (Full Day)

### Shipped

**Crashes fixed**
- `selectedDow is not defined` — missing useState declaration in ScorecardTab (was crashing scorecard for all users)
- `donations is not defined` — orphaned variable reference in CommShowRows AND CommVersionRows (was crashing Top Venues/Songs expand)
- `setState during render` in filter IIFE — replaced with proper useEffect
- `__filter__` string leaking into search input display
- Shows API ignoring `?limit=2000` — was always returning 20 shows; filters returned 0 matches as a result
- DesktopLanding apostrophe JSX build errors (multiple rounds)
- EbenezerRail dead space when logged out (flexShrink:0 not flex:1)
- `{!currentShow && <div>}` JSX — missing closing brace, build failure

**Filter system — complete rewrite**
- Desktop: ERA 2×2 grid (big labels 1.6rem), YEAR 10×4, MONTH 6×2, DAY 8×4, DOW 4×2 — all in one horizontal row
- Mobile: 4 independent dropdowns (YEAR/MONTH/DAY/DOW) with terminal styling, custom chevrons
- All filters independent — no required order, any combination works
- Availability dimming: unavailable options at 18% opacity, available at 70%, active at full color
- Match count: orange box with big number + "SHOWS" label, CLEAR ALL beside it
- Filters collapse when show loads; CLEAR resets to arrow/slot state
- CSS gating: `desktop-filter-block` / `mobile-filter-block` classes — no mobile bleed
- Root cause of filter failures identified: API returning 20 shows regardless of limit param

**Desktop landing**
- DesktopLanding as own `home` tab (not tied to scorecard)
- Logged-out desktop users land on home; scorecard stays clean
- Sidebar logo click → home for logged-out users
- Logo: Canva with white text, transparent bg
- Snowflake: Canva asset, transparent bg
- Landing page: single logo asset (snowflake + wordmark baked in), 3 feature cards, CTAs

**Scorecard**
- Browse setlists without login — auth gate only on star tap / SAVE RATINGS
- ShowSlotMachine: 3-reel animation (YEAR/MONTH/DAY), lock sequence, 2400ms delay before show loads
- RANDOM SHOW moved below filters so arrow CTA is unobstructed
- Default 20-show list hidden — arrow shows immediately; results only appear when filters/query active
- Show masthead desktop data panel: PHAN REVIEWS / PHREEZERS RATED / PHRIENDS HERE + YOUR SCORE

**Community**
- PHRIEND OVERLAP moved to #2 after FEED in sidebar and mobile sub-tabs
- Phriend Overlap logged-out gate: ⚇ icon, headline, description, CREATE ACCOUNT + LOGIN CTAs
- user + onLogin props threaded through to PhriendOverlapCommunity
- Companion system: show_companions table, POST/GET API, mutual detection, route in vercel.json
- Companion buttons in Phriend Overlap: + COMPANION → ◈ COMPANION → ❄ MUTUAL

**Feed / Ebenezer**
- Pinned post system: `pinned` BOOLEAN + `author_label` VARCHAR(50) columns added to posts
- `api/admin/seed-ebenezer.js` — seeds pinned Uncle Ebenezer welcome post
- Feed: pinned posts sort first, orange left border, ❄ PINNED · UNCLE EBENEZER badge

**Error handling**
- ALL React render errors → Mike Says No
- Mike boundary shows actual error.message + "Mike does not care."

**Boot sequence**
- Centered, max-width 720px
- Snowflake at top with cyan glow
- Lines: 1rem / 1.15rem / 1.8rem (DON'T SUCK AT PHISH in orange at 1.8rem)

**Community cards — desktop extras**
- CommExpandCard: `extraStats` prop for inline metrics between name and score
- `desktop-card-stats` CSS class: hidden on mobile, flex on desktop ≥769px

### Next Session Priorities (carried from Part 2)
1. Trigger Ebenezer seed
2. Rate limiting on auth endpoints (P0)
3. Delete mpgink weaker feed post
4. Remaining desktop font pass (setlist rows, masthead, notes)
5. Sentry DSN fix
6. Song duration storage foundation
