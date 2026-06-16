import { cors, verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const auth = verifyToken(req);
  if (!auth?.is_admin) return res.status(401).json({ error: 'Unauthorized' });

  const results = {};

  // Phish.net
  try {
    const t = Date.now();
    const r = await fetch(
      `https://api.phish.net/v5/shows/recent.json?apikey=${process.env.PHISH_NET_API_KEY}&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    const body = await r.json().catch(() => ({}));
    const ok = r.ok && Array.isArray(body?.data);
    results.phishnet = { ok, status: r.status, ms: Date.now() - t };
  } catch (e) {
    results.phishnet = { ok: false, ms: null, error: e.message };
  }

  // Anthropic
  try {
    const t = Date.now();
    const r = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(5000)
    });
    results.anthropic = { ok: r.ok || r.status === 200, status: r.status, ms: Date.now() - t };
  } catch (e) {
    results.anthropic = { ok: false, ms: null, error: e.message };
  }

  // Resend
  try {
    const t = Date.now();
    const r = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${process.env.PHREEZER_RESEND_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    });
    results.resend = { ok: r.ok, status: r.status, ms: Date.now() - t };
  } catch (e) {
    results.resend = { ok: false, ms: null, error: e.message };
  }

  res.json(results);
}
