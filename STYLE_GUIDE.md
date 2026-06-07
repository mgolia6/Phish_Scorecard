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
