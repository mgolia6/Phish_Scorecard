import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { phishnet_username } = req.body;
  if (!phishnet_username) return res.status(400).json({ error: 'phishnet_username required' });

  try {
    const url = `https://api.phish.net/v5/reviews/username/${encodeURIComponent(phishnet_username.toLowerCase())}.json?apikey=${process.env.PHISH_NET_API_KEY}`;
    const r = await fetch(url);
    const d = await r.json();

    if (d.error || !d.data) {
      return res.status(404).json({ error: `No reviews found for "${phishnet_username}"` });
    }

    const reviews = d.data;
    if (!reviews.length) return res.json({ imported: 0, message: 'No reviews found' });

    const pool = getPool();
    let imported = 0;
    let skipped = 0;

    for (const review of reviews) {
      const showDate = review.showdate;
      if (!showDate) continue;

      // phish.net score is 1-5 stars (personal user rating)
      const rawScore = review.score != null ? parseFloat(review.score) : null;
      const score = (!isNaN(rawScore) && rawScore <= 5) ? rawScore : null;

      // actual field name from phish.net API is review_text
      const reviewText = review.review_text || review.review || review.body || null;
      // actual field name from phish.net API is posted_at
      const postedRaw = review.posted_at || review.posted_date || review.tstamp || null;
      const postedDate = typeof postedRaw === 'string' ? postedRaw.slice(0, 10) : null;
      
      // Debug log first review
      if (imported === 0) console.log('REVIEW FIELDS:', JSON.stringify({ score: review.score, rawScore, scoreFields: Object.keys(review).filter(k => k.includes('score')) }));

      try {
        await pool.query(
          `INSERT INTO user_reviews (user_id, show_date, phishnet_score, review_text, posted_date, source)
           VALUES ($1, $2, $3, $4, $5, 'phishnet')
           ON CONFLICT (user_id, show_date) DO UPDATE SET
             phishnet_score = EXCLUDED.phishnet_score,
             review_text = EXCLUDED.review_text,
             posted_date = EXCLUDED.posted_date,
             imported_at = CURRENT_TIMESTAMP`,
          [user.id, showDate, score, reviewText, postedDate]
        );
        imported++;
      } catch (e) {
        skipped++;
      }
    }

    res.json({ imported, skipped, total: reviews.length, message: `Imported ${imported} reviews from phish.net` });
  } catch (err) {
    console.error('Phish.net reviews import error:', err);
    res.status(500).json({ error: err.message });
  }
}
