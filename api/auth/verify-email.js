import { getPool } from '../_db.js';
import { cors } from '../_auth.js';

async function ensureMigration(pool) {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
  `);
  await pool.query(`
    UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE
      AND created_at < NOW() - INTERVAL '1 hour'
  `);
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
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();
  await ensureMigration(pool);

  // GET /api/auth/verify-email?token=xxx  — link click from email
  if (req.method === 'GET') {
    const { token } = req.query;
    if (!token) return res.status(400).send(errorPage('No token provided.'));

    try {
      const result = await pool.query(
        `SELECT evt.*, u.email FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE evt.token = $1`,
        [token]
      );
      if (!result.rows.length) return res.status(400).send(errorPage('Invalid verification link.'));

      const row = result.rows[0];
      if (row.used) return res.status(400).send(errorPage('This link has already been used.'));
      if (new Date(row.expires_at) < new Date()) return res.status(400).send(expiredPage(row.email));

      await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [row.user_id]);
      await pool.query('UPDATE email_verification_tokens SET used = TRUE WHERE id = $1', [row.id]);

      return res.status(200).send(successPage());
    } catch (err) {
      return res.status(500).send(errorPage(err.message));
    }
  }

  // POST /api/auth/verify-email  — resend verification email
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      const userRes = await pool.query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
      if (!userRes.rows.length) return res.status(404).json({ error: 'No account found with that email' });
      if (userRes.rows[0].email_verified) return res.status(400).json({ error: 'Email already verified' });

      const userId = userRes.rows[0].id;
      const token = generateToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expires]
      );

      await sendVerificationEmail(email, token);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `https://phreezer.mpgink.com/api/auth/verify-email?token=${token}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Phreezer <noreply@mpgink.com>',
      to: [email],
      subject: 'Verify your Phreezer account',
      html: emailTemplate(verifyUrl),
    }),
  });
}

function emailTemplate(verifyUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { background: #0a0a0a; color: #33ff33; font-family: monospace; margin: 0; padding: 40px 20px; }
  .container { max-width: 480px; margin: 0 auto; border: 1px solid rgba(0,224,208,0.3); padding: 40px; }
  .logo { font-size: 1.4rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 8px; }
  .tagline { font-size: 0.65rem; letter-spacing: 3px; color: rgba(0,224,208,0.5); margin-bottom: 32px; }
  .heading { font-size: 0.9rem; letter-spacing: 3px; color: #33ff33; margin-bottom: 16px; }
  .body { font-size: 0.75rem; line-height: 1.8; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
  .btn { display: inline-block; padding: 14px 28px; background: #ff6600; color: #000; font-family: monospace; font-size: 0.75rem; letter-spacing: 2px; text-decoration: none; font-weight: bold; }
  .footer { margin-top: 32px; font-size: 0.6rem; color: rgba(255,255,255,0.25); line-height: 1.8; }
</style></head>
<body>
  <div class="container">
    <div class="logo">❄ PHREEZER</div>
    <div class="tagline">RATE. TRACK. RELIVE.</div>
    <div class="heading">VERIFY YOUR EMAIL</div>
    <div class="body">
      You're almost in the Phreezer. Click below to verify your email address and activate your account.<br><br>
      This link expires in 24 hours.
    </div>
    <a href="${verifyUrl}" class="btn">VERIFY MY EMAIL</a>
    <div class="footer">
      If you didn't create a Phreezer account, ignore this email.<br>
      phreezer.mpgink.com
    </div>
  </div>
</body>
</html>`;
}

function successPage() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Phreezer — Verified</title>
<style>
  body { background: #0a0a0a; color: #33ff33; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; border: 1px solid rgba(0,224,208,0.3); padding: 48px 40px; max-width: 420px; }
  .logo { font-size: 1.4rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 8px; }
  .check { font-size: 2.5rem; margin: 24px 0; }
  h2 { font-size: 0.9rem; letter-spacing: 3px; margin-bottom: 12px; color: #33ff33; }
  p { font-size: 0.7rem; color: rgba(255,255,255,0.6); line-height: 1.8; margin-bottom: 28px; }
  a { display: inline-block; padding: 12px 24px; background: #ff6600; color: #000; font-family: monospace; font-size: 0.7rem; letter-spacing: 2px; text-decoration: none; font-weight: bold; }
</style></head>
<body>
  <div class="box">
    <div class="logo">❄ PHREEZER</div>
    <div class="check">✓</div>
    <h2>EMAIL VERIFIED</h2>
    <p>You're in. Head back to the app and log in.</p>
    <a href="https://phreezer.mpgink.com">OPEN PHREEZER</a>
  </div>
</body>
</html>`;
}

function expiredPage(email) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Phreezer — Link Expired</title>
<style>
  body { background: #0a0a0a; color: #33ff33; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; border: 1px solid rgba(255,102,0,0.3); padding: 48px 40px; max-width: 420px; }
  .logo { font-size: 1.4rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 8px; }
  .icon { font-size: 2.5rem; margin: 24px 0; color: #ff6600; }
  h2 { font-size: 0.9rem; letter-spacing: 3px; margin-bottom: 12px; color: #ff6600; }
  p { font-size: 0.7rem; color: rgba(255,255,255,0.6); line-height: 1.8; margin-bottom: 28px; }
  a { display: inline-block; padding: 12px 24px; background: #ff6600; color: #000; font-family: monospace; font-size: 0.7rem; letter-spacing: 2px; text-decoration: none; font-weight: bold; }
</style></head>
<body>
  <div class="box">
    <div class="logo">❄ PHREEZER</div>
    <div class="icon">⚠</div>
    <h2>LINK EXPIRED</h2>
    <p>That verification link is no longer valid.<br>Head back to the app and request a new one.</p>
    <a href="https://phreezer.mpgink.com">BACK TO PHREEZER</a>
  </div>
</body>
</html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Phreezer — Error</title>
<style>
  body { background: #0a0a0a; color: #33ff33; font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; border: 1px solid rgba(255,0,0,0.3); padding: 48px 40px; max-width: 420px; }
  .logo { font-size: 1.4rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 8px; }
  h2 { font-size: 0.9rem; letter-spacing: 3px; margin-bottom: 12px; color: #ff3333; }
  p { font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-bottom: 28px; }
  a { display: inline-block; padding: 12px 24px; background: #ff6600; color: #000; font-family: monospace; font-size: 0.7rem; letter-spacing: 2px; text-decoration: none; font-weight: bold; }
</style></head>
<body>
  <div class="box">
    <div class="logo">❄ PHREEZER</div>
    <h2>SOMETHING WENT WRONG</h2>
    <p>${msg}</p>
    <a href="https://phreezer.mpgink.com">BACK TO PHREEZER</a>
  </div>
</body>
</html>`;
}

