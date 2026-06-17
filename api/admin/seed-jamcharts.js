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

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

  if (!PHISH_NET_KEY) return res.status(500).json({ error: 'PHISH_NET_API_KEY not set' });

  const pool = getPool();

  // Create table if needed
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jamchart_entries (
      id SERIAL PRIMARY KEY,
      show_date DATE NOT NULL,
      song_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      description TEXT,
      era VARCHAR(32),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(show_date, song_name)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jamchart_show_date ON jamchart_entries(show_date)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jamchart_song_name ON jamchart_entries(song_name)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_jamchart_description ON jamchart_entries USING gin(to_tsvector('english', coalesce(description,'')))`);

  // Fetch all jamchart entries from Phish.net
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  let page = 1;
  let hasMore = true;
  const BATCH = 500;

  while (hasMore) {
    try {
      const url = `${PNET}/jamcharts.json?apikey=${PHISH_NET_KEY}&limit=${BATCH}&page=${page}`;
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) { hasMore = false; break; }
      const data = await fetchRes.json();
      const entries = data?.data || [];

      if (!entries.length) { hasMore = false; break; }

      for (const e of entries) {
        const showDate = e.showdate;
        const songName = e.song || e.songname || '';
        const slug = e.slug || null;
        const description = e.jamchart_description || e.note || null;
        const era = getEra(showDate);
        if (!showDate || !songName) continue;
        try {
          const result = await pool.query(`
            INSERT INTO jamchart_entries (show_date, song_name, slug, description, era, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (show_date, song_name)
            DO UPDATE SET description = EXCLUDED.description, slug = EXCLUDED.slug, era = EXCLUDED.era, updated_at = NOW()
            RETURNING (xmax = 0) as was_inserted
          `, [showDate, songName, slug, description, era]);
          if (result.rows[0]?.was_inserted) inserted++;
          else updated++;
        } catch (e) { errors++; }
      }

      // If we got fewer than BATCH, we're done
      if (entries.length < BATCH) { hasMore = false; }
      else { page++; }

      // Safety — Phish.net usually has ~2500 entries total, stop at page 20
      if (page > 20) { hasMore = false; }
    } catch (e) {
      errors++;
      hasMore = false;
    }
  }

  const countRes = await pool.query('SELECT COUNT(*) FROM jamchart_entries');
  const total = parseInt(countRes.rows[0].count);

  return res.json({ ok: true, inserted, updated, errors, total, pages: page - 1 });
}
