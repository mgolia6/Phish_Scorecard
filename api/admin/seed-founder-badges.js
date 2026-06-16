import { getPool } from '../_db.js';
import { cors, verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const decoded = verifyToken(req);
    if (!decoded?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pool = getPool();

  // Ensure badges table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_key VARCHAR(64) NOT NULL,
      badge_label VARCHAR(128) NOT NULL,
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_key)
    )
  `);

  // Get users ordered by signup — first 20 verified users
  const usersRes = await pool.query(`
    SELECT id, username, created_at
    FROM users
    WHERE email_verified = TRUE
    ORDER BY created_at ASC
    LIMIT 20
  `);

  const results = [];
  for (let i = 0; i < usersRes.rows.length; i++) {
    const user = usersRes.rows[i];
    const rank = i + 1;
    const badgeKey = rank <= 5 ? 'phab_phive' : 'early_phreeze';
    const badgeLabel = rank <= 5 ? 'PHAB PHIVE' : 'EARLY PHREEZE';

    await pool.query(`
      INSERT INTO user_badges (user_id, badge_key, badge_label)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, badge_key) DO NOTHING
    `, [user.id, badgeKey, badgeLabel]);

    results.push({ rank, username: user.username, badge: badgeLabel });
  }

  res.json({ ok: true, assigned: results });
}
