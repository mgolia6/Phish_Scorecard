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
    const [attendedRes, ratedRes, topSongRes, topVenueRes, reviewsRes] = await Promise.all([
      // Total shows attended
      pool.query('SELECT COUNT(*) as count FROM attendance WHERE user_id = $1', [user.id]),
      // Rated shows + avg score
      pool.query(
        `SELECT COUNT(DISTINCT show_date) as count, ROUND(AVG(rating)::numeric, 2) as avg_score
         FROM ratings WHERE user_id = $1 AND rating IS NOT NULL`,
        [user.id]
      ),
      // Top rated song (min 1 rating)
      pool.query(
        `SELECT song_name, ROUND(AVG(rating)::numeric, 2) as avg, COUNT(*) as times_rated
         FROM ratings WHERE user_id = $1 AND rating IS NOT NULL
         GROUP BY song_name ORDER BY avg DESC, times_rated DESC LIMIT 1`,
        [user.id]
      ),
      // Most attended venue
      pool.query(
        `SELECT venue, city, state, COUNT(*) as shows
         FROM attendance WHERE user_id = $1
         GROUP BY venue, city, state ORDER BY shows DESC LIMIT 1`,
        [user.id]
      ),
      // Shows with phish.net reviews
      pool.query(
        'SELECT COUNT(DISTINCT show_date) as count FROM user_reviews WHERE user_id = $1',
        [user.id]
      ),
    ]);

    res.json({
      shows_attended: parseInt(attendedRes.rows[0]?.count || 0),
      shows_rated: parseInt(ratedRes.rows[0]?.count || 0),
      avg_score: ratedRes.rows[0]?.avg_score || null,
      top_song: topSongRes.rows[0] || null,
      top_venue: topVenueRes.rows[0] || null,
      shows_with_reviews: parseInt(reviewsRes.rows[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
