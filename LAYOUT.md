# Phreezer — Layout & Design State
**Last updated:** 2026-06-17

---

## App Status
- **Live at:** phreezer.mpgink.com
- **Stage:** Beta — Phish.net community post published 2026-06-15
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

### Fonts
- **Display:** Orbitron — headings, labels, nav items, section titles
- **Mono:** Share Tech Mono — body copy, data, song names, stats

---

## Mobile Layout

### Header (top bar)
- Left: ❄ PHREEZER wordmark (cyan)
- Right: Avatar button — pulses cyan→orange on every login until tapped

### Bottom Tab Nav
4 tabs: **MY PHREEZER · COMMUNITY · SCORECARD**
- Shop and About live in ProfileModal — NOT in tab nav

### Main Content Area
Full-width below header, above bottom nav.

---

## Desktop Layout
Three columns:
1. **Left sidebar** — navigation, collapsible
2. **Main content** — center, scrollable
3. **Right rail** — Uncle Ebenezer (persistent, collapsible)

### Sidebar Hierarchy
```
◈ MY PHREEZER
  — My Shows / Songs / Venues / States / Phriends / Deep Phreeze
★ COMMUNITY
  — Feed (NEW — first item)
  — Leaderboard / Top Shows / Top Songs / Top Venues / Top States
  — Phriend Overlap
◈ SCORECARD
◈ FEEDBACK
```

---

## Community Tab

### Subtab order (mobile + desktop)
**FEED · LEADERBOARD · PHRIEND OVERLAP · TOP SHOWS · TOP SONGS · TOP VENUES · TOP STATES**

- FEED is the default landing when tapping COMMUNITY — do not revert
- FEED is first in sidebar community items — do not revert

### Feed
- Chronological post stream, newest first
- Categories: GENERAL / SHOW / SONG / VENUE / FEEDBACK — color coded
- Compose box collapses to placeholder, expands with category picker
- Replies inline, upvotes on posts and replies
- 500 char limit, paginated (20/page)

### Phriend Overlap
- Default list: users who share shows, ranked by overlap count (loads on mount)
- Autocomplete dropdown on focus/type (250ms debounce)
- Tap any name to run scan
- Sources: user_show_attendance + attendance + ratings

---

## ProfileModal
4 tabs: **MY PHISH · BADGES · ABOUT · SHOP**

---

## Scorecard Tab

### Attendance Type — MANDATORY
- First star tap without attendance set → intercepts, shows full-screen modal
- Three options: 🎸 I WAS THERE / 📺 WATCHED WEBCAST / 🎧 HEARD THE RECORDING
- Attendance sets, pending rating applies, modal closes — seamless
- Do not remove this gate

### Song Row Layout (mobile)
- Row 1: song title full width, green glow
- Row 2: ▶ · duration · badges · [spacer] · ★★★★★
- `flex-direction: column` — do not revert to side-by-side

### Song Notes
- textarea, auto-expands, ▲ COLLAPSE — do not revert to single-line input

### Audio Player
- Full-width InlineAudioPlayer via `width:100%` + `gridColumn:1/-1`

---

## Entry Animation (WelcomeCelebration)
- Terminal boot sequence — NO particles, NO fireworks
- PHREEZER SYSTEMS header
- Lines type in with delays: INITIALIZING → DB LOADED → 2 random joke lines → IDENTITY CONFIRMED → DON'T SUCK AT PHISH
- 8-line joke pool in Celebrations.jsx, 2 picked randomly per login
- 5.8s total, tap to skip
- Do NOT revert to particle/firework animation

---

## Onboarding Tour
- 9-step centered modal — spotlight approach was explicitly abandoned
- Server-side `tour_completed` flag

---

## Auth Screens
- **MIKE SAID NO.** — email not verified
- **MIKE SAYS NO.** — rate limited

---

## Uncle Ebenezer
- Desktop: persistent right rail
- Mobile: floating ❄ button — label is "❄ ASK EBENEZER"

---

## Key Layout Decisions (Do Not Revisit Without Good Reason)
- **Song row mobile:** column layout — do not revert
- **Song notes:** textarea — do not revert to input
- **Audio player:** full-width span
- **Shop/About:** in ProfileModal, not nav
- **Tour:** centered modal, no spotlight
- **Feedback:** sidebar only
- **Avatar pulse:** resets on every login, stops on first tap
- **FEED:** default COMMUNITY landing, first in sidebar — do not revert
- **Attendance type:** mandatory gate on first star tap — do not remove
- **Entry animation:** terminal boot sequence — no particles — do not revert
- **Scorecard keying:** always posKey, never song name
- **ProfileModal JSX:** return must be wrapped in fragment

---

## What's Explicitly NOT There Yet
- Desktop logo (Matthew to deliver from Canva)
- Feed moderation in admin panel
- Feed reply notifications
- Phish Phreeze community subtab (band-level stats)
- Etsy OAuth activation (pending Etsy app review)
