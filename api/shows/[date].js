import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date required' });

  try {
    const [setlistRes, reviewsRes] = await Promise.all([
      fetch(`https://api.phish.net/v5/setlists/showdate/${date}.json?apikey=${process.env.PHISH_NET_API_KEY}`),
      fetch(`https://api.phish.net/v5/reviews/showdate/${date}.json?apikey=${process.env.PHISH_NET_API_KEY}`),
    ]);

    const setlistData = await setlistRes.json();
    const reviewsData = await reviewsRes.json().catch(() => ({ data: [] }));

    if (!setlistData.data || setlistData.data.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const first = setlistData.data[0];

    // Filter to Phish-only songs (artistid=1).
    // Phish.net returns all artists for a given date — e.g. Dude of Life shows
    // on the same date will bleed into the setlist if not filtered.
    // Also deduplicate by set+position for benefit shows where guest acts
    // share position numbers with Phish songs.
    const seenPositions = new Set();
    const songs = setlistData.data
      .filter(entry => {
        // Only include Phish songs (artistid 1, or no artistid field = legacy data)
        const aid = entry.artistid || entry.artist_id;
        if (aid && String(aid) !== '1') return false;
        // Deduplicate by set+position (benefit show openers at same slot)
        const key = `${entry.set}-${entry.position}`;
        if (seenPositions.has(key)) return false;
        seenPositions.add(key);
        return true;
      })
      .map(entry => ({
      songid:     entry.songid,
      song:       entry.song,
      slug:       entry.slug,
      set:        entry.set,
      position:   parseInt(entry.position) || 0,
      transition: entry.trans_mark || '',
      footnote:   entry.footnote || '',
      isjam:      entry.isjamchart === '1' || entry.isjamchart === 1,
      isreprise:  entry.isreprise === '1' || entry.isreprise === 1,
    }));

    // phish.net v5 reviews: fields are reviewid, showid, uid, score (0-10), review (text), tstamp, author
    // Map defensively — log raw first item to verify field names
    const rawReviews = reviewsData.data || [];
    const reviews = rawReviews.map(r => {
      // Try all known field name variants
      const author = r.author || r.username || r.uid || 'Anonymous';
      const text = r.review_text || r.review || r.body || r.text || '';
      const rawScore = r.score;
      // phish.net scores 0-10 scale; normalize to 0-5
      let score = null;
      if (rawScore != null && rawScore !== '') {
        const n = parseFloat(rawScore);
        if (!isNaN(n)) {
          // phish.net scores are 0-100 scale
          score = Math.round(n);
        }
      }
      // Strip ISO timestamp suffix — keep only YYYY-MM-DD
      const rawPosted = r.posted_date || r.tstamp || r.date || '';
      const posted = typeof rawPosted === 'string' ? rawPosted.slice(0, 10) : '';
      return { author, score, review: text, posted };
    });

    const scoredReviews = reviews.filter(r => r.score);
    const avgReviewScore = scoredReviews.length
      ? (scoredReviews.reduce((s, r) => s + parseFloat(r.score), 0) / scoredReviews.length).toFixed(2)
      : null;

    res.json({
      showid:        first.showid,
      showdate:      first.showdate,
      permalink:     first.permalink,
      venue:         first.venue,
      venueid:       first.venueid,
      city:          first.city,
      state:         first.state,
      country:       first.country,
      tour_name:     first.tour_name || '',
      tourid:        first.tourid,
      setlist_notes: first.setlistnotes || '',
      soundcheck:    (first.soundcheck || '').replace(/<[^>]*>/g, '').trim(),
      songs,
      reviews: {
        count:     reviews.length,
        avg_score: avgReviewScore,
        items:     reviews,
      },
    });
  } catch (err) {
    console.error('Show detail error:', err);
    res.status(500).json({ error: err.message });
  }
}
