import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.show_date) as show_count,
        COUNT(DISTINCT r.user_id) as unique_raters,
        COUNT(r.id) as total_ratings
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
      GROUP BY s.venue, s.city, s.state
      HAVING COUNT(DISTINCT r.show_date) >= 1
      ORDER BY avg_score DESC, show_count DESC
      LIMIT 25
    `);

    // For each venue, get its top-rated shows
    const rows = await Promise.all(result.rows.map(async (venue) => {
      const topShows = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(DISTINCT r.user_id) as raters
        FROM ratings r
        JOIN shows s ON r.show_date = s.show_date
        WHERE s.venue = $1 AND r.rating IS NOT NULL
        GROUP BY r.show_date
        ORDER BY avg_score DESC
        LIMIT 5
      `, [venue.venue]);
      return {
        ...venue,
        show_count: parseInt(venue.show_count),
        unique_raters: parseInt(venue.unique_raters),
        top_shows: topShows.rows,
      };
    }));

    // Aggregate by state for heatmap
    const statesRes = await pool.query(`
      SELECT
        s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.show_date) as show_count
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL AND s.state IS NOT NULL AND s.state != ''
      GROUP BY s.state
      ORDER BY avg_score DESC
    `);

    const statsRes = await pool.query(`
      SELECT COUNT(DISTINCT s.venue) as venues_rated, COUNT(DISTINCT s.state) as states_covered
      FROM ratings r JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
    `);

    res.json({
      venues: rows,
      states: statesRes.rows,
      stats: {
        venues_rated: parseInt(statsRes.rows[0]?.venues_rated || 0),
        states_covered: parseInt(statsRes.rows[0]?.states_covered || 0),
        top_venue: rows[0] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
