import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const username = req.query.username || 'mgolia6';
  const url = `https://api.phish.net/v5/reviews/username/${username}.json?apikey=${process.env.PHISH_NET_API_KEY}`;
  
  try {
    const r = await fetch(url);
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch(e) { parsed = null; }
    
    res.json({
      status: r.status,
      url_called: url.replace(process.env.PHISH_NET_API_KEY, 'REDACTED'),
      raw_length: text.length,
      parsed_count: parsed?.data?.length ?? 'parse_failed',
      sample: parsed?.data?.slice(0, 2) ?? text.slice(0, 500),
      error: parsed?.error ?? null
    });
  } catch(err) {
    res.json({ error: err.message });
  }
}
