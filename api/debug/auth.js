import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const auth = req.headers.authorization;
  const hasSecret = !!process.env.JWT_SECRET;
  const secretLen = process.env.JWT_SECRET?.length || 0;
  
  let tokenResult = 'no token';
  if (auth) {
    const verified = verifyToken(req);
    tokenResult = verified ? `valid — user id: ${verified.id}` : 'invalid/expired';
  }
  
  res.json({
    has_jwt_secret: hasSecret,
    jwt_secret_length: secretLen,
    auth_header_present: !!auth,
    token_status: tokenResult,
  });
}
