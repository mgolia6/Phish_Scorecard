// GET /api/user/deep-phreeze
// Returns computed stats from user_stats table.
// If no stats exist yet, returns { needs_sync: true }

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
    `SELECT stats, computed_at FROM user_stats WHERE user_id = $1`,
    [user.id]
  );

  if (!result.rows.length) return res.json({ needs_sync: true });

  return res.json({
    needs_sync: false,
    stats: result.rows[0].stats,
    computed_at: result.rows[0].computed_at,
  });

  } catch (err) {
    console.error('[deep-phreeze] DB error:', err.message);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}
