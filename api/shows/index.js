import { cors } from '../_auth.js';

// Simple in-memory cache — resets on cold start, fine for serverless
let cachedShows = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getShows() {
  if (cachedShows && Date.now() - cacheTime < CACHE_TTL) return cachedShows;

  const res = await fetch(
    `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=1000`
  );
  const data = await res.json();
  cachedShows = data.data || [];
  cacheTime = Date.now();
  return cachedShows;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const shows = await getShows();
    const { q } = req.query;

    if (!q) return res.json(shows.slice(0, 100)); // default: last 100 shows

    const query = q.toLowerCase();
    const filtered = shows.filter(show =>
      show.showdate?.includes(q) ||
      show.venue?.toLowerCase().includes(query) ||
      show.city?.toLowerCase().includes(query) ||
      show.state?.toLowerCase().includes(query)
    );

    res.json(filtered.slice(0, 50));
  } catch (err) {
    console.error('Shows error:', err);
    res.status(500).json({ error: err.message });
  }
}
