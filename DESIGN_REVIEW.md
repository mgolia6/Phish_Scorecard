# DESIGN_REVIEW.md — Phreezer Consistency & Upgrade Brief

**For:** Claude Design (or any design reviewer) doing a full run-through of the app.
**Goal:** Audit Phreezer for **visual consistency and uniformity**, flag drift, and propose upgrades **without breaking the established identity or reversing intentional decisions.**
**Last updated:** 2026-06-25

> Read this first, then `STYLE_GUIDE.md` (tokens/patterns) and `LAYOUT.md` (every layout decision + what's off-limits). When code and docs disagree, **trust the code** (`client/src/index.css` + `client/src/components/`).

---

## 0. How to use this doc
1. Walk the **Screen Inventory** (§5) in **both themes** (dark default + light) and **both breakpoints** (mobile ≤768px is primary; desktop ≥769px).
2. Score each screen against the **Consistency Rubric** (§6).
3. Check findings against **Hard Constraints** (§8) — if a "fix" would reverse one of those, it's out of scope; note it as intentional instead.
4. Record findings in the **Output Template** (§9). Severity + the exact token/pattern that should have been used.

---

## 1. Product & Aesthetic Identity (NON-NEGOTIABLE)
Phreezer (phreezer.mpgink.com) — a Phish show rating / tracking / community web app. Solo dev, beta.

**Aesthetic:** retro terminal / synthwave. Dark phosphor background, neon green/cyan/orange, glow effects, scanlines, **sharp corners (border-radius: 0)**, Orbitron + Share Tech Mono. This identity is fixed — do **not** propose rounding corners, pastel/desaturated palettes, drop shadows for elevation, new fonts, or "modernizing" it away. Upgrades must be *within* this language.

---

## 2. Design Tokens — source of truth
All tokens are CSS vars in `client/src/index.css` (`:root` = dark, `[data-theme="light"]` = light). **Components must use tokens, never hardcoded colors.** A hardcoded hex/rgba in a component is a finding (it won't theme).

### Hue + surface (dark → light)
| Token | Dark | Light | Use |
|---|---|---|---|
| `--green` | `#33ff33` | `#0f8a1e` | primary text, section labels, derived stats |
| `--cyan` | `#00ffff` | `#0a8a82` | interactive, links, phish.net data, active states |
| `--orange` | `#ff6600` | `#cf5500` | CTAs, Ebenezer, warnings, Phreezer (user) data |
| `--red` | `#ff3333` | `#cc2b2b` | errors, destructive |
| `--white` | `#f0fff0` | `#14211a` | "bright body text" — **use this, never `#fff`** (white vanishes on light) |
| `--bg` | `#000` | `#eef1ea` | page background |
| `--bg-panel` | `#050f05` | `#ffffff` | card/panel |
| `--bg-elevated` | `#0a1a0a` | `#e6ebe2` | nested/elevated surface; also the top-overscroll/notch color |
| `--border` / `--border-mid` | green @ .15 / .25 | green-ink @ .18 / .30 | borders |

### RGB-component tokens (for alpha shading)
Write colored shades as `rgba(var(--HUE-rgb), a)` so they flip with theme:
`--green-rgb`, `--cyan-rgb`, `--cyan-bright-rgb`, `--orange-rgb`, `--orange-bright-rgb`.
**Finding if you see** `rgba(51,255,51,…)` / `rgba(0,255,255,…)` etc. literally in a component.

### Text, inset, structural
| Token | Note |
|---|---|
| `--text-label` / `--text-muted` / `--text-dim` | label / secondary / de-emphasized text (light values darkened for contrast: .92 / .74 / .66) |
| `--ink-rgb` | "dimmed-white" text/borders. `rgba(var(--ink-rgb), a)` replaces old `rgba(255,255,255, a)`. **Low-alpha colored *text* has a 0.7 floor** (below that it washes out on light). |
| `--inset-soft/-/-md/-strong/-xstrong` | recessed backgrounds (dark black-alpha → light green tints). High-alpha scrims (≥0.75) stay literal dark and are intentionally NOT tokenized. |
| `--hairline` | faint dividers/borders |
| `--card-deep` | deep base of tinted **gradient cards** (OTD/My Shows/Community-result/Scorecard-phriends): `linear-gradient(135deg, rgba(var(--HUE-rgb),0.07), var(--card-deep))` |
| `--glow-green/-cyan/-orange` | neon glows (dropped to `none` in light) |

### Data-source color convention (check it's honored everywhere)
- **Cyan** = phish.net data · **Orange** = Phreezer (user-generated) · **Green** = computed/derived.

---

## 3. Theme system & invariants
- Light is `[data-theme="light"]` on `<html>` (theme.js, localStorage, applied pre-paint). **Released to all users; opt-in; defaults to dark.**
- **Invariant:** every token's **dark value == the original literal** it replaced, so dark mode is byte-identical. When proposing token changes, preserve this — only touch light values or shared values that hold the invariant.
- Audit **both themes**. The most common defects are light-mode only: hardcoded colors that don't flip, low-alpha colored text washing out, dark fills that should be inset tints.

---

## 4. Typography & spacing canon (from STYLE_GUIDE.md)
- Two fonts only: **Orbitron** (`--font-display`, chrome/labels/KPIs) + **Share Tech Mono** (`--font-mono`, data/body). Playfair italic for show dates only, sparingly.
- Sharp corners everywhere (`border-radius: 0`).
- Spacing: section padding 12–14px, card padding 10–14px, flex-row gap 8–10px, stack gap 5–6px.
- **Known issue:** font sizes drift small in places (squint factor) — a primary thing to flag. There's a canonical size table in STYLE_GUIDE.md; flag sizes that are too small for their role and any ad-hoc sizes outside the system.

---

## 5. Screen Inventory — walk every one (mobile + desktop, dark + light)

**Primary tabs (mobile bottom nav):** MY PHREEZER · COMMUNITY · SCORECARD

**MY PHREEZER** sub-tabs: `MY SHOWS · DEEP PHREEZE · MY SONGS · MY VENUES · MY STATES · MY PHRIENDS`
- MY SHOWS (`MyShowsTab` → OTD card via `OTDCard`/`OTDCarousel`, `ShowCard` list, filters)
- DEEP PHREEZE (`DeepPhreezeTab`, `Heatmap`)
- MY SONGS / MY VENUES / MY STATES (`MySongsTab`/`MyVenuesTab`/`MyStatesTab`)
- MY PHRIENDS (`MyPhriends` — dropdown picker + YOU/THEM overlap table)

**COMMUNITY** sub-tabs: `FEED · PHRIEND OVERLAP · PHAN ROLL · TOP SHOWS · TOP SONGS · TOP VENUES · TOP STATES`
- FEED (`PhreezeFeed` — pinned posts, composer, replies)
- PHRIEND OVERLAP (`CommunityTab` overlap picker)
- PHAN ROLL (member board — was "Leaderboard")
- TOP SHOWS/SONGS/VENUES/STATES (`CommunityTab` + `CommExpandCard` rows, `desktop-card-stats`)

**SCORECARD** (`ScorecardTab`)
- Empty/search state + `ShowSlotMachine` (random)
- Loaded show: masthead, attendance gate (mandatory), song rows (`ScorecardHelpers`), `AudioPlayer`, phriend-tag panel, SHOW NOTES, "ANOTHER RANDOM SHOW" re-roll

**Global / overlays**
- Header (mobile fixed; `Sidebar` on desktop), bottom nav
- `ProfileModal` (tabs: MY PHISH · BADGES · ABOUT · AI · SHOP — incl. APPEARANCE theme toggle, ✓ SAVED flash, avatars, `ShopTab`)
- `EbenezerDrawer` (mobile FAB + desktop rail + full modal)
- `AuthModals`, `OnboardingFlow`, `ChangelogModal` (v2.2 on login), `FeedbackModal` + `PassiveFeedbackButton`
- `BadgeCelebration` + `Celebrations` (boot/welcome), `FullPageLoader`, `TourGuide`, `PrivacyModal`, `DonationCard`
- `AdminTab` (admin only), `DesktopLanding` (logged-out desktop)
- Error boundary: **MIKE SAYS NO** (always-dark, full page)

---

## 6. Consistency Rubric — evaluate each screen on these
1. **Color tokens** — every color a token? any literal hex/rgba? data-source convention honored (cyan/orange/green)?
2. **Theme parity** — does it read correctly in BOTH themes? contrast adequate on light? any dark fill or white text that didn't flip?
3. **Type scale** — sizes match the canon for their role? anything too small to read? ad-hoc sizes?
4. **Spacing & alignment** — consistent padding/gaps; aligned grids; no cramped or runaway whitespace.
5. **Borders/corners** — sharp corners, 1px token borders, consistent accent-border usage (top cyan / left-or-bottom orange patterns).
6. **Component reuse** — are similar things built the same way? (e.g. all "stat boxes", all "section labels", all chips/badges). Flag one-off reimplementations that should use a shared pattern.
7. **Iconography & glyphs** — consistent glyph set (◈ ◐ ◑ ❄ ▶ ⚄ ★), no stray emoji in chrome.
8. **Copy & voice** — terminal/irreverent but clear; vocabulary correct (Phrozen, Phreeze, Phriend, Deep Phreeze, Vibe Check, Uncle Ebenezer, PHAN ROLL).
9. **Responsive** — mobile-first integrity; desktop uses the `.desktop-*` / `.mobile-*` gating classes, not JS width.
10. **Motion** — glow/scanline/boot animations consistent; nothing janky.
11. **Touch/affordance** — tap targets ≥ ~40px; safe-area respected (`viewport-fit=cover`); fixed chrome doesn't clip.

For each finding give: **screen · theme · breakpoint · severity (P1 visible/broken → P3 nit) · the rule broken · the exact token/pattern to use instead.**

---

## 7. Known debt / focus areas (look here first)
- **Hardcoded hex literals** not on the token system — they don't flip in light. (Most rgba hue shades are tokenized; strays remain.)
- **Light-mode logo/tagline** — the tagline is baked into the light-colored logo PNG and washes out on a light header. Candidate upgrade: a theme-aware logo asset or a live-text wordmark + tagline.
- **Small fonts** app-wide (subtext especially) — biggest "make it uniform" opportunity. A defined, enforced type scale is welcome.
- **Low-alpha colored text** — historically washed out on light; 0.7 floor applied, but spot-check.
- **Stat boxes / section labels / chips** — several near-duplicate inline implementations across tabs; prime candidates to unify into shared components.
- **Desktop pass** — not fully UAT'd; font sizes + polish flagged.

---

## 8. Hard Constraints — do NOT propose reversing these (see LAYOUT.md)
- Retro-terminal identity; sharp corners; the two-font system; no elevation shadows.
- Dark is the baseline; light tokens override; **dark values stay == originals.**
- Bottom nav: MY PHREEZER · COMMUNITY · SCORECARD; 72px above safe area.
- FEED is the default Community landing & first; PHRIEND OVERLAP second.
- **PHAN ROLL** name (not "Leaderboard").
- Attendance-type gate is mandatory on first star tap.
- Song row is column layout on mobile; song notes are a textarea.
- ProfileModal tab order: MY PHISH · BADGES · ABOUT · AI · SHOP.
- Boot sequence: terminal typewriter → snowflake melt → glitch exit (no left-align/instant-pop/particles).
- Error state is **MIKE SAYS NO** for all errors.
- `viewport-fit=cover` + safe-area handling + `index.html` no-cache must stay.

---

## 9. Output Template (how to record findings)
```
### [P1|P2|P3] <Screen> — <short title>
- Theme/Breakpoint: <dark|light> / <mobile|desktop>
- What: <the inconsistency, concretely>
- Rule: <which §6 dimension / which token or pattern was violated>
- Fix: <exact token/pattern/size to use; or the shared component to extract>
- File(s): <component + line if known>
```
Group findings by screen; lead with P1s. Where the same defect repeats across screens (e.g. one un-tokenized color used in 6 places), record it once as a **systemic** finding with the list of locations and a single fix.

---

## 10. Reference files
- `STYLE_GUIDE.md` — tokens, type scale, component patterns, vocabulary, what-not-to-do
- `LAYOUT.md` — every layout decision, what's been tried/reversed, what's off-limits
- `CLAUDE.md` — stack, conventions, design system summary
- `client/src/index.css` — **the** token + base-style source of truth
- `client/src/components/` — 34 components (see §5 for the map)
