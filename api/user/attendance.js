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
        ROUND(AVG(r.rating)::numeric, 2) as phreezer_avg,
        COUNT(r.id) as songs_rated,
        ur.phishnet_score,
        ur.review_text,
        TO_CHAR(ur.posted_date, 'YYYY-MM-DD') as review_date
       FROM attendance a
       LEFT JOIN ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date
       LEFT JOIN user_reviews ur ON ur.user_id = a.user_id AND ur.show_date = a.show_date
       WHERE a.user_id = $1
       GROUP BY a.show_date, a.venue, a.city, a.state, a.country, a.source,
                ur.phishnet_score, ur.review_text, ur.posted_date
       ORDER BY a.show_date DESC`,
      [user.id]
    );
    res.json({ shows: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
