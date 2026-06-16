import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

  const pool = getPool();

  try {
    // Ensure columns exist
    await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_label VARCHAR(50)`);

    // Check if Ebenezer post already exists
    const existing = await pool.query(
      `SELECT id FROM posts WHERE author_label = 'Uncle Ebenezer' AND pinned = TRUE LIMIT 1`
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Ebenezer post already exists', id: existing.rows[0].id });
    }

    const body = `WELCOME TO THE PHREEZE FEED.

This is where the community lives. Use it.

HOW IT WORKS:
→ Post about shows, songs, venues, or whatever is rattling around in your head
→ Use the category buttons to tag your post (SHOW, SONG, VENUE, FEEDBACK, GENERAL)
→ ▲ to upvote posts you agree with or want to see more of
→ Reply to start a thread

A few ground rules from your host:
◈ Keep it about the music. Debates are fine. Personal shots are not.
◈ If you went to a show, tell us about it. That is what this is for.
◈ Phish.net exists for reviews. This is for the stuff between the notes.

Rate shows. Track your run. Find out who you were standing next to in 1997.

— Uncle Ebenezer`;

    const result = await pool.query(
      `INSERT INTO posts (user_id, body, category, pinned, author_label)
       VALUES ($1, $2, 'GENERAL', TRUE, 'Uncle Ebenezer')
       RETURNING id`,
      [user.id, body]
    );

    return res.json({ message: 'Ebenezer post seeded', id: result.rows[0].id });
  } catch (err) {
    console.error('[seed-ebenezer]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
