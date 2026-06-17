import { getPool } from '../_db.js';
import { cors, verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

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

  // Get first 20 verified users by signup date
  const usersRes = await pool.query(`
    SELECT id, username, created_at
    FROM users
    WHERE email_verified = TRUE
    ORDER BY created_at ASC
    LIMIT 20
  `);

  const users = usersRes.rows;
  if (!users.length) return res.json({ ok: true, assigned: [] });

  // Build bulk insert values — one query, no loop, no timeout risk
  const values = [];
  const params = [];
  const results = [];

  users.forEach((u, i) => {
    const rank = i + 1;
    const badgeKey   = rank <= 5 ? 'phab_phive'    : 'early_phreeze';
    const badgeLabel = rank <= 5 ? 'PHAB PHIVE'    : 'EARLY PHREEZE';
    const base = i * 3;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    params.push(u.id, badgeKey, badgeLabel);
    results.push({ rank, username: u.username, badge: badgeLabel });
  });

  await pool.query(
    `INSERT INTO user_badges (user_id, badge_key, badge_label)
     VALUES ${values.join(', ')}
     ON CONFLICT (user_id, badge_key) DO NOTHING`,
    params
  );

  res.json({ ok: true, assigned: results });
}
