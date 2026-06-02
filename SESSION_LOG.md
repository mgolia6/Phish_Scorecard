# Phishow Scorecard — Session Log

## Session 2 — June 2, 2026
**Status**: Vercel-native rebuild complete. DB schema pending run. Not yet deployed.

---

### What Was Done

**Tore out:**
- `server.js` — deleted (Express won't work on Vercel serverless)
- `style.css` — deleted (stale, replaced)
- Old `vercel.json` — deleted and rewritten

**Built from scratch:**
- `api/_db.js` — shared Postgres pool helper using `POSTGRES_URL`
- `api/_auth.js` — JWT verify + CORS helper
- `api/auth/register.js` — user registration
- `api/auth/login.js` — login with bcrypt
- `api/auth/me.js` — token verification / session restore
- `api/shows/index.js` — Phish.net show search (uses `PHISH_NET_API_KEY`)
- `api/shows/[date].js` — single show + setlist from Phish.net
- `api/ratings/[showDate].js` — GET and POST ratings (auth required)
- `api/user/shows.js` — user's rated shows with avg rating
- `api/analytics/songs.js` — top rated songs across all users
- `api/analytics/venues.js` — top venues by avg rating
- `vercel.json` — full rewrite with correct build/output/rewrites config
- `package.json` (root) — backend deps only (bcryptjs, jsonwebtoken, pg)
- `client/package.json` — frontend deps only (react, vite)
- `client/vite.config.js` — removed Express proxy, kept for local dev
- `client/src/App.jsx` — full rewrite: fixed stale axios token bug, fixed ratings submission bug, proper set grouping, jam chart indicators, notes per song, session restore on load
- `client/src/index.css` — full retro-modern redesign: Orbitron + Share Tech Mono fonts, scanline overlay, glow effects, animated header, scrolling marquee, full component system

**Bugs fixed from Manus build:**
- Stale axios token (was captured at mount, now reads from localStorage at call time)
- Ratings submission missing song names (rebuilt from scratch with correct data structure)
- No Phish.net API key in requests (now uses `PHISH_NET_API_KEY` env var)

**Infrastructure:**
- Neon Postgres provisioned and connected to Vercel project
- All POSTGRES_* env vars auto-injected by Neon into Vercel
- JWT_SECRET and PHISH_NET_API_KEY already in Vercel env vars

---

### What's Blocking Deploy

**DB schema has not been run yet.**

The tables (`users`, `shows`, `ratings`) do not exist in Neon yet.
Schema is in `init-db.sql` — needs to run once against the Neon database.

Next session has `POSTGRES_URL` in project instructions and can run the schema directly via psycopg2.

---

### Next Session — Do This First

1. Read `POSTGRES_URL` from project instructions
2. Run `init-db.sql` against Neon using psycopg2
3. Verify tables exist
4. Check Vercel deploy status (should have auto-triggered from the pushes)
5. Hit the live URL and test: register, search a show, rate songs, check My Shows + Analytics
6. Debug whatever breaks (first deploy always has something)

---

### Architecture (current)

```
/
├── api/
│   ├── _db.js               shared pool
│   ├── _auth.js             JWT + CORS helpers
│   ├── auth/
│   │   ├── register.js
│   │   ├── login.js
│   │   └── me.js
│   ├── shows/
│   │   ├── index.js         search
│   │   └── [date].js        setlist
│   ├── ratings/
│   │   └── [showDate].js    GET + POST
│   ├── user/
│   │   └── shows.js
│   └── analytics/
│       ├── songs.js
│       └── venues.js
├── client/
│   ├── src/
│   │   ├── App.jsx          full rewrite
│   │   ├── index.css        retro-modern design system
│   │   └── App.css          minimal
│   ├── vite.config.js
│   └── package.json
├── init-db.sql
├── package.json
└── vercel.json
```

### Env Vars in Vercel (all present)
- `POSTGRES_URL` — Neon connection string (pooled)
- `POSTGRES_URL_NON_POOLING` — for migrations if needed
- `JWT_SECRET` — auth signing key
- `PHISH_NET_API_KEY` — Phish.net v5 API
- `NODE_ENV` — production

### Known Debt / Future Features
- [ ] Show detail page (click a show in My Shows to see song-by-song breakdown)
- [ ] Global leaderboard / community ratings
- [ ] Jam chart filter in setlist view
- [ ] Tour grouping in My Shows
- [ ] Export ratings to CSV
- [ ] User profile page
- [ ] Mobile polish pass
