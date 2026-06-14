import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { field } = req.query;
  const pool = getPool();

  const colMap = {
    tandc:      'tandc_accepted',
    onboarding: 'onboarding_complete',
    tour:       'tour_completed',
  };

  const col = colMap[field];
  if (!col) return res.status(400).json({ error: 'Unknown field' });

  try {
    // Lazy-add tour_completed column if it doesn't exist
    if (field === 'tour') {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE').catch(() => {});
    }
    await pool.query(`UPDATE users SET ${col} = TRUE WHERE id = $1`, [user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
