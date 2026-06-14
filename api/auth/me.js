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
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name,
              is_admin, tandc_accepted, onboarding_complete, created_at, avatar_icon
       FROM users WHERE id = $1`,
      [user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({
      ...u,
      is_admin: !!u.is_admin,
      tandc_accepted: !!u.tandc_accepted,
      onboarding_complete: !!u.onboarding_complete,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
