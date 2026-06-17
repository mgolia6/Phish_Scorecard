import { getPool } from '../_db.js';
import { cors, verifyToken } from '../_auth.js';

const PHISH_NET_KEY = process.env.PHISH_NET_API_KEY;
const PNET = 'https://api.phish.net/v5';

function getEra(showDate) {
  const year = parseInt((showDate || '').slice(0, 4));
  if (year >= 1983 && year <= 1994) return 'arenas';
  if (year >= 1995 && year <= 1997) return 'peak';
  if (year >= 1998 && year <= 2000) return 'jamming-maturity';
  if (year >= 2001 && year <= 2004) return 'wilderness';
  if (year >= 2009 && year <= 2014) return 'comeback';
  if (year >= 2015) return 'modern';
  return 'other';
}

async function pnetFetch(endpoint, params = {}) {
  const qs = new URLSearchParams({ apikey: PHISH_NET_KEY, ...params }).toString();
  const res = await fetch(`${PNET}/${endpoint}.json?${qs}`);
  if (!res.ok) throw new Error(`Phish.net ${endpoint} returned ${res.status}`);
  const data = await res.json();
  return data?.data || [];
}

// ── Schema setup ────────────────────────────────────────────
async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_songs (
      slug VARCHAR(255) PRIMARY KEY,
      song_name VARCHAR(255) NOT NULL,
      times_played INTEGER DEFAULT 0,
      debut_date DATE,
      last_played DATE,
      gap INTEGER DEFAULT 0,
      abbr VARCHAR(32),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_shows (
      show_date DATE PRIMARY KEY,
      venue VARCHAR(255),
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255),
      tour_name VARCHAR(255),
      era VARCHAR(32),
      song_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_longest_jams (
      id SERIAL PRIMARY KEY,
      show_date DATE NOT NULL,
      song_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      duration_seconds INTEGER,
      duration_label VARCHAR(32),
      era VARCHAR(32),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(show_date, song_name)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_debuts (
      slug VARCHAR(255) PRIMARY KEY,
      song_name VARCHAR(255) NOT NULL,
      debut_date DATE,
      debut_venue VARCHAR(255),
      debut_city VARCHAR(255),
      debut_state VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_teases (
      id SERIAL PRIMARY KEY,
      show_date DATE NOT NULL,
      teased_song VARCHAR(255),
      in_song VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(show_date, teased_song, in_song)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_reviews (
      id SERIAL PRIMARY KEY,
      show_date DATE NOT NULL,
      score NUMERIC(3,1),
      review_text TEXT,
      era VARCHAR(32),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pn_reviews_show_date ON pn_reviews(show_date)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pn_reviews_score ON pn_reviews(score DESC)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pn_guests (
      id SERIAL PRIMARY KEY,
      show_date DATE NOT NULL,
      guest_name VARCHAR(255),
      instrument VARCHAR(255),
      song_name VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(show_date, guest_name, song_name)
    )
  `);

  // Full-text index on reviews for keyword search
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_pn_reviews_fts
    ON pn_reviews USING gin(to_tsvector('english', coalesce(review_text,'')))
  `);
}

// ── Seeders ─────────────────────────────────────────────────

async function seedSongs(pool) {
  const songs = await pnetFetch('songdata');
  let upserted = 0;
  for (const s of songs) {
    try {
      await pool.query(`
        INSERT INTO pn_songs (slug, song_name, times_played, debut_date, last_played, gap, abbr)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (slug) DO UPDATE SET
          song_name=EXCLUDED.song_name, times_played=EXCLUDED.times_played,
          debut_date=EXCLUDED.debut_date, last_played=EXCLUDED.last_played,
          gap=EXCLUDED.gap, abbr=EXCLUDED.abbr, updated_at=NOW()
      `, [
        s.slug, s.song || s.songname,
        parseInt(s.times_played) || 0,
        s.debut || null,
        s.last_played || null,
        parseInt(s.gap) || 0,
        s.abbr || null,
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'songs', count: upserted, total: songs.length };
}

async function seedShows(pool) {
  const shows = await pnetFetch('shows');
  let upserted = 0;
  for (const s of shows) {
    try {
      await pool.query(`
        INSERT INTO pn_shows (show_date, venue, city, state, country, tour_name, era)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (show_date) DO UPDATE SET
          venue=EXCLUDED.venue, city=EXCLUDED.city, state=EXCLUDED.state,
          country=EXCLUDED.country, tour_name=EXCLUDED.tour_name, era=EXCLUDED.era, updated_at=NOW()
      `, [
        s.showdate,
        s.venue, s.city, s.state, s.country,
        s.tour_name || s.tourname || null,
        getEra(s.showdate),
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'shows', count: upserted, total: shows.length };
}

async function seedLongestJams(pool) {
  const jams = await pnetFetch('longestjams');
  let upserted = 0;
  for (const j of jams) {
    try {
      const durationSec = j.duration ? Math.round(parseFloat(j.duration) * 60) : null;
      const mins = j.duration ? Math.floor(parseFloat(j.duration)) : null;
      const secs = j.duration ? Math.round((parseFloat(j.duration) % 1) * 60) : null;
      const label = mins != null ? `${mins}:${String(secs).padStart(2,'0')}` : null;
      await pool.query(`
        INSERT INTO pn_longest_jams (show_date, song_name, slug, duration_seconds, duration_label, era)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (show_date, song_name) DO UPDATE SET
          duration_seconds=EXCLUDED.duration_seconds, duration_label=EXCLUDED.duration_label,
          slug=EXCLUDED.slug, era=EXCLUDED.era, updated_at=NOW()
      `, [
        j.showdate,
        j.song || j.songname,
        j.slug || null,
        durationSec,
        label,
        getEra(j.showdate),
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'longest_jams', count: upserted, total: jams.length };
}

async function seedDebuts(pool) {
  const debuts = await pnetFetch('debuts');
  let upserted = 0;
  for (const d of debuts) {
    try {
      await pool.query(`
        INSERT INTO pn_debuts (slug, song_name, debut_date, debut_venue, debut_city, debut_state)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (slug) DO UPDATE SET
          song_name=EXCLUDED.song_name, debut_date=EXCLUDED.debut_date,
          debut_venue=EXCLUDED.debut_venue, debut_city=EXCLUDED.debut_city,
          debut_state=EXCLUDED.debut_state, updated_at=NOW()
      `, [
        d.slug,
        d.song || d.songname,
        d.showdate || null,
        d.venue || null,
        d.city || null,
        d.state || null,
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'debuts', count: upserted, total: debuts.length };
}

async function seedTeases(pool) {
  const teases = await pnetFetch('teases');
  let upserted = 0;
  for (const t of teases) {
    try {
      await pool.query(`
        INSERT INTO pn_teases (show_date, teased_song, in_song)
        VALUES ($1,$2,$3)
        ON CONFLICT (show_date, teased_song, in_song) DO NOTHING
      `, [
        t.showdate,
        t.tease || t.teased_song || t.song,
        t.in_song || t.insong || null,
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'teases', count: upserted, total: teases.length };
}

async function seedGuests(pool) {
  try {
    const guests = await pnetFetch('guests');
    let upserted = 0;
    for (const g of guests) {
      try {
        await pool.query(`
          INSERT INTO pn_guests (show_date, guest_name, instrument, song_name)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (show_date, guest_name, song_name) DO NOTHING
        `, [
          g.showdate,
          g.guest || g.guest_name || null,
          g.instrument || null,
          g.song || g.songname || null,
        ]);
        upserted++;
      } catch (_) {}
    }
    return { type: 'guests', count: upserted, total: guests.length };
  } catch (e) {
    return { type: 'guests', count: 0, total: 0, skipped: true, reason: e.message };
  }
}

async function seedReviews(pool) {
  // Strategy: fetch ALL reviews, store them all
  // Reviews are the voice of the community — the richer the better
  // Phish.net has ~20k+ reviews; we fetch in batches and store all of them
  // review_text is the gold — phan language, feels, cow funk, bliss, etc.
  let page = 1;
  let total = 0;
  let upserted = 0;
  const BATCH = 500;
  const MAX_PAGES = 60; // safety cap ~30k reviews

  while (page <= MAX_PAGES) {
    try {
      const reviews = await pnetFetch('reviews', { limit: BATCH, page });
      if (!reviews.length) break;
      total += reviews.length;

      for (const r of reviews) {
        try {
          const text = (r.review_text || r.body || r.review || '').trim();
          if (!text || text.length < 50) continue; // skip empty/very short
          await pool.query(`
            INSERT INTO pn_reviews (show_date, score, review_text, era)
            VALUES ($1,$2,$3,$4)
            ON CONFLICT DO NOTHING
          `, [
            r.showdate,
            parseFloat(r.score) || null,
            text,
            getEra(r.showdate),
          ]);
          upserted++;
        } catch (_) {}
      }

      if (reviews.length < BATCH) break;
      page++;

      // Small delay to be nice to Phish.net
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      break;
    }
  }
  return { type: 'reviews', count: upserted, total, pages: page };
}

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });
  if (!PHISH_NET_KEY) return res.status(500).json({ error: 'PHISH_NET_API_KEY not set' });

  // Which data types to seed — default all, or pass ?types=songs,shows etc
  const requested = req.query?.types ? req.query.types.split(',') : null;
  const shouldRun = (type) => !requested || requested.includes(type);

  const pool = getPool();
  const results = [];

  try {
    // Step 0: ensure all tables exist
    await ensureSchema(pool);
    results.push({ type: 'schema', status: 'ok' });
  } catch (e) {
    return res.status(500).json({ error: 'Schema setup failed: ' + e.message });
  }

  // Run each seeder — continue even if one fails
  const seeders = [
    { key: 'songs',        fn: () => seedSongs(pool) },
    { key: 'shows',        fn: () => seedShows(pool) },
    { key: 'longest_jams', fn: () => seedLongestJams(pool) },
    { key: 'debuts',       fn: () => seedDebuts(pool) },
    { key: 'teases',       fn: () => seedTeases(pool) },
    { key: 'guests',       fn: () => seedGuests(pool) },
    { key: 'reviews',      fn: () => seedReviews(pool) },
  ];

  for (const seeder of seeders) {
    if (!shouldRun(seeder.key)) {
      results.push({ type: seeder.key, skipped: true });
      continue;
    }
    try {
      const result = await seeder.fn();
      results.push({ ...result, status: 'ok' });
    } catch (e) {
      results.push({ type: seeder.key, status: 'error', error: e.message });
    }
  }

  // Row counts for summary
  const counts = {};
  for (const tbl of ['pn_songs','pn_shows','pn_longest_jams','pn_debuts','pn_teases','pn_reviews','pn_guests']) {
    try {
      const r = await pool.query(`SELECT COUNT(*) FROM ${tbl}`);
      counts[tbl] = parseInt(r.rows[0].count);
    } catch (_) { counts[tbl] = 0; }
  }

  return res.json({ ok: true, results, db_counts: counts });
}
