// POST /api/emails/onboarding
// Called internally after email verification is confirmed.
// Sends the welcome/onboarding email to the newly verified user.

import { getPool } from '../_db.js';
import { cors } from '../_auth.js';
import { sendEmail, onboardingEmail } from '../_email.js';

async function ensureEmailLog(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email_type VARCHAR(64) NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, email_type)
    )
  `);
}

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  await ensureEmailLog(pool);

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const userRes = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1 AND email_verified = TRUE',
      [userId]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Verified user not found' });

    const user = userRes.rows[0];

    // Idempotency — don't send twice
    const already = await pool.query(
      'SELECT id FROM email_log WHERE user_id = $1 AND email_type = $2',
      [user.id, 'onboarding']
    );
    if (already.rows.length) return res.json({ skipped: true, reason: 'already sent' });

    const { subject, html } = onboardingEmail(user.username);
    await sendEmail({ to: user.email, subject, html });

    await pool.query(
      'INSERT INTO email_log (user_id, email_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, 'onboarding']
    );

    res.json({ sent: true, to: user.email });
  } catch (err) {
    console.error('Onboarding email error:', err);
    res.status(500).json({ error: err.message });
  }
}
