# Phreezer — Layout & Design State
**Last updated:** 2026-06-17

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
LEADERBOARD
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
**FEED · PHRIEND OVERLAP · LEADERBOARD · TOP SHOWS · TOP SONGS · TOP VENUES · TOP STATES**

- FEED is default landing — do not revert
- PHRIEND OVERLAP is second — do not revert (was last)

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

---

## ProfileModal
5 tabs: **MY PHISH · BADGES · ABOUT · AI · SHOP**
- AI tab added this session — between ABOUT and SHOP
- BADGES tab: shows founder badges (PHAB PHIVE, EARLY PHREEZE) and milestone badges
- Desktop width: 820px

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

### Show Masthead (Desktop)
- Left: date, venue, location, tour, audio badge
- Right panel (.show-masthead-right): PHAN REVIEWS / PHREEZERS RATED / PHRIENDS HERE + YOUR SCORE
- Right panel hidden on mobile via CSS class — single column on mobile

---

## Entry Animation (WelcomeCelebration / Boot Sequence)
- Full typewriter effect — char-by-char at 36ms/char with blinking block cursor
- Rotating inside-joke lines (NOTIFYING WILSON, CONSULTING ICCULUS, etc.)
- Snowflake: clamp(100px, 28vw, 160px) — large, centered, cyan glow
- Lines: clamp values for responsive sizing
- DON'T SUCK split across two lines to prevent mobile overflow
- Glitch exit: RGB split, hue rotation, clip-path tears → fades to black into app
- TAP TO SKIP visible after 2nd line
- Boot sequence z-index: 2000 — always above FullPageLoader (z-index: 1000)
- FullPageLoader: restored spinner for all other loading states (admin, community tabs, etc.)
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

---

## What's Explicitly NOT There Yet
- Desktop UAT pass — full walkthrough not done. Known issues: font sizes too small in places (causes squinting), visual polish needed. Scorecard overlay fixed (keeps sidebar/rail on desktop) but broader desktop pass pending Matthew's recorded UAT session.
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
