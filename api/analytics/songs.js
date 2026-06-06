import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT
        r.song_name,
        ROUND(AVG(r.rating)::numeric, 2) as average_rating,
        COUNT(*) as total_ratings
      FROM ratings r
      WHERE r.user_id = $1 AND r.rating IS NOT NULL
      GROUP BY r.song_name
      HAVING COUNT(*) >= 1
      ORDER BY average_rating DESC, total_ratings DESC
      LIMIT 50
    `, [user.id]);

    // For each song, get user's top-rated versions (show dates)
    const rows = await Promise.all(result.rows.map(async (song) => {
      const versions = await pool.query(`
        SELECT
          TO_CHAR(r.show_date, 'YYYY-MM-DD') as show_date,
          s.venue, s.city,
          r.rating,
          r.notes
        FROM ratings r
        LEFT JOIN shows s ON s.show_date = r.show_date
        WHERE r.user_id = $1 AND r.song_name = $2 AND r.rating IS NOT NULL
        ORDER BY r.rating DESC, r.show_date DESC
        LIMIT 5
      `, [user.id, song.song_name]);
      return { ...song, versions: versions.rows };
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
