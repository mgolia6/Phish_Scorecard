import { getPool } from '../_db.js';
import { cors, verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();

  // Optional auth for user score delta
  let userId = null;
  try {
    const decoded = verifyToken(req);
    if (decoded) userId = decoded.id;
  } catch (e) {}

  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date,
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as avg_score,
        COUNT(DISTINCT r.user_id) as rater_count,
        COUNT(r.id) as total_ratings,
        COUNT(DISTINCT r.song_name) as song_count,
        COUNT(DISTINCT r.set_number) as set_count,
        -- Set breakdown: songs per set
        COUNT(r.id) FILTER (WHERE r.set_number = '1') as set1_count,
        COUNT(r.id) FILTER (WHERE r.set_number = '2') as set2_count,
        COUNT(r.id) FILTER (WHERE r.set_number IN ('e','E','encore')) as encore_count,
        -- Day of week
        TO_CHAR(s.show_date, 'Dy') as day_of_week,
        EXTRACT(DOW FROM s.show_date) as dow_num
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
        SELECT song_name, set_number,
          ROUND(AVG(rating)::numeric, 2) as avg_score,
          COUNT(*) as ratings
        FROM ratings
        WHERE show_date = $1 AND rating IS NOT NULL
        GROUP BY song_name, set_number
        ORDER BY avg_score DESC, ratings DESC
        LIMIT 5
      `, [show.show_date]);

      // User's own score for this show
      let user_score = null;
      let user_delta = null;
      if (userId) {
        const userRes = await pool.query(`
          SELECT ROUND(AVG(rating)::numeric, 2) as avg
          FROM ratings WHERE show_date = $1 AND user_id = $2 AND rating IS NOT NULL
        `, [show.show_date, userId]);
        user_score = userRes.rows[0]?.avg || null;
        if (user_score && show.avg_score) {
          user_delta = Math.round((parseFloat(user_score) - parseFloat(show.avg_score)) * 10) / 10;
        }
      }

      return {
        ...show,
        rater_count: parseInt(show.rater_count),
        song_count: parseInt(show.song_count || 0),
        set_count: parseInt(show.set_count || 0),
        set1_count: parseInt(show.set1_count || 0),
        set2_count: parseInt(show.set2_count || 0),
        encore_count: parseInt(show.encore_count || 0),
        user_score,
        user_delta,
        top_songs: songs.rows,
      };
    }));

    const statsRes = await pool.query(`
      SELECT
        COUNT(DISTINCT show_date) as shows_covered,
        ROUND(AVG(rating)::numeric, 2) as overall_avg
      FROM ratings WHERE rating IS NOT NULL
    `);

    const mostRatedRes = await pool.query(`
      SELECT s.venue, TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date, COUNT(DISTINCT r.user_id) as raters
      FROM ratings r JOIN shows s ON r.show_date = s.show_date
      WHERE r.rating IS NOT NULL
      GROUP BY r.show_date, s.venue ORDER BY raters DESC LIMIT 1
    `);

    res.json({
      shows: rows,
      stats: {
        shows_covered: parseInt(statsRes.rows[0]?.shows_covered || 0),
        overall_avg: statsRes.rows[0]?.overall_avg || null,
        most_rated: mostRatedRes.rows[0] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
