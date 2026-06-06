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
        song_name,
        ROUND(AVG(rating)::numeric, 2) as avg_score,
        COUNT(*) as total_ratings,
        COUNT(DISTINCT user_id) as unique_raters
      FROM ratings
      WHERE rating IS NOT NULL
      GROUP BY song_name
      HAVING COUNT(*) >= 2
      ORDER BY avg_score DESC, total_ratings DESC
      LIMIT 25
    `);

    // For each song, get top-rated versions (show dates)
    const rows = await Promise.all(result.rows.map(async (song) => {
      const versions = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          s.venue, s.city, s.state,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(*) as ratings
        FROM ratings r
        JOIN shows s ON r.show_date = s.show_date
        WHERE r.song_name = $1 AND r.rating IS NOT NULL
        GROUP BY r.show_date, s.venue, s.city, s.state
        ORDER BY avg_score DESC, ratings DESC
        LIMIT 5
      `, [song.song_name]);
      return {
        ...song,
        total_ratings: parseInt(song.total_ratings),
        unique_raters: parseInt(song.unique_raters),
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
