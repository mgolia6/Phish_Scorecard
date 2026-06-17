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

  // Allow both admin UI calls and cron calls
  const cronSecret = req.headers['x-cron-secret'];
  const user = verifyToken(req);
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!isCron && !user?.is_admin) return res.status(403).json({ error: 'Unauthorized' });

  if (!PHISH_NET_KEY) return res.status(500).json({ error: 'PHISH_NET_API_KEY not set' });

  const pool = getPool();

  // Only fetch recent entries (last 90 days worth) for refresh
  let inserted = 0;
  let updated = 0;

  try {
    const url = `${PNET}/jamcharts.json?apikey=${PHISH_NET_KEY}&limit=200`;
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) throw new Error(`Phish.net returned ${fetchRes.status}`);
    const data = await fetchRes.json();
    const entries = data?.data || [];

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
      } catch (_) {}
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  const countRes = await pool.query('SELECT COUNT(*) FROM jamchart_entries');
  const total = parseInt(countRes.rows[0].count);

  return res.json({ ok: true, inserted, updated, total });
}
