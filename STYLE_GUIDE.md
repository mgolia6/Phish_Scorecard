# STYLE GUIDE — Phreezer

## Identity
Retro terminal meets modern data app. Green phosphor on black, cyan accents, orange highlights. Orbitron for display, Share Tech Mono for data. Scanlines and glow are part of the identity — not decoration. Never soften, round, or "modernize" this aesthetic without explicit direction from Matthew.

---

## Color Tokens
All defined as CSS vars in `client/src/index.css`.

| Token | Value | Use |
|---|---|---|
| `--green` | `#33ff33` | Primary text, active states |
| `--cyan` | `#00ffff` | Accents, links, attended data |
| `--orange` | `#ff6600` | Highlights, CTAs, Phreezer data |
| `--red` | `#ff3333` | Errors, destructive actions |
| `--white` | `#f0fff0` | Body text on dark, readable content |
| `--bg` | `#000` | Page background |
| `--bg-panel` | `#050f05` | Card/panel background |
| `--bg-elevated` | `#0a1a0a` | Nested panel, elevated surfaces |
| `--border` | `rgba(51,255,51,0.15)` | Default border |
| `--border-mid` | `rgba(51,255,51,0.25)` | Emphasized border |
| `--text-label` | `rgba(51,255,51,0.58)` | Label text |
| `--text-muted` | `rgba(51,255,51,0.42)` | Secondary/hint text |
| `--text-dim` | `rgba(255,255,255,0.5)` | De-emphasized white text |

### Data Source Color Convention
- **Cyan** = data sourced from phish.net
- **Orange** = data sourced from Phreezer (user-generated)
- **Green** = computed/derived stats

### Glow Shadows
```css
--glow-green:  0 0 10px rgba(51,255,51,0.5),  0 0 20px rgba(51,255,51,0.2)
--glow-cyan:   0 0 10px rgba(0,255,255,0.5),  0 0 20px rgba(0,255,255,0.2)
--glow-orange: 0 0 10px rgba(255,102,0,0.6),  0 0 25px rgba(255,102,0,0.3)
```
Use `textShadow: '0 0 16px currentColor'` as the standard inline glow for colored text.

---

## Typography

Two fonts only:
- `--font-display`: Orbitron — headlines, labels, UI chrome, KPIs
- `--font-mono`: Share Tech Mono — data values, dates, review text, anything "read"
- `--font-serif`: Playfair Display italic — show dates only, used sparingly

### Font Size System
All sizes in `rem`. These are the canonical sizes — do not invent new ones.

| Role | Size | Font | Weight | Use |
|---|---|---|---|---|
| KPI Value | `2rem` | display | 900 | Big stat numbers |
| Section Title | `0.62rem` | display | 700 | Section headers (e.g. QUICK PHREEZE) |
| Card Label | `0.54rem` | display | 400 | KPI labels, progress bar labels |
| Body / UI Text | `0.52rem` | display | 400 | Badge text, nav items, buttons |
| Meta / Source | `0.5rem` | mono | 400 | Data source attribution, hints |
| Data Value | `0.88rem` | mono | 400 | Song names, venue names, dates in lists |
| Sub-value | `0.76rem` | mono | 400 | Parenthetical values e.g. (5.00) |
| Hint / Fine Print | `0.48rem` | display | 400 | Tap hints, footnotes — use sparingly |

**Letter spacing convention:**
- Display font headers: `3–4px`
- Display font labels: `1.5–2px`
- Display font body: `0.5–1px`
- Mono: `0` (natural spacing)

---

## Spacing & Layout

| Context | Value |
|---|---|
| Section padding | `12–14px` |
| Card internal padding | `10–14px` |
| Inline gap (flex row) | `8–10px` |
| Stack gap (flex col) | `5–6px` |
| Border radius | `0` (sharp corners — terminal aesthetic) |
| Divider height | `4px` for progress bars, `1px` for section dividers |

---

## Component Patterns

### KPI Cards
- Grid: `1fr 1fr 1fr 1fr`, border unified on container
- Height: `96px` fixed
- Front: value `2rem` + label `0.52rem`
- Back: title `0.6rem` colored + body `0.54rem` white + source `0.5rem` mono dimmed
- Flip: CSS 3D rotateY, one at a time, 450ms ease
- Top border accent: `2px solid rgba(0,224,208,0.3)` (cyan) on KPI grid

### Section Headers
Pattern: `◈ SECTION NAME` in orange with glow, right side gets an action button if needed.
Background tint: `rgba(255,102,0,0.04)` on the header row.
Bottom border: `1px solid rgba(255,102,0,0.2)`.

### Progress Bars
Height: `4px`. Track: `rgba(51,255,51,0.08)`. Fill: colored with matching `boxShadow: '0 0 6px {col}'`.

### Badges
- Font: `0.52rem` Orbitron, `1.5px` letter-spacing
- Padding: `5px 10px`
- Border: `1px solid rgba(51,255,51,0.25)`
- Background: `rgba(51,255,51,0.04)`
- Color: `var(--green)`
- `whiteSpace: nowrap` — never wrap badge text
- Glyph: `0.85rem`, line-height 1

### Badge ID → Label Map (canonical)
```
century   → 100 CLUB
fifty     → 50 CLUB
quarter   → 25 CLUB
ten       → 10+ SHOWS
rated_100 → HALL OF PHAME
rated_50  → DEEP CUTS
rated_25  → SCHOLAR
rated_10  → SCHOOLED
rated_1   → 1ST FREEZE
critic    → CRITIC
reviewer  → REVIEWER
streak_30 → ON FIRE
streak_7  → WEEKLY
```

### Star Ratings
Never render individual star glyphs in list/card contexts — too small to count.
Use: `{parseFloat(rating).toFixed(1)}★` — e.g. `4.5★`
Color: `var(--orange)`
Font: `var(--font-display)`, `0.8rem`

### Avatars
Default: SVG geometric Phreeze pattern (snowflake geometry), `52px`, `var(--cyan)`.
Fallback: Orbitron initials if display name is set.
Never: emoji avatars, photo uploads, or cartoon options.
Size in header: matches snowflake logo glyph size on opposite side.

### Borders
- Container cards: `1px solid var(--border)` all sides
- Section accent top: `2px solid rgba(0,224,208,0.25–0.3)` for KPI-style blocks
- Section accent bottom: `2px solid rgba(255,102,0,0.15–0.25)` for content blocks
- Interior dividers: `1px solid rgba(51,255,51,0.06–0.08)`

---

## Data Source Labels
Always attribute data source when showing stats. Convention:
- `↗ phish.net` — data pulled from Phish.net API
- `↗ Phreezer` — data generated by user activity in Phreezer
Font: `var(--font-mono)`, `0.5rem`, colored at 60% opacity.

---

## Vocabulary (app-specific terms)
| Term | Meaning |
|---|---|
| Phrozen | Rated (a show) in Phreezer |
| Phreeze | A rating/review action |
| First Freeze | First show rated in Phreezer |
| First Show | First show attended (from phish.net) |
| Deep Phreeze | Analytics deep-dive section |
| Vibe Check | AI synthesis of phish.net reviews |
| Uncle Ebenezer | AI agent / chatbot |
| Phriend | Another Phreezer user |

---

## What Not to Do
- No rounded corners
- No pastel or desaturated colors
- No sans-serif fonts outside the defined system
- No `box-shadow` for elevation (use border + background instead)
- No font sizes outside the defined system — don't invent `0.38rem`, `0.44rem`, etc.
- No inline `<style>` blocks except for CSS animation keyframes that can't be expressed inline
- No appending to CSS files — always rewrite clean
- No emoji in UI chrome (only in badges where defined above)
- Never render raw AI response text — always parse and validate before rendering

### Filter Button Color Convention (Scorecard)
- **ERA buttons:** orange (`#ff6600`) — 2×2 grid, 1.6rem label, sub-label at 0.42rem
- **YEAR buttons:** cyan — 10×4 grid, `'94` style (2-digit with tick)
- **MONTH buttons:** green — 6×2 grid, 3-letter abbrev
- **DAY buttons:** orange — 8×4 grid, numeric
- **DOW buttons:** cyan — 4×2 grid, 3-letter abbrev
- Active state: 14% opacity background + full color border + glow shadow
- Available (inactive): 70% white text + 25% opacity colored border
- Unavailable: 18% white text + 8% white border

### Match Count Box
- Background: `rgba(255,102,0,0.08)`, border: `rgba(255,102,0,0.4)`, glow
- Number: `1.6rem` Orbitron 900, orange with textShadow
- Label: `0.34rem` Orbitron, `rgba(255,102,0,0.55)`, 2px letter-spacing
- Do NOT use cyan for this box — orange only, avoids clash with YEAR buttons

### Desktop-Only CSS Pattern
```css
.desktop-filter-block { display: block; }
.mobile-filter-block  { display: none; }
.desktop-card-stats   { display: none; }  /* hidden on mobile */

@media (min-width: 769px) {
  .desktop-filter-block { display: block; }  /* already default */
  .mobile-filter-block  { display: none; }   /* already default */
  .desktop-card-stats   { display: flex; align-items: center; gap: 0; }  /* visible on desktop */
}
@media (max-width: 768px) {
  .desktop-filter-block { display: none; }
  .mobile-filter-block  { display: block; }
}
```
Use these classes to gate desktop vs mobile UI — never rely on JS window width for rendering.

### Error Boundary Style (Mike Says No — full page)
- Background: `#0a0a0a`
- Alert label: `0.55rem` Orbitron, `rgba(255,80,80,0.5)`, 4px letter-spacing
- Headline: `2.2rem` Orbitron, `#ff3333`, glow `0 0 30px rgba(255,51,51,0.6)`
- Message: `0.8rem` mono, `rgba(255,255,255,0.35)`, 2px letter-spacing
- Sub: `0.6rem` mono, `rgba(255,255,255,0.18)`
- Retry: `0.5rem` Orbitron, border `rgba(255,51,51,0.2)`, padding `8px 20px`
- Entire overlay is clickable (onClick=resetError)



---

## New Patterns — 2026-06-17

### Boot Sequence Animations
```css
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
/* Blinking block cursor on typewriter lines */
/* Used in WelcomeCelebration during boot sequence */

@keyframes bootGlitch {
  /* RGB split + hue rotation + clip-path tears */
  /* Applied via .boot-glitch class on celebrate-overlay */
  /* Fires after last boot line finishes typing */
}
.boot-glitch { animation: bootGlitch 0.5s steps(1) forwards !important; }
```

### CommExpandCard extraStats
Extra metric columns shown between card name and score on desktop only:
```jsx
extraStats={[
  { value: '42', label: 'RATERS', color: 'var(--cyan)' },
  { value: 'SAT', label: 'DAY', color: 'var(--text-muted)' },
]}
```
- Rendered in `.desktop-card-stats` div — hidden on mobile, flex on desktop
- No !important — rely on media query specificity

### UserDelta component
Shows logged-in user's score vs community avg:
- Orange if user is above avg by >0.2
- Red if below by >0.2
- Green if within ±0.2
- Label: "YOUR SCORE" or "YOUR AVG FOR THIS SONG"

### SetBreakdown pills
```jsx
<SetBreakdown s1={12} s2={9} enc={2} />
```
- SET 1: cyan, SET 2: orange, ENCORE: green
- Only renders if any count > 0

### Feed post body truncation
- 220 char threshold
- READ MORE / SHOW LESS in post's accent color
- 0.36rem Orbitron, no border

### New post box (collapsed state)
- Single row: avatar initials + placeholder text + "+ POST" label right-aligned
- Expands to full composer on tap
- Never show expanded by default

### show-masthead-right
```css
.show-masthead-right { display: none; }
@media (min-width: 769px) {
  .show-masthead-right { display: flex; }
}
```
Desktop-only right panel on show masthead.

### Badge card pattern (BadgesTab)
- Left: icon (1.6rem, color-matched glow) in 48×48 bordered box
- Right: label (0.62rem Orbitron, color) + description (0.72rem mono, dimmed)
- Border-left: 3px solid badge color
- Background: badge color at 8% opacity

---

## Theme System — Light Mode (2026-06-25)

Light mode is `[data-theme="light"]` on `<html>` (set by `client/src/theme.js`, persisted in localStorage, applied in main.jsx before first paint). The toggle lives in ProfileModal → MY PHISH → APPEARANCE and is **admin-only** until release.

**Core rule:** dark is the baseline. Every token's **dark value equals the original literal** it replaced, so dark mode renders byte-identical. Only light values (or the shared invariant) change. Never hardcode a color in a component — use a token so both themes flip.

### Theme token families
- **RGB hue components** — so any alpha shade flips with the theme:
  `--green-rgb`, `--cyan-rgb`, `--cyan-bright-rgb`, `--orange-rgb`, `--orange-bright-rgb`.
  Always write colored shades as `rgba(var(--cyan-rgb), 0.4)` — never `rgba(0,255,255,0.4)`.
- **`--ink-rgb`** — "dimmed-white" text/borders. Dark = `255,255,255`, light = `20,33,26`. Use `rgba(var(--ink-rgb), a)` for any text/border that was previously `rgba(255,255,255, a)`. (Exception: always-dark overlays — boot, MIKE SAYS NO, badge celebration — keep literal white.)
- **Inset fills** — recessed backgrounds. `--inset-soft / --inset / --inset-md / --inset-strong / --inset-xstrong` (dark = black-alpha 0.2–0.6; light = faint green tints). High-alpha scrims (≥0.75, modals/overlays) stay literal dark.
- **`--hairline`** — faint dividers/borders (`rgba(var(--ink-rgb),0.07)` dark / `rgba(0,0,0,0.10)` light).
- **`--card-deep`** — the deep base of tinted **gradient cards** (OTD, My Shows, Community result, Scorecard phriends). Dark = `rgba(5,18,5,0.98)`, light = `#f3f6ef`. Write gradient cards as `linear-gradient(135deg, rgba(var(--HUE-rgb),0.07), var(--card-deep))`.
- **Text tokens (light values darkened for contrast):** `--text-label` .92, `--text-muted` .74, `--text-dim` .66.

### Low-alpha colored text — readable floor
Colored text glows on black but washes out on white. **Inline `color: rgba(var(--HUE-rgb), a)` text uses a 0.7 alpha floor** — anything below reads as invisible on light. (Backgrounds/borders are exempt; always-dark overlays exempt.)

### `--white` token
Dark = `#f0fff0`, light = `#14211a`. Use `var(--white)` for "bright body text" — never `#fff` (which vanishes on light; this caused the My Shows "disappearing day").

---

## New Patterns — 2026-06-25

### Mobile safe-area / fixed chrome
- Viewport meta **must** include `viewport-fit=cover` or `env(safe-area-inset-*)` is 0 and all safe-area handling is inert.
- Fixed header: `padding-top: env(safe-area-inset-top)` fills the notch.
- Bottom nav: `height: calc(72px + env(safe-area-inset-bottom))` (NOT `72px` + padding — with `box-sizing: border-box` the padding eats the content height and clips labels).
- Top overscroll: `html,body { overscroll-behavior-y: none }` + `html { background: var(--bg-elevated) }` so iOS rubber-band can't reveal a light strip above the fixed header.

### Header gradient
`.app-header` background is bottom-up: `linear-gradient(0deg, rgba(var(--cyan-rgb),0.26) 0%, rgba(var(--cyan-rgb),0.11) 45%, var(--bg-panel) 82%)` — tint rises from the bottom to back the wordmark/tagline.

### Save-confirmation flash
Auto-save UIs (ProfileModal prefs) show a transient `✓ SAVED` pill (green, fades out ~1.8s) in the header rather than a Save button.

### Inputs that must not trigger password managers
Username search/tag inputs add: `type="text" name="…-search" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} data-1p-ignore data-lpignore="true" data-form-type="other"`.

### Vocabulary addition
- **PHAN ROLL** — the community member board (renamed from "Leaderboard"; deliberately non-competitive). Still `leaderboard` in code/API.
