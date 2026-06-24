// /api/emails/unsubscribe?token=xxx
// One-click unsubscribe from recurring/marketing emails (weekly reminder, nudges).
// - POST  → RFC 8058 one-click (List-Unsubscribe-Post). Sets opt-out, returns 200.
// - GET   → human-facing confirmation page. ?action=resubscribe re-enables.
// Transactional mail (verification, password reset) is unaffected.

import { getPool } from '../_db.js';

async function ensureEmailPrefs(pool) {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT FALSE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(64)');
}

function page(title, message, color, extraHtml = '') {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Phreezer</title>
<style>
  body { margin:0; background:#0a0a0a; color:#f0fff0; font-family:'Courier New',monospace;
         display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
  .box { max-width:440px; text-align:center; }
  .flake { font-size:40px; color:#00e0d0; letter-spacing:8px; }
  h1 { font-size:18px; letter-spacing:4px; color:${color}; margin:24px 0 14px; }
  p { font-size:13px; line-height:1.8; color:rgba(255,255,255,0.6); }
  a.btn { display:inline-block; margin-top:24px; padding:12px 26px; border:1px solid #00e0d0;
          color:#00e0d0; text-decoration:none; font-size:12px; letter-spacing:3px; }
  a.link { color:rgba(0,224,208,0.6); }
</style></head>
<body><div class="box">
  <div class="flake">❄ PHREEZER</div>
  <h1>${title}</h1>
  <p>${message}</p>
  ${extraHtml}
</div></body></html>`;
}

export default async function handler(req, res) {
  const token = req.query.token;
  const pool = getPool();

  try {
    await ensureEmailPrefs(pool);

    // RFC 8058 one-click: mail client POSTs to unsubscribe, no page needed.
    if (req.method === 'POST') {
      if (token) {
        await pool.query('UPDATE users SET email_opt_out = TRUE WHERE unsubscribe_token = $1', [token]);
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!token) {
      return res.status(400).send(page('INVALID LINK', 'This unsubscribe link is missing its token.', '#ff3333'));
    }

    const resub = req.query.action === 'resubscribe';
    const result = await pool.query(
      'UPDATE users SET email_opt_out = $1 WHERE unsubscribe_token = $2 RETURNING email',
      [!resub, token]
    );

    if (!result.rows.length) {
      return res.status(404).send(page('LINK NOT RECOGNIZED', 'We couldn\'t match this unsubscribe link to an account. It may be out of date.', '#ff3333'));
    }

    if (resub) {
      return res.status(200).send(page(
        'YOU\'RE BACK IN.',
        'You\'ll receive Phreezer reminders again. Welcome back to the cold.',
        '#33ff33'
      ));
    }

    const resubUrl = `/api/emails/unsubscribe?token=${encodeURIComponent(token)}&action=resubscribe`;
    return res.status(200).send(page(
      'YOU\'RE UNSUBSCRIBED.',
      'You won\'t get reminder or nudge emails anymore. Account and security emails (like password resets) will still come through.',
      '#00e0d0',
      `<a class="btn" href="${resubUrl}">RESUBSCRIBE</a>`
    ));
  } catch (err) {
    return res.status(500).send(page('SOMETHING BROKE', err.message, '#ff3333'));
  }
}
