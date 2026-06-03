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
    const result = await pool.query(
      `SELECT
        TO_CHAR(a.show_date, 'YYYY-MM-DD') as show_date,
        a.venue, a.city, a.state, a.country, a.source,
        TO_CHAR(a.imported_at, 'YYYY-MM-DD') as imported_at,
        ROUND(AVG(r.rating)::numeric, 2) as avg_rating,
        COUNT(r.id) as songs_rated
       FROM attendance a
       LEFT JOIN ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date
       WHERE a.user_id = $1
       GROUP BY a.show_date, a.venue, a.city, a.state, a.country, a.source, a.imported_at
       ORDER BY a.show_date DESC`,
      [user.id]
    );
    res.json({ shows: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
