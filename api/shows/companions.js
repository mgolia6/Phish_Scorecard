// GET  /api/shows/companions?date=YYYY-MM-DD  — fetch companions for a show
// POST /api/shows/companions                  — tag a companion { show_date, companion_username }
// DELETE /api/shows/companions                — untag { show_date, companion_user_id }

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  // GET — return tagged companions + auto-detected overlaps for a show date
  if (req.method === 'GET') {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });

    // Intentional tags: people this user tagged
    const taggedRes = await pool.query(`
      SELECT sc.companion_user_id AS user_id, u.username, sc.created_at
      FROM show_companions sc
      JOIN users u ON u.id = sc.companion_user_id
      WHERE sc.user_id = $1 AND sc.show_date = $2
      ORDER BY u.username
    `, [user.id, date]);

    // Auto-detected: other Phreezer users who also marked attended on this date
    // (excludes already-tagged and self)
    const taggedIds = taggedRes.rows.map(r => r.user_id);
    const excludeIds = [user.id, ...taggedIds];
    const autoRes = await pool.query(`
      SELECT u.id AS user_id, u.username
      FROM user_show_attendance usa
      JOIN users u ON u.id = usa.user_id
      WHERE usa.show_date = $1
        AND usa.attendance_type = 'attended'
        AND usa.user_id <> ALL($2::int[])
      ORDER BY u.username
    `, [date, excludeIds]);

    return res.json({
      tagged: taggedRes.rows,
      also_attended: autoRes.rows,
    });
  }

  // POST — tag a companion by username
  if (req.method === 'POST') {
    const { show_date, companion_username } = req.body;
    if (!show_date || !companion_username) return res.status(400).json({ error: 'show_date and companion_username required' });

    const companion = await pool.query('SELECT id, username FROM users WHERE username = $1', [companion_username]);
    if (!companion.rows.length) return res.status(404).json({ error: 'User not found' });

    const c = companion.rows[0];
    if (c.id === user.id) return res.status(400).json({ error: 'Cannot tag yourself' });

    await pool.query(`
      INSERT INTO show_companions (user_id, show_date, companion_user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT ON CONSTRAINT show_companions_unique DO NOTHING
    `, [user.id, show_date, c.id]);

    return res.json({ ok: true, companion: { user_id: c.id, username: c.username } });
  }

  // DELETE — untag a companion
  if (req.method === 'DELETE') {
    const { show_date, companion_user_id } = req.body;
    if (!show_date || !companion_user_id) return res.status(400).json({ error: 'show_date and companion_user_id required' });

    await pool.query(
      'DELETE FROM show_companions WHERE user_id = $1 AND show_date = $2 AND companion_user_id = $3',
      [user.id, show_date, companion_user_id]
    );
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
