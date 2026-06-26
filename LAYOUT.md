# Phreezer — Layout & Design State
**Last updated:** 2026-06-25

---

## App Status
- **Live at:** phreezer.mpgink.com
- **Stage:** Beta — Phish.net community post published, 14 users
- **Primary surface:** Mobile (iOS Safari) — all layout decisions mobile-first
- **Desktop:** Supported, three-column layout active — unconfirmed visually (Matthew on mobile)

---

## Design System — Non-Negotiable

### Aesthetic
Retro terminal / synthwave. Dark background, glow effects, scanlines. This is the identity — do not deviate.

### Light Mode (RELEASED to all users — 2026-06-25)
- Toggle in ProfileModal → MY PHISH → APPEARANCE (DARK / LIGHT), visible to **all users**. Defaults to dark; opt-in, persisted per-device in localStorage — removing the gate did not flip anyone.
- Implemented as `[data-theme="light"]` on `<html>` (theme.js). Every design token is overridden; **dark token values are byte-identical to the original literals**, so dark mode is unchanged — only edit light values or shared tokens with that invariant in mind.
- See STYLE_GUIDE.md for the full token list (RGB hue tokens, `--ink-rgb`, `--inset-*`, `--card-deep`, `--hairline`).
- Known cosmetic follow-up: the tagline under the wordmark is baked into the (light-colored) logo PNG and is weak on light — needs a dark-ink logo asset or live-text wordmark.

### Colors
- `--green`: `#33ff33` — primary accent, section labels
- `--cyan`: `#00e0d0` — interactive elements, links, active states, YEAR filter
- `--orange`: `#ff6600` — CTAs, Ebenezer, warnings, ERA filter, match count box
- `--bg`: `#0a0a0a` — page background
- `--bg-panel`: `#0f0f0f` — card/panel background

### Fonts
- **Display:** Orbitron — headings, labels, nav items, section titles, filter labels
- **Mono:** Share Tech Mono — body copy, data, song names, stats

---

## Mobile Layout

### Header (top bar)
- Left: PHREEZER wordmark logo (Canva asset — snowflake + wordmark baked in, transparent bg)
- Right: Avatar button — pulses cyan→orange on every login until tapped

### Bottom Tab Nav
4 tabs: **MY PHREEZER · COMMUNITY · SCORECARD**
- Shop and About live in ProfileModal — NOT in tab nav
- Height: `calc(72px + env(safe-area-inset-bottom))` — keeps a full 72px of content **above** the home-indicator zone (border-box would otherwise let the safe-area padding clip the labels — caused "MY PHREEZER" to cut off). Icon 1.5rem, label 0.64rem.

### Header (mobile, fixed)
- `.mobile-sticky-header` is `position: fixed; top:0` with `padding-top: env(safe-area-inset-top)` to fill the notch (opaque, no content peeks above).
- `.app-header` background is a **bottom-up gradient** (cyan tint rising from the bottom) so the wordmark/tagline gets a darker backing.
- Top overscroll: `overscroll-behavior-y: none` + `html { background: var(--bg-elevated) }` so iOS rubber-band can't reveal a light strip above the header.
- **Requires `viewport-fit=cover`** in the viewport meta — without it `env(safe-area-inset-*)` is 0 and all of the above is inert.

### Mobile Filter (Scorecard)
4 independent dropdowns: YEAR / MONTH / DAY / DAY OF WEEK
- All independent — no required order
- Custom ▼ chevron (native select, appearance:none)
- Colors: YEAR=cyan, MONTH=green, DAY=orange, DOW=cyan
- Match count + CLEAR appear when any filter active
- Gated behind `.mobile-filter-block` CSS class

---

## Desktop Layout
Three columns:
1. **Left sidebar** — navigation, collapsible (300px expanded / 72px collapsed)
2. **Main content** — center, full-width, scrollable
3. **Right rail** — Uncle Ebenezer (auth-gated — logged-out users do NOT see rail)

### Logged-Out Desktop Experience
- Default tab: `home` (DesktopLanding component)
- Sidebar: MY PHREEZER hidden, prominent CREATE ACCOUNT + LOGIN CTAs
- Logo click → home tab
- Logging out → returns to `home` tab
- DesktopLanding: single logo asset (no duplicate snowflake), 3 feature cards, CTAs

### Sidebar Community Order (CONFIRMED — do not revert)
```
FEED (first)
PHRIEND OVERLAP (second — moved up from last)
PHAN ROLL  (renamed from LEADERBOARD 2026-06-25 — non-competitive)
TOP SHOWS
TOP SONGS
TOP VENUES
TOP STATES
```

### Desktop Filter (Scorecard)
One horizontal row: ERA | YEAR | MONTH | DAY | DOW | match box
- ERA: 2×2 grid, 1.6rem label, date range below
- YEAR: 10 col × 4 rows, `'94` style (2-digit with tick)
- MONTH: 6 col × 2 rows
- DAY: 8 col × 4 rows (31 + 1 blank)
- DOW: 4 col × 2 rows (7 + 1 blank)
- Match count: orange box, big number, "SHOWS" label
- CLEAR ALL: beside match box
- Filters collapse when show loads
- CLEAR resets to arrow/slot machine state
- Gated behind `.desktop-filter-block` CSS class

### Desktop Card Stats
`.desktop-card-stats` class: hidden on mobile, flex on ≥769px
- !important removed — was silently blocking display
- Top Shows: RATERS · SONGS · DAY · S1·S2·E breakdown
- Top Songs: RATERS · VERSIONS · HOME SET · FIRST RATED
- Top Venues: SHOWS · RATERS · RATINGS · DOW
- Top States: RATED · VENUES · RATERS · COVERAGE%

### Desktop Profile Modal
- Width: 820px (bumped from 560px)
- Tabs font: 0.62rem, padding 14px (bumped from 0.49rem / 10px)
- Header, username, email, stat fonts all bumped

### Desktop Feedback Modal
- maxWidth: 520px (bumped from 480px)
- Textarea font: 0.82rem, minHeight: 80px

---

## Community Tab

### Subtab order (mobile + desktop) — CONFIRMED
**FEED · PHRIEND OVERLAP · PHAN ROLL · TOP SHOWS · TOP SONGS · TOP VENUES · TOP STATES**

- FEED is default landing — do not revert
- PHRIEND OVERLAP is second — do not revert (was last)
- **PHAN ROLL** = renamed from LEADERBOARD (2026-06-25), deliberately non-competitive. Still `subTab="leaderboard"` / `/api/community/leaderboard` under the hood — only the label + panel title changed. Row fonts enlarged.

### Feed
- Pinned posts sort first, orange left border, ❄ PINNED · UNCLE EBENEZER badge
- `pinned` BOOLEAN + `author_label` VARCHAR(50) columns on posts table
- author_label display FIXED — displayName() helper checks author_label first
- Body truncation at 220 chars with READ MORE / SHOW LESS toggle
- New post box: collapsed single-row prompt, expands on tap
- 80px bottom padding on feed container
- Action buttons (▲ react, ◈ replies, + reply) always visible

### Phriend Overlap
- Logged-out gate: ⚇ icon + description + CREATE ACCOUNT/LOGIN CTAs
- Companion marking: + COMPANION → ◈ COMPANION → ❄ MUTUAL
- **Pick-a-phriend dropdown** (2026-06-25): on focus, lists phreezers who share your shows (`/community/overlap-suggestions`, with shared-show counts); typing runs typeahead (`/community/user-search`); same list also renders below the bar. The **My Phriends** tab (ProfileModal/sub-tab) now uses the identical picker — no more typing a username from memory; it keeps the YOU/THEM per-show score table + a CLEAR button.
- All phriend-search/tag inputs are hardened against password-manager autofill (type/name + autoComplete off + 1Password/LastPass/Dashlane ignore attrs).

---

## ProfileModal
5 tabs: **MY PHISH · BADGES · ABOUT · AI · SHOP**
- AI tab between ABOUT and SHOP
- BADGES tab: shows founder badges (PHAB PHIVE, EARLY PHREEZE) and milestone badges
- Desktop width: 820px
- **APPEARANCE** section (MY PHISH tab) — DARK / LIGHT theme toggle, **admin-only** (added 2026-06-25)
- **✓ SAVED** confirmation flash in the modal header — fires on every profile preference change (sit/era/side/avatar all auto-save)
- Avatar selector tiles use themed inset backgrounds (not the old `rgba(0,0,0,.3)` dark fill) so they read in light mode
- Modal inner has `padding-top: env(safe-area-inset-top)` so the page can't peek above the modal header on notched devices

---

## Scorecard Tab

### Browse Without Login
- Setlists load unauthed — auth gate only on star tap / SAVE RATINGS
- `loadShow` uses plain fetch() not api.get() for show data

### Attendance Type — MANDATORY
- First star tap without attendance set → intercepts, shows full-screen modal
- Three options: 🎸 I WAS THERE / 📺 WATCHED WEBCAST / 🎧 HEARD THE RECORDING
- Do not remove this gate

### Song Row Layout (mobile)
- Row 1: song title full width, green glow
- Row 2: ▶ · duration · badges · [spacer] · ★★★★★
- `flex-direction: column` — do not revert to side-by-side

### Random Show
- ShowSlotMachine: 3-reel animation (YEAR/MONTH/DAY), lock sequence at 900ms/1600ms/2200ms
- Show loads 2400ms after button press (animation completes)
- RANDOM SHOW button sits below all filters
- Default show list HIDDEN — arrow shows immediately below RANDOM SHOW
- **Re-roll** (2026-06-25): once a show is loaded, an "⚄ ANOTHER RANDOM SHOW" button appears in the masthead (was previously only on the empty state)
- SHOW NOTES toggle: filled, full-cyan, prominent (was a faint outline that disappeared on light)

### Show Masthead (Desktop)
- Left: date, venue, location, tour, audio badge
- Right panel (.show-masthead-right): PHAN REVIEWS / PHREEZERS RATED / PHRIENDS HERE + YOUR SCORE
- Right panel hidden on mobile via CSS class — single column on mobile

---

## Entry Animation (WelcomeCelebration / Boot Sequence)
- Full typewriter effect — char-by-char at 36ms/char with blinking block cursor
- Rotating inside-joke lines (NOTIFYING WILSON, CONSULTING ICCULUS, etc.)
- Snowflake: clamp(175px, 46vw, 280px) — large, centered, cyan glow
- Boot lines: short loading-dot suffixes ("...") + tightened letter-spacing (2px default) so lines never overflow/wrap on mobile
- Lines: clamp values for responsive sizing
- DON'T SUCK split across two lines to prevent mobile overflow
- Snowflake melt: after final line, snowflake dissolves downward (snowflakeDrip), droplets fall (dripFall), a puddle forms (puddleForm), and wake rings cascade outward (rippleWake) — layered "melt stage" in WelcomeCelebration, not a single scaled image (avoid the old "smooshed" look)
- Glitch exit: RGB split, hue rotation, clip-path tears → fades to black into app (melt at +80ms, glitch at +1700ms, done at +2900ms)
- TAP TO SKIP visible after 2nd line
- Boot sequence z-index: 2000 — always above FullPageLoader (z-index: 1000)
- FullPageLoader: spinner for all other loading states (admin, community tabs, etc.); snowflake enlarged to clamp(220px,56vw,340px) with a brighter LOADING label (2026-06-25)
- Do NOT revert to left-aligned, instant-pop, or particle animation

---

## Error Handling
- **React render errors** → Mike Says No (ErrorBoundary in main.jsx) — tap anywhere to retry
- **API errors** → Mike Says No (showError() in App.jsx)
- Ebenezer Is Frozen: RETIRED — do not re-introduce

---

## Auth Screens
- **MIKE SAID NO.** — email not verified
- **MIKE SAYS NO.** — rate limited or API error

---

## Uncle Ebenezer
- Desktop: persistent right rail (auth-gated)
- Mobile: floating ❄ button — label is "❄ ASK EBENEZER"
- Logged-out users on desktop: no rail (eliminates dead space)
- Pulls live Phish.net data (setlists, reviews, jamcharts) + Phreezer community aggregates
- Expand button (⛶) in rail header → opens full modal overlay (860px × 700px, z-index 8000, backdrop blur)
- Clicking outside modal or ✕ closes it — conversation state persists
- Disclosure footer: "Conversations logged anonymously. Opt out." — always visible, orange opt-out link
- Export button (orange): appears after first message, downloads .txt conversation
- Opt-out preference stored on users.ebenezer_opt_out, syncs cross-device via profile API

---

## Key Layout Decisions (Do Not Revisit Without Good Reason)
- **Song row mobile:** column layout — do not revert
- **Song notes:** textarea — do not revert to input
- **Audio player:** full-width span
- **Shop/About:** in ProfileModal, not nav
- **Tour:** centered modal, no spotlight
- **FEED:** default COMMUNITY landing, first in sidebar — do not revert
- **PHRIEND OVERLAP:** second in sidebar — do not revert
- **Attendance type:** mandatory gate on first star tap — do not remove
- **Entry animation:** terminal boot sequence, typewriter, glitch exit, centered — do not revert
- **Scorecard keying:** always posKey, never song name
- **Error boundary:** Mike Says No for ALL errors — do not revert to Ebenezer
- **Default show list:** hidden on scorecard — arrow shows immediately
- **Logged-out desktop:** home tab with DesktopLanding — not scorecard
- **New post box:** collapsed single row — do not revert to always-expanded
- **ProfileModal tabs:** MY PHISH · BADGES · ABOUT · AI · SHOP — do not reorder
- **Light mode:** RELEASED to all users (2026-06-25) — APPEARANCE toggle, opt-in, defaults to dark
- **Dark mode is the baseline:** light tokens override; dark token values must stay == their original literals so dark renders unchanged
- **PHAN ROLL** is the Leaderboard label — non-competitive framing, do not revert to "LEADERBOARD"
- **viewport-fit=cover** must stay in the viewport meta — the header/modal/bottom-nav safe-area handling all depends on it
- **index.html is no-cache** (vercel.json) — keeps the SPA from serving stale bundles; do not remove

---

## What's Explicitly NOT There Yet
- **Light-mode logo/tagline asset** — light mode is released, but the tagline baked into the light-colored logo PNG washes out on light. Needs a dark-ink logo or live-text wordmark. Also watch for any stray hardcoded hex literals that don't flip.
- Desktop UAT pass — full walkthrough not done. Mobile chrome/safe-area pass done 2026-06-25. Known issues: font sizes too small in places (causes squinting), visual polish needed. Scorecard overlay fixed (keeps sidebar/rail on desktop) but broader desktop pass pending Matthew's recorded UAT session.
- Feed reply notifications
- Feed moderation in admin panel
- Phish Phreeze community subtab (band-level stats)
- Etsy OAuth activation (pending Etsy app review)
- Sentry DSN fix (malformed org ID — Matthew to update in Vercel)
- GoDaddy DNS for phreezer.mpgink.com in Resend
- Song duration storage (duration_seconds column not yet added)
- Ebenezer song intent detection — only ~40 songs hardcoded, needs expansion
- Ebenezer show date links — dates in responses not yet tappable (design decided, not built)
- Phish.net show ratings — not in v5 API, hidden pending inquiry with phish.net
- Ebenezer conversation persistence across navigation (sessionStorage approach designed, not built)
