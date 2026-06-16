// GET /api/community/overlap-suggestions
// Returns up to 10 other users who share shows with the current user, ranked by overlap count
// "Share" = attended (user_show_attendance OR phishnet attendance import) OR rated

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
    const result = await pool.query(`
      WITH my_shows AS (
        SELECT show_date FROM user_show_attendance
          WHERE user_id = $1 AND attendance_type = 'attended'
        UNION
        SELECT show_date FROM attendance WHERE user_id = $1
        UNION
        SELECT DISTINCT show_date FROM ratings WHERE user_id = $1
      ),
      other_shows AS (
        SELECT u.id AS other_id, u.username, usa.show_date
        FROM user_show_attendance usa
        JOIN users u ON u.id = usa.user_id
        WHERE usa.user_id != $1
          AND usa.attendance_type = 'attended'
          AND u.email_verified = true
        UNION
        SELECT u.id AS other_id, u.username, a.show_date
        FROM attendance a
        JOIN users u ON u.id = a.user_id
        WHERE a.user_id != $1
          AND u.email_verified = true
        UNION
        SELECT u.id AS other_id, u.username, r.show_date
        FROM ratings r
        JOIN users u ON u.id = r.user_id
        WHERE r.user_id != $1
          AND u.email_verified = true
      )
      SELECT
        os.username,
        COUNT(DISTINCT os.show_date) AS shared_count
      FROM other_shows os
      JOIN my_shows ms ON ms.show_date = os.show_date
      GROUP BY os.username
      ORDER BY shared_count DESC
      LIMIT 10
    `, [user.id]);

    return res.json({ suggestions: result.rows });
  } catch (err) {
    console.error('[overlap-suggestions] error:', err.message);
    return res.status(500).json({ error: 'Failed to load suggestions' });
  }
}
