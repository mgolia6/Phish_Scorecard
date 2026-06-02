import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { showDate } = req.query;
  if (!showDate) return res.status(400).json({ error: 'Show date required' });

  const pool = getPool();

  // GET - fetch this user's ratings for a show
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM ratings WHERE user_id = $1 AND show_date = $2 ORDER BY set_number, id',
        [user.id, showDate]
      );
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST - submit ratings for a show
  if (req.method === 'POST') {
    const { ratings, showDetails } = req.body;

    if (!ratings || !Array.isArray(ratings)) {
      return res.status(400).json({ error: 'ratings array required' });
    }

    try {
      // Upsert show record
      await pool.query(
        `INSERT INTO shows (show_date, venue, city, state, country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (show_date) DO NOTHING`,
        [showDate, showDetails?.venue, showDetails?.city, showDetails?.state, showDetails?.country]
      );

      // Upsert each rating
      for (const r of ratings) {
        if (!r.song || r.rating == null) continue;
        await pool.query(
          `INSERT INTO ratings (user_id, show_date, song_name, set_number, rating, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, show_date, song_name)
           DO UPDATE SET rating = $5, notes = $6, updated_at = NOW()`,
          [user.id, showDate, r.song, r.set || null, r.rating, r.notes || '']
        );
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Ratings error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
