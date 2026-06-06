import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const { id, action } = req.query;
  if (!id) return res.status(400).json({ error: 'User ID required' });

  const pool = getPool();

  // DELETE user — full cascade
  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM ratings WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM attendance WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM user_reviews WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM user_stats WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM show_companions WHERE user_id = $1 OR companion_user_id = $1', [id]);
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      res.json({ ok: true, deleted: parseInt(id) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    // Reset onboarding + T&C flags AND clear profile fields so setup modal starts fresh
    if (action === 'reset-onboarding') {
      try {
        await pool.query(`
          UPDATE users SET
            onboarding_complete = FALSE,
            tandc_accepted = FALSE,
            phishnet_username = NULL,
            favorite_song = NULL,
            favorite_venue = NULL,
            favorite_show_date = NULL
          WHERE id = $1
        `, [id]);
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
      return;
    }

    // Clear all show data + profile fields — full fresh start keeping only account credentials
    if (action === 'clear-data') {
      try {
        await pool.query('DELETE FROM ratings WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM attendance WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM user_reviews WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM user_stats WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM show_companions WHERE user_id = $1 OR companion_user_id = $1', [id]);
        await pool.query(`
          UPDATE users SET
            phishnet_username = NULL,
            favorite_song = NULL,
            favorite_venue = NULL,
            favorite_show_date = NULL,
            onboarding_complete = FALSE,
            tandc_accepted = FALSE
          WHERE id = $1
        `, [id]);
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
      return;
    }

    // Send password reset email via Resend
    if (action === 'reset-password') {
      try {
        const userRes = await pool.query('SELECT email, username FROM users WHERE id = $1', [id]);
        if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
        const target = userRes.rows[0];

        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000);

        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64), ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMP').catch(() => {});
        await pool.query('UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE id = $3', [token, expiry, id]);

        const resetUrl = `${process.env.APP_URL || 'https://phreezer.mpgink.com'}/reset-password?token=${token}`;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Phreezer <noreply@phreezer.mpgink.com>',
            to: target.email,
            subject: 'Phreezer — Password Reset',
            html: `<div style="background:#000;color:#33ff33;font-family:monospace;padding:32px;max-width:480px;"><h2 style="color:#ff6600;letter-spacing:3px;">PHREEZER</h2><p>Hey ${target.username},</p><p>A password reset was requested for your account.</p><p style="margin:24px 0;"><a href="${resetUrl}" style="background:#ff6600;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;letter-spacing:2px;">RESET PASSWORD</a></p><p style="color:rgba(51,255,51,0.4);font-size:0.8em;">Link expires in 1 hour.</p></div>`,
          }),
        });

        if (!emailRes.ok) {
          const err = await emailRes.json();
          return res.status(500).json({ error: err.message || 'Email send failed' });
        }

        res.json({ ok: true, email: target.email });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
      return;
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
