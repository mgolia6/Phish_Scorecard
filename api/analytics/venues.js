import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT 
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(DISTINCT r.show_date) as total_shows,
        COUNT(r.id) as total_ratings
       FROM ratings r
       JOIN shows s ON r.show_date = s.show_date
       WHERE r.rating IS NOT NULL
       GROUP BY s.venue, s.city, s.state
       ORDER BY average_rating DESC, total_shows DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
