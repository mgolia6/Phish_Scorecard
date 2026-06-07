# SESSION LOG — Phreezer

## Session: 2026-06-07 (final update)

### Shipped
- KPI card flip: CSS 3D rotateY, one-at-a-time, data source attribution on back
- KPI labels: SHOWS / PHROZEN / AVG SCORE / REVIEWED
- KPI layout restructure: bare grid on top, QUICK PHREEZE section below with IMPORT moved in
- Font system standardized across KPI card: 2rem value, 0.52rem label, 0.6rem section title, 0.54rem body
- Badge labels fixed: BADGE_LABELS map now uses actual API IDs (century, rated_1, critic, etc.)
- Badge labels shortened: 100 CLUB, 1ST FREEZE, CRITIC, ON FIRE, etc.
- FIRST SHOW label corrected (was FIRST FREEZE — that's attendance date not rating date)
- TOP RATED SONG / TOP VENUE labels clarified
- Stars → X.X★ format in ShowCard and MySongsTab (★ glyph, not asterisk)
- Filter buttons: orange active / cyan-dim inactive, labels PHROZEN / UNPHROZEN
- Sort buttons: cyan active / cyan-dim inactive
- ShowCard PHISH.NET link: contrast bumped from text-muted to cyan 70%
- KPICards TAP TO FLIP hint: 0.52rem bold, 75% opacity
- Deep Phreeze CTA: 80% opacity + underline affordance
- Vibe Check: proper vibeError state, clean fallback message pointing to raw reviews below
- Vibe Check: bad cache detection — purge and regenerate on corrupt stored data
- HOW TO USE PHREEZER copy: updated — stars, Vibe Check, MY PHREEZER refs; Leaderboard removed
- STYLE_GUIDE.md added to repo — design tokens, font system, component patterns, badge map, vocabulary
- INSTRUCTIONS.md updated — 75% context wrap rule, STYLE_GUIDE ref, current architecture
- Badge black screen fixed — BadgesSection was missing useState/useEffect imports, crashed silently
- Geometric SVG avatar implemented: PhreezerAvatar component, 4 options (PHREEZE/CROSSHAIR/WAVEFORM/HEXAGON)
- Avatar picker replaced emoji grid with 2×2 SVG geometric picker in ProfileModal
- Header avatar button replaced with PhreezerAvatar component (44px circle, cyan border)
- App.jsx updated to import and render PhreezerAvatar

### Decisions
- Avatars: geometric SVG (4 options seeded by id), exported from ProfileModal.jsx, used in App.jsx header
- Profile questions: tap-to-select buttons only — better data quality
- Star display: always X.X★ in compact contexts, never individual star glyphs
- Filter color convention: orange = filter, cyan = sort
- RATED/UNRATED → PHROZEN/UNPHROZEN on-brand vocabulary
- Vibe Check intermittent failure: ANTHROPIC_API_KEY confirmed present; likely rate limit or cold start timeout — error state handles it gracefully, not blocking

### Roadmap
- **Star rating scale definition** — what does 1★–5★ mean in Phreezer? Needs Matthew's rubric before adding anywhere
- **Profile tap-to-select questions** — vantage point (Mike's Side / Page's Side), GA or Seats, show style (Dance / Chill / Both) — needs DB ALTER + API update + UI
- **Welcome email** — send on registration via Resend; personalized, on-brand
- **Weekly reminder email** — "log in and rate a show"; if user has imported shows, personalize with one of their unrated shows; cadence TBD
- **Email infrastructure** — Resend already wired; need email templates + trigger logic in auth/register.js and a scheduled job or cron for weekly
- **COMMUNITY tab** — still placeholder
- **Phishook/Phreezer logo integration** — not yet applied to codebase
- **Rate limiting on auth endpoints** — security backlog, Priority 1
- **MySongsTab KPI tiles** — still old square tile design, different from MY SHOWS KPI grid — unify
- **Vibe Check reliability** — investigate rate limits / cold start timeout on Haiku; consider bumping max_tokens or adding retry logic

### Open issues
- Profile modal INFO tab is read-only — no edit UI yet for any profile fields
- Vibe Check intermittent generation failure — error state surfaces cleanly but root cause not fully resolved

### Next session priorities
1. Profile tap-to-select questions (DB ALTER + API + modal UI)
2. Email: welcome + weekly reminder (Resend templates + trigger)
3. COMMUNITY tab scaffold
4. Rate limiting on /api/auth/login + /api/auth/register
