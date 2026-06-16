// GET  /api/community/posts/[id]/replies
// POST /api/community/posts/[id]/replies { body }

import { getPool } from '../../_db.js';
import { verifyToken, cors } from '../../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.query.id);
  if (!postId) return res.status(400).json({ error: 'post id required' });

  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT pr.id, pr.body, pr.created_at, u.username,
          COUNT(react.id) AS up_count,
          BOOL_OR(react.user_id = $2) AS user_reacted
        FROM post_replies pr
        JOIN users u ON u.id = pr.user_id
        LEFT JOIN post_reactions react ON react.post_id = pr.post_id AND react.user_id = pr.user_id
        WHERE pr.post_id = $1 AND pr.deleted_at IS NULL
        GROUP BY pr.id, u.username
        ORDER BY pr.created_at ASC
      `, [postId, user.id]);
      return res.json({ replies: result.rows.map(r => ({ ...r, up_count: parseInt(r.up_count) })) });
    } catch (err) {
      console.error('[post-replies GET]', err.message);
      return res.status(500).json({ error: 'Failed to load replies' });
    }
  }

  if (req.method === 'POST') {
    const { body } = req.body || {};
    if (!body?.trim()) return res.status(400).json({ error: 'body required' });
    if (body.trim().length > 500) return res.status(400).json({ error: 'Reply too long' });
    try {
      // Verify post exists
      const post = await pool.query('SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL', [postId]);
      if (!post.rows.length) return res.status(404).json({ error: 'Post not found' });

      const result = await pool.query(`
        INSERT INTO post_replies (post_id, user_id, body)
        VALUES ($1, $2, $3)
        RETURNING id, body, created_at
      `, [postId, user.id, body.trim()]);

      return res.status(201).json({
        reply: { ...result.rows[0], username: user.username, up_count: 0, user_reacted: false }
      });
    } catch (err) {
      console.error('[post-replies POST]', err.message);
      return res.status(500).json({ error: 'Failed to post reply' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
