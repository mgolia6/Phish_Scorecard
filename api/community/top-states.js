import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT
        s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.show_date) as show_count,
        COUNT(DISTINCT s.venue) as venue_count,
        COUNT(DISTINCT r.user_id) as unique_raters
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL AND s.state IS NOT NULL AND s.state != ''
      GROUP BY s.state
      ORDER BY avg_score DESC, show_count DESC
    `);

    const rows = await Promise.all(result.rows.map(async (st) => {
      // Top venue in this state
      const topVenue = await pool.query(`
        SELECT s.venue, ROUND(AVG(r.rating)::numeric, 2) as avg_score
        FROM ratings r JOIN shows s ON r.show_date = s.show_date
        WHERE r.rating IS NOT NULL AND s.state = $1
        GROUP BY s.venue ORDER BY avg_score DESC LIMIT 1
      `, [st.state]);
      // Top show in this state
      const topShow = await pool.query(`
        SELECT TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date, s.venue,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score
        FROM ratings r JOIN shows s ON r.show_date = s.show_date
        WHERE r.rating IS NOT NULL AND s.state = $1
        GROUP BY r.show_date, s.venue ORDER BY avg_score DESC LIMIT 1
      `, [st.state]);
      return {
        ...st,
        show_count: parseInt(st.show_count),
        venue_count: parseInt(st.venue_count),
        unique_raters: parseInt(st.unique_raters),
        top_venue: topVenue.rows[0]?.venue || null,
        top_show: topShow.rows[0] || null,
      };
    }));

    const statsRes = await pool.query(`
      SELECT COUNT(DISTINCT s.state) as states_covered
      FROM ratings r JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL AND s.state IS NOT NULL AND s.state != ''
    `);

    res.json({
      states: rows,
      stats: {
        states_covered: parseInt(statsRes.rows[0]?.states_covered || 0),
        top_state: rows[0] || null,
        bottom_state: rows[rows.length - 1] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
