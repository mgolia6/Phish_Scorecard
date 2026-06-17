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
  if (!PHISH_NET_KEY) throw new Error(`PHISH_NET_API_KEY not set — cannot fetch ${endpoint}`);
  const qs = new URLSearchParams({ apikey: PHISH_NET_KEY, ...params }).toString();
  const url = `${PNET}/${endpoint}.json?${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Try to get error body for better diagnostics
    const body = await res.text().catch(() => '');
    throw new Error(`Phish.net ${endpoint} returned ${res.status}: ${body.slice(0, 100)}`);
  }
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
      pn_rating NUMERIC(4,3),
      pn_num_ratings INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Add rating columns if table was created before this migration was added
  await pool.query(`ALTER TABLE pn_shows ADD COLUMN IF NOT EXISTS pn_rating NUMERIC(4,3)`).catch(() => {});
  await pool.query(`ALTER TABLE pn_shows ADD COLUMN IF NOT EXISTS pn_num_ratings INTEGER DEFAULT 0`).catch(() => {});

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
      // Phish.net /shows endpoint returns: rating (1-5 aggregate), num_ratings (vote count)
      const pnRating = s.rating ? parseFloat(s.rating) : null;
      const pnNumRatings = s.num_ratings ? parseInt(s.num_ratings) : 0;
      await pool.query(`
        INSERT INTO pn_shows (show_date, venue, city, state, country, tour_name, era, pn_rating, pn_num_ratings)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (show_date) DO UPDATE SET
          venue=EXCLUDED.venue, city=EXCLUDED.city, state=EXCLUDED.state,
          country=EXCLUDED.country, tour_name=EXCLUDED.tour_name, era=EXCLUDED.era,
          pn_rating=EXCLUDED.pn_rating, pn_num_ratings=EXCLUDED.pn_num_ratings, updated_at=NOW()
      `, [
        s.showdate,
        s.venue, s.city, s.state, s.country,
        s.tour_name || s.tourname || null,
        getEra(s.showdate),
        pnRating,
        pnNumRatings,
      ]);
      upserted++;
    } catch (_) {}
  }
  return { type: 'shows', count: upserted, total: shows.length };
}

async function seedLongestJams(pool) {
  // Note: longestjams endpoint requires elevated Phish.net API access
  // Request at: https://phish.net/api
  const jams = await pnetFetch('longestjams');
  let upserted = 0;
  for (const j of jams) {
    try {
      // Phish.net longestjams: duration may be in 'minutes', 'duration', or 'length'
      const rawDur = j.minutes || j.duration || j.length || j.duration_seconds / 60 || null;
      const durationSec = rawDur ? Math.round(parseFloat(rawDur) * 60) : null;
      const mins = rawDur ? Math.floor(parseFloat(rawDur)) : null;
      const secs = rawDur ? Math.round((parseFloat(rawDur) % 1) * 60) : null;
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
      const slug = d.slug || (d.song || d.songname || '').toLowerCase().replace(/[^a-z0-9]+/g,'-');
      if (!slug) continue;
      await pool.query(`
        INSERT INTO pn_debuts (slug, song_name, debut_date, debut_venue, debut_city, debut_state)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (slug) DO UPDATE SET
          song_name=EXCLUDED.song_name, debut_date=EXCLUDED.debut_date,
          debut_venue=EXCLUDED.debut_venue, debut_city=EXCLUDED.debut_city,
          debut_state=EXCLUDED.debut_state, updated_at=NOW()
      `, [
        slug,
        d.song || d.songname || d.song_name || '',
        d.showdate || d.show_date || null,
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
      const teaseShow = t.showdate || t.show_date;
      const teaseSong = t.tease || t.teased_song || t.song || t.songname;
      const inSong = t.in_song || t.insong || t.song_performed_in || null;
      if (!teaseShow || !teaseSong) continue;
      await pool.query(`
        INSERT INTO pn_teases (show_date, teased_song, in_song)
        VALUES ($1,$2,$3)
        ON CONFLICT (show_date, teased_song, in_song) DO NOTHING
      `, [teaseShow, teaseSong, inSong]);
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
        const guestShow = g.showdate || g.show_date;
        const guestName = g.guest || g.guest_name || g.name || g.artistname;
        if (!guestShow || !guestName) continue;
        await pool.query(`
          INSERT INTO pn_guests (show_date, guest_name, instrument, song_name)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (show_date, guest_name, song_name) DO NOTHING
        `, [
          guestShow,
          guestName,
          g.instrument || g.instruments || null,
          g.song || g.songname || g.song_name || null,
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
  // Bulk /reviews.json doesn't return review text — only metadata.
  // Working pattern (same as Vibe Check + show detail): /reviews/showdate/{date}.json
  // Strategy: fetch top-rated shows from pn_shows, pull reviews per show.
  // Prioritize shows with highest pn_rating and most votes — richest content first.
  let upserted = 0;
  let showsProcessed = 0;
  let errors = 0;

  // Pull top 600 shows by rating from what we've already seeded
  // Covers the canonical "must-know" shows — Big Cypress, Nassau 4/3/98, etc.
  let shows = [];
  try {
    // Try top-rated shows first; fall back to all shows if ratings not populated yet
    const ratedRes = await pool.query(`
      SELECT show_date FROM pn_shows
      WHERE pn_rating IS NOT NULL
      ORDER BY pn_rating DESC, pn_num_ratings DESC NULLS LAST
      LIMIT 600
    `).catch(() => ({ rows: [] }));

    if (ratedRes.rows.length > 0) {
      shows = ratedRes.rows.map(r => r.show_date instanceof Date
        ? r.show_date.toISOString().slice(0, 10)
        : String(r.show_date).slice(0, 10)
      );
    } else {
      // pn_rating not populated yet — fall back to all shows ordered by date desc
      // (recent shows have more reviews and more phan activity)
      const allRes = await pool.query(`
        SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date
        FROM pn_shows
        ORDER BY show_date DESC
        LIMIT 600
      `).catch(() => ({ rows: [] }));
      shows = allRes.rows.map(r => r.show_date);
    }
  } catch (e) {
    return { type: 'reviews', count: 0, error: 'Could not query pn_shows: ' + e.message };
  }

  if (!shows.length) {
    return { type: 'reviews', count: 0, status: 'error', error: 'pn_shows is empty or has no shows — run songs/shows seed first, then retry reviews' };
  }

  let firstError = null;
  let firstShowDateTried = null;
  let sampleReviewKeys = null;

  for (const showDate of shows) {
    try {
      firstShowDateTried = firstShowDateTried || showDate;
      const url = `${PNET}/reviews/showdate/${showDate}.json?apikey=${PHISH_NET_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (!firstError) firstError = `HTTP ${res.status} for ${showDate}: ${body.slice(0,80)}`;
        errors++;
        continue;
      }
      const data = await res.json();
      const reviews = data?.data || [];

      // Capture field shape from first review we see
      if (!sampleReviewKeys && reviews[0]) {
        sampleReviewKeys = Object.keys(reviews[0]).join(', ');
      }

      for (const r of reviews) {
        try {
          const text = (r.review || r.review_text || r.body || '').trim();
          if (!text || text.length < 30) continue;
          const score = r.score != null ? parseFloat(r.score) : null;
          await pool.query(`
            INSERT INTO pn_reviews (show_date, score, review_text, era)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [
            showDate,
            (!isNaN(score) && score > 0) ? score : null,
            text,
            getEra(showDate),
          ]);
          upserted++;
        } catch (insertErr) {
          if (!firstError) firstError = `Insert error: ${insertErr.message}`;
          errors++;
        }
      }

      showsProcessed++;
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (e) {
      if (!firstError) firstError = `Fetch error for ${showDate}: ${e.message}`;
      errors++;
    }
  }

  return {
    type: 'reviews',
    count: upserted,
    shows_processed: showsProcessed,
    errors,
    total_shows: shows.length,
    first_error: firstError,
    sample_review_fields: sampleReviewKeys,
  };
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
  const VALID_TYPES = ['songs', 'shows', 'reviews'];
  const shouldRun = (type) => VALID_TYPES.includes(type) && (!requested || requested.includes(type));

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
  // Phish.net v5 API exposes: shows, songs, songdata, setlists, jamcharts, reviews, venues, attendance
  // longestjams, debuts, teases, guests are web-only chart pages — no API endpoint exists
  const seeders = [
    { key: 'songs',   fn: () => seedSongs(pool) },
    { key: 'shows',   fn: () => seedShows(pool) },
    { key: 'reviews', fn: () => seedReviews(pool) },
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
  for (const tbl of ['pn_songs','pn_shows','pn_reviews']) {
    try {
      const r = await pool.query(`SELECT COUNT(*) FROM ${tbl}`);
      counts[tbl] = parseInt(r.rows[0].count);
    } catch (_) { counts[tbl] = 0; }
  }

  return res.json({ ok: true, results, db_counts: counts });
}
