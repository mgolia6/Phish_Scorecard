import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date required' });

  try {
    // Get setlist from Phish.net
    const setlistRes = await fetch(
      `https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${process.env.PHISH_NET_API_KEY}`
    );
    const setlistData = await setlistRes.json();

    if (!setlistData.data || setlistData.data.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Build structured setlist
    const songs = setlistData.data.map(entry => ({
      song: entry.song,
      set: entry.set,
      position: entry.position,
      transition: entry.trans_mark,
      footnote: entry.footnote || '',
      isjam: entry.isjamchart || false,
    }));

    const show = setlistData.data[0];

    res.json({
      showdate: show.showdate,
      venue: show.venue,
      city: show.city,
      state: show.state,
      country: show.country,
      songs,
    });
  } catch (err) {
    console.error('Show detail error:', err);
    res.status(500).json({ error: err.message });
  }
}
