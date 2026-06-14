// POST /api/admin/clear-cache
// Clears show_cache entries and user_stats for the requesting user.
// Does NOT touch ratings, attendance, reviews, or any other user data.

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  try {
    // Get attended show dates as strings
    const attendedRes = await pool.query(
      `SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date FROM attendance WHERE user_id = $1`,
      [user.id]
    );
    const dates = attendedRes.rows.map(r => r.show_date);

    // Delete show_cache rows using string comparison to avoid cast issues
    let clearedCache = 0;
    if (dates.length) {
      const result = await pool.query(
        `DELETE FROM show_cache WHERE show_date::text = ANY($1::text[])`,
        [dates]
      );
      clearedCache = result.rowCount;
    }

    // Delete computed stats
    const statsResult = await pool.query(
      `DELETE FROM user_stats WHERE user_id = $1`,
      [user.id]
    );
    const clearedStats = statsResult.rowCount;

    return res.json({
      ok: true,
      cleared_show_cache: clearedCache,
      cleared_stats: clearedStats,
      attended_count: dates.length,
      message: `Cleared ${clearedCache} cached shows and reset stats. Run SYNC to rebuild.`,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
