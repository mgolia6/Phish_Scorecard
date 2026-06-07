# SESSION LOG — Phreezer

## Session: 2026-06-07

### Shipped
- Full monolith refactor: App.jsx (4,424 lines) -> 26 component files in client/src/components/
- Mock design: compact ShowCard, KPICards with IMPORT in header, MyShowsTab cleanup
- Sub-nav fix: flex-shrink:0 so tabs scroll instead of truncate
- ShowCard: expand restored with placeholder for unrated shows, action bar always visible
- Heatmap: HEATMAP_POS and hmColor constants restored (missing, caused black screen on MyVenues/MyStates/MySongs)
- Vibe Check: server-side AI synthesis via api/ai/summarize.js (Haiku)
- Vibe Check: structured JSON (overall, themes, sentiment badge FIRE/SOLID/MIXED/SLEEPER)
- Vibe Check: caching in vibe_checks table (auto-creates), GET cache + POST generate+store
- Vibe Check: review field fixed (review_text not review), all reviews returned not just 3
- Vibe Check: added to ScorecardTab on every show load
- ScorecardTab: hides search/instructions when pre-loading a show via RATE button
- Uncle Ebenezer: floating AI agent (snowflake button, orange glow, bottom-right, every tab)
  - api/ai/ebenezer.js: pulls user show history from DB, 10-turn fading memory, Claude Sonnet
  - EbenezerDrawer.jsx: slide-up drawer, suggestion prompts, CLEAR, session memory
- KPI refresh: closes scorecard overlay increments kpiRefreshKey, forces KPI + show list re-fetch
- Search panel fix: removed onShowLoaded callback that was nulling initialShowDate immediately
- Mobile song-row CSS: horizontal layout — name+meta left, play+stars right (was stacking vertically)
- Setlist data fix: filter non-Phish artists by artistid !== 1
  - Phish.net returns ALL artists for a date — Dude of Life shows, openers, etc bleed in without this
  - Secondary dedup by set+position for benefit shows where guest songs share position numbers
- Custom song filter removed in favor of artistid filter (was catching some but not all guest songs)

### How the setlist filter works
- Phish.net v5 setlist API: every song entry has artistid field. Phish = 1.
- Filter: if artistid exists and is not '1', drop the song
- Secondary: if two songs share the same set+position (benefit show format), keep the first
- This handles: Dude of Life co-bills, benefit show openers, any other non-Phish artist on same date

### Next session priorities
- Confirm Ebenezer works end-to-end (check localStorage token key is phreezer_token)
- Confirm Vibe Check renders correctly with real review text
- Rate limiting on auth endpoints (Priority 1 security item)
- Lock down admin/migrate endpoint
- COMMUNITY tab still placeholder
- Phishook/Phreezer rename + logo not yet applied

### Security backlog (see previous session log entry for full detail)
1. Rate limiting on /api/auth/login and /api/auth/register — brute force risk
2. Email verification + one-account-per-email enforcement (use Resend, already wired)
3. Disposable email domain blocklist on register
4. Lock /api/admin/migrate — no auth check currently
5. JWT hardening — shorten to 7d + revocation mechanism
6. Verify no API keys leak into client bundle (grep process.env in client/src/)

### Key learnings
- Phish.net v5 review field: review_text (not review)
- Phish.net v5 artistid: Phish = 1. Always filter by this before processing setlists.
- Phish.net returns multi-artist setlists for same date — co-bills, DOL shows, etc
- Haiku wraps JSON in markdown fences despite instructions -- always strip + harden prompt
- HEATMAP_POS must live in Heatmap.jsx -- cannot rely on monolith scope
- Never touch files with string manipulation for deploy triggers
- DB connection times out from bash_tool -- use auto-create pattern instead
- Claude Haiku for Vibe Check (fast/cheap), Claude Sonnet for Ebenezer (needs to reason)
- KPICards useEffect must include refreshKey in deps array or it never re-fetches after rating
