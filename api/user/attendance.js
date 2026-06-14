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
        TO_CHAR(a.show_date, 'YYYY-MM-DD') as show_date,
        a.venue, a.city, a.state, a.country, a.source,
        ROUND(AVG(r.rating)::numeric, 2) as phreezer_avg,
        COUNT(DISTINCT r.id) as songs_rated,
        JSON_AGG(
          CASE WHEN ur.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'review_id', ur.phishnet_review_id,
              'review_text', ur.review_text,
              'posted_date', TO_CHAR(ur.posted_date, 'YYYY-MM-DD')
            )
          END
          ORDER BY ur.posted_date ASC
        ) FILTER (WHERE ur.id IS NOT NULL) as reviews
       FROM attendance a
       LEFT JOIN ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date
       LEFT JOIN user_reviews ur ON ur.user_id = a.user_id AND ur.show_date = a.show_date
       WHERE a.user_id = $1
       GROUP BY a.show_date, a.venue, a.city, a.state, a.country, a.source
       ORDER BY a.show_date DESC`,
      [user.id]
    );
    res.json({ shows: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
