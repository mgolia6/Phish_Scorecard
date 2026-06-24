// POST /api/admin/send-email
// Admin-only manual email trigger.
//   { mode: 'all' }                  → runs the full lifecycle cron for everyone
//   { mode: 'one', userId, type }    → sends one specific email to one user
// Manual sends bypass the email_log dedup (admin override) so you can resend.

import { verifyToken, cors } from '../_auth.js';
import { getPool } from '../_db.js';
import {
  sendEmail,
  onboardingEmail,
  day3NudgeEmail,
  day7EngageEmail,
  day30ReengageEmail,
  milestoneEmail,
  ratingReminderEmail,
  weeklyReminderEmail,
} from '../_email.js';

const APP_URL = 'https://phreezer.mpgink.com';

function genToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 48; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = verifyToken(req);
  if (!admin?.is_admin) return res.status(403).json({ error: 'Admin only' });

  const { mode, userId, type, milestone } = req.body || {};
  const pool = getPool();

  try {
    // ── EN MASSE — run the lifecycle cron for everyone ──
    if (mode === 'all') {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL;
      const r = await fetch(`${baseUrl}/api/emails/cron`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ error: 'Cron run failed', detail: result });
      return res.json({ ok: true, ran: 'lifecycle-all', ...result });
    }

    // ── INDIVIDUAL — send one email to one user ──
    if (mode === 'one') {
      if (!userId || !type) return res.status(400).json({ error: 'userId and type required' });

      const uRes = await pool.query(
        'SELECT id, email, username, unsubscribe_token FROM users WHERE id = $1',
        [userId]
      );
      if (!uRes.rows.length) return res.status(404).json({ error: 'User not found' });
      const u = uRes.rows[0];

      const showsRated = parseInt((await pool.query(
        'SELECT COUNT(DISTINCT show_date) AS c FROM ratings WHERE user_id = $1 AND rating IS NOT NULL',
        [userId]
      )).rows[0].c, 10);
      const showsAttended = parseInt((await pool.query(
        'SELECT COUNT(DISTINCT show_date) AS c FROM attendance WHERE user_id = $1',
        [userId]
      )).rows[0].c, 10);

      let tpl;
      let unsubscribeUrl;
      switch (type) {
        case 'onboarding':     tpl = onboardingEmail(u.username); break;
        case 'day3_nudge':     tpl = day3NudgeEmail(u.username); break;
        case 'day7_engage':    tpl = day7EngageEmail(u.username, showsRated || 1); break;
        case 'day30_reengage': tpl = day30ReengageEmail(u.username); break;
        case 'rating_reminder':tpl = ratingReminderEmail(u.username, showsAttended || 1); break;
        case 'milestone':      tpl = milestoneEmail(u.username, parseInt(milestone, 10) || 5); break;
        case 'weekly': {
          let token = u.unsubscribe_token;
          if (!token) {
            token = genToken();
            await pool.query('UPDATE users SET unsubscribe_token = $1 WHERE id = $2', [token, userId]);
          }
          unsubscribeUrl = `${APP_URL}/api/emails/unsubscribe?token=${token}`;
          tpl = weeklyReminderEmail(u.username, unsubscribeUrl);
          break;
        }
        default: return res.status(400).json({ error: `Unknown email type: ${type}` });
      }

      await sendEmail({ to: u.email, subject: tpl.subject, html: tpl.html, unsubscribeUrl });
      return res.json({ ok: true, sent: true, to: u.email, type });
    }

    return res.status(400).json({ error: 'mode must be "all" or "one"' });
  } catch (err) {
    console.error('Admin send-email error:', err);
    res.status(500).json({ error: err.message });
  }
}
