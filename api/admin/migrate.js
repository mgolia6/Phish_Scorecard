import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
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
    // --- show_companions: intentional friend tagging on attended shows ---
    { name: 'show_companions table', sql: `
      CREATE TABLE IF NOT EXISTS show_companions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        show_date DATE NOT NULL,
        companion_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT show_companions_unique UNIQUE (user_id, show_date, companion_user_id),
        CONSTRAINT show_companions_no_self CHECK (user_id <> companion_user_id)
      )
    `},
    { name: 'show_companions.idx_user', sql: 'CREATE INDEX IF NOT EXISTS idx_sc_user ON show_companions(user_id)' },
    { name: 'show_companions.idx_companion', sql: 'CREATE INDEX IF NOT EXISTS idx_sc_companion ON show_companions(companion_user_id)' },
    { name: 'show_companions.idx_show_date', sql: 'CREATE INDEX IF NOT EXISTS idx_sc_show_date ON show_companions(show_date)' },
    { name: 'users.avatar_icon', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_icon VARCHAR(10)" },
  ];

  migrations.push({
    name: 'create_vibe_checks',
    sql: `
      CREATE TABLE IF NOT EXISTS vibe_checks (
        show_date     VARCHAR(10) PRIMARY KEY,
        structured    JSONB,
        review_count  INT,
        generated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        model         VARCHAR(50)
      )
    `
  });

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
