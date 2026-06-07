# SESSION LOG — Phreezer

## Session: 2026-06-07 (complete)

### Shipped
- KPI card flip: CSS 3D rotateY, one-at-a-time, data source attribution on back
- KPI labels: SHOWS / PHROZEN / AVG SCORE / REVIEWED
- KPI layout restructure: bare grid on top, QUICK PHREEZE section below with IMPORT moved in
- Font system standardized: 2rem value, 0.52rem label, 0.6rem section title, 0.54rem body
- Badge labels fixed: BADGE_LABELS map uses actual API IDs (century, rated_1, critic, etc.)
- Badge labels shortened: 100 CLUB, 1ST FREEZE, CRITIC, ON FIRE, etc.
- FIRST SHOW label corrected (was FIRST FREEZE — attendance date not rating date)
- TOP RATED SONG / TOP VENUE labels clarified
- Stars → X.X★ format in ShowCard and MySongsTab (★ glyph, not asterisk)
- Filter buttons: orange active / cyan-dim inactive, labels PHROZEN / UNPHROZEN
- Sort buttons: cyan active / cyan-dim inactive
- ShowCard PHISH.NET link: contrast bumped to cyan 70%
- KPICards TAP TO FLIP: 0.52rem bold, 75% opacity
- Deep Phreeze CTA: 80% opacity + underline affordance
- Vibe Check: vibeError state, clean fallback message pointing to raw reviews
- Vibe Check: bad cache detection — purge and regenerate on corrupt stored data
- HOW TO USE PHREEZER copy: updated — stars, Vibe Check, MY PHREEZER; Leaderboard removed
- STYLE_GUIDE.md: added to repo — design tokens, font system, component patterns, badge map, vocab
- INSTRUCTIONS.md: 75% context wrap rule, STYLE_GUIDE ref, current architecture
- Badge black screen fixed: BadgesSection was missing useState/useEffect imports
- Geometric SVG avatar: PhreezerAvatar component, 4 options (PHREEZE/CROSSHAIR/WAVEFORM/HEXAGON)
- Avatar picker: replaced emoji grid with 2×2 SVG picker in ProfileModal settings
- Header avatar: replaced emoji button with PhreezerAvatar at 44px
- ScorecardTab JSX bug fixed: invalid ternary `condition ? A : B && C` → two separate `&&` blocks
- vercel.json: companions route added, build command restored to standard

### Key learnings this session
- JSX ternary false branch cannot be a short-circuit `&&` expression — use two separate `{cond && (...)}` blocks
- Vercel build cache is restored from last successful build, not from source — source changes don't bust it; the actual JSX compiler error is what matters
- When a string replacement reports "OK" in Python but the pattern doesn't match exactly, the file is unchanged — always verify by re-reading the live file

### Decisions
- Avatars: geometric SVG (4 options), exported from ProfileModal.jsx, used in App.jsx header
- Profile questions: tap-to-select buttons only — better data quality
- Star display: always X.X★ in compact contexts, never individual star glyphs
- Filter = orange, Sort = cyan — consistent color convention
- RATED/UNRATED → PHROZEN/UNPHROZEN on-brand

### Roadmap
- **Star rating scale** — what does 1★–5★ mean? Needs Matthew's rubric
- **Profile tap-to-select questions** — vantage point, GA/seats, show style — DB + API + UI
- **Welcome email** — on registration via Resend, personalized on-brand
- **Weekly reminder email** — personalized with unrated show from user's import history
- **COMMUNITY tab** — still placeholder
- **Phishook/Phreezer logo integration** — not yet applied
- **Rate limiting on auth endpoints** — Priority 1 security
- **MySongsTab KPI tiles** — still old design, needs unifying with MY SHOWS grid

### Next session priorities
1. Profile tap-to-select questions (DB ALTER + API + modal UI)
2. Email: welcome + weekly reminder (Resend templates + trigger)
3. COMMUNITY tab scaffold
4. Rate limiting on auth endpoints
