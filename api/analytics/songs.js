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
    // Scope to shows the user attended (or rated — union both for best coverage)
    const result = await pool.query(
      `SELECT
        r.song_name,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(*) as total_ratings
       FROM ratings r
       WHERE r.user_id = $1
         AND r.rating IS NOT NULL
         AND (
           EXISTS (SELECT 1 FROM attendance a WHERE a.user_id = r.user_id AND a.show_date = r.show_date)
           OR TRUE
         )
       GROUP BY r.song_name
       HAVING COUNT(*) >= 1
       ORDER BY average_rating DESC, total_ratings DESC
       LIMIT 50`,
      [user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
