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
    const result = await pool.query(
      `SELECT 
        TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date,
        s.venue, s.city, s.state, s.country,
        ROUND(AVG(r.rating)::numeric, 2) as overall_rating,
        COUNT(r.id) as song_count,
        COUNT(CASE WHEN r.rating IS NOT NULL THEN 1 END) as rated_count
       FROM ratings r
       JOIN shows s ON r.show_date = s.show_date
       WHERE r.user_id = $1
       GROUP BY s.show_date, s.venue, s.city, s.state, s.country
       ORDER BY s.show_date DESC`,
      [user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
