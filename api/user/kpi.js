import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

function computeBadges({ shows_attended, shows_rated, shows_with_reviews, login_streak }) {
  const badges = [];

  // Attendance milestones
  if (shows_attended >= 100) badges.push({ id: 'century', label: 'CENTURY CLUB', desc: '100+ shows attended', glyph: '💯' });
  else if (shows_attended >= 50) badges.push({ id: 'fifty', label: 'HALF-CENTURY', desc: '50+ shows attended', glyph: '★' });
  else if (shows_attended >= 25) badges.push({ id: 'quarter', label: 'QUARTER-CENTURY', desc: '25+ shows attended', glyph: '◉' });
  else if (shows_attended >= 10) badges.push({ id: 'ten', label: 'DOUBLE DIGITS', desc: '10+ shows attended', glyph: '◈' });

  // Rating milestones
  if (shows_rated >= 100) badges.push({ id: 'rated_100', label: 'HALL OF PHAME', desc: '100+ shows rated', glyph: '🏆' });
  else if (shows_rated >= 50) badges.push({ id: 'rated_50', label: 'DEEP CUTS', desc: '50+ shows rated', glyph: '⬡' });
  else if (shows_rated >= 25) badges.push({ id: 'rated_25', label: 'PHISH SCHOLAR', desc: '25+ shows rated', glyph: '▦' });
  else if (shows_rated >= 10) badges.push({ id: 'rated_10', label: 'GETTING SCHOOLED', desc: '10+ shows rated', glyph: '✦' });
  else if (shows_rated >= 1) badges.push({ id: 'rated_1', label: 'FIRST FREEZE', desc: 'Rated your first show', glyph: '❄' });

  // Reviews
  if (shows_with_reviews >= 10) badges.push({ id: 'critic', label: 'PHISH CRITIC', desc: '10+ shows reviewed', glyph: '✍' });
  else if (shows_with_reviews >= 1) badges.push({ id: 'reviewer', label: 'REVIEWER', desc: 'Imported phish.net reviews', glyph: '✎' });

  // Streak
  if (login_streak >= 30) badges.push({ id: 'streak_30', label: 'ON FIRE', desc: '30-day login streak', glyph: '🔥' });
  else if (login_streak >= 7) badges.push({ id: 'streak_7', label: 'WEEKLY', desc: '7-day login streak', glyph: '⚡' });

  return badges;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  try {
    const [attendedRes, ratedRes, topSongRes, topVenueRes, reviewsRes, streakRes, firstShowRes, lastSyncRes] = await Promise.all([
      // SHOWS count: union of phish.net import (attendance) + any show they've rated/tracked (user_show_attendance)
      pool.query(
        `SELECT COUNT(DISTINCT show_date) as count FROM (
           SELECT show_date FROM attendance WHERE user_id = $1
           UNION
           SELECT show_date FROM user_show_attendance WHERE user_id = $1
         ) combined`,
        [user.id]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT show_date) as count, ROUND(AVG(rating)::numeric, 2) as avg_score
         FROM ratings WHERE user_id = $1 AND rating IS NOT NULL`,
        [user.id]
      ),
      pool.query(
        `SELECT song_name, ROUND(AVG(rating)::numeric, 2) as avg, COUNT(*) as times_rated
         FROM ratings WHERE user_id = $1 AND rating IS NOT NULL
         GROUP BY song_name ORDER BY avg DESC, times_rated DESC LIMIT 1`,
        [user.id]
      ),
      // TOP VENUE: check phish.net import first, fall back to shows rated/attended via user_show_attendance
      pool.query(
        `SELECT s.venue, s.city, s.state, COUNT(*) as shows
         FROM (
           SELECT show_date FROM attendance WHERE user_id = $1
           UNION
           SELECT show_date FROM user_show_attendance WHERE user_id = $1
         ) combined
         JOIN shows s ON s.show_date = combined.show_date
         WHERE s.venue IS NOT NULL
         GROUP BY s.venue, s.city, s.state
         ORDER BY shows DESC LIMIT 1`,
        [user.id]
      ),
      pool.query(
        'SELECT COUNT(DISTINCT show_date) as count FROM user_reviews WHERE user_id = $1',
        [user.id]
      ),
      pool.query('SELECT login_streak FROM users WHERE id = $1', [user.id]),
      // FIRST SHOW: earliest date across both attendance sources
      pool.query(
        `SELECT TO_CHAR(MIN(show_date), 'YYYY-MM-DD') as first_show FROM (
           SELECT show_date FROM attendance WHERE user_id = $1
           UNION
           SELECT show_date FROM user_show_attendance WHERE user_id = $1
         ) combined`,
        [user.id]
      ),
      pool.query(
        `SELECT TO_CHAR(MAX(created_at), 'Mon DD, YYYY · HH12:MIam') as last_sync FROM ratings WHERE user_id = $1`,
        [user.id]
      ),
    ]);

    const shows_attended = parseInt(attendedRes.rows[0]?.count || 0);
    const shows_rated = parseInt(ratedRes.rows[0]?.count || 0);
    const shows_with_reviews = parseInt(reviewsRes.rows[0]?.count || 0);
    const login_streak = parseInt(streakRes.rows[0]?.login_streak || 0);

    res.json({
      shows_attended,
      shows_rated,
      avg_score: ratedRes.rows[0]?.avg_score || null,
      top_song: topSongRes.rows[0] || null,
      top_venue: topVenueRes.rows[0] || null,
      shows_with_reviews,
      login_streak,
      first_show: firstShowRes.rows[0]?.first_show || null,
      last_sync: lastSyncRes.rows[0]?.last_sync || null,
      badges: computeBadges({ shows_attended, shows_rated, shows_with_reviews, login_streak }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
