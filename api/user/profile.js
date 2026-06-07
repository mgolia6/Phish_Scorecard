import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

const ALLOWED_ICONS = ['❄','◈','⚡','✦','⬡','◉','▦','✎','🔥','🐟','🌀','🎸','💯','★','✍','🏔'];
const ALLOWED_VANTAGE = ['floor', 'pit', 'lower-bowl', 'upper-bowl', 'lawn', 'balcony', 'anywhere'];
const ALLOWED_STYLE = ['attended', 'webcast', 'both'];
const ALLOWED_ERA = ['1.0', '2.0', '3.0', '4.0', 'no-preference'];

let migrated = false;
async function ensureColumns(pool) {
  if (migrated) return;
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vantage_point VARCHAR(20)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_style VARCHAR(20)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS era_preference VARCHAR(20)`);
    migrated = true;
  } catch (err) {
    console.error('Profile migration error (non-fatal):', err.message);
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  await ensureColumns(pool);

  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT phishnet_username, favorite_song, favorite_venue, favorite_show_date,
              avatar_icon, vantage_point, show_style, era_preference
       FROM users WHERE id = $1`,
      [user.id]
    );
    return res.json(result.rows[0] || {});
  }

  if (req.method === 'POST') {
    const { phishnet_username, favorite_song, favorite_venue, favorite_show_date,
            avatar_icon, vantage_point, show_style, era_preference } = req.body;

    if (avatar_icon && !ALLOWED_ICONS.includes(avatar_icon)) {
      return res.status(400).json({ error: 'Invalid icon' });
    }
    if (vantage_point && !ALLOWED_VANTAGE.includes(vantage_point)) {
      return res.status(400).json({ error: 'Invalid vantage point' });
    }
    if (show_style && !ALLOWED_STYLE.includes(show_style)) {
      return res.status(400).json({ error: 'Invalid show style' });
    }
    if (era_preference && !ALLOWED_ERA.includes(era_preference)) {
      return res.status(400).json({ error: 'Invalid era preference' });
    }

    await pool.query(
      `UPDATE users SET
         phishnet_username  = $1,
         favorite_song      = $2,
         favorite_venue     = $3,
         favorite_show_date = $4,
         avatar_icon        = $5,
         vantage_point      = $6,
         show_style         = $7,
         era_preference     = $8
       WHERE id = $9`,
      [
        phishnet_username  || null,
        favorite_song      || null,
        favorite_venue     || null,
        favorite_show_date || null,
        avatar_icon        || null,
        vantage_point      || null,
        show_style         || null,
        era_preference     || null,
        user.id,
      ]
    );
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
