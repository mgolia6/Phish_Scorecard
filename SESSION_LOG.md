# Phishow Scorecard — Session Log

## Session 4 — June 2, 2026
**Status**: Active development. Week 1 of July 4 roadmap underway.

---

### What Was Done

**Roadmap established:**
- Full workback schedule to July 4 launch created (ROADMAP.md in repo)
- Phish summer tour starts July 7 — posting on .net ~June 16
- 4-week plan with clear weekly themes

**Week 1 features shipped (this session):**

**UX fixes:**
- Autocomplete search: type-ahead with 300ms debounce, dropdown on input, closes on outside tap, no search button needed
- Future shows (date > today) filtered out of all result lists
- Star ratings replaced with 1–5 tap buttons: bigger targets, clear feedback, tap same number to deselect
- "NOT PART OF A TOUR" filtered from tour name display in results
- Search spinner (◈ rotating) while fetching

**Error/feedback:**
- Mike Says No: all errors now trigger a full-screen red modal with shake animation. Tap anywhere to dismiss. 5s auto-dismiss.
- Dopamine save animation: 18 particles burst upward (orange/cyan/green glyphs), "RATINGS LOCKED IN" + "DON'T SUCK AT PHISH" center display. 2.8 seconds.

**Links fixed:**
- PhishTracks replaced with Relisten everywhere (scorecard + My Shows)
- Phish.in link added to My Shows cards

**phish.in API integration:**
- New serverless endpoint: `api/audio/[date].js` — proxies phish.in v2, returns per-track { title, mp3_url, duration, likes, position }
- No API key needed on GET requests. Caches 6 hours. Fails gracefully (audio is enhancement, never blocks)
- Per-song ▶ play button in song rows — links to direct mp3_url
- Song duration (MM:SS) displayed next to song name (hidden on mobile to save space)
- "◉ AUDIO AVAILABLE VIA PHISH.IN" badge on show masthead when audio found
- phish.in attribution added to scorecard footer
- Audio loads in parallel with setlist (no extra wait)

**Random Show button:**
- New serverless endpoint: `api/random-show.js` — hits phish.in random-show, falls back to picking random past show from phish.net cache
- "⚄ RANDOM SHOW" button below search input, dashed cyan border
- Loads the show directly (no extra click)

---

### Architecture (updated)
```
/api/
  audio/[date].js     NEW — phish.in proxy, per-track mp3 + duration
  random-show.js      NEW — random show via phish.in + phish.net fallback
  shows/index.js      recent 20 + search (future shows filtered server-side too)
  shows/[date].js     full show + setlist + reviews
  ratings/[showDate].js
  user/shows.js
  analytics/songs.js, venues.js
ROADMAP.md            NEW — July 4 launch plan
```

---

### Known Issues / Next Session (Week 2)
- [ ] phish.in may block some show dates (403/404) — fails gracefully, no audio shown
- [ ] Attendance type field (attended / webcast / after the fact) — not yet built
- [ ] Sign-in welcome animation
- [ ] Profile page + Buy Me a Coffee
- [ ] Phish.net attended shows import
- [ ] Show detail from My Shows
- [ ] Show comments (per-show, moderated)
- [ ] Notable links hub

### Decisions Made
- phish.in v2 API: no key required for GET requests. Server blocks direct hits from this dev environment but Vercel serverless works fine. Confirmed via community code examples.
- Audio is always non-blocking — if phish.in fails, show still loads normally
- Random show: phish.in first (cleaner), phish.net as fallback (reliable)
- ROADMAP.md committed to repo so it persists across sessions

### Env Vars / Credentials
All in Claude memory and Vercel dashboard. Not in repo.
