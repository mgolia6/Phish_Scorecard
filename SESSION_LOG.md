# Phishow Scorecard — Session Log

## Session 3 — June 2, 2026 (continued)
**Status**: Live on Vercel. Core feature set complete. Awaiting feedback.

---

### What Was Done

**Infrastructure (completed this session):**
- Neon Postgres provisioned, connected to Vercel, all POSTGRES_* env vars auto-injected
- DB schema run against Neon — tables users, shows, ratings all created with indexes
- Fixed 3 successive Vercel build failures (vite PATH, devDependencies, framework detection)
- App is live and fully deployed

**API layer expanded:**
- `api/shows/[date].js` — now pulls ALL available Phish.net fields: showid, permalink, tour_name, tourid, setlist_notes, soundcheck, isjamchart, isreprise, trans_mark, footnote, slug, position. Also fetches reviews in parallel.
- `api/shows/index.js` — pre-populates with 20 most recent shows on load (no search needed), includes tour_name and permalink in response

**Full UI overhaul (App.jsx + index.css):**
- Marquee simplified to just "DON'T SUCK AT PHISH" on loop
- Search pre-populates with recent 20 shows immediately on load
- Collapsible instructions panel (collapsed by default)
- Show date formatted as "Jan 12, 1999" instead of raw YYYY-MM-DD
- Show masthead: formatted date, venue, city, tour name
- External links: Phish.net setlist, PhishTracks audio stream, community review count + avg score
- Soundcheck displayed when available
- Setlist notes from Phish.net rendered under masthead
- Song rows rebuilt: position number, song name links to phish.net/song/[slug], JAM badge (cyan) for jam chart songs, REPRISE badge, footnote badge with tooltip, segue indicators (> soft, --> hard segue)
- Star ratings (1-5 click with hover preview) replacing dropdown selects
- Per-song notes field
- Set score bars — animated progress bar per set with average rating
- Overall show score — large display number + star glyph string
- Phish.net handle field (persists in localStorage, links to profile page)
- Community reviews — top 3 previewed inline, link to all on Phish.net
- Phish.net attribution footer (API requirement)
- My Shows — audio link per show to PhishTracks
- Analytics — song names link to Phish.net song pages
- Full responsive mobile CSS for all new components

**Credentials secured:**
- GitHub token saved to Claude memory
- Neon Postgres URLs saved to Claude memory
- Vercel API key saved to Claude memory
- Resend API key saved to Claude memory
- Removed all credentials from project instructions

---

### Current State
App is live. Matthew has registered an account and confirmed ratings save successfully. Full feature set deployed and awaiting feedback.

---

### Known Debt / Next Session
- [ ] Feedback from Matthew on UI/UX after review
- [ ] Song duration not available from Phish.net — placeholder or skip
- [ ] Show detail page from My Shows (click a show to see song breakdown)
- [ ] Favorite/star a show
- [ ] Global leaderboard / community ratings
- [ ] Jam chart filter in setlist view
- [ ] Tour grouping in My Shows
- [ ] Export ratings to CSV
- [ ] Mobile polish pass after feedback
- [ ] Verify PhishTracks URL format works for all shows
- [ ] Test reviews endpoint on shows that actually have reviews

---

### Architecture (current, stable)
```
/
├── api/
│   ├── _db.js
│   ├── _auth.js
│   ├── auth/register.js, login.js, me.js
│   ├── shows/index.js         recent 20 + search
│   ├── shows/[date].js        full show + setlist + reviews
│   ├── ratings/[showDate].js  GET + POST
│   ├── user/shows.js
│   └── analytics/songs.js, venues.js
├── client/src/
│   ├── App.jsx                full feature set
│   └── index.css              complete design system
├── init-db.sql
├── package.json
└── vercel.json
```

### Env Vars
All in Vercel dashboard. Credentials in Claude memory — do not put in project instructions or this file.
