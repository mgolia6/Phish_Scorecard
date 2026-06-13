// GET /api/emails/cron
// Daily cron job — checks all cadence conditions and fires emails.
// Secured with CRON_SECRET header.
//
// Cadence:
//   day3_nudge    — 3+ days since signup, 0 ratings, not yet sent
//   day7_engage   — 7+ days since signup, 1+ ratings, not yet sent
//   day30_reengage — inactive 30+ days (no login), not yet sent in last 60 days
//   milestone_5   — exactly crossed 5 shows rated
//   milestone_25  — exactly crossed 25 shows rated
//   milestone_50  — exactly crossed 50 shows rated

import { getPool } from '../_db.js';
import { cors } from '../_auth.js';
import {
  sendEmail,
  day3NudgeEmail,
  day7EngageEmail,
  day30ReengageEmail,
  milestoneEmail,
} from '../_email.js';

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

async function alreadySent(pool, userId, emailType) {
  const r = await pool.query(
    'SELECT id FROM email_log WHERE user_id = $1 AND email_type = $2',
    [userId, emailType]
  );
  return r.rows.length > 0;
}

async function logSent(pool, userId, emailType) {
  await pool.query(
    'INSERT INTO email_log (user_id, email_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, emailType]
  );
}

async function fire(pool, user, emailType, emailFn, ...args) {
  if (await alreadySent(pool, user.id, emailType)) return { skipped: true };
  const { subject, html } = emailFn(user.username, ...args);
  await sendEmail({ to: user.email, subject, html });
  await logSent(pool, user.id, emailType);
  return { sent: true, to: user.email, type: emailType };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth — must provide CRON_SECRET
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pool = getPool();
  await ensureEmailLog(pool);

  const results = [];

  try {
    // ── All verified users with key stats ──────────────────────────────────────
    const usersRes = await pool.query(`
      SELECT
        u.id, u.email, u.username, u.created_at, u.last_login_date,
        COUNT(DISTINCT r.show_date) AS shows_rated
      FROM users u
      LEFT JOIN ratings r ON r.user_id = u.id
      WHERE u.email_verified = TRUE
      GROUP BY u.id
    `);

    const now = new Date();

    for (const user of usersRes.rows) {
      const daysSinceSignup = (now - new Date(user.created_at)) / 86400000;
      const daysSinceLogin = user.last_login_date
        ? (now - new Date(user.last_login_date)) / 86400000
        : daysSinceSignup;
      const showsRated = parseInt(user.shows_rated, 10);

      // Day 3 nudge — no ratings yet
      if (daysSinceSignup >= 3 && showsRated === 0) {
        const r = await fire(pool, user, 'day3_nudge', day3NudgeEmail);
        results.push(r);
      }

      // Day 7 engage — has ratings
      if (daysSinceSignup >= 7 && showsRated >= 1) {
        const r = await fire(pool, user, 'day7_engage', day7EngageEmail, showsRated);
        results.push(r);
      }

      // Day 30 re-engage — inactive 30+ days
      // Uses a separate key so it can fire again after 60 days if they go dark again
      if (daysSinceLogin >= 30) {
        const recentLog = await pool.query(
          `SELECT id FROM email_log WHERE user_id = $1 AND email_type = 'day30_reengage'
           AND sent_at > NOW() - INTERVAL '60 days'`,
          [user.id]
        );
        if (!recentLog.rows.length) {
          const { subject, html } = day30ReengageEmail(user.username);
          await sendEmail({ to: user.email, subject, html });
          // Delete old log entry so the 60-day window resets
          await pool.query(
            `DELETE FROM email_log WHERE user_id = $1 AND email_type = 'day30_reengage'`,
            [user.id]
          );
          await logSent(pool, user.id, 'day30_reengage');
          results.push({ sent: true, to: user.email, type: 'day30_reengage' });
        }
      }

      // Milestone emails — 5, 25, 50
      for (const milestone of [5, 25, 50]) {
        if (showsRated >= milestone) {
          const r = await fire(pool, user, `milestone_${milestone}`, milestoneEmail, milestone);
          results.push(r);
        }
      }
    }

    const sent = results.filter(r => r.sent).length;
    const skipped = results.filter(r => r.skipped).length;
    res.json({ ok: true, sent, skipped, total: results.length });

  } catch (err) {
    console.error('Email cron error:', err);
    res.status(500).json({ error: err.message });
  }
}
