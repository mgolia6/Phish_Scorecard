// POST /api/community/companions — mark/unmark a show companion
// GET  /api/community/companions?with_user_id=X&show_dates=d1,d2,... — fetch companion status

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS show_companions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    companion_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, companion_user_id, show_date)
  );
  CREATE INDEX IF NOT EXISTS idx_show_companions_user ON show_companions(user_id);
  CREATE INDEX IF NOT EXISTS idx_show_companions_companion ON show_companions(companion_user_id);
  CREATE INDEX IF NOT EXISTS idx_show_companions_date ON show_companions(show_date);
`;

let initialized = false;

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  try {
    if (!initialized) {
      await pool.query(INIT_SQL);
      initialized = true;
    }

    // GET — fetch companion status for a list of show dates with a specific user
    if (req.method === 'GET') {
      const { with_user_id, show_dates } = req.query;
      if (!with_user_id || !show_dates) return res.status(400).json({ error: 'with_user_id and show_dates required' });

      const dates = show_dates.split(',').filter(Boolean);
      if (!dates.length) return res.json({ companions: {} });

      const companionId = parseInt(with_user_id);

      // Fetch marks from both sides
      const result = await pool.query(`
        SELECT show_date,
          bool_or(user_id = $1) AS i_marked,
          bool_or(user_id = $2) AS they_marked
        FROM show_companions
        WHERE show_date = ANY($3)
          AND (
            (user_id = $1 AND companion_user_id = $2)
            OR
            (user_id = $2 AND companion_user_id = $1)
          )
        GROUP BY show_date
      `, [user.id, companionId, dates]);

      const companions = {};
      result.rows.forEach(row => {
        companions[row.show_date] = {
          i_marked: row.i_marked,
          they_marked: row.they_marked,
          mutual: row.i_marked && row.they_marked,
        };
      });

      return res.json({ companions });
    }

    // POST — toggle companion mark for a show
    if (req.method === 'POST') {
      const { companion_user_id, show_date } = req.body;
      if (!companion_user_id || !show_date) return res.status(400).json({ error: 'companion_user_id and show_date required' });
      if (companion_user_id === user.id) return res.status(400).json({ error: 'Cannot companion yourself' });

      // Check if already marked
      const existing = await pool.query(
        'SELECT id FROM show_companions WHERE user_id = $1 AND companion_user_id = $2 AND show_date = $3',
        [user.id, companion_user_id, show_date]
      );

      let i_marked;
      if (existing.rows.length) {
        // Unmark
        await pool.query(
          'DELETE FROM show_companions WHERE user_id = $1 AND companion_user_id = $2 AND show_date = $3',
          [user.id, companion_user_id, show_date]
        );
        i_marked = false;
      } else {
        // Mark
        await pool.query(
          'INSERT INTO show_companions (user_id, companion_user_id, show_date) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.id, companion_user_id, show_date]
        );
        i_marked = true;
      }

      // Check if now mutual
      const theirMark = await pool.query(
        'SELECT id FROM show_companions WHERE user_id = $1 AND companion_user_id = $2 AND show_date = $3',
        [companion_user_id, user.id, show_date]
      );
      const they_marked = theirMark.rows.length > 0;

      return res.json({ i_marked, they_marked, mutual: i_marked && they_marked });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[companions] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
