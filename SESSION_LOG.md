# Session Log — Phreezer

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

### Next session priorities
1. Etsy OAuth activation (once approved)
2. Phish.net import UAT + username pre-fill confirm
3. Desktop logo when Matthew delivers Canva version
4. Phish Phreeze community subtab
5. Any beta user feedback after forum post



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

### What Matthew needs to do (desktop, ~10 min)
1. Create Sentry account → new project (React) → copy DSN → add as `VITE_SENTRY_DSN` in Vercel env vars
2. Create Posthog account → new project → copy API key → add as `VITE_POSTHOG_KEY` in Vercel env vars
3. Redeploy (or push any change) — both activate automatically

### Known issues / open debt
- Etsy OAuth pending app review
- Tour guide UAT needed end-to-end
- Posthog: EbenezerRail open not yet tracked (rail open/close is in Sidebar component — low priority)
- Posthog: ratingSubmitted not yet wired (fires from ScorecardTab — next session if needed)

### Next session priorities
1. Posthog/Sentry activation once Matthew adds keys
2. Etsy OAuth activation (once Etsy approves)
3. Phish.net import UAT
4. Phish Phreeze community subtab
5. Any beta feedback after forum post
