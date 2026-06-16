# Phreezer — Layout & Design State
**Last updated:** 2026-06-16

---

## App Status
- **Live at:** phreezer.mpgink.com
- **Stage:** Beta prep — Phish.net community post drafted, not yet published
- **Primary surface:** Mobile (iOS Safari) — all layout decisions mobile-first
- **Desktop:** Supported, three-column layout active

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
- Top Shows: RATERS · TOTAL RATINGS · VENUE inline
- Top Venues: SHOWS RATED · RATERS · TOTAL RATINGS inline
- Top Songs: RATERS · TIMES RATED inline

---

## Community Tab

### Subtab order (mobile + desktop) — CONFIRMED
**FEED · PHRIEND OVERLAP · LEADERBOARD · TOP SHOWS · TOP SONGS · TOP VENUES · TOP STATES**

- FEED is default landing — do not revert
- PHRIEND OVERLAP is second — do not revert (was last)

### Feed
- Pinned posts sort first, orange left border, ❄ PINNED · UNCLE EBENEZER badge
- `pinned` BOOLEAN + `author_label` VARCHAR(50) columns on posts table
- KNOWN ISSUE: author_label not overriding username display — fix pending
- Built for mobile currently — desktop layout pass pending

### Phriend Overlap
- Logged-out gate: ⚇ icon + description + CREATE ACCOUNT/LOGIN CTAs
- Companion marking: + COMPANION → ◈ COMPANION → ❄ MUTUAL

---

## ProfileModal
4 tabs: **MY PHISH · BADGES · ABOUT · SHOP**
- Currently built for mobile — desktop pass pending (target: 700–900px wide panel)

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
- Right panel: PHAN REVIEWS / PHREEZERS RATED / PHRIENDS HERE stat boxes + YOUR SCORE

---

## Entry Animation (WelcomeCelebration)
- Centered, max-width 720px, dark overlay
- Snowflake at top (90px, cyan glow)
- Lines: 1rem / 1.15rem / 1.8rem, 20px gap between, centered
- Big final line "DON'T SUCK AT PHISH" in orange at 1.8rem
- TAP TO SKIP at bottom
- Do NOT revert to left-aligned or particle animation

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
- **Entry animation:** terminal boot sequence, centered, no particles — do not revert
- **Scorecard keying:** always posKey, never song name
- **Error boundary:** Mike Says No for ALL errors — do not revert to Ebenezer
- **Default show list:** hidden on scorecard — arrow shows immediately
- **Logged-out desktop:** home tab with DesktopLanding — not scorecard

---

## What's Explicitly NOT There Yet
- Ebenezer post author_label display fix (shows as mpgink username)
- Feed desktop layout (reply/upvote buttons not visible on desktop)
- Profile modal desktop layout (too narrow, mobile-sized)
- Feedback modal desktop sizing
- Global desktop font pass (everything too small on desktop)
- Community card data expansion (Top Songs: times played, set breakdown; Top Venues: attendance data)
- Feed moderation in admin panel
- Feed reply notifications
- Phish Phreeze community subtab (band-level stats)
- Etsy OAuth activation (pending Etsy app review)
- Rate limiting on auth endpoints
- Sentry DSN fix (malformed org ID in Vercel env var)
