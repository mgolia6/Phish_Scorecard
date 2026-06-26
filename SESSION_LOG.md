## Session: 2026-06-25

### Shipped

**Light Mode — full theme system (admin-gated sandbox)**
- `client/src/theme.js` (new) — get/set/apply/toggle theme, persisted in localStorage (`phreezer_theme`). Applied in `main.jsx` before first paint (no flash).
- `index.css` — `[data-theme="light"]` overrides every design token. Technique: dark token values stay byte-identical to the original literals, so dark mode renders unchanged while light flips.
- ProfileModal MY PHISH tab — APPEARANCE section (DARK / LIGHT toggle), **gated `{user?.is_admin}`** so only admins see it in production. Light mode stays sandboxed until fully polished — DO NOT remove the gate until release.
- Phase 2a: RGB-component hue tokens (`--green-rgb/--cyan-rgb/--cyan-bright-rgb/--orange-rgb/--orange-bright-rgb`); ~695 hardcoded `rgba()` hue shades converted to `rgba(var(--x-rgb), a)`.
- Phase 2b: `--inset-soft/--inset/--inset-md/--inset-strong/--inset-xstrong` + `--hairline` tokens (dark = original black-alpha fills; light = faint green tints). Scrims ≥0.75 stay dark.
- Phase 2c: `--ink-rgb` token (dark=255,255,255 / light=20,33,26) — converted 111 dimmed-white `rgba(255,255,255,a)` text/borders app-wide; reverted on always-dark overlays (boot, MIKE SAYS NO, badge celebration).
- Phase 2d/2e: FullPageLoader snowflake 80px → clamp(220px,56vw,340px); app-wide sweep raising inline low-alpha colored text (`rgba(var(--HUE-rgb), <0.6)`) to a 0.7 readable floor (45 spots / 21 files).
- Readability passes: `--card-deep` token (dark=rgba(5,18,5,.98) / light=#f3f6ef) themes the OTD / My Shows / Community-result / Scorecard-phriends gradient cards; `#fff`→`var(--white)` on ShowCard day+venue and OTD date (the "disappearing day"); light text tokens darkened (label .82→.92, muted .58→.74, dim .55→.66); AI-tab + Shop ink subtext raised to ~0.7; avatar tiles themed; SHOW NOTES toggle made prominent; masthead stat labels ink .3→.55.

**My Phriends — dropdown picker (no name recall)**
- `MyPhriends.jsx` rewritten to mirror the Community overlap picker: on focus a dropdown lists phreezers who share your shows (via `/community/overlap-suggestions`) with shared-show counts; typing runs live typeahead (`/community/user-search`); same list renders below the bar before any search; CLEAR button. Keeps the YOU/THEM per-show score comparison.

**Email system**
- `api/admin/send-email.js` (new) — admin endpoint: `mode:'all'` runs the lifecycle pass for everyone (calls `runLifecycleEmails(pool)` directly — no internal VERCEL_URL fetch, which deployment protection was intercepting → 0 sends); `mode:'one'` sends a specific template to one user.
- `api/emails/cron.js` — extracted `runLifecycleEmails(pool)`; cron auth now accepts `Authorization: Bearer <CRON_SECRET>`; added weekly-reminder pass (Tuesdays, ISO-week-stamped `weekly_YYYY-Www`, one-click unsubscribe URL), `email_opt_out` filter.
- `api/emails/unsubscribe.js` (new) — RFC 8058 one-click unsubscribe (POST) + GET confirmation/resubscribe page; lazy-migrates `email_opt_out`/`unsubscribe_token`.
- `api/_email.js` — `sendEmail` sets `List-Unsubscribe`/`List-Unsubscribe-Post` headers; `weeklyReminderEmail()` template.
- `api/_ai_usage.js` — Haiku 4.5 pricing corrected to $1.00/$5.00 per MTok; warn on unknown models. `ebenezer-moderate.js`/`ebenezer.js` now log moderation calls (feature 'moderation'). `admin/ai-usage.js` adds per-user cost (byUser); AdminTab AI-usage "LAST 30 DAYS" ISO dates formatted (e.g. JUN 24, 2026).

**Admin**
- User cards: removed duplicated stats, 2-col button grid, per-user email nudge. 77 small admin font sizes bumped ~+0.07rem.

**Scorecard**
- Re-roll: "⚄ ANOTHER RANDOM SHOW" button now on the loaded show (was only on the empty state).
- Phriend-tag input hardened against password-manager autofill (type/name + autoComplete off + 1Password/LastPass/Dashlane ignore attrs) — same treatment on both Phriend search inputs.

**PHAN ROLL** — the "LEADERBOARD" sub-tab + panel title renamed (non-competitive), row fonts enlarged.

**Light mode released + changelog v2.2** — removed the admin gate (APPEARANCE toggle now visible to all users; opt-in, defaults to dark). Bumped `CHANGELOG_VERSION` → 2.2 (shows once per version on login to everyone): announces light mode + My Phriends dropdown + a **SHARE FEEDBACK** CTA that opens the general feedback form (`setFeedbackModal('passive')`).

**Mobile chrome / safe-area / cache**
- `client/index.html` — added `viewport-fit=cover`. The safe-area padding already written was inert without it (iOS reports insets as 0). This activated: header notch-fill, modal top inset, bottom-nav height.
- `.mobile-bottom-nav` height → `calc(72px + env(safe-area-inset-bottom))` (border-box was eating the content height and clipping "MY PHREEZER"); larger icon/label.
- Header: bottom-up gradient (catches the wordmark/tagline), safe-area top fill.
- Top overscroll: `overscroll-behavior-y: none` + `html { background: var(--bg-elevated) }` so iOS rubber-band can't reveal a light strip above the fixed header.
- `vercel.json` — `Cache-Control: no-cache` on `/` and `/index.html`. Root cause of the recurring "stale OTD card / old bundle" reports: the SPA HTML was being cached, so new content-hashed assets weren't picked up. Hashed JS/CSS stay long-cached.

### Decisions Made
- **Light mode ships behind an admin gate** and stays there until fully polished — regular production users still see dark only. Chosen approach: "full polished light theme," built in phases.
- Dark mode preserved byte-identical via the token technique (every dark token value == the original literal it replaced).
- Weekly reminders: all users, Tuesdays, with proper RFC-8058 one-click unsubscribe (chosen over a softer opt-out).
- Leaderboard reframed as **PHAN ROLL** — deliberately non-competitive.
- All of the above merged to production (#16–#24) — safe because light mode is admin-gated and dark mode is unchanged.

### Known Issues / Debt Introduced
- **Light-mode admin gate** must be removed at release (search `is_admin` on the APPEARANCE toggle in ProfileModal).
- **Tagline under the PHREEZER wordmark** is baked into the logo PNG (light-colored) — the bottom-up header gradient backs it but it may still be weak on light. Real fix: a dark-ink logo asset for light mode, or render the wordmark+tagline as live text. Flagged to Matthew, not yet done.
- `overscroll-behavior-y: none` needs iOS 16+; on older iOS the `html` bg-elevated fallback covers the reveal.
- Light-mode Phase 2 may still have a few stray hardcoded hex literals not yet tokenized — sweep as spotted.

### Open / Next Session
- Confirm top-overscroll fix on device; remove the light-mode admin gate when polish is signed off; light-mode logo/tagline asset; continue desktop UAT.
- See ROADMAP.md

---

## Session: 2026-06-18

### Shipped

**Tweezerfest dedupe fix**
- `api/user/sync.js` — `songFreq` now counts unique shows per song, not raw setlist rows
- Added `seenThisShow` Set per show in `computeStats` — prevents multi-play nights (e.g. Tweezerfest) from inflating "times heard" count in Deep Phreeze MOST HEARD section
- Fix only applies after user re-syncs; existing cached stats unaffected until sync

**1ST BUG badge**
- `client/src/components/BadgeCelebration.jsx` — added `first_bug` entry: 🐛 emoji, orange, pulse, sub-label "IT DOES MATTER"
- Awarded manually to lbag420 (user ID 9) via Neon SQL — will show on next login via badge catch-up flow
- SQL: `INSERT INTO user_badges (user_id, badge_key, badge_label) VALUES (9, 'first_bug', '1ST BUG') ON CONFLICT DO NOTHING`

**Rating reminder email**
- `api/_email.js` — new `ratingReminderEmail` template: subject "You've been to X shows. How were they?", attended count stat tile, 3-step rate guide, summer tour July 7 callout
- `api/emails/cron.js` — new rating reminder pass: targets verified users with attendance but zero ratings, most recent attended show ≥7 days ago. One-time send, logged as `rating_reminder`. Runs on daily cron schedule.

**CLAUDE.md**
- New file added to repo root — handoff doc for Claude Code sessions
- Covers stack, file map, patterns, conventions, what NOT to do, and how this repo uses claude.ai vs Claude Code

### Decisions Made
- Rating reminder fires on schedule (not manually triggered) — goes out tomorrow morning
- claude.ai = mocking, design discussion, session wrap; Claude Code = actual builds going forward
- lbag420 reported Tweezerfest inflation bug — first community bug report, earned the 1ST BUG badge

### Open / Next Session
See ROADMAP.md

---

# SESSION LOG

## Session: 2026-06-17 (Full Day — Part 2)

### Shipped

**Navigation**
- Deep Phreeze moved to second position in both mobile sub-tabs and desktop sidebar (MY SHOWS → DEEP PHREEZE → MY SONGS → ...)
- Primary tabs (MY PHREEZER / COMMUNITY / SCORECARD) moved to fixed bottom nav on mobile
- Bottom nav: 72px tall, icon + label, iPhone safe area padding, active state in cyan
- Ebenezer FAB shifted to bottom: 88px to clear bottom nav
- Ebenezer drawer opens from bottom: 72px (sits above nav)

**Boot sequence**
- Single rotating joke line (one of original 8, picked randomly per session)
- Cursor sits 700ms after joke line completes
- `OK` types out in bright green, sits 600ms
- Then: IDENTITY CONFIRMED → DON'T SUCK / AT PHISH → glitch exit

**Changelog modal**
- ChangelogModal.jsx — shows once per version via localStorage key (phreezer_changelog_seen_2.1)
- Two entries: bottom nav move, Deep Phreeze promotion
- Tap outside or GOT IT dismisses permanently
- Next release: bump CHANGELOG_VERSION + update CHANGES array

**Badge celebration system**
- BadgeCelebration.jsx — full-screen animated celebration for all 14 badge types
- Snowflake asset used for founder badges (PHAB PHIVE, EARLY PHREEZE); each other badge has its own icon/glyph/color
- BadgeQueue component: shows badges one at a time sequentially, never stacked
- api/user/badges.js: GET returns unseen badges (notified_at IS NULL), POST marks them seen
- notified_at column added to user_badges via ALTER TABLE IF NOT EXISTS
- Real-time trigger: ratings save endpoint checks milestones (1/10/25/50/100 shows rated), returns new_badges, fires 2.8s after save celebration
- Login catch-up: auth/me → fetch unseen badges → queue sequentially
- vercel.json: /api/user/badges route added
- seed-founder-badges.js rewritten as bulk upsert (was sequential loop — timed out at 12+)

### Decisions Made
- No copy/one-liners on badge celebrations — animation is enough
- Joke lines locked to original 8 from prior session — no new ones added
- Badge catch-up on login shows for all existing users (16 have unseen EARLY PHREEZE / PHAB PHIVE)
- reviewer badge key dropped — merged into critic (Phish.net reviewer trigger)

### Open / Next Session
See ROADMAP.md

---

## Session: 2026-06-17 (Full Day — Part 1)

### Shipped

**Ebenezer — Knowledge Base**
- Full Phish.net catalog seeded: 3,171 songs, 4,082 shows, 1,847 reviews, 2,500+ jamchart entries
- DB tables: pn_songs, pn_shows, pn_reviews, jamchart_entries
- All query helpers, formatters, vibe search, jamchart search wired

**Ebenezer — Intent + System Prompt**
- vibeMap expanded, era-only queries, banned disclaimers, lead-with-answer hard rules

**Ebenezer — Content Moderation + Logging**
- Moderation, anonymous logging, opt-out

**Ebenezer — Drawer UI**
- Export, disclosure footer, full modal on desktop

**Admin**
- SYSTEM tab reorganized, MONITORING knowledge base panel, RATING ACTIVITY fix, USER GROWTH fix

**Other**
- Toast z-index 9500, repositioned to bottom-center
- Rate limiting on auth endpoints ✓
- Phish.net forum post published ✓
- Founder badges seeded ✓

---

## Session: 2026-06-16 Part 3 (Evening)

### Shipped
- Feed fixes (truncation, collapsed post box)
- Boot sequence typewriter effect, glitch exit
- Email cron upgraded, onboarding email rewritten
- Founder badges (PHAB PHIVE, EARLY PHREEZE), seed endpoint, BadgesTab
- AI tab in ProfileModal
- Ebenezer intent detection, show/song/general handlers

---

## Session: 2026-06-16 Part 2 (Desktop Pass)

### Shipped
- API upgrades: top-songs, top-shows, top-venues, top-states
- CommunityTab full rewrite, desktop CSS pass

---

## Session: 2026-06-16 Part 1 (Full Day)

### Shipped
- All crashes / P0s, filter rewrite, DesktopLanding, SlotMachine
- Companion system, Phriend Overlap gate, Ebenezer pinned post
- Boot sequence, desktop card stats
