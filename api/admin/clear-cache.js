// POST /api/admin/clear-cache
// Clears show_cache and user_stats for the requesting user only.
// Does NOT touch ratings, attendance, or any other user data.
// Use this to force a full re-sync of Deep Phreeze data.

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  try {
    // Get the user's attended show dates so we can selectively clear show_cache
    const attendedRes = await pool.query(
      `SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date FROM attendance WHERE user_id = $1`,
      [user.id]
    );
    const dates = attendedRes.rows.map(r => r.show_date);

    // Clear show_cache rows for this user's shows only
    // (show_cache is shared but we only need to re-fetch shows we attended)
    let clearedCache = 0;
    if (dates.length) {
      const result = await pool.query(
        `DELETE FROM show_cache WHERE show_date = ANY($1::date[])`,
        [dates]
      );
      clearedCache = result.rowCount;
    }

    // Clear computed stats for this user
    const statsResult = await pool.query(
      `DELETE FROM user_stats WHERE user_id = $1`,
      [user.id]
    );
    const clearedStats = statsResult.rowCount;

    return res.json({
      ok: true,
      cleared_show_cache: clearedCache,
      cleared_stats: clearedStats,
      message: `Cleared cache for ${clearedCache} shows and reset your computed stats. Run SYNC to rebuild.`,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
