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
- Uncle Ebenezer: floating AI agent (snowflake button, orange, bottom-right, every tab)
  - api/ai/ebenezer.js: pulls user show history from DB, 10-turn fading memory, Claude Sonnet
  - EbenezerDrawer.jsx: slide-up drawer, suggestion prompts, CLEAR, session memory
- Security review: bcrypt passwords, signed JWTs, CORS. Missing: rate limiting on auth endpoints.

### Next session priorities
- Confirm Ebenezer works end-to-end (check localStorage token key)
- Confirm Vibe Check renders correctly with real review text
- Rate limiting on auth endpoints (low priority)
- Lock down admin/migrate endpoint
- COMMUNITY tab still placeholder
- Phishook/Phreezer rename + logo not yet applied

### Key learnings
- Phish.net v5 review field: review_text (not review)
- Haiku wraps JSON in markdown fences despite instructions -- always strip + harden prompt
- HEATMAP_POS must live in Heatmap.jsx -- cannot rely on monolith scope
- Never touch files with string manipulation for deploy triggers
- DB connection times out from bash_tool -- use auto-create pattern instead
- Claude Haiku for Vibe Check (fast/cheap), Claude Sonnet for Ebenezer (needs to reason)
