import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();

  // Auto-migrate feedback table
  if (req.method === 'GET' && req.query.action === 'migrate') {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          trigger_type VARCHAR(20) NOT NULL,
          section VARCHAR(50),
          answers JSONB NOT NULL DEFAULT '{}',
          free_text TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_trigger ON feedback(trigger_type);
        CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
      `);
      return res.json({ ok: true, message: 'feedback table ready' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    // Prevent duplicate survey submissions (post_rating and week1 are one-time)
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
