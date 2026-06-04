import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  try {
    const [songsRes, venuesRes, showsRes] = await Promise.all([
      // Rated songs, ordered by times rated (most familiar first)
      pool.query(
        `SELECT DISTINCT song_name
         FROM ratings WHERE user_id = $1 AND rating IS NOT NULL
         GROUP BY song_name ORDER BY COUNT(*) DESC LIMIT 200`,
        [user.id]
      ),
      // Attended venues
      pool.query(
        `SELECT DISTINCT venue, city, state
         FROM attendance WHERE user_id = $1
         ORDER BY venue ASC`,
        [user.id]
      ),
      // Attended shows for favorite show picker
      pool.query(
        `SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date, venue, city, state
         FROM attendance WHERE user_id = $1
         ORDER BY show_date DESC`,
        [user.id]
      ),
    ]);

    res.json({
      songs: songsRes.rows.map(r => r.song_name),
      venues: venuesRes.rows.map(r => ({ venue: r.venue, city: r.city, state: r.state })),
      shows: showsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
