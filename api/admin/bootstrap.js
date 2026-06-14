import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-bootstrap-secret'];
  if (secret !== process.env.BOOTSTRAP_SECRET) return res.status(403).json({ error: 'Forbidden' });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const pool = getPool();
  try {
    // Run migrations first
    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS tandc_accepted BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE',
    ];
    for (const sql of migrations) {
      await pool.query(sql).catch(() => {});
    }

    const result = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE username = $1 RETURNING id, username, email',
      [username]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
