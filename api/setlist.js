// Vercel serverless function for setlist endpoint
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    // Fetch setlist from Phish.net API
    const response = await fetch(`https://api.phish.net/v5/shows/${date}`, {
      headers: {
        'User-Agent': 'Phishow-Scorecard/2.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Show not found' });
    }

    const data = await response.json();
    const show = data.data;

    if (!show || !show.setlist) {
      return res.status(404).json({ error: 'No setlist found' });
    }

    // Transform setlist data
    const setlist = show.setlist.map(song => ({
      song: song.song,
      set: song.set || 'I',
      isjamchart: song.isjamchart || false,
      gap: song.gap || null,
      notes: song.notes || null
    }));

    res.status(200).json(setlist);
  } catch (error) {
    console.error('Setlist error:', error);
    res.status(500).json({ error: error.message });
  }
}
