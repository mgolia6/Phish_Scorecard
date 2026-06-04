import { cors } from '../_auth.js';

let cachedShows = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function getShows() {
  if (cachedShows && Date.now() - cacheTime < CACHE_TTL) return cachedShows;
  const res = await fetch(
    `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=asc&limit=2500`
  );
  if (!res.ok) throw new Error(`phish.net ${res.status}`);
  const data = await res.json();
  cachedShows = data.data || [];
  cacheTime = Date.now();
  return cachedShows;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TODAY = new Date().toISOString().split('T')[0];

  try {
    const shows = await getShows();
    const past = shows.filter(s => s.showdate && s.showdate < TODAY && !['2005','2006','2007'].includes(s.showdate.slice(0,4)));
    if (!past.length) return res.status(404).json({ error: 'No past shows found' });
    const pick = past[Math.floor(Math.random() * past.length)];
    return res.json({ showdate: pick.showdate });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
