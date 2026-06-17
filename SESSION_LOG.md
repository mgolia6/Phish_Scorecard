# SESSION LOG

## Session: 2026-06-17 (Full Day)

### Shipped

**Ebenezer — Knowledge Base**
- Full Phish.net catalog seeded: 3,171 songs (play count, debut, gap), 4,082 shows (venue, tour), 1,847 fan-written reviews
- 2,500+ jamchart entries seeded separately via seed-jamchart endpoint
- DB tables: pn_songs, pn_shows, pn_reviews, jamchart_entries
- searchJamchartsDB — keyword + era search across full catalog
- searchReviewsByVibe — full-text search fan reviews for vibe language (cow funk, bliss, type II etc.)
- querySongFacts, queryShowFacts, queryLongestVersions, queryDebut, queryTeases, queryGuests, queryReviews
- formatVibeContext, formatRichShowContext, formatRichSongContext, formatDBJamchartContext
- Weekly cron: refresh-jamcharts every Monday 6am UTC

**Ebenezer — Intent + System Prompt**
- vibeMap expanded: siren, loop, dissonant, reggae, tension, peak, drone, electronic, rage, shred
- Era-only queries now work without vibe keywords (best 1997 shows → pulls peak era jamcharts + reviews)
- Banned context block disclaimers entirely — "the jamchart pull", "early-era material" etc. explicitly prohibited
- Hard rule: always lead with the answer, never explain data pipeline to user
- Hard rule: never redirect user to Phish.net — Ebenezer IS the discovery tool
- Hard rule: never claim data is era-limited — full catalog is loaded
- Hard rule: no "see live" / future show recommendations

**Ebenezer — Content Moderation + Logging**
- ebenezer-moderate.js: hard keyword blocklist + Claude Haiku pre-flight check
- ebenezer-log.js: anonymous conversation metadata (intent, era, keywords, lengths — NO user ID, NO text)
- User opt-out: ebenezer_opt_out column on users table, persists cross-device via profile API
- Blocked messages get in-character response: "That's not the kind of conversation I'm having."
- logAiUsage fixed: non-blocking Promise.resolve().then pattern

**Ebenezer — Drawer UI**
- Export conversation button (orange, appears after first message, downloads .txt)
- Disclosure footer: "Conversations logged anonymously. Opt out." — visible, orange/green styling
- Expand to full modal on desktop (860px × 700px, backdrop blur, ✕ to close)
- Opt-out syncs from user profile on first open — cross-device consistent
- Both drawer and rail have full opt-out state management

**Admin — SYSTEM tab**
- Tooltips removed — always-visible descriptions for every action
- Grouped by: DATABASE, UNCLE EBENEZER — KNOWLEDGE BASE, USERS + BADGES
- SEED PHISH.NET FULL CATALOG button with full result modal (songs/shows/reviews counts)
- SEED JAMCHART CATALOG button
- REFRESH JAMCHARTS button (also runs on Monday cron)

**Admin — MONITORING tab**
- EBENEZER KNOWLEDGE BASE panel: row counts, last seeded date, refresh recommendation if >30 days
- RATING ACTIVITY: now shows SONG RATINGS / SHOWS RATED / RATERS (was just total)
- USER GROWTH: fixed email_verified column name (was is_verified — broken)

**Seed diagnostics**
- seedShows: captures field names from first record, surfaces in result modal
- seedReviews: shows shows_processed, errors, first_error, sample_review_fields
- Phish.net /shows has no rating field — pn_rating hidden pending inquiry with phish.net

**Toast notification**
- z-index bumped to 9500 — floats above everything
- Repositioned to bottom-center (was top-right, buried behind header on mobile)

**Fixes**
- Ebenezer syntax error fixed (formatPhreezeerContext broken multiline strings)
- seed-phishnet SQL comment syntax error fixed (-- is not valid JS)
- Missing imports for ebenezer-moderate + ebenezer-log added
- ebenezerOptOut declared before use (was causing 500 on every call)
- AI usage logging: was imported but never called — now fires after every response

### Decisions Made
- Phish.net show ratings not available via v5 API — pn_rating hidden, will re-add when API access confirmed
- Review score field on bulk /reviews.json is upvotes on the review, not show rating — confirmed
- Per-show review endpoint (/reviews/showdate/{date}) is the correct one — matches Vibe Check pattern
- Anonymous logging only — no user ID, no message text stored. User can opt out via drawer
- Ebenezer context disclaimer is banned — lead with the answer always
- AI skepticism in forum thread is real — don't lean into AI angle in comms

### Open Debt / Next Session
See ROADMAP.md

---

## Session: 2026-06-16 Part 3 (Evening)

### Shipped

**Feed fixes**
- Body truncation at 220 chars with READ MORE / SHOW LESS toggle
- New post box collapsed by default — single compact row, expands on tap
- 80px bottom padding on feed container

**Boot sequence**
- Real typewriter effect — char-by-char with blinking block cursor (36ms/char)
- Rotating Phish inside-joke lines (NOTIFYING WILSON, CONSULTING ICCULUS, etc.)
- Snowflake size bumped to clamp(100px, 28vw, 160px)
- DON'T SUCK AT PHISH split to two lines to prevent overflow
- Glitch exit effect — RGB split, hue rotation, clip-path tears, fades to black into app
- Tap to skip restored (pointer-events fix on celebrate-overlay)
- FullPageLoader spinning snowflake suppressed during boot, restored elsewhere
- FullPageLoader z-index lowered to 1000 so boot sequence (2000) always wins

**Email system**
- Cron upgraded — onboarding email now fires to any verified user who hasn't gotten it
- 300ms delay between sends to stay under Resend 5/sec rate limit
- Onboarding email copy rewritten — community-first tone, removed braggy opener
- Welcome emails successfully sent to users (confirmed via Resend dashboard)

**Founder badges**
- PHAB PHIVE badge — first 5 verified users by signup date
- EARLY PHREEZE badge — users #6-20
- seed-founder-badges.js admin endpoint
- BadgesTab component in ProfileModal
- SEED FOUNDER BADGES button in AdminTab SYSTEM tab

**AI tab**
- New AI tab in ProfileModal
- Responsible AI opener
- Ask Ebenezer and Vibe Check feature cards
- Three data layers (YOUR DATA, PHREEZER COMMUNITY, PHISH.NET PUBLIC DATA)

**Ebenezer upgrades**
- Intent detection — date, song name, recommendation/general patterns
- Show/song/general intent handlers
- Phreezer aggregate data injected every session

---

## Session: 2026-06-16 Part 2 (Desktop Pass)

### Shipped
- API upgrades: top-songs, top-shows, top-venues, top-states
- CommunityTab full rewrite
- Desktop CSS pass

---

## Session: 2026-06-16 Part 1 (Full Day)

### Shipped
- All crashes / P0s, filter rewrite, DesktopLanding, SlotMachine
- Companion system, Phriend Overlap gate, Ebenezer pinned post
- Boot sequence, desktop card stats
