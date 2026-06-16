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

    // Delete existing pinned post so we can re-seed with updated copy
    await pool.query(`DELETE FROM posts WHERE author_label = 'Uncle Ebenezer' AND pinned = TRUE`);

    const body = `We are still workshopping this new song.

You know that moment in a show when they drop into something that does not have a name yet? Everyone in the room knows it is happening. Nobody is sure where it is going. That is where we are with Phreezer right now.

This is beta. The setlist is being written in real time. Expect some noodling. Expect some false starts. Expect a version of this that is better next time you check in.

While we figure it out, here is what this place is for:

→ POST about shows, songs, venues, moments, debates, whatever is living rent-free in your head
→ TAG your post so people can find it — SHOW, SONG, VENUE, FEEDBACK, or just GENERAL
→ ▲ anything that earns it. This is the upvote, not the participation trophy.
→ REPLY to start a thread. Disagree with someone. Be right about it.

One rule from me: keep it about the music. Everything else follows from that.

Rate the shows. Track your run. Find out who was standing three people to your left at MSG on New Year's Eve 1995.

We are still in the jam. Stay in the room.

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
