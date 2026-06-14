import { cors, verifyToken } from '../_auth.js';
import { getPool } from '../_db.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

  const db = await getPool().connect();
  try {
    // --- Activation status ---
    const activation = {
      sentry_client:  !!process.env.VITE_SENTRY_DSN,
      posthog:        !!process.env.VITE_POSTHOG_KEY,
      sentry_server:  !!process.env.SENTRY_DSN,
      resend:         !!process.env.RESEND_API_KEY,
      etsy_oauth:     !!process.env.ETSY_ACCESS_TOKEN,
      anthropic:      !!process.env.ANTHROPIC_API_KEY,
      phishnet:       !!process.env.PHISH_NET_API_KEY,
    };

    // --- Email log: last run + counts ---
    const emailLog = await db.query(`
      SELECT email_type, COUNT(*) as count, MAX(sent_at) as last_sent
      FROM email_log
      GROUP BY email_type
      ORDER BY MAX(sent_at) DESC
    `).catch(() => ({ rows: [] }));

    const lastEmail = await db.query(`
      SELECT email_type, sent_at, user_id
      FROM email_log
      ORDER BY sent_at DESC
      LIMIT 5
    `).catch(() => ({ rows: [] }));

    // --- AI usage: today + 7d + 30d ---
    const aiToday = await db.query(`
      SELECT feature, COUNT(*) as calls, SUM(cost_usd) as cost
      FROM ai_usage_log
      WHERE created_at >= NOW() - INTERVAL '1 day'
      GROUP BY feature
    `).catch(() => ({ rows: [] }));

    const ai7d = await db.query(`
      SELECT COUNT(*) as calls, COALESCE(SUM(cost_usd),0) as cost
      FROM ai_usage_log
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `).catch(() => ({ rows: [{ calls: 0, cost: 0 }] }));

    const ai30d = await db.query(`
      SELECT COUNT(*) as calls, COALESCE(SUM(cost_usd),0) as cost
      FROM ai_usage_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `).catch(() => ({ rows: [{ calls: 0, cost: 0 }] }));

    // --- User growth ---
    const userStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_verified) as verified,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
      FROM users
    `).catch(() => ({ rows: [{ total: 0, verified: 0, last_7d: 0, last_24h: 0 }] }));

    // --- Rating activity ---
    const ratingStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d
      FROM ratings
    `).catch(() => ({ rows: [{ total: 0, last_24h: 0, last_7d: 0 }] }));

    // --- Donation tracker ---
    const donations = await db.query(`
      SELECT items_sold, donation_total FROM donation_tracker WHERE id = 1
    `).catch(() => ({ rows: [] }));

    // --- Feedback inbox ---
    const feedbackStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE is_read = false) as unread
      FROM feedback
    `).catch(() => ({ rows: [{ total: 0, last_7d: 0, unread: 0 }] }));

    res.json({
      activation,
      email: {
        by_type: emailLog.rows,
        recent: lastEmail.rows,
      },
      ai: {
        today: aiToday.rows,
        seven_day: ai7d.rows[0],
        thirty_day: ai30d.rows[0],
      },
      users: userStats.rows[0],
      ratings: ratingStats.rows[0],
      donations: donations.rows[0] || { items_sold: 0, donation_total: 0 },
      feedback: feedbackStats.rows[0],
    });
  } finally {
    db.release();
  }
}
