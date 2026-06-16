// GET  /api/community/posts?page=1&limit=20&category=GENERAL
// POST /api/community/posts { body, category }

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();

  // ── CREATE POST ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { body, category = 'GENERAL' } = req.body || {};
    if (!body?.trim()) return res.status(400).json({ error: 'body required' });
    if (body.trim().length > 500) return res.status(400).json({ error: 'Post too long (500 char max)' });
    if (!['GENERAL','SHOW','SONG','VENUE','FEEDBACK'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          category VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS post_replies (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS post_reactions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(10) NOT NULL DEFAULT 'up',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `);

      const result = await pool.query(`
        INSERT INTO posts (user_id, body, category)
        VALUES ($1, $2, $3)
        RETURNING id, body, category, created_at
      `, [user.id, body.trim(), category]);

      return res.status(201).json({
        post: {
          ...result.rows[0],
          username: user.username,
          reply_count: 0,
          up_count: 0,
          user_reacted: false,
        }
      });
    } catch (err) {
      console.error('[posts POST]', err.message);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  // ── GET FEED ─────────────────────────────────────────────
  if (req.method === 'GET') {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { category } = req.query;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          category VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS post_replies (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS post_reactions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(10) NOT NULL DEFAULT 'up',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `);

      const categoryFilter = category && ['GENERAL','SHOW','SONG','VENUE','FEEDBACK'].includes(category)
        ? `AND p.category = '${category}'` : '';

      const result = await pool.query(`
        SELECT
          p.id, p.body, p.category, p.created_at, p.pinned, p.author_label,
          u.username,
          COUNT(DISTINCT pr.id) FILTER (WHERE pr.deleted_at IS NULL) AS reply_count,
          COUNT(DISTINCT react.id) AS up_count,
          BOOL_OR(react.user_id = $1) AS user_reacted
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN post_replies pr ON pr.post_id = p.id
        LEFT JOIN post_reactions react ON react.post_id = p.id
        WHERE p.deleted_at IS NULL
        ${categoryFilter}
        GROUP BY p.id, u.username
        ORDER BY p.pinned DESC, p.created_at DESC
        LIMIT $2 OFFSET $3
      `, [user.id, limit + 1, offset]);

      const rows = result.rows;
      const has_more = rows.length > limit;
      const posts = rows.slice(0, limit).map(r => ({
        ...r,
        reply_count: parseInt(r.reply_count),
        up_count: parseInt(r.up_count),
      }));

      return res.json({ posts, has_more, page });
    } catch (err) {
      console.error('[posts GET]', err.message);
      return res.status(500).json({ error: 'Failed to load posts' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
