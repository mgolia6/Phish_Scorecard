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

    const reviews = (reviewsData.data || []).map(r => ({
      author:  r.author,
      score:   parseFloat(r.score) || null,
      review:  r.review,
      posted:  r.posted_date,
    }));

    const scoredReviews = reviews.filter(r => r.score);
    const avgReviewScore = scoredReviews.length
      ? (scoredReviews.reduce((s, r) => s + r.score, 0) / scoredReviews.length).toFixed(2)
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
