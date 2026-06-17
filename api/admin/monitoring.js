import { cors, verifyToken, isAdminKey } from '../_auth.js';
import { getPool } from '../_db.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  // Accept either a valid admin JWT or the server-to-server admin key
  const user = verifyToken(req);
  if (!user?.is_admin && !isAdminKey(req)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const db = await getPool().connect();
  try {
    const activation = {
      sentry_client:  !!process.env.VITE_SENTRY_DSN,
      posthog:        !!process.env.VITE_POSTHOG_KEY,
      sentry_server:  !!process.env.SENTRY_DSN,
      resend:         !!process.env.PHREEZER_RESEND_API_KEY,
      etsy_oauth:     !!process.env.ETSY_ACCESS_TOKEN,
      anthropic:      !!process.env.ANTHROPIC_API_KEY,
      phishnet:       !!process.env.PHISH_NET_API_KEY,
    };

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

    const userStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE email_verified = true) as verified,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
      FROM users
    `).catch(() => ({ rows: [{ total: 0, verified: 0, last_7d: 0, last_24h: 0 }] }));

    const ratingStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT show_date) as shows_rated,
        COUNT(DISTINCT user_id) as raters,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d
      FROM ratings
    `).catch(() => ({ rows: [{ total: 0, shows_rated: 0, raters: 0, last_24h: 0, last_7d: 0 }] }));

    const donations = await db.query(`
      SELECT items_sold, donation_total FROM donation_tracker WHERE id = 1
    `).catch(() => ({ rows: [] }));

    const feedbackStats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE is_read = false) as unread
      FROM feedback
    `).catch(() => ({ rows: [{ total: 0, last_7d: 0, unread: 0 }] }));

    // Knowledge base catalog status
    const kbStats = await Promise.all([
      db.query(`SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM pn_songs`).catch(() => ({ rows: [{ count: 0, last_updated: null }] })),
      db.query(`SELECT COUNT(*) as count, MAX(updated_at) as last_updated, COUNT(*) FILTER (WHERE pn_rating IS NOT NULL) as with_rating FROM pn_shows`).catch(() => ({ rows: [{ count: 0, last_updated: null, with_rating: 0 }] })),
      db.query(`SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM pn_reviews`).catch(() => ({ rows: [{ count: 0, last_updated: null }] })),
      db.query(`SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM jamchart_entries`).catch(() => ({ rows: [{ count: 0, last_updated: null }] })),
    ]);

    const knowledge_base = {
      songs:     { count: parseInt(kbStats[0].rows[0]?.count || 0), last_updated: kbStats[0].rows[0]?.last_updated, label: 'Song catalog', desc: 'Play counts, debut dates, gaps. Refresh monthly.' },
      shows:     { count: parseInt(kbStats[1].rows[0]?.count || 0), with_rating: parseInt(kbStats[1].rows[0]?.with_rating || 0), last_updated: kbStats[1].rows[0]?.last_updated, label: 'Show catalog', desc: 'Venues, tours, community ratings. Refresh monthly.' },
      reviews:   { count: parseInt(kbStats[2].rows[0]?.count || 0), last_updated: kbStats[2].rows[0]?.last_updated, label: 'Fan reviews', desc: 'Phan-written show reviews. Refresh after major tours.' },
      jamcharts: { count: parseInt(kbStats[3].rows[0]?.count || 0), last_updated: kbStats[3].rows[0]?.last_updated, label: 'Jamchart entries', desc: 'Auto-refreshes every Monday via cron.' },
    };

    res.json({
      activation,
      email: { by_type: emailLog.rows, recent: lastEmail.rows },
      ai: { today: aiToday.rows, seven_day: ai7d.rows[0], thirty_day: ai30d.rows[0] },
      users: userStats.rows[0],
      ratings: ratingStats.rows[0],
      donations: donations.rows[0] || { items_sold: 0, donation_total: 0 },
      feedback: feedbackStats.rows[0],
      knowledge_base,
    });
  } finally {
    db.release();
  }
}
