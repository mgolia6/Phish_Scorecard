import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT
          u.id, u.username, u.email, u.first_name, u.is_admin,
          u.tandc_accepted, u.onboarding_complete,
          TO_CHAR(u.created_at, 'YYYY-MM-DD') as joined,
          COUNT(DISTINCT a.show_date) as shows_attended,
          COUNT(DISTINCT r.show_date) as shows_rated,
          COUNT(DISTINCT ur.id) as reviews
         FROM users u
         LEFT JOIN attendance a ON a.user_id = u.id
         LEFT JOIN ratings r ON r.user_id = u.id
         LEFT JOIN user_reviews ur ON ur.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
