import jwt from 'jsonwebtoken';
import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  const secret = process.env.JWT_SECRET;
  
  let decoded = null;
  let decodeError = null;
  let dbUser = null;
  let dbError = null;

  if (auth?.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    try {
      decoded = jwt.verify(token, secret);
    } catch(e) {
      decodeError = e.message;
    }

    if (decoded) {
      try {
        const pool = getPool();
        const r = await pool.query('SELECT id, email, username FROM users WHERE id = $1', [decoded.id]);
        dbUser = r.rows[0] || 'NOT FOUND';
      } catch(e) {
        dbError = e.message;
      }
    }
  }

  res.json({
    has_secret: !!secret,
    secret_length: secret?.length,
    has_auth_header: !!auth,
    decoded,
    decode_error: decodeError,
    db_user: dbUser,
    db_error: dbError,
  });
}
