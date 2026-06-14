# Session Log — Phreezer

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
- Monitoring endpoint updated to check `SENTRY_DSN` env var presence
- Monitoring tab updated: SENTRY (SERVER) now shows INACTIVE (orange) not NOT BUILT (grey)

### Decisions made
- Server-side Sentry uses same DSN as client — one Sentry project, tagged by source (`server` vs browser)
- `SENTRY_DSN` (no VITE_ prefix) for server, `VITE_SENTRY_DSN` for client — both needed in Vercel env vars
- Song row is column layout on mobile — title gets full width, controls are a second row. Do not revert.
- Notes are textarea not input — do not revert to single line

### Known issues / open debt
- Sentry + Posthog not yet activated — Matthew needs to create accounts and add env vars to Vercel
- Etsy OAuth pending Etsy app review
- Tour guide UAT needed end-to-end
- Phish.net import UAT with buddy still pending

### What Matthew needs to do to activate monitoring
1. Create Sentry account → new React project → copy DSN
   - Add `VITE_SENTRY_DSN` = DSN value (client)
   - Add `SENTRY_DSN` = same DSN value (server)
2. Create Posthog account → new project → copy API key
   - Add `VITE_POSTHOG_KEY` = key value
3. Redeploy (or push any change) — all three activate automatically
4. Check MONITORING tab in admin — dots go green

### Next session priorities
1. UAT pass — scorecard song cards, audio player, notes textarea
2. Sentry/Posthog activation (once Matthew adds keys)
3. Etsy OAuth activation (once Etsy approves)
4. Tour guide UAT
5. Forum post — publish when ready

---

## Session: 2026-06-13 (evening, pass 3 — security)

### What shipped

**Security hardening — all API endpoints**
- `api/_auth.js` — CORS locked to `phreezer.mpgink.com` + `localhost:5173` (was `*`); explicit `algorithms: ['HS256']` in `verifyToken`; passes `Vary: Origin` header
- `api/_disposable.js` — new module: disposable/throwaway email domain blocklist (~40 providers)
- `api/auth/register.js` — blocks disposable emails at registration with clear error message
- `api/auth/login.js` — explicit `algorithm: 'HS256'` in `jwt.sign`
- `api/feedback/submit.js` — removed open unauthenticated GET migration endpoint (dead code, table already exists)
- **45 API handler files** — all updated to pass `req` to `cors()` so origin-aware CORS headers work

### Security audit findings
- All admin endpoints were already properly auth-gated (session log was wrong about migrate.js)
- Cron endpoint was already protected by CRON_SECRET header
- Client bundle was clean — no secrets exposed
- JWT 30d expiry + is_admin baked in: documented risk, acceptable for single-admin beta

### Decisions made
- CORS defaults to prod origin when request has no Origin header (API clients, curl, etc.)
- Disposable email check is server-side only — no client feedback until submit
- JWT revocation not implemented — low priority while Matthew is only admin
- feedback migration endpoint removed entirely (not just locked) — it's been shipped for weeks, table exists

### Next session priorities
1. Posthog/Sentry activation — add VITE_SENTRY_DSN + VITE_POSTHOG_KEY to Vercel
2. Etsy OAuth activation (pending Etsy app review)
3. Phish.net import UAT
4. Tour UAT
5. **Forum post — ready to publish**


## Session: 2026-06-13 (evening, pass 2)

### What shipped

**Privacy Policy**
- `PrivacyModal.jsx` — full plain-language privacy policy in retro terminal style
- Covers: what we collect, what we don't, how we use it, third-party services (Phish.net, Phish.in, Anthropic, Resend, Sentry, Posthog, Etsy), data retention, user rights
- Plain language section: "We don't sell your data. Your show ratings are yours."
- Linked from: About tab in ProfileModal (quiet footer link), T&C modal (below accept button)
- Accessible at any point — before account creation and after

**Beta success criteria documented**
- 50 registered users · 500 shows rated · 14 consecutive days no P0 bugs
- P0 definition included (app down, data loss, auth broken, security vuln)
- Added to ROADMAP.md as its own section

**Username validation confirmed**
- Backend enforces `!email || !username || !password` — 400 if missing
- Frontend form has `required` on username field
- No fix needed — this was already correct

**Resend/GoDaddy confirmed closed**
- mpgink.com domain already configured in Resend (Matthew confirmed)

### Decisions made
- Discord deferred — not needed for small beta, revisit if volume warrants
- Privacy policy as modal (not route) — app has no react-router, modal is correct pattern
- Privacy link intentionally subtle (low contrast) — present for compliance, not prominence

---

## Session: 2026-06-13 (evening)

### What shipped

**Sentry + Posthog integration (client-side, keys-pending)**
- `client/package.json` — added `@sentry/react` ^8.0.0 and `posthog-js` ^1.143.0
- `client/src/analytics.js` — new module: Posthog init, identifyUser, resetIdentity, track(), and `Analytics` named-event object covering tabs, auth, scorecard, audio, Ebenezer, tour, profile, shop, feedback, community
- `client/src/main.jsx` — Sentry init (DSN from VITE_SENTRY_DSN env var), Posthog init, Sentry ErrorBoundary wrapping entire app, retro "EBENEZER IS FROZEN" fallback UI, Sentry.withProfiler on App
- `client/src/App.jsx` — wired Analytics calls: tabViewed on tab change, loginSuccess/registered on auth, loggedOut + resetIdentity on logout, scorecardOpened on rate show, identifyUser on auto-login, tourStarted on onboarding complete, ebenezerOpened('drawer') on drawer open

**Resend/GoDaddy confirmed**
- phreezer.mpgink.com subdomain already configured — mpgink.com Resend domain is live (Matthew uses it for another app)
- Removed from open debt

### Decisions made
- Both Sentry + Posthog are no-op when env vars are absent — no errors in dev, keys just aren't set yet
- Posthog: explicit tracking only (autocapture off) — cleaner signal, less noise
- Posthog person profiles: identified_only — no anonymous bloat
- Sentry replay: 10% of sessions, 100% of error sessions — cost-efficient
- Sentry tracing: 20% sample rate — enough for perf data without burning quota
- Sentry strips Authorization headers from error payloads before send

---

## Session: 2026-06-13

### What shipped

**Rate Limiting**
- /api/auth/login — 10 attempts/15min per IP
- /api/auth/register — 5 attempts/60min per IP
- Shared _ratelimit.js module (in-memory Map, cleans expired entries)
- Mike Says No screen (present tense) for 429 — separate from Mike Said No (email verification)

**Email System**
- _email.js — shared Resend sender + all 5 HTML templates, Uncle Ebenezer voice
- Onboarding email — fires after email verification via verify-email.js trigger
- Day 3 nudge, Day 7 engage, Day 30 re-engage, milestone (5/25/50) emails
- Daily cron at 2pm UTC — email-cron.js checks all conditions, fires what's due
- email_log table — idempotency, prevents duplicates
- All from: Phreezer Support <phreezer.support@mpgink.com>
- Ebenezer voice: jaded vet, loving underneath, "don't suck at Phish" in every signoff

**Onboarding Tour**
- TourGuide.jsx v4 — centered modal, no DOM targeting, works on mobile
- 9 steps: Ebenezer intro → Scorecard → My Shows → OTD → Deep Phreeze → Community → Ebenezer → Profile → outro
- Each step: large glyph hero, subtitle, title, body, animated progress dots
- Server-side tour_completed flag on users table
- Admin RESET TOUR button — no confirm needed, fires immediately
- Fires after all three onboarding paths (import, scorecard, skip)

**Shop + Donations**
- ShopTab content moved into ProfileModal as 4th tab (MY PHISH / BADGES / ABOUT / SHOP)
- 3 Etsy listings: t-shirt ($23.99+), logo sticker ($11.99+), DSAP sticker ($8.99+)
- DonationCard in Shop tab — live Mockingbird total
- Mockingbird banner in Community tab — dollar total + items sold
- donation_tracker table — single row, lazy-created, $1.00/item
- Admin DONATIONS tab — cumulative items sold input, auto-calculates total
- Etsy OAuth integration built: api/etsy/auth.js, callback.js, sync.js — pending app review
- Listing IDs: 4521118995, 4521116067, 4521316287

**AI Usage Logging**
- _ai_usage.js — shared logger, PRICING map (Sonnet 4.6, Haiku 4.5), cost estimation
- ebenezer.js and summarize.js both log after every call (fire and forget)
- ai_usage_log table — user_id, feature, model, input/output tokens, cost_usd
- api/admin/ai-usage.js — totals, by feature, by model, last 30 days, recent 20 calls
- Admin AI USAGE tab with full dashboard

**Admin**
- External API health tab — probes Phish.net, Phish.in, Anthropic, Resend
- 401/403 from external = alive (service up, auth rejected)
- RESET TOUR button in user row
- DONATIONS tab
- Loading text fixed: "LOADING..." not "LOADING USERS..."
- Clear Data now deletes from user_show_attendance (Albany show bug fixed)
- Delete User also deletes user_show_attendance

**Audio**
- api/audio/stream.js — server-side proxy for Phish.in MP3s, CORS bypass
- Supports Range headers for seeking
- InlineAudioPlayer.jsx — expandable drop-down below song row
- Play/pause, scrubber with glowing dot, seek, current/total time, "via phish.in" credit
- One active player at a time — tap another ▶ closes current
- ▶ button turns cyan when active
- fadeIn animation on expand

**Profile / About**
- ihoz.com / Phishtistics origin story added to About tab
- Links to http://www.ihoz.com/PhishStats.html
- Excel → website → app journey documented
- SHOP tab added to ProfileModal

**Ebenezer**
- System prompt rewritten — "jaded veteran... genuine love for this band and community"
- Never mean, never dismissive of newer fans
- 3.0 acknowledged as producing great shows
- Signs off with personality

**UX**
- Avatar pulse — cyan to orange/red glow, 2s loop, resets on every login
- Stops when user taps profile for first time in session
- profileTapped state resets in handleAuthSuccess and JWT auto-login

**Forum Post**
- Full Phish.net community post drafted and approved
- Credits ihoz.com as inspiration
- Mentions Phish.net foundation, Phish.in recording access, Vibe Check, Ebenezer
- CTA: "Sign up... tell me what's good and what sucks"
- Closes: "Don't suck at Phish."

### Decisions made
- Tour moved from spotlight/DOM approach to centered modal — mobile compatibility
- Shop moved from sidebar/nav to ProfileModal — low-frequency feature, cleaner nav
- About stays in ProfileModal — same reasoning
- Donation tracker manual for now, Etsy OAuth ready to activate on approval
- $1 flat per item (not percentage) — simple, clear, communicable
- Tour state server-side not localStorage — admin can reset it
- Ebenezer: "loving jaded vet" not pure cynic — warmth underneath the weariness

### Known issues / open debt
- Etsy OAuth pending app review — 1-3 business days
- Phish.net profile import needs buddy UAT
- Tour guide needs full end-to-end UAT after admin reset
- phreezer.mpgink.com subdomain not configured in GoDaddy for Resend
