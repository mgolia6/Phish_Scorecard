import { getPool } from '../_db.js';
import { cors, verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();

  // Optional auth for "I WAS THERE" / "I RATED" tags
  let userId = null;
  try {
    const decoded = verifyToken(req);
    if (decoded) userId = decoded.id;
  } catch (e) {}

  try {
    const result = await pool.query(`
      SELECT
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.show_date) as show_count,
        COUNT(DISTINCT r.user_id) as unique_raters,
        COUNT(r.id) as total_ratings,
        -- Day of week breakdown
        MODE() WITHIN GROUP (ORDER BY TO_CHAR(s.show_date, 'Dy')) as most_common_dow,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM s.show_date) = 0) as sun_count,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM s.show_date) = 5) as fri_count,
        COUNT(*) FILTER (WHERE EXTRACT(DOW FROM s.show_date) = 6) as sat_count
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
      GROUP BY s.venue, s.city, s.state
      HAVING COUNT(DISTINCT r.show_date) >= 1
      ORDER BY avg_score DESC, show_count DESC
      LIMIT 25
    `);

    const rows = await Promise.all(result.rows.map(async (venue) => {
      const topShows = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          TO_CHAR(r.show_date, 'Dy') as day_of_week,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(DISTINCT r.user_id) as raters
        FROM ratings r
        JOIN shows s ON r.show_date = s.show_date
        WHERE s.venue = $1 AND r.rating IS NOT NULL
        GROUP BY r.show_date
        ORDER BY avg_score DESC
        LIMIT 5
      `, [venue.venue]);

      // User-specific: did they attend / rate any show here?
      let user_rated = false;
      let user_was_there = false;
      let user_show_count = 0;
      if (userId) {
        const userRes = await pool.query(`
          SELECT COUNT(DISTINCT r.show_date) as rated_count
          FROM ratings r
          JOIN shows s ON r.show_date = s.show_date
          WHERE s.venue = $1 AND r.user_id = $2 AND r.rating IS NOT NULL
        `, [venue.venue, userId]);
        user_show_count = parseInt(userRes.rows[0]?.rated_count || 0);
        user_rated = user_show_count > 0;

        // "I WAS THERE" = user has attendance marked for a show at this venue
        const attendRes = await pool.query(`
          SELECT COUNT(*) as cnt
          FROM user_show_attendance usa
          JOIN shows s ON usa.show_date = s.show_date
          WHERE s.venue = $1 AND usa.user_id = $2
        `, [venue.venue, userId]).catch(() => ({ rows: [{ cnt: 0 }] }));
        user_was_there = parseInt(attendRes.rows[0]?.cnt || 0) > 0;
      }

      return {
        ...venue,
        show_count: parseInt(venue.show_count),
        unique_raters: parseInt(venue.unique_raters),
        total_ratings: parseInt(venue.total_ratings),
        sun_count: parseInt(venue.sun_count || 0),
        fri_count: parseInt(venue.fri_count || 0),
        sat_count: parseInt(venue.sat_count || 0),
        user_rated,
        user_was_there,
        user_show_count,
        top_shows: topShows.rows,
      };
    }));

    const statesRes = await pool.query(`
      SELECT
        s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.show_date) as show_count
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL AND s.state IS NOT NULL AND s.state != ''
      GROUP BY s.state ORDER BY avg_score DESC
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
