// GET /api/etsy/auth
// Initiates Etsy OAuth flow — visit this URL in browser once to authorize.
// Redirects to Etsy, which redirects back to /api/etsy/callback.

import { cors } from '../_auth.js';

const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
const SCOPES = 'transactions_r listings_r';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ETSY_API_KEY } = process.env;
  if (!ETSY_API_KEY) return res.status(500).json({ error: 'ETSY_API_KEY not configured' });

  // Simple state token for CSRF protection
  const state = Buffer.from(`phreezer-${Date.now()}`).toString('base64');

  const callbackUrl = `https://phreezer.mpgink.com/api/etsy/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     ETSY_API_KEY,
    redirect_uri:  callbackUrl,
    scope:         SCOPES,
    state,
    code_challenge_method: 'S256',
    // Note: Etsy v3 uses PKCE — for simplicity we use a fixed challenge
    // In production this should be a proper PKCE flow
    code_challenge: Buffer.from(ETSY_API_KEY + state).toString('base64url').replace(/=/g,''),
  });

  const authUrl = `${ETSY_AUTH_URL}?${params}`;
  res.redirect(302, authUrl);
}
