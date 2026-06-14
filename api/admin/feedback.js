import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user?.is_admin && !isAdminKey(req)) return res.status(403).json({ error: 'Forbidden' });

  const pool = getPool();
  const { trigger_type, section, limit = 100, offset = 0 } = req.query;

  try {
    let where = [];
    let params = [];
    let idx = 1;

    if (trigger_type) {
      where.push(`f.trigger_type = $${idx++}`);
      params.push(trigger_type);
    }
    if (section) {
      where.push(`f.section = $${idx++}`);
      params.push(section);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Summary counts
    const summary = await pool.query(`
      SELECT
        trigger_type,
        COUNT(*) as count
      FROM feedback
      GROUP BY trigger_type
      ORDER BY trigger_type
    `);

    const sectionSummary = await pool.query(`
      SELECT
        section,
        COUNT(*) as count
      FROM feedback
      WHERE trigger_type = 'passive' AND section IS NOT NULL
      GROUP BY section
      ORDER BY count DESC
    `);

    // Individual responses
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const rows = await pool.query(`
      SELECT
        f.id,
        f.trigger_type,
        f.section,
        f.answers,
        f.free_text,
        f.created_at,
        u.email,
        u.phishnet_username
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    const total = await pool.query(`
      SELECT COUNT(*) FROM feedback f ${whereClause}
    `, params.slice(0, -2));

    res.json({
      summary: summary.rows,
      section_summary: sectionSummary.rows,
      total: parseInt(total.rows[0].count),
      responses: rows.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
