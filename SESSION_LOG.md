## Session 9 — 2026-06-03 (continued)

### What Was Built
- **Welcome back celebration** — rotating Phish lyrics on every login. Fires once per browser session (sessionStorage gate). Auto-dismisses in 3.2s, tappable to skip.
- **Lyrics in rotation** — 9 lines including "We're glad, glad, glad that you've arrived!", Farmhouse, Tweezer, Everything's Right, Halley's Comet, Say it to Me Santos, and others
- **T&C copy overhauled** — title: "BEFORE YOU STEP INTO THE PHREEZER...", gratitude section acknowledges phish.net/Mockingbird/phish.in and the fan community, ground rules: "Don't be a jerk. Don't suck at Phish. Or at least try not to.", CTA: "STEP INTO THE PHREEZER"
- **Onboarding 5th step added** — support note: Phreezer is free, overhead is real, if the spirit moves you
- **Full-page snowflake loader** — spinning ❄ centered on black screen replaces inline loading text everywhere
- **Admin toasts killed** — all admin actions now silent, confirm modal is the only feedback
- **Welcome back gated to session** — fires once per tab session, not on every refresh
- **Year/month dropdowns** — replaced the wall of year buttons with two compact selects. Year auto-loads results, month narrows. Clean.
- **Random show fixed** — phish.in API changed, now goes direct to phish.net
- **Triple-tap logo → admin** — admin tab removed from nav entirely, 3 taps within 800ms on logo opens admin panel. Desktop sidebar logo also works.
- **Mobile logo enlarged** — 38px → 52px
- **Admin tab built** — user cards with stats, reset onboarding, reset password, clear data, delete user. Confirm modal for destructive actions.
- **Bootstrap page** — /bootstrap.html for one-time admin setup. BOOTSTRAP_SECRET env var gates it.
- **DB flags** — is_admin, tandc_accepted, onboarding_complete moved to users table (DB-backed, not localStorage)
- **Auth endpoints updated** — login, register, me all return is_admin + tandc_accepted + onboarding_complete
- **KPI cards** — top of My Shows: attended, rated, avg score, reviews count + top song + most visited venue
- **Tap to rate** — ◈ RATE / ◈ RE-RATE button on every attended show card, navigates to Scorecard with show pre-loaded

### Decisions Made
- Welcome back fires on auto-login (page load with token) AND manual login, but gated to once per session
- Admin is secret — triple-tap logo only, not in nav. Keeps UI clean for regular users.
- phish.net handle auth: no OAuth available. Data tied to Phreezer user ID so no collision between users importing same handle. Add "I confirm this is my account" checkbox on profile setup.
- Onboarding slideshow kept for now — will be replaced by interactive tour guide in a future session (needs desktop testing)
- Profile setup page scoped but not built — fires after T&C, before slideshow. Fields: phish.net handle + confirmation checkbox, favorite song (searchable), favorite venue (searchable), favorite show (show search → loads Scorecard). All optional, not skippable.

### Open Technical Debt
- Debug endpoint /api/debug/reviews.js still in repo — DELETE before launch
- Community rating on show cards not built (needs caching layer)
- Import button in onboarding last step — still needs real-world verification
- Profile setup page not built yet
- Tour guide not built yet
- Streaks + badges + leaderboard scoped but not built
- Share cards not built
- Subdomain phreezer.mpgink.com not configured
- Vercel cron for reminders/sync not set up

### Next Session Priorities
1. **Profile setup page** — after T&C, before slideshow. phish.net handle + confirmation, favorite song/venue/show (searchable selects). Favorite show → Scorecard. DB columns: favorite_song, favorite_venue, favorite_show_date, phishnet_username on users table.
2. **Tour guide** — replace static slideshow with interactive overlay that walks user through each section. Needs desktop + mobile testing.
3. **Streaks** — login streak + rating streak. Store last_login_date on users table, calculate streak server-side.
4. **Badges** — import expert, reviewer, show milestones (10/25/50/100 rated). Display on profile.
5. **Leaderboard** — Community tab: rankings by shows rated, avg score, streak. Badges next to names.
6. **Delete /api/debug/reviews.js**

## Session 8 — 2026-06-03

### What Was Built
- **Onboarding flow** — 4-step modal for new users only. Walks through what Phreezer does, ends with CTA: IMPORT FROM PHISH.NET or RATE A SHOW NOW. Stored in localStorage per user ID (`phreezer_onboarding_{id}`). Skippable.
- **T&Cs** — fires on first login for any user who hasn't accepted. Plain English: not affiliated, you own your data, Phish.net attribution, don't be a jerk. Accept button sets `phreezer_tandc_{id}` in localStorage.
- **KPI dashboard** — top of My Shows tab. 4 stat cards: SHOWS ATTENDED / SHOWS RATED / AVG SCORE / REVIEWS. Highlight bar below: TOP SONG + MOST VISITED venue. Backed by new `/api/user/kpi.js` endpoint.
- **Tap to rate from attended list** — every show card has ◈ RATE / ◈ RE-RATE button. Tapping navigates to Scorecard tab with that show pre-loaded via `initialShowDate` prop + `onShowLoaded` callback.
- **psycopg2-binary installed** in session container for future DB work.

### Decisions Made
- Community rating on show cards (phish.net overall score) deferred — requires lazy DB caching to avoid 188 API calls on My Shows load. Will tackle as standalone piece.
- T&C and onboarding both keyed to user ID in localStorage — fires once per user, respects multi-user scenarios.
- Onboarding only triggers on new account registration (`isNewUser = true` flag from AuthModal).
- T&C fires for any user (new or existing) who hasn't accepted yet — good for retroactive rollout.

### Known Issues / Open Debt
- Debug endpoint /api/debug/reviews.js still in repo — DELETE before launch
- Community rating on show cards not yet built (deferred — needs caching layer)
- Onboarding testing: to re-trigger, run `Object.keys(localStorage).filter(k => k.startsWith('phreezer_')).forEach(k => localStorage.removeItem(k))` in console, then re-register
- CSS at ~760 lines — still clean, no duplication, but watch it

### Next Session Priorities
1. **Test onboarding end-to-end** with fresh account (Matthew was doing this at session close)
2. **Delete /api/debug/reviews.js** — overdue
3. **Community rating caching** — add `pnet_community_score` column to attendance table, write on show load, display on cards
4. **Share cards** — post-rating shareable image for Twitter/Instagram
5. **Subdomain** — phreezer.mpgink.com CNAME → Vercel

## Session 7 — 2026-06-03 (FINAL UPDATE)

### Completed This Session
- App renamed Phishow Scorecard → Phishook → **Phreezer**
- Tagline: FREEZE. RATE. RELIVE.
- SVG logo built inline: snowflake + THE PHREEZER wordmark, no external font deps
- Collapsed sidebar: orange snowflake SVG
- Expanded sidebar + mobile header: full wordmark SVG
- Hiatus years 2005/2006/2007 hidden from year buttons; 2008 kept
- CLAUDE.md created for Claude Code session context
- Full rename pass throughout codebase
- Song duration format fixed (ms vs seconds)
- Pre-1998 shows fixed (API limit bumped to 2500)
- Phish.net link format fixed in attended cards (?d=YYYY-MM-DD)
- Attendance table + import: /api/import/phishnet.js
- user_reviews table v2: one row per review using phishnet_review_id as unique key
- Reviews import: /api/import/phishnet-reviews.js — all distinct reviews per show
- Attendance endpoint: returns all reviews as JSON array per show
- My Shows tab rebuilt: ATTENDED/RATED toggle, import panel, sort/filter
- Sort: DATE↓↑, PHREEZER↓, PHISH.NET↓, UNRATED FIRST
- Filter pills: ALL, REVIEWED, RATED, UNRATED
- Side-by-side scores on show cards: PHREEZER avg
- Multiple reviews per show displayed chronologically with REVIEW X OF N label
- Dopamine import modal: glowing count, tagline, tap to dismiss

### Data State (mpgink)
- 188 attended shows imported from phish.net
- 35 reviews imported — multiple per show where applicable
- phishnet_score field dropped from active use — review upvote score not personal rating
- Personal phish.net star rating not accessible via API without OAuth — deferred

### Decisions Made
- phish.net `score` field on reviews = community upvotes on the review, not personal show rating
- Personal star rating requires OAuth — not worth building, deferred indefinitely
- PHISH.NET score column on show cards to show community rating pulled from setlist API instead
- Social sharing: Twitter/X and Instagram story after rating a show
- Share card = marketing — "I just froze 12/31/95 — 4.8/5 on Phreezer"
- Platform scope: Phish community only, no expansion beyond
- App is moving toward platform — onboarding, T&Cs, social sharing needed

### Next Session Priorities
1. **Onboarding flow** — welcome screen, what is Phreezer, import phish.net, rate first show, T&Cs
2. **T&Cs** — plain English, not affiliated with Phish/phish.net, data attribution, user owns content
3. **Share cards** — after rating, generate shareable image: show, score, Phreezer brand → Twitter/Instagram
4. **Community rating on show cards** — pull phish.net overall show rating from setlist API, cache per show, display alongside Phreezer avg
5. **KPI dashboard** — top of My Shows: shows attended, rated, avg score, top song, peak era, geographic footprint
6. **Tap to rate from attended list** — eliminate friction of going back to Scorecard
7. **Remove debug endpoint** — /api/debug/reviews.js before public launch

### Open Technical Debt
- Debug endpoint still in repo: api/debug/reviews.js — DELETE before launch
- index.css approaching bloat again — rebuild pass needed soon
- Session log token pattern only needed in claude.ai — Claude Code reads files directly

## Session 7 — 2026-06-03

### Decisions
- App renamed: Phishow Scorecard → Phishook → **Phreezer** (song title, Ph spelling, freeze/preserve metaphor)
- Tagline: FREEZE. RATE. RELIVE.
- Logo: SVG built inline — snowflake icon + THE PHREEZER wordmark, no external font deps
- Collapsed sidebar: orange snowflake SVG
- Expanded sidebar + mobile header: full wordmark SVG
- Hiatus years 2005/2006/2007 hidden from year buttons; 2008 kept (one-off show)

### What Was Built
- CLAUDE.md created for Claude Code session context
- Full rename pass: Phishook → Phreezer throughout codebase
- Logo assets pushed to client/public/assets/ (SVG preferred over PNG)
- Phish.net attendance import: /api/import/phishnet.js
- Attendance table: user_id, show_date, venue, city, state, country, source
- User reviews import: /api/import/phishnet-reviews.js
- user_reviews table: user_id, show_date, phishnet_score (1-5), review_text, posted_date
- Attendance endpoint updated to JOIN user_reviews — returns all three scores per show
- My Shows tab rebuilt: ATTENDED/RATED toggle, IMPORT panel with ATTENDANCE/REVIEWS+SCORES toggle
- Dopamine import modal: big glowing count, tagline, tap to dismiss
- Sort controls: DATE↓↑, PHREEZER↓, PHISH.NET↓, UNRATED FIRST
- Filter pills: ALL, REVIEWED, RATED, UNRATED
- Side-by-side scores on show cards: PHREEZER avg + PHISH.NET star rating
- Expandable written review inline on show card
- Fixed: song duration format (ms vs seconds)
- Fixed: pre-1998 shows (bumped API limit to 2500)
- Fixed: phish.net link format in attended cards (?d=YYYY-MM-DD)
- Fixed: phish.net score scale — 1-5 stars, 0 treated as null

### Data Imported (mpgink)
- 188 attended shows from phish.net
- 35 written reviews from phish.net
- Scores: 1-5 star personal ratings, nulls where not personally rated

### Known Issues / Open Debt
- Debug endpoint /api/debug/reviews.js still in repo — remove before public launch
- phish.net community score (3.79/5 overall) not yet pulled — separate from personal score
- Filter by year not yet built (sort exists, year filter deferred)
- KPI dashboard not yet built (shows rated, avg score, top song, etc.)
- Song versions expandable list not yet built
- Tap to rate from attended list not yet built
- Login screen welcome/hero moment not yet built
- Subdomain phreezer.mpgink.com not yet configured

### Next Session Priorities
1. KPI cards at top of My Shows (shows attended, rated, avg score, top song, rarest show)
2. Tap to rate directly from attended show card
3. Filter attended by year (dropdown or pill)
4. Song versions expandable in Analytics
5. Login/landing hero screen with full lockup + tagline

# Phishook Scorecard — Session Log

## Session 6 — June 3, 2026
**Status**: UAT complete. Sidebar shipped. Brand/name direction locked. Logo in progress.

---

### What Was Done

**UAT — all 5 items from Session 5 verified:**
- ✓ Spinner glitch fixed (300ms delay before showing, year buttons bypass entirely)
- ✓ Year filter working — mobile and desktop, 2002/2003 NYE tour bleed eliminated
- ✓ Phish.net + Reviews merged into one button: "PHISH.NET SETLIST + REVIEWS (N)"
- ✓ Relisten URL correct — direct show page. Mobile app intercept is Relisten's bug, not ours
- ✓ Desktop sidebar rendering and toggle working (after CSS deduplication fix)

**CSS cleanup:**
- index.css was 2969 lines with 3x duplication from session append pattern
- Rebuilt clean from scratch: 460 lines, no duplicates, sidebar integrated properly
- Root cause of sidebar not rendering was CSS specificity conflicts from duplicate blocks

**Desktop sidebar — Stage 1 shipped:**
- Left sidebar replaces horizontal tab nav on desktop
- Collapsed (52px icon-only) / Expanded (220px with labels) via click toggle
- Toggle moved outside `<aside>` as a protruding tab (sidebar-wrapper + sidebar-tab pattern) — fixes Firefox overflow:hidden clipping the click
- Sections: MY PHISH (Scorecard, My Shows, Analytics), COMMUNITY (shell, SOON badges), LINKS (placeholder)
- User avatar + username + logout at bottom
- Login/Register when not authed
- Mobile: completely unchanged — original header + tab nav still in place
- Placeholder logo glyph ⟁ in sidebar — to be replaced with real Phishook logo

**App name change — decided, not yet implemented:**
- App renamed from "Phishow Scorecard" to **Phishook**
- Phishow conflicts with phishows.com (existing community site)
- Phishook = fish + hook, works on every level, no conflicts found
- Subdomain: **phishook.mpgink.com** — uses existing mpgink.com domain, no new registration needed
- Name change not yet applied to codebase — do in next session as part of logo pass

**Brand/logo direction locked:**
- Reference fish: clean minimal line art, similar to teal fish image provided (rounded body, V-fork tail, dorsal spike, simple eye)
- Reference hook: classic J-hook with barb and straight shank, orange on dark
- Concept: fish + hook as icon mark, PHISHOOK wordmark in Orbitron, "DON'T SUCK AT PHISH" tagline
- Two assets: (1) icon/favicon = fish + hook combined, (2) full lockup = icon + wordmark + tagline
- Matthew is generating final logo assets externally — will provide finished file next session
- SVG in-chat rendering hit payload size limit — don't attempt base64 image embedding in widget tool

**Score comparison — open item:**
- Phish.net shows community ratings (e.g. 4.379/5) vs our per-song ratings (e.g. 2.25)
- Decision: drop score from the merged button entirely, just show count
- Future feature: show our score vs phish.net score side by side in show masthead — designed but not built

---

### Known Issues / Open Debt
- Score confusion: .net ratings scale vs our song-by-song ratings — surface in masthead (not built)
- Relisten mobile app drops to home screen on deep links — Relisten's bug, documented
- Search on mobile still clunky — parked for dedicated session
- Sidebar toggle tab sizing/polish — functional but rough visually, refine with logo pass
- How To Use panel: on mobile stays where it is; hamburger/bottom nav option deferred

---

### Next Session Priorities
1. **Logo integration** — Matthew provides final fish+hook asset, drop into sidebar replacing ⟁ glyph
2. **Full rename pass** — "Phishow Scorecard" → "Phishook" everywhere (title tag, header, instructions, SESSION_LOG, INSTRUCTIONS.md)
3. **Subdomain setup** — phishook.mpgink.com CNAME → Vercel (Matthew does DNS, we verify)
4. **Score comparison** — our rating vs phish.net rating in show masthead
5. **AI Show Summary** — on-demand Claude API call on show detail, gated behind auth
6. **Community tab shell** — real layout with placeholders, pulls actual user rating data we have
7. **Profile page** — bio, Phishook handle, Buy Me a Coffee

### Architecture Notes
- Sidebar uses sidebar-wrapper + sidebar-tab pattern (toggle outside aside) — required for Firefox overflow:hidden fix
- CSS must NOT be appended — always rebuild clean. Last clean version: 460 lines
- Desktop = desktop-layout (flex row, sidebar + main-area). Mobile = mobile-layout (hidden on desktop)
- Claude Code recommended for next session — eliminates GitHub API roundtrip friction
- Context window gets long fast — start fresh each session, SESSION_LOG is the handoff

### Credentials (in Claude project memory, not here)
- GitHub token: session-only, provided fresh each time
- Vercel, Neon, Resend: in project memory
