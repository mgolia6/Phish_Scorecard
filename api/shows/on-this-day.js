import { cors } from '../_auth.js';

let cachedShows = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getAllShows() {
  if (cachedShows && Date.now() - cacheTime < CACHE_TTL) return cachedShows;
  const res = await fetch(
    `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=asc&limit=2500`
  );
  const data = await res.json();
  cachedShows = data.data || [];
  cacheTime = Date.now();
  return cachedShows;
}

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const mmdd = `${mm}-${dd}`;

    const shows = await getAllShows();

    const otd = shows
      .filter(s => s.showdate && s.showdate.slice(5) === mmdd)
      .map(s => ({
        show_date: s.showdate,
        venue: s.venuename || s.venue,
        city: s.city,
        state: s.state,
        country: s.country,
        tour_name: s.tour_name || '',
      }));

    res.json({ shows: otd, mmdd });
  } catch (err) {
    console.error('OTD error:', err);
    res.status(500).json({ error: err.message });
  }
}
