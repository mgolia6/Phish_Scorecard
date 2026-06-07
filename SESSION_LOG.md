# SESSION LOG — Phreezer

## Session: 2026-06-07 (continued)

### Shipped
- KPI card flip: CSS 3D rotateY, one-at-a-time, data source attribution on back
- KPI labels: SHOWS / PHROZEN / AVG SCORE / REVIEWED
- KPI layout restructure: bare grid on top, QUICK PHREEZE section below with IMPORT moved in
- Font system standardized across KPI card: 2rem value, 0.52rem label, 0.6rem section title, 0.54rem body — no more ad-hoc rem values
- Badge labels fixed: BADGE_LABELS map now uses actual API IDs (century, rated_1, critic, etc.)
- Badge labels shortened: 100 CLUB, 1ST FREEZE, CRITIC, ON FIRE, etc.
- FIRST SHOW label corrected (was FIRST FREEZE — that's attendance date, not rating date)
- TOP RATED SONG / TOP VENUE labels clarified
- Stars → X.X★ format in ShowCard and MySongsTab (★ glyph, not asterisk)
- Filter buttons: orange active / cyan-dim inactive, labels PHROZEN / UNPHROZEN
- Sort buttons: cyan active / cyan-dim inactive
- ShowCard PHISH.NET link: contrast bumped from text-muted to cyan 70%
- KPICards TAP TO FLIP hint: 0.52rem bold, 75% opacity (was tiny and invisible)
- Deep Phreeze CTA: 80% opacity + underline affordance
- Vibe Check: proper error state (vibeError), clean fallback message pointing to raw reviews
- Vibe Check: bad cache detection — if stored structured data doesn't parse, purge and regenerate
- HOW TO USE PHREEZER copy: updated to reflect current state (stars, Vibe Check, MY PHREEZER)
- STYLE_GUIDE.md added to repo — design tokens, font system, component patterns, badge map, vocabulary
- INSTRUCTIONS.md updated — 75% context wrap rule, STYLE_GUIDE reference, current architecture
- Avatar direction decided: Option C (SVG geometric Phreeze pattern) — not yet implemented

### Decisions
- Avatars: geometric SVG (snowflake geometry, cyan) as default, Orbitron initials if display name set. No emoji, no uploads.
- Profile questions: tap-to-select buttons only, no free text — better data quality
- Star display: always X.X★ in compact contexts, never individual star glyphs
- Filter color convention: orange = filter (user-set state), cyan = sort (temporal/data ordering)
- RATED/UNRATED → PHROZEN/UNPHROZEN to stay on-brand vocabulary

### Roadmap items added
- Star rating scale definition: what 1★–5★ actually means in Phreezer context — needs design decision before implementing (currently inaccurate in any documentation)
- Profile questions: vantage point (Mike's Side / Page's Side), GA or Seats, show style (Dance / Chill / Both) — tap-to-select, needs DB columns + API update + UI
- Avatar implementation: SVG geometric Phreeze pattern component, seeded from username
- COMMUNITY tab: still placeholder
- Phishook/Phreezer logo integration: not yet applied to codebase

### Open issues
- Vibe Check "could not generate" on some shows — error state now shows cleanly but root cause unclear; likely ANTHROPIC_API_KEY env var or Haiku model string needs verification
- Profile modal INFO tab is read-only — no edit UI yet for any profile fields
- MySongsTab KPI tiles still use old square tile design, different from MY SHOWS — should unify

### Next session priorities
1. Implement profile tap-to-select questions (DB + API + UI)
2. Implement geometric SVG avatar
3. Investigate Vibe Check generation failure (check ANTHROPIC_API_KEY in Vercel env)
4. COMMUNITY tab scaffold
5. Rate limiting on auth endpoints (security backlog)
