// GET /api/community/user-search?q=partial_username
// Returns up to 10 users matching the query (for autocomplete)

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { q = '' } = req.query;
  const pool = getPool();

  try {
    const result = await pool.query(`
      SELECT username
      FROM users
      WHERE username ILIKE $1
        AND id != $2
        AND email_verified = true
      ORDER BY username ASC
      LIMIT 10
    `, [`%${q}%`, user.id]);

    return res.json({ users: result.rows.map(r => r.username) });
  } catch (err) {
    console.error('[user-search] error:', err.message);
    return res.status(500).json({ error: 'Search failed' });
  }
}
