import { cors } from '../_auth.js';

let cachedShows = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getShows() {
  if (cachedShows && Date.now() - cacheTime < CACHE_TTL) return cachedShows;
  const res = await fetch(
    `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=2500`
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

    const mapped = (list) => list.map(s => ({
      showid:    s.showid,
      showdate:  s.showdate,
      permalink: s.permalink,
      venue:     s.venue,
      city:      s.city,
      state:     s.state,
      country:   s.country,
      tour_name: s.tour_name || '',
    }));

    if (!q) return res.json(mapped(shows.slice(0, 20)));

    const query = q.toLowerCase();
    const filtered = shows.filter(show =>
      show.showdate?.includes(q) ||
      show.venue?.toLowerCase().includes(query) ||
      show.city?.toLowerCase().includes(query) ||
      show.state?.toLowerCase().includes(query) ||
      show.tour_name?.toLowerCase().includes(query)
    );
    res.json(mapped(filtered.slice(0, 50)));
  } catch (err) {
    console.error('Shows error:', err);
    res.status(500).json({ error: err.message });
  }
}
