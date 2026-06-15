# Session Log — Phreezer

---

## Session: 2026-06-14 (evening)

### What was confirmed / closed out
- Sentry accounts created — VITE_SENTRY_DSN + SENTRY_DSN added to Vercel ✅
- Posthog account created — VITE_POSTHOG_KEY added to Vercel ✅
- UAT confirmed on iOS Safari — audio player, song card redesign, notes textarea all working ✅
- Matthew's own Phish.net import working ✅
- Buddy Phish.net import UAT: buddy doesn't have his handle handy — deemed not a blocker (Matthew's import validated the feature)
- STTF (Surrender to the Flow) email sent — pitching Phreezer for mention in their publication
- Forum post ready — decision made to post Monday morning for better traffic

### Decisions made
- Forum post timing: Monday morning (not Sunday night) — peak procrastination hours
- Buddy import UAT: not a blocker — Matthew's own import is sufficient validation
- App is ready for beta launch — no remaining technical blockers

### Next session priorities
1. Post "Won't You Step Into the Phreezer!" to Phish.net community forum
2. Monitor signups, errors, feedback after post goes live
3. Enable GitHub Issues on repo for bug triage (Matthew flips switch in repo settings)
4. Etsy OAuth activation (once Etsy approves)
5. Watch for STTF reply

---

## Session: 2026-06-14

### What shipped

**Audio player — fixed and working**
- Root cause 1: `ProfileModal.jsx` had `{showPrivacy && <PrivacyModal />}` as a sibling outside the root JSX div — invalid, caused every build since last session to fail silently with esbuild error. Fixed by wrapping return in a fragment (`<>`).
- Root cause 2: `stream.js` used `require('stream')` inside an ES module — ReferenceError at runtime. Rewrote streaming to use Web Streams reader loop (`reader.read()` → `res.write()` → `res.end()`), no CommonJS.
- Root cause 3: URL validation regex `^https:\/\/phish\.in\/` too strict — CDN domains rejected. Replaced with `new URL()` hostname check allowing `phish.in` and anything containing `phish`.
- `InlineAudioPlayer` wrapper: added `width: 100%; gridColumn: 1 / -1; boxSizing: border-box` — now spans full width on both mobile flex and desktop grid.

**Song card redesign (mobile)**
- Row 1: song title, full width, green glow (`text-shadow: 0 0 8px rgba(51,255,51,0.4)`)
- Row 2: `▶ · duration · JAM/REPRISE badges · [spacer] · ★★★★★` — all on one tight line
- Song number brightened to `rgba(255,102,0,0.75)`, letter-spacing added
- `flex-direction: column` layout — do not revert

**Song notes — auto-expanding textarea**
- Swapped single-line `<input>` for `<textarea>` with auto-resize on change (`scrollHeight` pattern)
- Starts at 3 rows, grows with content, no scrollbar
- Green border + glow on focus
- `▲ COLLAPSE` button bottom-right — preserves note, collapses cleanly
- Collapse with no text auto-dismisses to `+ NOTE`

**Admin MONITORING tab**
- New `api/admin/monitoring.js` endpoint — activation status, user growth, rating activity, AI usage (today/7d/30d), email activity by type, feedback stats, donation totals
- `MonitoringTab` component in `AdminTab.jsx`
- Activation status panel: green dot = active, orange = wired/inactive, grey = not built
- Services tracked: Sentry client, Sentry server, Posthog, Resend, Anthropic, Phish.net API, Etsy OAuth
- Route added to `vercel.json`

**Server-side Sentry**
- `@sentry/node` added to root `package.json`
- `api/_sentry.js` — lazy init helper, `captureException()` utility, no-op when `SENTRY_DSN` absent
- Wired into 5 high-risk endpoints: `audio/stream.js`, `ai/ebenezer.js`, `ai/summarize.js`, `auth/login.js`, `auth/register.js`

### Decisions made
- Server-side Sentry uses same DSN as client — one Sentry project, tagged by source
- `SENTRY_DSN` (no VITE_ prefix) for server, `VITE_SENTRY_DSN` for client — both needed in Vercel env vars
- Song row is column layout on mobile — title gets full width, controls are a second row. Do not revert.
- Notes are textarea not input — do not revert to single line

---

## Session: 2026-06-13 (evening, pass 3 — security)

### What shipped

**Security hardening — all API endpoints**
- `api/_auth.js` — CORS locked to `phreezer.mpgink.com` + `localhost:5173`; explicit `algorithms: ['HS256']`; passes `Vary: Origin` header
- `api/_disposable.js` — disposable/throwaway email domain blocklist (~40 providers)
- `api/auth/register.js` — blocks disposable emails at registration
- `api/auth/login.js` — explicit `algorithm: 'HS256'` in `jwt.sign`
- `api/feedback/submit.js` — removed open unauthenticated GET migration endpoint
- **45 API handler files** — all updated to pass `req` to `cors()` for origin-aware CORS headers

---

## Session: 2026-06-13 (evening, pass 2)

### What shipped

**Privacy Policy**
- `PrivacyModal.jsx` — full plain-language privacy policy in retro terminal style
- Linked from About tab in ProfileModal and T&C modal

**Beta success criteria documented**
- 50 registered users · 500 shows rated · 14 consecutive days no P0 bugs

---

## Session: 2026-06-13 (evening)

### What shipped

**Sentry + Posthog integration**
- `@sentry/react` + `posthog-js` added to client
- `analytics.js` — Posthog init, identifyUser, resetIdentity, 20+ named events
- `main.jsx` — Sentry init, ErrorBoundary, retro fallback UI
- `App.jsx` — analytics calls wired throughout

---

## Session: 2026-06-13

### What shipped

**Rate Limiting**
- /api/auth/login — 10 attempts/15min per IP
- /api/auth/register — 5 attempts/60min per IP
- Shared _ratelimit.js module (in-memory Map)
- Mike Says No screen for 429

**Email System**
- _email.js — shared Resend sender + 5 HTML templates, Uncle Ebenezer voice
- Onboarding, Day 3 nudge, Day 7 engage, Day 30 re-engage, milestone emails
- Daily cron at 2pm UTC — email-cron.js
- email_log table — idempotency

**Onboarding Tour**
- TourGuide.jsx v4 — centered modal, 9 steps, works on mobile
- Server-side tour_completed flag
- Admin RESET TOUR button

**Shop + Donations**
- Shop tab in ProfileModal — 3 Etsy listings
- $1/item donated to Mockingbird Foundation
- donation_tracker table, admin DONATIONS tab
- Etsy OAuth built — pending app review

**AI Usage Logging**
- ai_usage_log table, _ai_usage.js shared logger
- Admin AI USAGE tab

**Audio**
- api/audio/stream.js — server-side proxy for Phish.in MP3s
- InlineAudioPlayer.jsx — play/pause, scrubber, seek

**Forum Post**
- Full Phish.net community post drafted and approved
- Ready to publish Monday 2026-06-15
