import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT 
        song_name,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*) as total_ratings
       FROM ratings
       WHERE rating IS NOT NULL
       GROUP BY song_name
       HAVING COUNT(*) >= 1
       ORDER BY average_rating DESC, total_ratings DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
