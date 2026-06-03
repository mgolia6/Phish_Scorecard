import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TODAY = new Date().toISOString().split('T')[0];

  try {
    // Hit phish.in random-show — no key needed
    const response = await fetch('https://phish.in/api/v2/random-show', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhishowScorecard/1.0 (phish-scorecard.vercel.app)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const date = data.date;
      if (date && date < TODAY) {
        return res.json({ showdate: date });
      }
    }

    // Fallback: pick a random show from our phish.net shows cache
    const pnetRes = await fetch(
      `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=1000`
    );
    const pnetData = await pnetRes.json();
    const past = (pnetData.data || []).filter(s => s.showdate < TODAY);
    if (!past.length) return res.status(404).json({ error: 'No shows found' });
    const pick = past[Math.floor(Math.random() * past.length)];
    res.json({ showdate: pick.showdate });
  } catch (err) {
    console.error('Random show error:', err);
    res.status(500).json({ error: err.message });
  }
}
