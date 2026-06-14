import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();

  // Allow anonymous passive feedback — token optional
  const user = verifyToken(req);
  const userId = user ? user.id : null;

  const { trigger_type, section, answers, free_text } = req.body;

  if (!trigger_type) return res.status(400).json({ error: 'trigger_type required' });

  const validTriggers = ['post_rating', 'week1', 'passive'];
  if (!validTriggers.includes(trigger_type)) {
    return res.status(400).json({ error: 'Invalid trigger_type' });
  }

  try {
    if (trigger_type !== 'passive' && userId) {
      const existing = await pool.query(
        'SELECT id FROM feedback WHERE user_id = $1 AND trigger_type = $2',
        [userId, trigger_type]
      );
      if (existing.rows.length > 0) {
        return res.json({ ok: true, skipped: true, reason: 'already_submitted' });
      }
    }

    await pool.query(
      `INSERT INTO feedback (user_id, trigger_type, section, answers, free_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, trigger_type, section || null, JSON.stringify(answers || {}), free_text || null]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
