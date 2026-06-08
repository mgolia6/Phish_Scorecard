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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your Phreezer account</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

        <!-- LOGO -->
        <tr><td style="padding-bottom:6px;">
          <span style="font-family:monospace;font-size:22px;letter-spacing:8px;color:#00e0d0;font-weight:bold;">❄ PHREEZER</span>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <span style="font-family:monospace;font-size:10px;letter-spacing:4px;color:rgba(0,224,208,0.5);">RATE. TRACK. RELIVE.</span>
        </td></tr>

        <!-- DIVIDER -->
        <tr><td style="border-top:1px solid rgba(0,224,208,0.2);padding-bottom:32px;"></td></tr>

        <!-- HEADING -->
        <tr><td style="padding-bottom:16px;">
          <span style="font-family:monospace;font-size:14px;letter-spacing:4px;color:#33ff33;font-weight:bold;">VERIFY YOUR EMAIL</span>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding-bottom:32px;">
          <p style="font-family:monospace;font-size:13px;line-height:1.8;color:rgba(255,255,255,0.65);margin:0;">
            You're almost in the Phreezer.<br>
            Click below to verify your email address and activate your account.<br><br>
            This link expires in 24 hours.
          </p>
        </td></tr>

        <!-- BUTTON -->
        <tr><td style="padding-bottom:40px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:16px 32px;background-color:#ff6600;color:#000000;font-family:monospace;font-size:12px;font-weight:bold;letter-spacing:3px;text-decoration:none;">VERIFY MY EMAIL</a>
        </td></tr>

        <!-- DIVIDER -->
        <tr><td style="border-top:1px solid rgba(51,255,51,0.1);padding-bottom:24px;"></td></tr>

        <!-- FOOTER -->
        <tr><td>
          <p style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.25);line-height:1.8;margin:0;">
            If you didn't create a Phreezer account, ignore this email.<br>
            Questions? Reply to this email or visit <a href="https://phreezer.mpgink.com" style="color:rgba(0,224,208,0.5);text-decoration:none;">phreezer.mpgink.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function successPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Phreezer — Verified</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #0a0a0a; }
    body {
      font-family: monospace;
      color: #33ff33;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .logo { font-size: 1.3rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 4px; }
    .tagline { font-size: 0.55rem; letter-spacing: 3px; color: rgba(0,224,208,0.45); margin-bottom: 48px; }
    .check { font-size: 3rem; color: #33ff33; margin-bottom: 20px; }
    .heading { font-size: 1rem; letter-spacing: 4px; color: #33ff33; margin-bottom: 12px; }
    .sub { font-size: 0.7rem; color: rgba(255,255,255,0.5); line-height: 1.8; margin-bottom: 40px; text-align: center; }
    .btn {
      display: block;
      width: 100%;
      max-width: 320px;
      padding: 16px;
      background: #ff6600;
      color: #000;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: bold;
      letter-spacing: 3px;
      text-decoration: none;
      text-align: center;
      margin-bottom: 16px;
    }
    .support {
      font-size: 0.55rem;
      letter-spacing: 2px;
      color: rgba(0,224,208,0.4);
      text-decoration: none;
      text-align: center;
    }
    .support:hover { color: rgba(0,224,208,0.7); }
    .divider {
      width: 100%;
      max-width: 320px;
      border: none;
      border-top: 1px solid rgba(51,255,51,0.08);
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="logo">❄ PHREEZER</div>
  <div class="tagline">RATE. TRACK. RELIVE.</div>
  <div class="check">✓</div>
  <div class="heading">EMAIL VERIFIED</div>
  <div class="sub">You're in. Head back to the app and log in.</div>
  <a href="https://phreezer.mpgink.com" class="btn">OPEN PHREEZER</a>
  <hr class="divider">
  <a href="mailto:phreezer.support@mpgink.com" class="support">◈ QUESTIONS? CONTACT SUPPORT</a>
</body>
</html>`;
}

function expiredPage(email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Phreezer — Link Expired</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #0a0a0a; }
    body {
      font-family: monospace;
      color: #33ff33;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .logo { font-size: 1.3rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 4px; }
    .tagline { font-size: 0.55rem; letter-spacing: 3px; color: rgba(0,224,208,0.45); margin-bottom: 48px; }
    .icon { font-size: 3rem; color: #ff6600; margin-bottom: 20px; }
    .heading { font-size: 1rem; letter-spacing: 4px; color: #ff6600; margin-bottom: 12px; }
    .sub { font-size: 0.7rem; color: rgba(255,255,255,0.5); line-height: 1.8; margin-bottom: 40px; text-align: center; }
    .btn {
      display: block;
      width: 100%;
      max-width: 320px;
      padding: 16px;
      background: #ff6600;
      color: #000;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: bold;
      letter-spacing: 3px;
      text-decoration: none;
      text-align: center;
      margin-bottom: 16px;
    }
    .support {
      font-size: 0.55rem;
      letter-spacing: 2px;
      color: rgba(0,224,208,0.4);
      text-decoration: none;
      text-align: center;
    }
    .divider {
      width: 100%;
      max-width: 320px;
      border: none;
      border-top: 1px solid rgba(51,255,51,0.08);
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="logo">❄ PHREEZER</div>
  <div class="tagline">RATE. TRACK. RELIVE.</div>
  <div class="icon">⚠</div>
  <div class="heading">LINK EXPIRED</div>
  <div class="sub">That verification link is no longer valid.<br>Head back to the app and request a new one.</div>
  <a href="https://phreezer.mpgink.com" class="btn">BACK TO PHREEZER</a>
  <hr class="divider">
  <a href="mailto:phreezer.support@mpgink.com" class="support">◈ QUESTIONS? CONTACT SUPPORT</a>
</body>
</html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Phreezer — Error</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #0a0a0a; }
    body {
      font-family: monospace;
      color: #33ff33;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .logo { font-size: 1.3rem; letter-spacing: 6px; color: #00e0d0; margin-bottom: 4px; }
    .tagline { font-size: 0.55rem; letter-spacing: 3px; color: rgba(0,224,208,0.45); margin-bottom: 48px; }
    .heading { font-size: 1rem; letter-spacing: 4px; color: #ff3333; margin-bottom: 12px; }
    .sub { font-size: 0.7rem; color: rgba(255,255,255,0.5); line-height: 1.8; margin-bottom: 40px; text-align: center; }
    .btn {
      display: block;
      width: 100%;
      max-width: 320px;
      padding: 16px;
      background: #ff6600;
      color: #000;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: bold;
      letter-spacing: 3px;
      text-decoration: none;
      text-align: center;
      margin-bottom: 16px;
    }
    .support {
      font-size: 0.55rem;
      letter-spacing: 2px;
      color: rgba(0,224,208,0.4);
      text-decoration: none;
      text-align: center;
    }
    .divider {
      width: 100%;
      max-width: 320px;
      border: none;
      border-top: 1px solid rgba(51,255,51,0.08);
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="logo">❄ PHREEZER</div>
  <div class="tagline">RATE. TRACK. RELIVE.</div>
  <div class="heading">SOMETHING WENT WRONG</div>
  <div class="sub">${msg}</div>
  <a href="https://phreezer.mpgink.com" class="btn">BACK TO PHREEZER</a>
  <hr class="divider">
  <a href="mailto:phreezer.support@mpgink.com" class="support">◈ QUESTIONS? CONTACT SUPPORT</a>
</body>
</html>`;
}


