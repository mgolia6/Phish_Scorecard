# SESSION LOG — Phreezer

## Session: 2026-06-07 (complete)

### Shipped
- KPI card flip, labels, layout restructure, font system, badge fixes
- Stars → X.X★ format, filter/sort button styling
- STYLE_GUIDE.md and INSTRUCTIONS.md added to repo
- Badge black screen fix, geometric SVG avatar system
- ScorecardTab JSX bug fix, vercel.json companions route

---

## Session: 2026-06-07 (continued — UI + Deep Phreeze pass)

### Shipped

**Vibe Check**
- Fixed model string → `claude-haiku-4-5` alias (never dates)
- Fixed max_tokens 600→1500 (was truncating mid-JSON)
- Resilient JSON parser — extracts from anywhere in response
- Frontend cache validation — falls through to POST if cached result invalid
- Error surfaced in UI instead of generic fallback

**ShowCard redesign**
- Stacked date (MON/DD/YR), dual left border (cyan=rated, orange=reviewed, both=both)
- ★ favorite moved to action bar — prominent, tappable
- MY REVIEW in expanded panel — deduped, bbcode stripped
- Set scores space-evenly, differentiated colors (SET I cyan, SET II orange, ENCORE green)
- Star rendering fixed — mono font, 1.3rem, reads as star not asterisk
- iOS address auto-link underline suppressed on venue/city

**My Shows filters**
- Removed UNPHROZEN filter, SORT label removed
- UNRATED in sort options

**KPICards**
- Quick Phreeze background fixed (was tinted green)
- Progress bars → next milestone (5→10→25→50→100...)
- Deep Phreeze CTA formatting matches TAP STAT hint

**OTD Card**
- Typography hierarchy fixed: YRS AGO, MY SCORE, city, vibe toggle all properly sized

**MyVenuesTab / MyStatesTab**
- Consistent section headers (◈ prefix), score colors, expand headers
- Added venue show count in states expanded

**DeepPhreezeTab — full redesign**
- Removed redundant headers
- Merged CLEAR + SYNC into two buttons: ↺ SYNC (incremental) and ↺↺ FULL (wipe + rebuild)
- Sections: YOUR PHISH LIFE, BY ERA, SONGS YOU'VE HEARD, GEOGRAPHY, WHEN YOU SEE PHISH, LONGEST SHOWS, STREAKS & GAPS, MOST HEARD, ENCORE PATTERNS, RAREST CATCHES
- RATED tab: YOUR RATINGS, PEAK MOMENT, BIGGEST SET SWING, COMPLETIONISM, MOST RATED VERSIONS
- Live Phish time: real calculation (attended × 3hrs), formatted as Xd Yh Zm
- Era breakdown: 1.0/2.0/3.0/4.0 with date ranges
- Set preference: YOU'RE A SET I/II PERSON based on rating history
- Show density, consecutive years, days since first show
- Day-of-week bar chart + month bar chart (WHEN YOU SEE PHISH section)
- Avg show length, avg set I/II length, avg encore — real times from phish.in when available
- First/last song ever heard, first/last show tappable → opens Scorecard overlay
- Longest show/set/encore tiles tappable → Scorecard overlay
- Song version dropdown: tap song in MOST RATED VERSIONS → expands top 5 versions with ▶ links
- All song names link to phish.net song page
- Row component: full row tappable (not just value)

**sync.js extended stats**
- phish.in duration fetch per show (stored in show_cache.duration_seconds)
- Per-set duration calculated proportionally
- Day-of-week + month breakdowns
- Era breakdown, set preference, show density, busiest year
- Song version details stored in most_heard_rated for dropdown
- Consecutive years streak computed

**Admin**
- /api/admin/clear-cache endpoint: wipes show_cache + user_stats, leaves ratings/attendance intact
- vercel.json: added clear-cache, sync, deep-phreeze routes

**Phishook brand assets**
- Deleted from repo: fish-and-hook.png, hook-only.png, phishook-full-lockup.png, phishook-icon.png
- Not our IP, removed entirely

**Security**
- Neon token exposure detected in git history (old SESSION_LOG commit)
- Neon auto-rotated password, Vercel auto-updated env vars
- GitHub PAT to rotate at start of next session
- Repo files clean — no hardcoded credentials

### Key learnings this session
- phish.in API blocked from Claude environment — can't test response shape directly; wrote defensive multi-shape parser
- show_cache is shared across users; clear-cache deletes only rows matching user's attended dates
- JSX onClick on inline button inside flex row not reliably tappable on mobile — full div as tap target is correct
- Fake progress delay messages (setTimeout) are fine for UX; real SSE streaming is future work
- Git history retains secrets even after file edit — rotate immediately, don't rely on removal

### Decisions
- SYNC = incremental update (new/stale shows only)
- FULL = clear + full rebuild in one motion
- No separate CLEAR button — merged into FULL sync flow
- Phishook dropped entirely — separate brand, not ours
- Set duration shown as real time when phish.in data available, song count only when not

### Process change this session
- INSTRUCTIONS.md updated: ROADMAP.md now pulled at session kickoff (step 3)
- Formal session wrap protocol added — roadmap + session log must be updated and validated before session closes
- Rule added: if Matthew asks about roadmap mid-session, pull it fresh — never answer from memory

### Next session priorities
1. **COMMUNITY tab** — biggest visible gap, still placeholder
2. **Rate limiting on auth endpoints** — security backlog Priority 1
3. **Welcome + weekly nudge emails** — Resend wired, needs templates + triggers
4. **Profile tap-to-select questions** — vantage point, GA/seats, era preference
5. **Rotate GitHub PAT** before starting
6. Verify phish.in duration data is populating after FULL sync (check precise_show_count in result message)

---

## Session: 2026-06-07 (afternoon/evening — Deep Phreeze + Profile + Community pass)

### Shipped

**Deep Phreeze**
- First/Last show rows: added ◈ indicator, removed href (onClick only → opens Scorecard overlay)
- OTD carousel: switched from find() to filter() — shows ALL matching shows for today, ‹ N/total › nav
- Longest show toggle: SONGS / TIME button pair, falls back to song count if duration_seconds unavailable
- Most Heard: fixed "TAP TO LISTEN" label → "TAP TO EXPAND", expand shows top 5 versions with ▶ + GO TO SHOW
- Encore Patterns: rebuilt from RankedList → custom render with last_date/last_venue + ▶ play button
- Rarest Catches: same treatment — date/venue + ▶ play button per row
- Streaks: added run start/end (tappable), songs heard, unique songs, states covered
- Completionism section: removed entirely
- Set breakdown tiles (SET I/II/ENCORE SONGS): removed — data lives in TOTAL SONGS HEARD expand
- SYNC/FULL collapsed to single SYNC button — long press (1.5s) triggers full rebuild
- SYNC button visually separated from ATTENDED/RATED tabs (margin, green border, glow)
- Tap-to-expand factoids on all Hero and Tile cards (expand-below pattern, one open at a time)
- YEARS OF PHISH renamed to YEARS WITH PHISH, factoid shows full span since first show

**sync.js**
- longest_run: added end date, songs_heard, unique_songs, states array
- rarest_caught: added date + venue per song
- most_common_encore: added last_date + last_venue per song
- longest_show/set1/set2/encore: added duration_seconds
- most_heard_attended: added versions array (top 5 dates+venues per song)
- songAttendedVersions built from showsWithCache loop

**Scorecard bug fix — sandwiched/reprised songs**
- Songs keyed by globalIdx/posKey (pos_N) instead of song_name
- ratings API: added song_position column (auto-migrates), upserts by position
- ScorecardTab: annotates songs with globalIdx + posKey on load
- ScorecardHelpers SetScore: uses posKey fallback

**Community**
- Top Shows: fixed stats query (was cross-joining, returning blank)
- Top Venues: removed Heatmap from CommunityTab and MyVenuesTab
- Leaderboard: added feedback_count and bugs_reported columns (JOIN on feedback table)
- FeedbackModal: added "Bug Report" as a PASSIVE_SECTIONS option

**Profile**
- INFO tab: full aesthetic overhaul — cyan left border, ◈ headers, bigger fonts, proper spacing
- Tap-to-select questions added: WHERE DO YOU USUALLY SIT (Floor/Reserved/Lawn), FAVORITE ERA, MIKE/PAGE SIDE, DANCE/CHILL
- HOW DO YOU EXPERIENCE PHISH question removed
- Profile API: added stage_side, show_vibe columns with auto-migration
- ABOUT tab added: Origin Story, What This Is, Built By (mpgink + BMaC), Standing on Shoulders (phish.net/phish.in/Anthropic)
- BADGES tab: fixed black screen — ALL_BADGES_DEF was defined in MyPhriends but not in ProfileModal, added it
- initialSection prop added to ProfileModal so Easter egg and programmatic opens can target a specific tab

**My Songs**
- Removed ★ star from expanded version rating display

**Holographic gradient text**
- Applied to: UNCLE EBENEZER (all instances), JADED VET (new subtitle, own line), QUICK PHREEZE, IMPORT button, RATE button (OTD), SEARCH buttons (MyPhriends + CommunityTab)

**Uncle Ebenezer**
- Title updated to UNCLE EBENEZER / JADED VET (two lines, both holographic)

**Easter egg**
- Triple-tap DON'T SUCK AT PHISH marquee → opens ProfileModal to ABOUT tab
- Logo triple-tap remains admin access

**How-to steps**
- All 6 steps rewritten: clearer, accurate, added attendance tracking as step 4, removed joke ending

### Build failures this session (root cause documented)
- ScorecardTab step 03: partial str.replace spliced old+new tags → `<spa<div`
- MyPhriends/CommunityTab SEARCH buttons: duplicate `background` key from holographic patch
- ProfileModal settings: JSX comment missing closing `}`, plus missing `</div>` for info wrapper
- All caused by editing stale /tmp copies without re-pulling from GitHub between patches

### Process fix for next session
- Pull fresh from GitHub immediately before EVERY edit, not just at start of a block

### Decisions
- Expand-below (not flip) for Deep Phreeze card factoids — cleaner on mobile 2-col layout
- SYNC = smart incremental, long-press = full rebuild — no second button exposed
- Phish Phreeze (band-level stats tab) scoped but not built — next session

### Next session priorities
1. **Phish Phreeze** — band-level stats subtab in Community (shows played, songs, hours, days of week, months, countries)
2. **Rate limiting on auth endpoints** — Priority 1 security
3. **Top Shows blank** — needs more user ratings to populate (only 7 shows rated)
4. **Verify sandwiched song fix** on a real show with reprises (e.g. Mike's Song > something > Mike's Song)
5. **Deep Phreeze SYNC** — run a full sync to populate new data fields (rarest date/venue, encore last_date, run detail)
6. **Desktop UAT pass** still pending
