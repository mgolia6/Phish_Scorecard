// POST /api/user/sync
// Fetches phish.net setlist data for all attended shows, caches it,
// then computes Deep Phreeze stats and writes to user_stats.
// Shared cache: if show already fetched recently, skip. Re-fetch last 60 days.

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

const PNET = 'https://api.phish.net/v5';
const CACHE_DAYS = 30;
const RECENT_DAYS = 60; // always re-fetch recent shows

async function fetchSetlist(date, apiKey) {
  const res = await fetch(`${PNET}/setlists/showdate/${date}.json?apikey=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.data?.length) return null;

  const first = data.data[0];
  const songs = data.data.map(e => ({
    song:     e.song,
    slug:     e.slug,
    set:      e.set,
    position: parseInt(e.position) || 0,
    isjam:    e.isjamchart === '1' || e.isjamchart === 1,
  }));

  // Group by set to get counts
  const sets = {};
  songs.forEach(s => {
    const k = s.set || '1';
    if (!sets[k]) sets[k] = [];
    sets[k].push(s);
  });

  return {
    venue:      first.venue,
    city:       first.city,
    state:      first.state,
    country:    first.country,
    tour_name:  first.tour_name || '',
    songs,
    set1_count:    (sets['1'] || []).length,
    set2_count:    (sets['2'] || []).length,
    encore_count:  (sets['e'] || sets['E'] || []).length,
    song_count:    songs.length,
  };
}

function computeStats(attendedDates, cachedShows, userRatings) {
  // Index cache and ratings by date
  const cache = {};
  cachedShows.forEach(s => { cache[s.show_date] = s; });
  
  const ratings = {};
  userRatings.forEach(r => {
    if (!ratings[r.show_date]) ratings[r.show_date] = [];
    ratings[r.show_date].push(r);
  });

  // ── ATTENDANCE STATS ──────────────────────────────────────
  const sortedDates = [...attendedDates].sort();
  
  // Longest gap between attended shows
  let longestGap = 0, longestGapFrom = null, longestGapTo = null;
  for (let i = 1; i < sortedDates.length; i++) {
    const days = Math.round((new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / 86400000);
    if (days > longestGap) {
      longestGap = days;
      longestGapFrom = sortedDates[i-1];
      longestGapTo = sortedDates[i];
    }
  }

  // Longest consecutive run (shows within 7 days of each other = same run)
  let maxRun = 1, currentRun = 1, runStart = sortedDates[0], bestRunStart = sortedDates[0];
  for (let i = 1; i < sortedDates.length; i++) {
    const days = Math.round((new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / 86400000);
    if (days <= 7) {
      currentRun++;
      if (currentRun > maxRun) { maxRun = currentRun; bestRunStart = runStart; }
    } else {
      currentRun = 1;
      runStart = sortedDates[i];
    }
  }

  // Years span
  const years = [...new Set(sortedDates.map(d => d.slice(0,4)))].sort();

  // ── SETLIST STATS (from cache) ────────────────────────────
  const showsWithCache = attendedDates.filter(d => cache[d]);
  
  // Longest show (by song count as proxy — we don't have duration from pnet)
  let longestShow = null, longestShowCount = 0;
  showsWithCache.forEach(d => {
    const c = cache[d];
    if (c.song_count > longestShowCount) {
      longestShowCount = c.song_count;
      longestShow = { date: d, venue: c.venue, city: c.city, song_count: c.song_count };
    }
  });

  // Longest Set I / II (by song count)
  let longestSet1 = null, longestSet1Count = 0;
  let longestSet2 = null, longestSet2Count = 0;
  showsWithCache.forEach(d => {
    const c = cache[d];
    if ((c.set1_count || 0) > longestSet1Count) {
      longestSet1Count = c.set1_count;
      longestSet1 = { date: d, venue: c.venue, count: c.set1_count };
    }
    if ((c.set2_count || 0) > longestSet2Count) {
      longestSet2Count = c.set2_count;
      longestSet2 = { date: d, venue: c.venue, count: c.set2_count };
    }
  });

  // Song frequency — how many times you've heard each song
  const songFreq = {};
  showsWithCache.forEach(d => {
    const c = cache[d];
    (c.setlist || []).forEach(s => {
      if (!songFreq[s.song]) songFreq[s.song] = 0;
      songFreq[s.song]++;
    });
  });

  const mostHeardAttended = Object.entries(songFreq)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([song, count]) => ({ song, count }));

  // Rarest songs — catch songs you've seen that are rarely played
  // (low frequency in YOUR history but we flag them)
  const rarestCaught = Object.entries(songFreq)
    .filter(([,count]) => count === 1)
    .map(([song]) => ({ song, times_caught: 1 }))
    .slice(0, 10);

  // ── RATED STATS ───────────────────────────────────────────
  const ratedDates = Object.keys(ratings);
  
  // Highest single song rating
  let highestSong = null, highestRating = 0;
  let lowestShowAvg = null, lowestShowAvgVal = 6;
  let highestShowAvg = null, highestShowAvgVal = 0;
  let mostVersionsSong = null, mostVersionsCount = 0;
  
  // Song versions across all rated shows
  const songVersions = {};
  const songRatings = {};

  ratedDates.forEach(d => {
    const showRatings = ratings[d];
    const showAvg = showRatings.reduce((s,r) => s + parseFloat(r.rating||0), 0) / showRatings.length;
    
    if (showAvg > highestShowAvgVal) {
      highestShowAvgVal = showAvg;
      highestShowAvg = { date: d, venue: cache[d]?.venue || '', avg: showAvg.toFixed(2) };
    }
    if (showAvg < lowestShowAvgVal && showRatings.length >= 3) {
      lowestShowAvgVal = showAvg;
      lowestShowAvg = { date: d, venue: cache[d]?.venue || '', avg: showAvg.toFixed(2) };
    }

    showRatings.forEach(r => {
      if (!r.rating) return;
      const rating = parseFloat(r.rating);
      if (rating > highestRating) {
        highestRating = rating;
        highestSong = { song: r.song_name, date: d, venue: cache[d]?.venue || '', rating };
      }
      if (!songVersions[r.song_name]) { songVersions[r.song_name] = 0; songRatings[r.song_name] = []; }
      songVersions[r.song_name]++;
      songRatings[r.song_name].push(rating);
      if (songVersions[r.song_name] > mostVersionsCount) {
        mostVersionsCount = songVersions[r.song_name];
        mostVersionsSong = r.song_name;
      }
    });
  });

  const mostHeardRated = Object.entries(songVersions)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([song, count]) => ({
      song, count,
      avg: (songRatings[song].reduce((a,b)=>a+b,0)/songRatings[song].length).toFixed(2)
    }));

  // Perfect 5s count
  let perfect5s = 0;
  ratedDates.forEach(d => {
    ratings[d].forEach(r => { if (parseFloat(r.rating) === 5) perfect5s++; });
  });

  // Most complete show (highest % songs rated)
  let mostComplete = null, mostCompletePct = 0;
  ratedDates.forEach(d => {
    const c = cache[d];
    if (!c || !c.song_count) return;
    const pct = Math.round((ratings[d].length / c.song_count) * 100);
    if (pct > mostCompletePct) {
      mostCompletePct = pct;
      mostComplete = { date: d, venue: c.venue, rated: ratings[d].length, total: c.song_count, pct };
    }
  });

  // Biggest set gap
  let biggestGapShow = null, biggestGapDelta = 0;
  ratedDates.forEach(d => {
    const showRatings = ratings[d];
    const set1 = showRatings.filter(r => r.set_number === '1' && r.rating);
    const set2 = showRatings.filter(r => r.set_number === '2' && r.rating);
    if (!set1.length || !set2.length) return;
    const s1avg = set1.reduce((s,r)=>s+parseFloat(r.rating),0)/set1.length;
    const s2avg = set2.reduce((s,r)=>s+parseFloat(r.rating),0)/set2.length;
    const delta = Math.abs(s2avg - s1avg);
    if (delta > biggestGapDelta) {
      biggestGapDelta = delta;
      biggestGapShow = {
        date: d, venue: cache[d]?.venue || '',
        set1_avg: s1avg.toFixed(2), set2_avg: s2avg.toFixed(2),
        delta: delta.toFixed(2),
        direction: s2avg > s1avg ? 'up' : 'down'
      };
    }
  });

  return {
    // Attendance
    total_attended: attendedDates.length,
    years_active: years.length,
    first_show: sortedDates[0],
    latest_show: sortedDates[sortedDates.length - 1],
    longest_gap: { days: longestGap, from: longestGapFrom, to: longestGapTo },
    longest_run: { shows: maxRun, start: bestRunStart },
    // Setlist (attended)
    longest_show: longestShow,
    longest_set1: longestSet1,
    longest_set2: longestSet2,
    most_heard_attended: mostHeardAttended,
    rarest_caught: rarestCaught,
    // Ratings
    total_rated: ratedDates.length,
    perfect_5s: perfect5s,
    highest_song: highestSong,
    highest_show: highestShowAvg,
    lowest_show: lowestShowAvg,
    most_versions_song: mostVersionsSong ? { song: mostVersionsSong, count: mostVersionsCount } : null,
    most_heard_rated: mostHeardRated,
    most_complete: mostComplete,
    biggest_set_gap: biggestGapShow,
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  const apiKey = process.env.PHISH_NET_API_KEY;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_DAYS);
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - RECENT_DAYS);

  try {
    // Get all attended show dates
    const attendedRes = await pool.query(
      `SELECT TO_CHAR(show_date, 'YYYY-MM-DD') as show_date FROM attendance WHERE user_id = $1 ORDER BY show_date`,
      [user.id]
    );
    const attendedDates = attendedRes.rows.map(r => r.show_date);
    if (!attendedDates.length) return res.json({ synced: 0, message: 'No attended shows to sync' });

    // Check cache — which shows need fetching
    const cacheRes = await pool.query(
      `SELECT show_date::text as show_date, fetched_at FROM show_cache WHERE show_date = ANY($1::date[])`,
      [attendedDates]
    );
    const cached = {};
    cacheRes.rows.forEach(r => { cached[r.show_date] = r.fetched_at; });

    const needsFetch = attendedDates.filter(d => {
      if (!cached[d]) return true; // never fetched
      const fetchedAt = new Date(cached[d]);
      if (d >= recentCutoff.toISOString().slice(0,10)) return true; // recent show, re-fetch
      if (fetchedAt < cutoff) return true; // stale cache
      return false;
    });

    // Fetch from phish.net in batches of 5 (rate limit friendly)
    let synced = 0;
    const batchSize = 5;
    for (let i = 0; i < needsFetch.length; i += batchSize) {
      const batch = needsFetch.slice(i, i + batchSize);
      await Promise.all(batch.map(async date => {
        try {
          const data = await fetchSetlist(date, apiKey);
          if (!data) return;
          await pool.query(`
            INSERT INTO show_cache (
              show_date, venue, city, state, country, tour_name,
              setlist, set1_count, set2_count, encore_count, song_count, fetched_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
            ON CONFLICT (show_date) DO UPDATE SET
              venue=$2, city=$3, state=$4, country=$5, tour_name=$6,
              setlist=$7, set1_count=$8, set2_count=$9, encore_count=$10,
              song_count=$11, fetched_at=NOW()
          `, [
            date, data.venue, data.city, data.state, data.country, data.tour_name,
            JSON.stringify(data.songs),
            data.set1_count, data.set2_count, data.encore_count, data.song_count
          ]);
          synced++;
        } catch (e) { /* skip failed fetches */ }
      }));
    }

    // Get full cache for attended shows
    const fullCacheRes = await pool.query(
      `SELECT show_date::text as show_date, venue, city, state, setlist,
              set1_count, set2_count, encore_count, song_count
       FROM show_cache WHERE show_date = ANY($1::date[])`,
      [attendedDates]
    );

    // Get all user ratings
    const ratingsRes = await pool.query(
      `SELECT TO_CHAR(r.show_date,'YYYY-MM-DD') as show_date, r.song_name, r.rating, r.set_number
       FROM ratings r WHERE r.user_id = $1 AND r.rating IS NOT NULL`,
      [user.id]
    );

    // Compute stats
    const stats = computeStats(attendedDates, fullCacheRes.rows, ratingsRes.rows);

    // Write to user_stats
    await pool.query(`
      INSERT INTO user_stats (user_id, stats, computed_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET stats=$2, computed_at=NOW()
    `, [user.id, JSON.stringify(stats)]);

    return res.json({ ok: true, synced, total_attended: attendedDates.length, stats });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
