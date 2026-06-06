import jwt from 'jsonwebtoken';
import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token', debug: 'no_auth_header' });
  }

  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch(e) {
    return res.status(401).json({ error: 'Token invalid', debug: e.message, secret_length: secret?.length });
  }

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name,
              is_admin, tandc_accepted, onboarding_complete, created_at, avatar_icon
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found', user_id: decoded.id });
    const u = result.rows[0];
    res.json({
      ...u,
      is_admin: !!u.is_admin,
      tandc_accepted: !!u.tandc_accepted,
      onboarding_complete: !!u.onboarding_complete,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
