# SESSION LOG

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
- Logo: Canva "Copy of Full 1200x300" with white text, transparent bg
- Snowflake: Canva "The Phreezer full logo" (1024×1536), transparent bg
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
- `api/admin/seed-ebenezer.js` — seeds pinned Uncle Ebenezer welcome post, deletes and re-inserts
- Post copy: "We are still workshopping this new song..." (beta energy, stay in the room)
- Feed: pinned posts sort first, orange left border, ❄ PINNED · UNCLE EBENEZER badge
- KNOWN ISSUE: post displays as mpgink not Uncle Ebenezer — author_label display not wired yet
- Seed not triggered yet — needs admin console call after deploy

**Error handling**
- ALL React render errors → Mike Says No (replaced Ebenezer frozen error boundary in main.jsx)
- Mike boundary shows actual error.message + "Mike does not care."
- Tap anywhere to try again

**Boot sequence**
- Centered, max-width 720px
- Snowflake at top with cyan glow
- Lines: 1rem / 1.15rem / 1.8rem (DON'T SUCK AT PHISH in orange at 1.8rem)
- 20px gap between lines, 44px above lines, 56px before TAP TO SKIP

**Community cards — desktop extras**
- CommExpandCard: `extraStats` prop for inline metrics between name and score
- Top Shows: RATERS · TOTAL RATINGS · VENUE inline
- Top Venues: SHOWS RATED · RATERS · TOTAL RATINGS inline
- Top Songs: RATERS · TIMES RATED inline
- `desktop-card-stats` CSS class: hidden on mobile, flex on desktop ≥769px

**Assets**
- Both Canva exports grabbed via browser JS → pushed directly to GitHub
- White background stripped via canvas pixel manipulation

### Decisions Made
- Filters are client-side only — one fetch on mount (?limit=2000), no API calls per filter interaction
- ERA is 2×2 not 4×1 to match height of YEAR grid
- Filter layout: all on one horizontal row (ERA | sep | YEAR | sep | MONTH | sep | DAY | sep | DOW | match box)
- Day of Week added as a filter — fans care about Sunday shows, Halloween, NYE patterns
- Error boundary → Mike not Ebenezer (funnier, consistent with app voice)
- Phriend Overlap is #2 in nav (was last) — it's a key social feature, needs visibility
- Default show list hidden on scorecard — cleaner, arrow CTA more prominent

### Open Debt Introduced
- Ebenezer post shows as mpgink username — author_label not overriding display in PhreezeFeed
- Seed endpoint exists but not triggered — needs: `fetch('/api/admin/seed-ebenezer',{method:'POST',headers:{'Authorization':'Bearer '+localStorage.getItem('phish_token'),'Content-Type':'application/json'}}).then(r=>r.json()).then(console.log)`
- Sentry DSN still malformed (org ID 16 digits, should be 7) — fix in Vercel env vars
- `desktop-card-stats` div uses `display: none !important` inline override — fragile, should move to CSS class properly
- Font sizes on desktop still too small globally — systematic pass deferred to next session
- Profile modal and feedback modal built for mobile — desktop pass deferred
- Feed built for mobile — reply/upvote buttons not visible on desktop — deferred
- mpgink's weaker feed post ("early communal feedback") still live — needs deletion

### Next Session Priorities
1. Ebenezer post: fix author_label display in PhreezeFeed, trigger seed
2. Global desktop font pass — systematic 1.2–1.4× scale across all surfaces
3. Feed desktop layout — wider post body, reply/upvote buttons visible
4. Profile modal desktop — wider panel (700–900px), larger fonts
5. Feedback modal — bigger, wider on desktop
6. Community card data expansion:
   - Top Shows: song count, set count, day of week
   - Top Songs: times played, by-set breakdown, avg slot in set, first/last played
   - Top Venues: total shows, attendance estimates, day-of-week breakdown, "I WAS THERE" tag
7. Delete mpgink's weaker feed post
8. Rate limiting on auth endpoints (security)
