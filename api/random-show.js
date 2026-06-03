import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TODAY = new Date().toISOString().split('T')[0];
  const errors = [];

  // Try phish.in first
  try {
    const response = await fetch('https://phish.in/api/v2/random-show', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhishowScorecard/1.0 (phish-scorecard.vercel.app)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      // phish.in returns { date: "YYYY-MM-DD", ... }
      const date = data.date || data.showdate || data.show_date;
      if (date && date.slice(0, 10) < TODAY) {
        return res.json({ showdate: date.slice(0, 10) });
      } else {
        errors.push(`phish.in returned invalid date: ${JSON.stringify(date)}`);
      }
    } else {
      errors.push(`phish.in ${response.status}: ${response.statusText}`);
    }
  } catch (e) {
    errors.push(`phish.in error: ${e.message}`);
  }

  // Fallback: phish.net shows list — pick random past show
  try {
    const pnetRes = await fetch(
      `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=1000`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!pnetRes.ok) {
      errors.push(`phish.net ${pnetRes.status}: ${pnetRes.statusText}`);
      return res.status(502).json({ error: `All sources failed: ${errors.join(' | ')}` });
    }

    const pnetData = await pnetRes.json();
    const past = (pnetData.data || []).filter(s => s.showdate && s.showdate < TODAY);

    if (!past.length) {
      return res.status(404).json({ error: `No past shows found. Errors: ${errors.join(' | ')}` });
    }

    const pick = past[Math.floor(Math.random() * past.length)];
    return res.json({ showdate: pick.showdate });

  } catch (e) {
    errors.push(`phish.net error: ${e.message}`);
    return res.status(500).json({ error: `Random show failed: ${errors.join(' | ')}` });
  }
}
