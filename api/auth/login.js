import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getPool();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Update login streak
    const today = new Date().toISOString().split('T')[0];
    const last = user.last_login_date ? user.last_login_date.toISOString().split('T')[0] : null;
    let streak = user.login_streak || 0;
    if (last === null) {
      streak = 1;
    } else {
      const diff = Math.round((new Date(today) - new Date(last)) / 86400000);
      if (diff === 0) {
        // same day — keep streak as-is
      } else if (diff === 1) {
        streak += 1;
      } else {
        streak = 1; // broke the chain
      }
    }
    if (last !== today) {
      await pool.query(
        'UPDATE users SET last_login_date = $1, login_streak = $2 WHERE id = $3',
        [today, streak, user.id]
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: !!user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: !!user.is_admin,
        tandc_accepted: !!user.tandc_accepted,
        onboarding_complete: !!user.onboarding_complete,
        login_streak: streak,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
