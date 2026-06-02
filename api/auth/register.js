import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  const { email, username, password, firstName, lastName } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, username, password, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, first_name, last_name`,
      [email, username, passwordHash, firstName || '', lastName || '']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
}
