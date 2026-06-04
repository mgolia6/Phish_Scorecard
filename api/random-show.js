import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TODAY = new Date().toISOString().split('T')[0];

  try {
    const pnetRes = await fetch(
      `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=2000`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!pnetRes.ok) {
      return res.status(502).json({ error: `phish.net ${pnetRes.status}` });
    }

    const pnetData = await pnetRes.json();
    const past = (pnetData.data || []).filter(s => s.showdate && s.showdate < TODAY);

    if (!past.length) {
      return res.status(404).json({ error: 'No past shows found' });
    }

    const pick = past[Math.floor(Math.random() * past.length)];
    return res.json({ showdate: pick.showdate });
  } catch (e) {
    return res.status(500).json({ error: `Random show failed: ${e.message}` });
  }
}
