import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth optional — show leaderboard to all, but mark current user
  const authUser = verifyToken(req);

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.login_streak,
        COUNT(DISTINCT a.show_date) AS shows_attended,
        COUNT(DISTINCT r.show_date) AS shows_rated,
        ROUND(AVG(r.rating)::numeric, 2) AS avg_score
      FROM users u
      LEFT JOIN attendance a ON a.user_id = u.id
      LEFT JOIN ratings r ON r.user_id = u.id AND r.rating IS NOT NULL
      GROUP BY u.id, u.username, u.login_streak
      HAVING COUNT(DISTINCT r.show_date) > 0
      ORDER BY shows_rated DESC, avg_score DESC
      LIMIT 50
    `);

    const rows = result.rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      is_me: authUser ? row.id === authUser.id : false,
      shows_attended: parseInt(row.shows_attended || 0),
      shows_rated: parseInt(row.shows_rated || 0),
      avg_score: row.avg_score,
      login_streak: parseInt(row.login_streak || 0),
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
