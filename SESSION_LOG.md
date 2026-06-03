# Phishow Scorecard — Session Log

## Session 5 — June 2, 2026 (evening)
**Status**: Active bug fixing. Search/UX overhaul in progress.

---

### What Was Done

**Bug fixes shipped this session:**

- vercel.json: added missing routes for /api/random-show and /api/audio/:date (root cause of both failures)
- Search: replaced floating dropdown with inline results list (no more scroll-select problem)
- Search: added year-button strip (1983–present) for easy browsing by year
- Search: removed broken date normalizer, minimum 2 chars before searching
- My Shows cards: restructured layout — date/venue/city left, score right, links bottom row
- My Shows cards: bigger fonts, display font for date and score
- Permalink doubling: fixed — was prepending PNET/setlists/ to a URL that already had it
- Show notes: collapsible by default (SHOW NOTES ▼ EXPAND toggle)
- Attendance selector: 3-button (ATTENDED/WEBCAST/LISTENED), saves to user_show_attendance table
- Mike Says No: now shows full API error detail, 8s auto-dismiss
- user/shows.js: fixed ISO timestamp — TO_CHAR(show_date, 'YYYY-MM-DD') so links work correctly
- shows/[date].js: defensive review field mapping (r.author||r.username||r.uid), score normalization (>5 halved), posted date stripped to YYYY-MM-DD
- random-show.js: AbortSignal.timeout, verbose error chain, date.slice(0,10)
- Save Ratings button: locked after first save (shows ✓ RATINGS SAVED), resets on new show load

---

### Known Issues / Open
- Random show: may still fail if phish.in and phish.net both time out — error now shows in Mike Says No with full detail
- Song ▶ play links and duration: depends on phish.in having audio for that show (~80-90% coverage)
- Review scores: phish.net v5 score scale still not 100% confirmed — normalized defensively
- Phish.net handle: removed from submit UI, will live on profile page (Week 2)

---

### Next Session (Week 2 priorities)
- [ ] Sign-in welcome animation
- [ ] Profile page (bio, Phish.net handle, Buy Me a Coffee)
- [ ] Phish.net attended shows import
- [ ] Show detail page from My Shows
- [ ] Show comments (per-show, light, moderated)
- [ ] Notable links hub
- [ ] Continue random show debugging if still broken

### Architecture
All routes now registered in vercel.json. Credentials in Vercel env + Claude memory.
