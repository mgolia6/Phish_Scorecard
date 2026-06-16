// POST /api/community/posts/[id]/react — toggle upvote

import { getPool } from '../../_db.js';
import { verifyToken, cors } from '../../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.query.id);
  if (!postId) return res.status(400).json({ error: 'post id required' });

  const pool = getPool();
  try {
    const existing = await pool.query(
      'SELECT id FROM post_reactions WHERE post_id = $1 AND user_id = $2',
      [postId, user.id]
    );
    if (existing.rows.length) {
      await pool.query('DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2', [postId, user.id]);
      return res.json({ reacted: false });
    } else {
      await pool.query('INSERT INTO post_reactions (post_id, user_id) VALUES ($1, $2)', [postId, user.id]);
      return res.json({ reacted: true });
    }
  } catch (err) {
    console.error('[post-react]', err.message);
    return res.status(500).json({ error: 'Failed to react' });
  }
}
