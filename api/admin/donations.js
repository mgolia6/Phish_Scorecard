// GET  /api/admin/donations        — returns current totals (public read)
// POST /api/admin/donations        — updates items sold (admin only)
//
// Stores in a single DB row. Lazy-creates table on first call.
// $1.00 donated per item sold to the Mockingbird Foundation.

import { verifyToken, cors } from '../_auth.js';
import { getPool } from '../_db.js';

const DONATION_PER_ITEM = 1.00;

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS donation_tracker (
      id SERIAL PRIMARY KEY,
      items_sold INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Ensure at least one row exists
  await pool.query(`
    INSERT INTO donation_tracker (id, items_sold)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);
}

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();
  await ensureTable(pool);

  // GET — public, no auth required
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT items_sold, updated_at FROM donation_tracker WHERE id = 1');
      const { items_sold, updated_at } = result.rows[0];
      return res.json({
        items_sold,
        donation_per_item: DONATION_PER_ITEM,
        total_donated: (items_sold * DONATION_PER_ITEM).toFixed(2),
        updated_at,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — admin only
  if (req.method === 'POST') {
    const user = verifyToken(req);
    if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });

    const { items_sold } = req.body;
    if (typeof items_sold !== 'number' || items_sold < 0) {
      return res.status(400).json({ error: 'items_sold must be a non-negative number' });
    }

    try {
      await pool.query(
        'UPDATE donation_tracker SET items_sold = $1, updated_at = NOW() WHERE id = 1',
        [Math.floor(items_sold)]
      );
      const total_donated = (Math.floor(items_sold) * DONATION_PER_ITEM).toFixed(2);
      return res.json({ ok: true, items_sold: Math.floor(items_sold), total_donated });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
