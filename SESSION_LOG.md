# Session Log — Phreezer

---

## Session: 2026-06-17

### What shipped

**Phriend Overlap — autocomplete + attendance-based suggestions**
- New `api/community/user-search.js` — username autocomplete (ILIKE, verified users only, excludes self)
- New `api/community/overlap-suggestions.js` — users who share shows with current user, ranked by overlap count
- Suggestions union all three attendance sources: `user_show_attendance`, `attendance` (Phish.net import), `ratings`
- `PhriendOverlapCommunity` in `CommunityTab.jsx` fully redesigned:
  - Default list of "PHRIENDS WHO WERE THERE" on load/focus, ranked by shared show count
  - Live autocomplete dropdown (250ms debounce) as user types
  - Tap any name to run scan immediately — no submit required
  - SCAN ▶ button for manual entry
  - ✕ CLEAR returns to suggestion list
- Routes added to `vercel.json`

**Attendance type — mandatory on first star tap**
- `attendanceType` state + `attendancePrompt` modal in `ScorecardTab.jsx`
- First star tap without attendance set intercepts rating, shows full-screen modal
- Three options: 🎸 I WAS THERE / 📺 WATCHED WEBCAST / 🎧 HEARD THE RECORDING
- Pick one → attendance sets, pending rating applies, modal closes instantly
- Backfills existing unset attendance on next interaction with any rated show

**Phish Phreeze Feed — full implementation**
- New `client/src/components/PhreezeFeed.jsx` — full feed component
- `api/community/posts.js` — GET (paginated, category-filterable, 20/page) + POST (500 char limit)
- `api/community/posts/[id]/replies.js` — GET + POST replies
- `api/community/posts/[id]/react.js` — toggle upvote
- Tables (`posts`, `post_replies`, `post_reactions`) created via `CREATE TABLE IF NOT EXISTS` on first request — no separate migration needed
- Categories: GENERAL / SHOW / SONG / VENUE / FEEDBACK with color coding
- Compose box: collapsed placeholder, expands with category picker + char counter
- Reply inline, upvote posts and replies, paginated load more
- FEED added as first subtab under COMMUNITY — default landing when tapping COMMUNITY tab
- Sidebar updated: FEED first in community items
- App.jsx: `feed` added to community tab array, render case, subtab button
- CommunityTab.jsx: `PhreezeFeed` imported + wired to `subTab === 'feed'`
- Routes added to `vercel.json`

**Entry animation — terminal boot sequence**
- `WelcomeCelebration` in `Celebrations.jsx` completely replaced
- Pool of 8 Phish inside-joke boot lines, 2 picked randomly each login:
  - INITIATING SIREN LOOPS, CHILLING THE PHREEZER, EXTRACTING THE JAMS, READING THE BOOK, LOCATING THE LIZARDS, NOTIFYING WILSON, CONSULTING ICCULUS, CALCULATING TUBE TIME
- Full sequence with breathing room:
  - 0ms: PHREEZER v2.0 — INITIALIZING...
  - 600ms: LOADING SHOW DATABASE............OK
  - 1200ms: [random joke line 1]
  - 1800ms: [random joke line 2]
  - 2600ms: IDENTITY CONFIRMED: USERNAME (cyan)
  - 3500ms: DON'T SUCK AT PHISH. (orange glow)
  - Auto-dismiss at 5800ms, tap anywhere to skip
- No particles, no fireworks — pure terminal aesthetic
- SaveCelebration (post-rating) left unchanged

### Decisions made
- Feed is permanent infrastructure, not just beta tooling — data model built for long term (soft deletes, reactions table, pagination)
- Attendance type is mandatory — enforced at first star tap, not at scorecard open (option 2 chosen for lower friction)
- Boot sequence uses rotating joke lines so returning users see variety — pool expandable anytime
- Phriend Overlap suggestions include rated shows (not just attendance) — anyone who rated a show was effectively there
- FEED is default COMMUNITY landing tab going forward — do not revert

### Known issues / open debt
- Feed has no moderation UI yet — soft delete exists in DB but no admin surface to action it
- Feed has no notification system — users won't know when someone replies
- Boot sequence only fires on `WelcomeCelebration` (login) — first-time onboarding flow uses separate `OnboardingFlow` component, unaffected
- Repo is currently public — Matthew to make private tomorrow via GitHub settings

### Next session priorities
1. Make GitHub repo private (Matthew action)
2. Monitor feed — first real posts from users
3. Feed moderation surface in admin panel (soft delete posts/replies)
4. Add more joke lines to boot pool as they come to mind
5. Dual attendance table audit — other queries that may have same blind spot as Phriend Overlap

---

## Session: 2026-06-16

### What shipped

**Email verification fix**
- Root cause: `RESEND_API_KEY` env var was invalid/broken in Vercel production
- Created new Resend API key as `PHREEZER_RESEND_API_KEY`
- Updated all 4 files that referenced `RESEND_API_KEY` → `PHREEZER_RESEND_API_KEY`: `api/_email.js`, `api/auth/verify-email.js`, `api/admin/monitoring.js`, `api/admin/user.js`
- Added proper `res.ok` check + error throw to `sendVerificationEmail` (was silently swallowing failures)
- Email verified working end-to-end ✅

**Admin USERS tab — KPI bar**
- 4-stat grid at top: TOTAL · VERIFIED · RATED · .NET LINKED
- Computed from already-loaded user list — no extra API call
- `phishnet_username` added to admin users query in `api/admin/users.js`
- `email_verified` also added to query (was missing)

**Admin USERS tab — RESEND VERIFY button**
- Appears only on unverified users (cyan)
- Calls `POST /api/auth/verify-email` with user's email
- VERIFIED ✓/✗ stat added to expanded user card (orange ✗ for unverified)

**Admin EXTERNAL tab — fixed false failures**
- Created `api/admin/health.js` — server-side proxy that probes all three with real keys
- Added route to `vercel.json`
- EXTERNAL tab now calls `/api/admin/health` for those three; Phish.in remains direct

**Floating button — ASK EBENEZER**
- Updated label from "ASK" to "ASK EBENEZER" in `EbenezerDrawer.jsx`

**Phriend Overlap — fixed**
- Bug 1: `s.showdate` → `s.show_date`
- Bug 2: Rewrote using CTEs that UNION both tables for each user

**Error handling audit**
- `api/user/companions.js`, `api/user/deep-phreeze.js`, `api/community/phriend-overlap.js` — all got try/catch

**Wrap protocol overhaul**
- `INSTRUCTIONS.md` rewritten with explicit 8-step checklist wrap protocol

### Decisions made
- `PHREEZER_RESEND_API_KEY` is the canonical env var name going forward
- Phriend Overlap must union both `attendance` and `user_show_attendance`
- External API health checks must always be proxied server-side
- Wrap protocol is now 8 explicit steps

### Known issues / open debt
- Dual attendance table pattern exists throughout — other queries may have same blind spot
- Frontend error messages still show raw API error strings in some places

---

## Session: 2026-06-14 (evening)

### What was confirmed / closed out
- Sentry + Posthog env vars added to Vercel ✅
- UAT confirmed on iOS Safari — audio player, song card redesign, notes textarea ✅
- Matthew's own Phish.net import working ✅
- STTF email sent
- Forum post ready — posted Monday 2026-06-15 ✅

---

## Session: 2026-06-14

### What shipped
- Audio player fixed (stream.js ES module rewrite, URL validation, full-width player)
- Song card redesign (column layout, title row 1, controls row 2)
- Song notes auto-expanding textarea
- Admin MONITORING tab
- Server-side Sentry (`api/_sentry.js`, wired into 5 endpoints)

---

## Session: 2026-06-13 (evening, pass 3)
- Security hardening — CORS locked, rate limiting, disposable email blocklist, 45 API handlers updated

## Session: 2026-06-13 (evening, pass 2)
- Privacy Policy (PrivacyModal.jsx)
- Beta success criteria documented

## Session: 2026-06-13 (evening)
- Sentry + Posthog integration

## Session: 2026-06-13
- Rate limiting, email system, onboarding tour, shop + donations, AI usage logging, audio proxy, forum post drafted
