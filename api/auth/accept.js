import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { field } = req.query; // 'tandc' or 'onboarding'
  const pool = getPool();

  const col = field === 'onboarding' ? 'onboarding_complete' : 'tandc_accepted';
  try {
    await pool.query(`UPDATE users SET ${col} = TRUE WHERE id = $1`, [user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
