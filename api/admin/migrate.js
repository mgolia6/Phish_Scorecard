import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user || !user.is_admin) return res.status(403).json({ error: 'Forbidden' });

  const pool = getPool();
  const results = [];
  const migrations = [
    { name: 'users.is_admin', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE' },
    { name: 'users.tandc_accepted', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS tandc_accepted BOOLEAN DEFAULT FALSE' },
    { name: 'users.onboarding_complete', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE' },
    { name: 'users.created_at index', sql: 'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)' },
    { name: 'users.phishnet_username', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phishnet_username VARCHAR(255)' },
    { name: 'users.favorite_song', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_song VARCHAR(255)' },
    { name: 'users.favorite_venue', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_venue VARCHAR(255)' },
    { name: 'users.favorite_show_date', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_show_date DATE' },
    { name: 'users.last_login_date', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE' },
    { name: 'users.login_streak', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0' },
  ];

  for (const m of migrations) {
    try {
      await pool.query(m.sql);
      results.push({ migration: m.name, status: 'ok' });
    } catch (err) {
      results.push({ migration: m.name, status: 'error', error: err.message });
    }
  }

  res.json({ results });
}
