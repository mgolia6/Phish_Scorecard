// GET /api/admin/ai-usage
// Returns aggregated AI token usage stats for admin dashboard.
// Auth: must be admin JWT.

import { verifyToken, cors } from '../_auth.js';
import { getPool } from '../_db.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

  const pool = getPool();

  try {
    // Ensure table exists before querying
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

    const [totals, byFeature, byDay, byModel, byUser, recent] = await Promise.all([
      // Overall totals
      pool.query(`
        SELECT
          COUNT(*)::int                        AS total_calls,
          COALESCE(SUM(input_tokens), 0)::int  AS total_input_tokens,
          COALESCE(SUM(output_tokens), 0)::int AS total_output_tokens,
          COALESCE(SUM(cost_usd), 0)::numeric  AS total_cost_usd
        FROM ai_usage_log
      `),

      // By feature
      pool.query(`
        SELECT
          feature,
          COUNT(*)::int                        AS calls,
          COALESCE(SUM(input_tokens), 0)::int  AS input_tokens,
          COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
          COALESCE(SUM(cost_usd), 0)::numeric  AS cost_usd
        FROM ai_usage_log
        GROUP BY feature
        ORDER BY calls DESC
      `),

      // By day — last 30 days
      pool.query(`
        SELECT
          DATE(created_at)                     AS day,
          COUNT(*)::int                        AS calls,
          COALESCE(SUM(input_tokens), 0)::int  AS input_tokens,
          COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
          COALESCE(SUM(cost_usd), 0)::numeric  AS cost_usd
        FROM ai_usage_log
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `),

      // By model
      pool.query(`
        SELECT
          model,
          COUNT(*)::int                        AS calls,
          COALESCE(SUM(input_tokens), 0)::int  AS input_tokens,
          COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
          COALESCE(SUM(cost_usd), 0)::numeric  AS cost_usd
        FROM ai_usage_log
        GROUP BY model
        ORDER BY calls DESC
      `),

      // By user — cost attributed per user (null user_id rolls up as system)
      pool.query(`
        SELECT
          l.user_id,
          COALESCE(u.username, '(system)')     AS username,
          COUNT(*)::int                        AS calls,
          COALESCE(SUM(l.input_tokens), 0)::int  AS input_tokens,
          COALESCE(SUM(l.output_tokens), 0)::int AS output_tokens,
          COALESCE(SUM(l.cost_usd), 0)::numeric  AS cost_usd
        FROM ai_usage_log l
        LEFT JOIN users u ON u.id = l.user_id
        GROUP BY l.user_id, u.username
        ORDER BY cost_usd DESC
        LIMIT 50
      `),

      // Most recent 20 calls
      pool.query(`
        SELECT
          l.id,
          l.feature,
          l.model,
          l.input_tokens,
          l.output_tokens,
          l.cost_usd,
          l.created_at,
          u.username
        FROM ai_usage_log l
        LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.created_at DESC
        LIMIT 20
      `),
    ]);

    res.json({
      totals: totals.rows[0],
      byFeature: byFeature.rows,
      byDay: byDay.rows,
      byModel: byModel.rows,
      byUser: byUser.rows,
      recent: recent.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
