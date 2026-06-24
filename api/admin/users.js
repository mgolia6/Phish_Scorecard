import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const pool = getPool();

  if (req.method === 'GET') {
    try {
      // ai_usage_log is lazily created elsewhere — ensure it exists so the
      // per-user cost subquery below never errors on a fresh database.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_usage_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          feature VARCHAR(64) NOT NULL,
          model VARCHAR(64) NOT NULL,
          input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0,
          cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const result = await pool.query(
        `SELECT
          u.id, u.username, u.email, u.first_name, u.is_admin,
          u.tandc_accepted, u.onboarding_complete, u.email_verified, u.phishnet_username,
          TO_CHAR(u.created_at, 'YYYY-MM-DD') as joined,
          COUNT(DISTINCT a.show_date) as shows_attended,
          COUNT(DISTINCT r.show_date) as shows_rated,
          COUNT(DISTINCT ur.id) as reviews,
          (SELECT COALESCE(SUM(cost_usd), 0) FROM ai_usage_log WHERE user_id = u.id) as ai_cost_usd
         FROM users u
         LEFT JOIN attendance a ON a.user_id = u.id
         LEFT JOIN ratings r ON r.user_id = u.id
         LEFT JOIN user_reviews ur ON ur.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
