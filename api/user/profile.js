import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

const ALLOWED_ICONS = ['❄','◈','⚡','✦','⬡','◉','▦','✎','🔥','🐟','🌀','🎸','💯','★','✍','🏔'];

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT phishnet_username, favorite_song, favorite_venue, favorite_show_date, avatar_icon
       FROM users WHERE id = $1`,
      [user.id]
    );
    return res.json(result.rows[0] || {});
  }

  if (req.method === 'POST') {
    const { phishnet_username, favorite_song, favorite_venue, favorite_show_date, avatar_icon } = req.body;

    // Validate icon if provided
    if (avatar_icon && !ALLOWED_ICONS.includes(avatar_icon)) {
      return res.status(400).json({ error: 'Invalid icon' });
    }

    await pool.query(
      `UPDATE users SET
         phishnet_username  = $1,
         favorite_song      = $2,
         favorite_venue     = $3,
         favorite_show_date = $4,
         avatar_icon        = $5
       WHERE id = $6`,
      [
        phishnet_username  || null,
        favorite_song      || null,
        favorite_venue     || null,
        favorite_show_date || null,
        avatar_icon        || null,
        user.id,
      ]
    );
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
