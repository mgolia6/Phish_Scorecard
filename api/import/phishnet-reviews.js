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
    let updated = 0;
    let skipped = 0;

    for (const review of reviews) {
      const showDate = review.showdate;
      const reviewId = review.reviewid;
      if (!showDate || !reviewId) continue;

      const reviewText = review.review_text || review.review || review.body || null;
      const postedRaw = review.posted_at || review.posted_date || review.tstamp || null;
      const postedDate = typeof postedRaw === 'string' ? postedRaw.slice(0, 10) : null;

      try {
        const result = await pool.query(
          `INSERT INTO user_reviews 
            (user_id, show_date, phishnet_review_id, review_text, posted_date, source)
           VALUES ($1, $2, $3, $4, $5, 'phishnet')
           ON CONFLICT (user_id, phishnet_review_id) DO UPDATE SET
             review_text = EXCLUDED.review_text,
             posted_date = EXCLUDED.posted_date,
             imported_at = CURRENT_TIMESTAMP
           RETURNING (xmax = 0) as inserted`,
          [user.id, showDate, reviewId, reviewText, postedDate]
        );
        if (result.rows[0]?.inserted) imported++;
        else updated++;
      } catch (e) {
        console.error('Row error:', e.message, { showDate, reviewId });
        skipped++;
      }
    }

    res.json({ 
      imported, 
      updated,
      skipped, 
      total: reviews.length, 
      message: `Imported ${imported} new reviews, updated ${updated} from phish.net` 
    });
  } catch (err) {
    console.error('Phish.net reviews import error:', err);
    res.status(500).json({ error: err.message });
  }
}
