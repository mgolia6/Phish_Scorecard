import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  // Ensure notified_at column exists
  await pool.query(`ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP`);

  // GET — return unseen badges
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT badge_key, badge_label, awarded_at
       FROM user_badges
       WHERE user_id = $1 AND notified_at IS NULL
       ORDER BY awarded_at ASC`,
      [user.id]
    );
    return res.json({ badges: result.rows });
  }

  // POST — mark badges as seen
  if (req.method === 'POST') {
    const { badge_keys } = req.body;
    if (!badge_keys?.length) return res.json({ ok: true });
    await pool.query(
      `UPDATE user_badges SET notified_at = NOW()
       WHERE user_id = $1 AND badge_key = ANY($2)`,
      [user.id, badge_keys]
    );
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
