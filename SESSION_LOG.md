# Phishook Scorecard — Session Log

## Session 6 — June 3, 2026
**Status**: UAT complete. Sidebar shipped. Brand/name direction locked. Logo in progress.

---

### What Was Done

**UAT — all 5 items from Session 5 verified:**
- ✓ Spinner glitch fixed (300ms delay before showing, year buttons bypass entirely)
- ✓ Year filter working — mobile and desktop, 2002/2003 NYE tour bleed eliminated
- ✓ Phish.net + Reviews merged into one button: "PHISH.NET SETLIST + REVIEWS (N)"
- ✓ Relisten URL correct — direct show page. Mobile app intercept is Relisten's bug, not ours
- ✓ Desktop sidebar rendering and toggle working (after CSS deduplication fix)

**CSS cleanup:**
- index.css was 2969 lines with 3x duplication from session append pattern
- Rebuilt clean from scratch: 460 lines, no duplicates, sidebar integrated properly
- Root cause of sidebar not rendering was CSS specificity conflicts from duplicate blocks

**Desktop sidebar — Stage 1 shipped:**
- Left sidebar replaces horizontal tab nav on desktop
- Collapsed (52px icon-only) / Expanded (220px with labels) via click toggle
- Toggle moved outside `<aside>` as a protruding tab (sidebar-wrapper + sidebar-tab pattern) — fixes Firefox overflow:hidden clipping the click
- Sections: MY PHISH (Scorecard, My Shows, Analytics), COMMUNITY (shell, SOON badges), LINKS (placeholder)
- User avatar + username + logout at bottom
- Login/Register when not authed
- Mobile: completely unchanged — original header + tab nav still in place
- Placeholder logo glyph ⟁ in sidebar — to be replaced with real Phishook logo

**App name change — decided, not yet implemented:**
- App renamed from "Phishow Scorecard" to **Phishook**
- Phishow conflicts with phishows.com (existing community site)
- Phishook = fish + hook, works on every level, no conflicts found
- Subdomain: **phishook.mpgink.com** — uses existing mpgink.com domain, no new registration needed
- Name change not yet applied to codebase — do in next session as part of logo pass

**Brand/logo direction locked:**
- Reference fish: clean minimal line art, similar to teal fish image provided (rounded body, V-fork tail, dorsal spike, simple eye)
- Reference hook: classic J-hook with barb and straight shank, orange on dark
- Concept: fish + hook as icon mark, PHISHOOK wordmark in Orbitron, "DON'T SUCK AT PHISH" tagline
- Two assets: (1) icon/favicon = fish + hook combined, (2) full lockup = icon + wordmark + tagline
- Matthew is generating final logo assets externally — will provide finished file next session
- SVG in-chat rendering hit payload size limit — don't attempt base64 image embedding in widget tool

**Score comparison — open item:**
- Phish.net shows community ratings (e.g. 4.379/5) vs our per-song ratings (e.g. 2.25)
- Decision: drop score from the merged button entirely, just show count
- Future feature: show our score vs phish.net score side by side in show masthead — designed but not built

---

### Known Issues / Open Debt
- Score confusion: .net ratings scale vs our song-by-song ratings — surface in masthead (not built)
- Relisten mobile app drops to home screen on deep links — Relisten's bug, documented
- Search on mobile still clunky — parked for dedicated session
- Sidebar toggle tab sizing/polish — functional but rough visually, refine with logo pass
- How To Use panel: on mobile stays where it is; hamburger/bottom nav option deferred

---

### Next Session Priorities
1. **Logo integration** — Matthew provides final fish+hook asset, drop into sidebar replacing ⟁ glyph
2. **Full rename pass** — "Phishow Scorecard" → "Phishook" everywhere (title tag, header, instructions, SESSION_LOG, INSTRUCTIONS.md)
3. **Subdomain setup** — phishook.mpgink.com CNAME → Vercel (Matthew does DNS, we verify)
4. **Score comparison** — our rating vs phish.net rating in show masthead
5. **AI Show Summary** — on-demand Claude API call on show detail, gated behind auth
6. **Community tab shell** — real layout with placeholders, pulls actual user rating data we have
7. **Profile page** — bio, Phishook handle, Buy Me a Coffee

### Architecture Notes
- Sidebar uses sidebar-wrapper + sidebar-tab pattern (toggle outside aside) — required for Firefox overflow:hidden fix
- CSS must NOT be appended — always rebuild clean. Last clean version: 460 lines
- Desktop = desktop-layout (flex row, sidebar + main-area). Mobile = mobile-layout (hidden on desktop)
- Claude Code recommended for next session — eliminates GitHub API roundtrip friction
- Context window gets long fast — start fresh each session, SESSION_LOG is the handoff

### Credentials (in Claude project memory, not here)
- GitHub token: session-only, provided fresh each time
- Vercel, Neon, Resend: in project memory
