import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../_db.js';
import { cors } from '../_auth.js';
import { sendVerificationEmail } from './verify-email.js';

async function ensureMigration(pool) {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(128) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Grandfather all existing users
  await pool.query(`UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE AND created_at < NOW() - INTERVAL '5 minutes'`);
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  await ensureMigration(pool);

  const { email, username, password, firstName, lastName } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Email, username, and password required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email or username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, username, password, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING id, email, username, first_name, last_name, is_admin, tandc_accepted, onboarding_complete`,
      [email, username, passwordHash, firstName || '', lastName || '']
    );

    const user = result.rows[0];

    // Generate and store verification token
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expires]
    );

    // Send verification email — fire and forget, don't block registration response
    sendVerificationEmail(email, token).catch(err => console.error('Email send failed:', err));

    // Return needs_verification instead of a session token
    res.status(201).json({ needs_verification: true, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
