import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const pool = getPool();
  try {
    const [users, ratings, attendance, shows, feedback, vibeChecks] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM ratings'),
      pool.query('SELECT COUNT(*) FROM attendance'),
      pool.query('SELECT COUNT(*) FROM show_cache'),
      pool.query('SELECT COUNT(*) FROM feedback'),
      pool.query('SELECT COUNT(*) FROM vibe_checks'),
    ]);

    const recentErrors = await pool.query(`
      SELECT username, email, created_at, last_login_date, login_streak
      FROM users ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      users: parseInt(users.rows[0].count),
      ratings: parseInt(ratings.rows[0].count),
      attendance: parseInt(attendance.rows[0].count),
      shows_cached: parseInt(shows.rows[0].count),
      feedback: parseInt(feedback.rows[0].count),
      vibe_checks: parseInt(vibeChecks.rows[0].count),
      recent_users: recentErrors.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
