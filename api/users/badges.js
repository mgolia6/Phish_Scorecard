import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const pool = getPool();
  const result = await pool.query(
    'SELECT badge_key, badge_label, awarded_at FROM user_badges WHERE user_id = $1 ORDER BY awarded_at ASC',
    [user_id]
  );

  res.json({ badges: result.rows });
}
