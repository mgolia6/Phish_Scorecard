import jwt from 'jsonwebtoken';

const ALLOWED_ORIGINS = [
  'https://phreezer.mpgink.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

// Server-to-server admin key — used by PM dashboard, never exposed to browser.
// Set PHREEZER_ADMIN_KEY env var on both Phreezer and PM dashboard Vercel projects.
export function isAdminKey(req) {
  const key = req.headers['x-admin-key'];
  if (!key || !process.env.PHREEZER_ADMIN_KEY) return false;
  return key === process.env.PHREEZER_ADMIN_KEY;
}

export function cors(res, req) {
  const origin = req?.headers?.origin;
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
  res.setHeader('Vary', 'Origin');
}
