# SESSION LOG

## Session: 2026-06-16

### Completed
- Fixed Phriend Overlap `show_date?.slice` TypeError (cast to ::text in SQL)
- Fixed "phreek" → "phan" in feed compose placeholder
- Improved feed text contrast (compose button opacity, username color)
- Built Companion system (show_companions table, POST/GET API, mutual detection)
- Phriend Overlap UI — + COMPANION button per show, ◈ COMPANION marked state, ❄ MUTUAL locked state
- Fixed Phriend Overlap venue data — fallback to attendance table via DISTINCT ON
- Added tap-to-rate from Phriend Overlap (onRateShow threaded through)
- Removed KPI duplication in Phriend Overlap results
- Bigger fonts and redesigned show card in Phriend Overlap
- Fixed EbenezerRail — auth gate for desktop (logged-out users don't see rail)
- Built DesktopLanding component — hero page for logged-out desktop users
- Sidebar redesign — hide auth-required items when logged out, prominent CREATE ACCOUNT/LOGIN CTAs
- Desktop content width fix — removed centering constraint, full-width main area
- Ebenezer rail wrapper fixed (flexShrink:0 not flex:1, eliminates dead space when logged out)
- ShowSlotMachine component — three-reel (YEAR/MONTH/DAY) animation on RANDOM SHOW press
- Scorecard — browse without login (setlists load unauthed), auth gate on star/submit
- Era filter buttons replacing year/month dropdowns
- Fixed unescaped apostrophes in DesktopLanding (build error)
- DesktopLanding as own 'home' tab (not tied to scorecard)
- Fixed missing selectedDow useState (was crashing scorecard with Ebenezer frozen error)
- Added sidebar logo click → home navigation for logged-out users
- Pinned Ebenezer post system (pinned column, author_label, seed endpoint, feed badge)
- Desktop logo updated from Canva (white text version)
- Snowflake asset updated from Canva full logo
- Filter system complete rewrite: ERA/YEAR/MONTH/DAY/DOW stacked, all independent, proper colors
- Fixed filter setState-during-render crash
- Fixed __filter__ leaking into search input
- Show masthead desktop data panel (review count, raters, phriends, your score)
- CLEAR ALL filter button with live match count

### Open / Pending
- Seed Ebenezer pinned post (run from console while logged in as mpgink)
- Fix Sentry DSN (VITE_SENTRY_DSN env var has wrong org ID in Vercel)
- Mike Said No vs Ebenezer boundary — investigate why non-API errors hit Ebenezer
- Rate limiting on auth endpoints (still top security priority)
- iOS Safari UAT pass
- Phish.net community forum post (drafted, not yet published)
- Email triggers (welcome, onboarding, reminders)
- GoDaddy DNS for phreezer.mpgink.com subdomain in Resend
