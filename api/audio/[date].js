import { cors } from '../_auth.js';

const CACHE = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date required (YYYY-MM-DD)' });
  }

  // Check cache
  const cached = CACHE.get(date);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch(`https://phish.in/api/v2/shows/${date}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhishowScorecard/1.0 (phish-scorecard.vercel.app)',
      },
    });

    if (response.status === 404) {
      return res.json({ tracks: [] });
    }

    if (!response.ok) {
      return res.json({ tracks: [] }); // Fail gracefully — audio is enhancement only
    }

    const data = await response.json();
    const tracks = (data.tracks || []).map(t => ({
      title:    t.title,
      position: t.position,
      set:      t.set_name || t.set,
      duration: t.duration || null, // seconds
      mp3_url:  t.mp3_url || null,
      likes:    t.likes_count || 0,
      slug:     t.slug || null,
    }));

    const payload = { date, tracks };
    CACHE.set(date, { time: Date.now(), data: payload });

    res.json(payload);
  } catch (err) {
    console.error('phish.in audio error:', err);
    res.json({ tracks: [] }); // Always return something — audio is non-blocking
  }
}
