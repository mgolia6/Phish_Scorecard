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
        song_name,
        ROUND(AVG(rating)::numeric, 2) as avg_score,
        COUNT(*) as total_ratings,
        COUNT(DISTINCT user_id) as unique_raters,
        -- By-set breakdown
        COUNT(*) FILTER (WHERE set_number = '1') as set1_ratings,
        COUNT(*) FILTER (WHERE set_number = '2') as set2_ratings,
        COUNT(*) FILTER (WHERE set_number = 'e' OR set_number = 'E' OR set_number = 'encore') as encore_ratings,
        ROUND(AVG(rating) FILTER (WHERE set_number = '1')::numeric, 2) as set1_avg,
        ROUND(AVG(rating) FILTER (WHERE set_number = '2')::numeric, 2) as set2_avg,
        ROUND(AVG(rating) FILTER (WHERE set_number = 'e' OR set_number = 'E' OR set_number = 'encore')::numeric, 2) as encore_avg,
        -- First and last played (by show date in our ratings)
        TO_CHAR(MIN(show_date), 'YYYY-MM-DD') as first_rated_date,
        TO_CHAR(MAX(show_date), 'YYYY-MM-DD') as last_rated_date,
        COUNT(DISTINCT show_date) as unique_shows_rated
      FROM ratings
      WHERE rating IS NOT NULL
      GROUP BY song_name
      HAVING COUNT(*) >= 2
      ORDER BY avg_score DESC, total_ratings DESC
      LIMIT 25
    `);

    const rows = await Promise.all(result.rows.map(async (song) => {
      const versions = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          s.venue, s.city, s.state,
          r.set_number,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(*) as ratings
        FROM ratings r
        JOIN shows s ON r.show_date = s.show_date
        WHERE r.song_name = $1 AND r.rating IS NOT NULL
        GROUP BY r.show_date, s.venue, s.city, s.state, r.set_number
        ORDER BY avg_score DESC, ratings DESC
        LIMIT 5
      `, [song.song_name]);

      // User's own avg for this song (if logged in)
      let user_avg = null;
      if (userId) {
        const userRes = await pool.query(`
          SELECT ROUND(AVG(rating)::numeric, 2) as avg
          FROM ratings WHERE song_name = $1 AND user_id = $2 AND rating IS NOT NULL
        `, [song.song_name, userId]);
        user_avg = userRes.rows[0]?.avg || null;
      }

      return {
        ...song,
        total_ratings: parseInt(song.total_ratings),
        unique_raters: parseInt(song.unique_raters),
        set1_ratings: parseInt(song.set1_ratings || 0),
        set2_ratings: parseInt(song.set2_ratings || 0),
        encore_ratings: parseInt(song.encore_ratings || 0),
        unique_shows_rated: parseInt(song.unique_shows_rated || 0),
        user_avg,
        top_versions: versions.rows,
      };
    }));

    const statsRes = await pool.query(`
      SELECT
        COUNT(DISTINCT song_name) as songs_rated,
        ROUND(AVG(rating)::numeric, 2) as overall_avg,
        COUNT(*) as total_ratings
      FROM ratings WHERE rating IS NOT NULL
    `);

    const mostRatedRes = await pool.query(`
      SELECT song_name, COUNT(*) as ratings
      FROM ratings WHERE rating IS NOT NULL
      GROUP BY song_name ORDER BY ratings DESC LIMIT 1
    `);

    res.json({
      songs: rows,
      stats: {
        songs_rated: parseInt(statsRes.rows[0]?.songs_rated || 0),
        overall_avg: statsRes.rows[0]?.overall_avg || null,
        total_ratings: parseInt(statsRes.rows[0]?.total_ratings || 0),
        most_rated: mostRatedRes.rows[0] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
