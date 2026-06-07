# SESSION LOG — Phreezer

## Session: 2026-06-07

### Shipped
- Full monolith refactor: App.jsx (4,424 lines) -> 26 component files in client/src/components/
- Mock design: compact ShowCard, KPICards with IMPORT in header, MyShowsTab cleanup
- Sub-nav fix: flex-shrink:0 so tabs scroll instead of truncate
- ShowCard: expand restored with placeholder for unrated shows, action bar always visible
- Heatmap: HEATMAP_POS and hmColor constants restored (missing, caused black screen on MyVenues/MyStates/MySongs)
- Vibe Check: server-side AI synthesis via api/ai/summarize.js (Haiku)
- Vibe Check: structured JSON (overall, themes, sentiment badge FIRE/SOLID/MIXED/SLEEPER)
- Vibe Check: caching in vibe_checks table (auto-creates), GET cache + POST generate+store
- Vibe Check: review field fixed (review_text not review), all reviews returned not just 3
- Vibe Check: added to ScorecardTab on every show load
- ScorecardTab: hides search/instructions when pre-loading a show via RATE button
- Uncle Ebenezer: floating AI agent (snowflake button, orange glow, bottom-right, every tab)
  - api/ai/ebenezer.js: pulls user show history from DB, 10-turn fading memory, Claude Sonnet
  - EbenezerDrawer.jsx: slide-up drawer, suggestion prompts, CLEAR, session memory
- Security review completed (see below)

### Next session priorities
- Confirm Ebenezer works end-to-end (check localStorage token key is phreezer_token)
- Confirm Vibe Check renders correctly with real review text
- Implement security backlog (see below) -- do rate limiting first
- COMMUNITY tab still placeholder
- Phishook/Phreezer rename + logo not yet applied

### Key learnings
- Phish.net v5 review field: review_text (not review)
- Haiku wraps JSON in markdown fences despite instructions -- always strip + harden prompt
- HEATMAP_POS must live in Heatmap.jsx -- cannot rely on monolith scope
- Never touch files with string manipulation for deploy triggers
- DB connection times out from bash_tool -- use auto-create pattern instead
- Claude Haiku for Vibe Check (fast/cheap), Claude Sonnet for Ebenezer (needs to reason)

---

## SECURITY BACKLOG

### What is solid right now
- Passwords: bcrypt hashed, cost factor 10. Never stored plain text. Correct.
- Login: returns same error message for bad email and bad password -- does not leak which one is wrong. Correct.
- JWTs: signed with JWT_SECRET env var, 30-day expiry. Correct.
- HTTPS: enforced by Vercel automatically. Correct.
- DB credentials + API keys: in Vercel env vars, not in repo. Correct.
- SQL: using parameterized queries throughout (_db.js pattern). Not vulnerable to SQL injection. Correct.

### Priority 1 -- Rate limiting on auth endpoints (do this first)
- Problem: no limit on login or register attempts. Someone can brute-force passwords or spam account creation.
- Fix: install express-rate-limit or use upstash/ratelimit (works with Vercel edge).
  Simple version: track attempts by IP in memory or a redis store.
  Suggested limits: 10 login attempts per IP per 15 minutes, 5 register attempts per IP per hour.
- Files to touch: api/auth/login.js, api/auth/register.js
- Effort: ~1 hour

### Priority 2 -- One account per email (enforce + fraud detection)
- Problem: email uniqueness is checked at register but there is no email verification.
  Someone can create 50 accounts with fake emails like fake1@gmail.com, fake2@gmail.com.
- Fix part A -- email verification:
  Use Resend (already integrated -- re_aPxWcAKa_59QDytBpxDobhnqBZjVXtqXp) to send a
  verification email on register. Add email_verified boolean and verification_token to users table.
  Block login until verified. Token expires in 24 hours.
- Fix part B -- disposable email detection:
  Check the domain against a blocklist of known disposable email providers
  (mailinator.com, tempmail.com, guerrillamail.com, etc -- list of ~2000 domains available as npm package).
  Reject registration from those domains.
- Fix part C -- duplicate detection beyond email:
  On register, also check for same username variations (case-insensitive).
  Consider flagging accounts that register within seconds of each other from same IP.
- Files to touch: api/auth/register.js, api/auth/verify.js (new), users table (add email_verified, verification_token, verification_expires)
- Effort: ~3 hours

### Priority 3 -- Lock down admin endpoint
- Problem: /api/admin/migrate has no auth check. Anyone who knows the URL can POST and run migrations.
- Fix: add verifyToken check + is_admin check at top of migrate.js, same pattern as other admin routes.
- Files to touch: api/admin/migrate.js
- Effort: 15 minutes

### Priority 4 -- JWT hardening
- Current: 30-day expiry, no refresh token, no revocation mechanism.
  If a token is stolen it works for up to 30 days with no way to invalidate it.
- Fix: shorten to 7-day expiry + add a refresh token flow, OR add a token_version column
  to users table and increment on password change/logout so old tokens become invalid.
- Effort: ~2 hours, medium complexity

### Priority 5 -- API key exposure in client
- The Phish.net API key is used server-side (correct) but double-check no API keys
  are being imported into any client/src/ file. Vite will bundle them into the JS payload.
- Quick check: grep -r "process.env" client/src/ -- should return nothing.
- Effort: 10 minutes to verify

### Not a concern for this app at current scale
- DDOS protection: Vercel handles this at the edge
- XSS: React escapes by default, no dangerouslySetInnerHTML usage observed
- CSRF: stateless JWT auth is not vulnerable to CSRF
