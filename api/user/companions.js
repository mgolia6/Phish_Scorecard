// GET /api/user/companions
// Returns all tagged companions for the current user, keyed by show_date
// Used by My Shows to bulk-load companion chips without N+1 requests

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
  // All companions for this user across all shows
  const result = await pool.query(`
    SELECT
      sc.show_date::text,
      sc.companion_user_id AS user_id,
      u.username,
      AVG(r.rating)::numeric(4,2) AS their_score
    FROM show_companions sc
    JOIN users u ON u.id = sc.companion_user_id
    LEFT JOIN ratings r ON r.user_id = sc.companion_user_id AND r.show_date = sc.show_date
    WHERE sc.user_id = $1
    GROUP BY sc.show_date, sc.companion_user_id, u.username
    ORDER BY sc.show_date DESC
  `, [user.id]);

  // Group by show_date
  const byDate = {};
  for (const row of result.rows) {
    if (!byDate[row.show_date]) byDate[row.show_date] = [];
    byDate[row.show_date].push({
      user_id: row.user_id,
      username: row.username,
      their_score: row.their_score,
    });
  }

  return res.json({ by_date: byDate });

  } catch (err) {
    console.error('[companions] DB error:', err.message);
    return res.status(500).json({ error: 'Failed to load companions' });
  }
}
