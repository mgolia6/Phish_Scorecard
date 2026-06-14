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
        TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date,
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.user_id) as rater_count,
        COUNT(r.id) as total_ratings
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
      GROUP BY s.show_date, s.venue, s.city, s.state
      HAVING COUNT(DISTINCT r.user_id) >= 1
      ORDER BY avg_score DESC, rater_count DESC
      LIMIT 25
    `);

    const rows = await Promise.all(result.rows.map(async (show) => {
      const songs = await pool.query(`
        SELECT song_name,
          ROUND(AVG(rating)::numeric, 2) as avg_score,
          COUNT(*) as ratings
        FROM ratings
        WHERE show_date = $1 AND rating IS NOT NULL
        GROUP BY song_name
        ORDER BY avg_score DESC, ratings DESC
        LIMIT 5
      `, [show.show_date]);
      return {
        ...show,
        rater_count: parseInt(show.rater_count),
        top_songs: songs.rows,
      };
    }));

    // Fixed stats — no cross join
    const statsRes = await pool.query(`
      SELECT
        COUNT(DISTINCT show_date) as shows_covered,
        ROUND(AVG(rating)::numeric, 2) as overall_avg
      FROM ratings
      WHERE rating IS NOT NULL
    `);

    const mostRatedRes = await pool.query(`
      SELECT s.venue, TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date, COUNT(DISTINCT r.user_id) as raters
      FROM ratings r JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
      GROUP BY r.show_date, s.venue
      ORDER BY raters DESC LIMIT 1
    `);

    const topShowRes = await pool.query(`
      SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date,
        ROUND(AVG(rating)::numeric, 2) as avg_score
      FROM ratings
      WHERE rating IS NOT NULL
      GROUP BY show_date
      ORDER BY avg_score DESC LIMIT 1
    `);

    res.json({
      shows: rows,
      stats: {
        shows_covered: parseInt(statsRes.rows[0]?.shows_covered || 0),
        overall_avg: statsRes.rows[0]?.overall_avg || null,
        most_rated: mostRatedRes.rows[0] || null,
        top_show: topShowRes.rows[0] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
