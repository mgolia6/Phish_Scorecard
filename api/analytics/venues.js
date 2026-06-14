import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(s.venue, a.venue) as venue,
        COALESCE(s.city, a.city) as city,
        COALESCE(s.state, a.state) as state,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(DISTINCT COALESCE(r.show_date, a.show_date)) as total_shows,
        COUNT(r.id) as total_ratings
      FROM attendance a
      LEFT JOIN shows s ON s.show_date = a.show_date
      LEFT JOIN ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date AND r.rating IS NOT NULL
      WHERE a.user_id = $1 AND COALESCE(s.venue, a.venue) IS NOT NULL
      GROUP BY COALESCE(s.venue, a.venue), COALESCE(s.city, a.city), COALESCE(s.state, a.state)
      ORDER BY average_rating DESC NULLS LAST, total_shows DESC
      LIMIT 50
    `, [user.id]);

    // For each venue get top-rated shows
    const rows = await Promise.all(result.rows.map(async (venue) => {
      const topShows = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(*) as ratings
        FROM ratings r
        JOIN shows s ON s.show_date = r.show_date
        WHERE r.user_id = $1 AND s.venue = $2 AND r.rating IS NOT NULL
        GROUP BY r.show_date
        ORDER BY avg_score DESC
        LIMIT 5
      `, [user.id, venue.venue]);
      return { ...venue, top_shows: topShows.rows };
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
