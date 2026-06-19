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
