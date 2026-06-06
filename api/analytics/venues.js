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
    // Primary: venues from attended shows (with or without ratings)
    // If user has rated shows there, include avg; if attended only, show 0 ratings
    const result = await pool.query(
      `SELECT
        COALESCE(s.venue, a.venue) as venue,
        COALESCE(s.city, a.city) as city,
        COALESCE(s.state, a.state) as state,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(DISTINCT COALESCE(r.show_date, a.show_date)) as total_shows,
        COUNT(r.id) as total_ratings
       FROM attendance a
       LEFT JOIN shows s ON s.show_date = a.show_date
       LEFT JOIN ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date AND r.rating IS NOT NULL
       WHERE a.user_id = $1
         AND COALESCE(s.venue, a.venue) IS NOT NULL
       GROUP BY COALESCE(s.venue, a.venue), COALESCE(s.city, a.city), COALESCE(s.state, a.state)
       ORDER BY average_rating DESC NULLS LAST, total_shows DESC
       LIMIT 50`,
      [user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
