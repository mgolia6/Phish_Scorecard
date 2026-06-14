import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { phishnet_username } = req.body;
  if (!phishnet_username) return res.status(400).json({ error: 'phishnet_username required' });

  try {
    const url = `https://api.phish.net/v5/attendance/username/${encodeURIComponent(phishnet_username)}.json?apikey=${process.env.PHISH_NET_API_KEY}`;
    const r = await fetch(url);
    const d = await r.json();

    if (d.error || !d.data) {
      return res.status(404).json({ error: `Phish.net user "${phishnet_username}" not found or has no attendance data` });
    }

    const shows = d.data;
    if (!shows.length) return res.json({ imported: 0, message: 'No attended shows found' });

    const pool = getPool();

    let imported = 0;
    let skipped = 0;

    for (const show of shows) {
      const showDate = show.showdate;
      if (!showDate) continue;

      try {
        await pool.query(
          `INSERT INTO attendance (user_id, show_date, venue, city, state, country, source)
           VALUES ($1, $2, $3, $4, $5, $6, 'phishnet')
           ON CONFLICT (user_id, show_date) DO UPDATE SET
             venue = EXCLUDED.venue,
             city = EXCLUDED.city,
             state = EXCLUDED.state,
             country = EXCLUDED.country,
             source = 'phishnet',
             imported_at = CURRENT_TIMESTAMP`,
          [user.id, showDate, show.venue || null, show.city || null, show.state || null, show.country || null]
        );
        imported++;
      } catch (e) {
        skipped++;
      }
    }

    res.json({ imported, skipped, total: shows.length, message: `Imported ${imported} shows from phish.net` });
  } catch (err) {
    console.error('Phish.net import error:', err);
    res.status(500).json({ error: err.message });
  }
}
