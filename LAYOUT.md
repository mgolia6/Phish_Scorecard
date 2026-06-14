# Phreezer — Layout & Design State
**Last updated:** 2026-06-13 (evening, final)

---

## App Status
- **Live at:** phreezer.mpgink.com
- **Stage:** Beta — Phish.net community post ready to publish
- **Primary surface:** Mobile (iOS Safari) — all layout decisions mobile-first
- **Desktop:** Supported, three-column layout

---

## Design System — Non-Negotiable

### Aesthetic
Retro terminal / synthwave. Dark background, glow effects, scanlines. This is the identity — do not deviate.

### Colors
- `--green`: `#33ff33` — primary accent, section labels
- `--cyan`: `#00e0d0` — interactive elements, links, active states
- `--orange`: `#ff6600` — CTAs, Ebenezer, warnings
- `--bg`: `#0a0a0a` — page background
- `--bg-panel`: `#0f0f0f` — card/panel background
- Background for elevated surfaces: `rgba(0,0,0,0.4)`

### Fonts
- **Display:** Orbitron — headings, labels, nav items, section titles
- **Mono:** Share Tech Mono — body copy, data, song names, stats

### Key UI Patterns
- Section labels: `fontFamily: var(--font-display)`, `fontSize: 0.5–0.58rem`, `letterSpacing: 3–4px`
- Body text: `fontFamily: var(--font-mono)`, `fontSize: 0.7–0.8rem`, `lineHeight: 1.8`
- Borders: `1px solid rgba(255,255,255,0.06)` default, colored left-border for emphasis
- Glow: `textShadow: 0 0 Xpx COLOR` on active/important elements
- Buttons: `var(--font-display)`, all caps, `letterSpacing: 2–3px`

---

## Mobile Layout

### Header (top bar)
- Left: ❄ PHREEZER wordmark (cyan)
- Right: Avatar button — pulses cyan→orange on every login until tapped, stops on first tap
- Avatar is the gateway to ProfileModal (profile, settings, shop, about)

### Bottom Tab Nav
4 tabs: **MY PHREEZER · COMMUNITY · SCORECARD · (no shop — lives in ProfileModal)**
- Shop was explicitly moved OUT of the tab nav — too low frequency
- About was explicitly moved OUT of the tab nav — same reason

### Main Content Area
Full-width below header, above bottom nav. Each tab owns its scroll.

---

## Desktop Layout
Three columns:
1. **Left sidebar** — navigation, collapsible
2. **Main content** — center, scrollable
3. **Right rail** — Uncle Ebenezer (persistent, collapsible)

### Sidebar Hierarchy
```
◈ MY PHREEZER (section label)
  — My Shows
  — My Songs
  — My Venues
  — My States
  — My Phriends
  — Deep Phreeze
★ COMMUNITY (section label)
  — Leaderboard
  — Top Shows
  — Top Songs
  — Top Venues
◈ SCORECARD
◈ FEEDBACK (bottom, below divider)
```
- SHOP is NOT in the sidebar — lives in ProfileModal
- ABOUT is NOT in the sidebar — lives in ProfileModal
- FEEDBACK is sidebar-only (no floating button, no portal)

---

## ProfileModal
4 tabs: **MY PHISH · BADGES · ABOUT · SHOP**

### MY PHISH
- INFO section: phish.net handle, first show, home venue, years active
- SETTINGS: tap-to-select preference questions (stage side, show vibe, etc.)

### BADGES
- Badge shelf — earned badges displayed

### ABOUT
- Origin story: ihoz.com / Phishtistics as inspiration, links to http://www.ihoz.com/PhishStats.html
- Excel → website → app journey
- Phish.net foundation, Phish.in recordings
- Feedback CTA
- "Hopefully you enjoy it and it helps us all suck a little less at Phish."
- Privacy Policy link at bottom (subtle, low-contrast) — opens PrivacyModal

### SHOP
- DonationCard at top — Mockingbird Foundation total, $1/item
- 3 Etsy listings:
  - Phreezer Logo T-Shirt — cyan border (`4521116067`)
  - Phreezer Logo Bumper Sticker — orange border (`4521118995`)
  - Don't Suck at Phish Bumper Sticker — green border (`4521316287`)
- Footer: "Sold via Etsy · Fulfilled by Printify"

---

## Scorecard Tab
- Search bar at top
- Show loads: setlist by set, each song row has:
  - Song number, song name (links to phish.net)
  - Duration, JAM/REPRISE badges
  - Segue indicator (> or →)
  - ▶ play button (if audio available) — tapping expands InlineAudioPlayer below the row
  - Star rating (1–5)
  - + NOTE toggle
- InlineAudioPlayer: drop-down below song row, play/pause, scrubber, time, "via phish.in"
- One audio player open at a time
- Vibe Check expandable below setlist
- ◉ AUDIO AVAILABLE badge when Phish.in data present
- PHISH.IN link opens externally (for full show context)

---

## Onboarding Tour
- 9-step centered modal — fires after onboarding completes
- Ebenezer voice throughout
- No spotlight/DOM targeting — centered overlay only, works on mobile and desktop
- Steps: Intro → Scorecard → My Shows → OTD → Deep Phreeze → Community → Ebenezer → Profile → Outro
- "Don't suck at Phish." is the outro closing line
- Server-side `tour_completed` flag — admin can reset per user

---

## Auth Screens
- **MIKE SAID NO.** (past tense) — email not verified, hard block, resend option
- **MIKE SAYS NO.** (present tense) — rate limited, cool your jets, back button only
- Both use orange glow, 🐟, full-screen overlay
- T&C modal has Privacy Policy link below accept button (subtle)

---

## Community Tab
- Mockingbird donation banner at very top (green left border)
- Leaderboard, Top Shows, Top Songs, Top Venues sections
- Phish Phreeze subtab (band-level stats) — planned, not yet built

---

## Uncle Ebenezer
- Desktop: persistent right rail, collapsible
- Mobile: floating ❄ button opens drawer
- Character: jaded veteran, genuine love for the band underneath the weariness
- 10-turn fading memory, user show history as context
- Tagline: "Helping you suck a little less at Phish."
- Powers: Claude Sonnet

---

## Key Layout Decisions (Do Not Revisit Without Good Reason)
- **Shop in ProfileModal, not nav** — decided this session, low-frequency feature
- **About in ProfileModal, not nav** — same reasoning
- **Tour as centered modal** — spotlight approach failed on mobile, explicitly abandoned
- **Feedback in sidebar only** — removed from floating/portal position
- **Avatar pulse** — resets on every login, stops on first tap per session
- **holographic/gradient text on orange** — fully reverted, plain `var(--orange)` only
- **Scorecard keying** — always posKey, never song name — sandwiched songs break name-based lookups

---

## What's Explicitly NOT There Yet
- Desktop logo (Matthew to deliver from Canva)
- Phish Phreeze community subtab
- In-app Phish.in streaming (proxy built, audio player built — needs UAT)
- Etsy OAuth activation (pending Etsy app review)
