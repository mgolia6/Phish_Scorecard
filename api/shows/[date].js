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

    const songs = setlistData.data.map(entry => ({
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
      const text = r.review || r.body || r.text || '';
      const rawScore = r.score;
      // phish.net scores 0-10 scale; normalize to 0-5
      let score = null;
      if (rawScore != null && rawScore !== '') {
        const n = parseFloat(rawScore);
        if (!isNaN(n)) {
          // If score > 5, it's on 0-10 scale — halve it
          score = n > 5 ? (n / 2).toFixed(1) : n.toFixed(1);
        }
      }
      const posted = r.posted_date || r.tstamp || r.date || '';
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
      soundcheck:    first.soundcheck || '',
      songs,
      reviews: {
        count:     reviews.length,
        avg_score: avgReviewScore,
        items:     reviews.slice(0, 3),
      },
    });
  } catch (err) {
    console.error('Show detail error:', err);
    res.status(500).json({ error: err.message });
  }
}
