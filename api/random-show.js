import { getPool } from './_db.js';
import { cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const TODAY = new Date().toISOString().split('T')[0];
  const HIATUS = ['2005-01-01', '2007-12-31'];

  const pool = getPool();
  try {
    // Pick a random show from our shows table — already seeded from phish.net
    const result = await pool.query(`
      SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as showdate
      FROM shows
      WHERE show_date < $1
        AND show_date NOT BETWEEN '2004-12-31' AND '2008-01-01'
      ORDER BY RANDOM()
      LIMIT 1
    `, [TODAY]);

    if (!result.rows.length) {
      // Fallback: if shows table is empty, use phish.net API
      const pnetRes = await fetch(
        `https://api.phish.net/v5/shows/artist/phish.json?apikey=${process.env.PHISH_NET_API_KEY}&order_by=showdate&direction=desc&limit=500`
      );
      if (!pnetRes.ok) throw new Error(`phish.net ${pnetRes.status}`);
      const data = await pnetRes.json();
      const past = (data.data || []).filter(s => s.showdate < TODAY);
      if (!past.length) return res.status(404).json({ error: 'No shows found' });
      const pick = past[Math.floor(Math.random() * past.length)];
      return res.json({ showdate: pick.showdate });
    }

    return res.json({ showdate: result.rows[0].showdate });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
