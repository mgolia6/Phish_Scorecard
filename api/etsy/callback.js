// GET /api/etsy/callback
// Handles OAuth redirect from Etsy, exchanges code for access token,
// stores token in DB for use by sync endpoint.

import { cors } from '../_auth.js';
import { getPool } from '../_db.js';

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS etsy_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TIMESTAMP,
      shop_id TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html><body style="background:#0a0a0a;color:#ff3333;font-family:monospace;padding:40px;">
        <h2>❌ ETSY AUTH ERROR</h2><p>${error}</p>
      </body></html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html><body style="background:#0a0a0a;color:#ff3333;font-family:monospace;padding:40px;">
        <h2>❌ NO CODE</h2><p>No authorization code received from Etsy.</p>
      </body></html>
    `);
  }

  const { ETSY_API_KEY, ETSY_SHARED_SECRET } = process.env;

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     ETSY_API_KEY,
        redirect_uri:  'https://phreezer.mpgink.com/api/etsy/callback',
        code,
        code_verifier: Buffer.from(ETSY_API_KEY + state).toString('base64url').replace(/=/g,''),
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Token exchange failed: ${err}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    const expires_at = new Date(Date.now() + (expires_in * 1000));

    // Get shop ID
    const meRes = await fetch('https://openapi.etsy.com/v3/application/users/me', {
      headers: { 'x-api-key': ETSY_API_KEY, Authorization: `Bearer ${access_token}` },
    });
    const meData = await meRes.json();
    const shop_id = meData.shop_id || meData.user_id;

    // Store in DB
    const pool = getPool();
    await ensureTable(pool);
    await pool.query(`
      INSERT INTO etsy_tokens (id, access_token, refresh_token, expires_at, shop_id, updated_at)
      VALUES (1, $1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        access_token = $1, refresh_token = $2, expires_at = $3, shop_id = $4, updated_at = NOW()
    `, [access_token, refresh_token || null, expires_at, String(shop_id)]);

    return res.send(`
      <html><body style="background:#0a0a0a;color:#33ff33;font-family:monospace;padding:40px;text-align:center;">
        <h1 style="color:#00e0d0;letter-spacing:4px;">❄ PHREEZER</h1>
        <h2 style="color:#33ff33;letter-spacing:3px;">✓ ETSY CONNECTED</h2>
        <p style="color:rgba(255,255,255,0.5);">Shop ID: ${shop_id}</p>
        <p style="color:rgba(255,255,255,0.5);">Token stored. The daily cron will sync sales automatically.</p>
        <p style="margin-top:30px;"><a href="https://phreezer.mpgink.com" style="color:#ff6600;font-family:monospace;letter-spacing:2px;">← BACK TO PHREEZER</a></p>
      </body></html>
    `);
  } catch (err) {
    console.error('Etsy callback error:', err);
    return res.status(500).send(`
      <html><body style="background:#0a0a0a;color:#ff3333;font-family:monospace;padding:40px;">
        <h2>❌ ERROR</h2><p>${err.message}</p>
      </body></html>
    `);
  }
}
