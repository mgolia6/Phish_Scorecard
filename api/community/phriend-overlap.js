// GET /api/community/phriend-overlap?username=other_user
// Returns shows both the current user and target user attended
// Also returns aggregate: total shared, venues, years

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });

  const pool = getPool();

  const targetRes = await pool.query('SELECT id, username FROM users WHERE username = $1', [username]);
  if (!targetRes.rows.length) return res.status(404).json({ error: 'User not found' });
  const target = targetRes.rows[0];

  // Shows both attended
  const overlapRes = await pool.query(`
    SELECT
      a.show_date,
      s.venue,
      s.city,
      s.state,
      ur.overall_rating AS my_score,
      tr.overall_rating AS their_score
    FROM user_show_attendance a
    JOIN user_show_attendance b
      ON b.show_date = a.show_date
      AND b.attendance_type = 'attended'
      AND b.user_id = $2
    LEFT JOIN shows s ON s.showdate = a.show_date
    LEFT JOIN (
      SELECT show_date, AVG(rating)::numeric(4,2) AS overall_rating
      FROM ratings WHERE user_id = $1
      GROUP BY show_date
    ) ur ON ur.show_date = a.show_date
    LEFT JOIN (
      SELECT show_date, AVG(rating)::numeric(4,2) AS overall_rating
      FROM ratings WHERE user_id = $2
      GROUP BY show_date
    ) tr ON tr.show_date = a.show_date
    WHERE a.user_id = $1 AND a.attendance_type = 'attended'
    ORDER BY a.show_date DESC
  `, [user.id, target.id]);

  const shows = overlapRes.rows;
  const total = shows.length;
  const venues = [...new Set(shows.map(s => s.venue).filter(Boolean))].length;
  const years = [...new Set(shows.map(s => s.show_date?.slice(0,4)).filter(Boolean))].length;

  return res.json({
    target: { user_id: target.id, username: target.username },
    total_shared: total,
    unique_venues: venues,
    unique_years: years,
    shows,
  });
}
