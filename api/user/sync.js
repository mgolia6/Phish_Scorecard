// POST /api/user/sync
// Fetches phish.net setlist data for all attended shows, caches it,
// then computes Deep Phreeze stats and writes to user_stats.
// Shared cache: if show already fetched recently, skip. Re-fetch last 60 days.

import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';

const PNET = 'https://api.phish.net/v5';
const PHISH_IN = 'https://phish.in/api/v2';
const CACHE_DAYS = 30;
const RECENT_DAYS = 60; // always re-fetch recent shows

async function fetchPhishInDuration(date) {
  try {
    // phish.in v2 API
    const res = await fetch(`${PHISH_IN}/shows/${date}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Handle multiple possible response shapes from phish.in
    // Shape 1: { tracks: [...] }
    // Shape 2: { data: { tracks: [...] } }
    // Shape 3: { data: [...] } where each item has duration
    let tracks = [];
    if (Array.isArray(data?.tracks)) tracks = data.tracks;
    else if (Array.isArray(data?.data?.tracks)) tracks = data.data.tracks;
    else if (Array.isArray(data?.data)) tracks = data.data;

    if (!tracks.length) return null;

    // duration field may be in seconds (integer) or "mm:ss" string or milliseconds
    const totalSeconds = tracks.reduce((sum, t) => {
      const raw = t.duration ?? t.length ?? t.run_time ?? 0;
      if (!raw) return sum;
      if (typeof raw === 'number') {
        // If > 10000 assume milliseconds
        return sum + (raw > 10000 ? Math.round(raw / 1000) : raw);
      }
      if (typeof raw === 'string' && raw.includes(':')) {
        const parts = raw.split(':').map(Number);
        if (parts.length === 2) return sum + parts[0] * 60 + parts[1];
        if (parts.length === 3) return sum + parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return sum + (parseInt(raw) || 0);
    }, 0);

    return totalSeconds > 60 ? totalSeconds : null;
  } catch (e) {
    return null;
  }
}

async function fetchSetlist(date, apiKey) {
  const res = await fetch(`${PNET}/setlists/showdate/${date}.json?apikey=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.data?.length) return null;

  // Filter to Phish-only (artistid=1) — same logic as shows/[date].js
  // Without this, Trey Trio / side project shows on the same date bleed in
  const phishOnly = data.data.filter(e => {
    const aid = e.artistid || e.artist_id;
    return !aid || String(aid) === '1';
  });
  if (!phishOnly.length) return null;

  const first = phishOnly[0];
  const songs = phishOnly.map(e => ({
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
  let bestRunEnd = sortedDates[0], currentRunStart = sortedDates[0];
  for (let i = 1; i < sortedDates.length; i++) {
    const days = Math.round((new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / 86400000);
    if (days <= 7) {
      currentRun++;
      if (currentRun > maxRun) {
        maxRun = currentRun;
        bestRunStart = currentRunStart;
        bestRunEnd = sortedDates[i];
      }
    } else {
      currentRun = 1;
      currentRunStart = sortedDates[i];
    }
  }

  // Run detail — songs, unique songs, states during the best run
  const runDates = sortedDates.filter(d => d >= bestRunStart && d <= bestRunEnd);
  let runSongsHeard = 0, runUniqueSongs = new Set(), runStates = new Set();
  runDates.forEach(d => {
    const c = cache[d];
    if (!c) return;
    runSongsHeard += c.song_count || 0;
    (c.setlist || []).forEach(s => { if (s.song) runUniqueSongs.add(s.song); });
    if (c.state) runStates.add(c.state);
  });

  // Years span
  const years = [...new Set(sortedDates.map(d => d.slice(0,4)))].sort();

  // ── SETLIST STATS (from cache) ────────────────────────────
  const showsWithCache = attendedDates.filter(d => cache[d]);
  
  // Longest show (by song count as proxy — we don't have duration from pnet)
  let longestShow = null, longestShowCount = 0;
  let longestShowDur = null, longestShowDurSec = 0;
  showsWithCache.forEach(d => {
    const c = cache[d];
    if (c.song_count > longestShowCount) {
      longestShowCount = c.song_count;
      longestShow = { date: d, venue: c.venue, city: c.city, song_count: c.song_count, duration_seconds: c.duration_seconds || null };
    }
  });

  // Longest Set I / II (by song count)
  let longestSet1 = null, longestSet1Count = 0;
  let longestSet2 = null, longestSet2Count = 0;
  showsWithCache.forEach(d => {
    const c = cache[d];
    const durPerSong = c.duration_seconds && c.song_count ? c.duration_seconds / c.song_count : null;
    if ((c.set1_count || 0) > longestSet1Count) {
      longestSet1Count = c.set1_count;
      longestSet1 = { date: d, venue: c.venue, count: c.set1_count, duration_seconds: durPerSong ? Math.round(durPerSong * c.set1_count) : null };
    }
    if ((c.set2_count || 0) > longestSet2Count) {
      longestSet2Count = c.set2_count;
      longestSet2 = { date: d, venue: c.venue, count: c.set2_count, duration_seconds: durPerSong ? Math.round(durPerSong * c.set2_count) : null };
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

  // Build attended song versions (dates + venues, sorted desc)
  const songAttendedVersions = {};
  showsWithCache.forEach(d => {
    const c = cache[d];
    (c.setlist || []).forEach(s => {
      if (!s.song) return;
      if (!songAttendedVersions[s.song]) songAttendedVersions[s.song] = [];
      // Only add once per show date
      if (!songAttendedVersions[s.song].find(v => v.date === d)) {
        songAttendedVersions[s.song].push({ date: d, venue: c.venue });
      }
    });
  });

  const mostHeardAttended = Object.entries(songFreq)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([song, count]) => ({
      song, count,
      versions: (songAttendedVersions[song] || [])
        .sort((a,b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    }));

  // Rarest songs — catch songs you've seen that are rarely played
  // Track date and venue for each song (first occurrence)
  const songFirstSeen = {};
  showsWithCache.forEach(d => {
    const c = cache[d];
    (c.setlist || []).forEach(s => {
      if (!songFirstSeen[s.song]) songFirstSeen[s.song] = { date: d, venue: c.venue };
    });
  });
  const rarestCaught = Object.entries(songFreq)
    .filter(([,count]) => count === 1)
    .map(([song]) => ({ song, times_caught: 1, date: songFirstSeen[song]?.date || null, venue: songFirstSeen[song]?.venue || null }))
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

  // Build per-song version details for dropdown
  const songVersionDetails = {}; // song -> [{date, venue, rating}]
  ratedDates.forEach(d => {
    ratings[d].forEach(r => {
      if (!r.rating) return;
      if (!songVersionDetails[r.song_name]) songVersionDetails[r.song_name] = [];
      songVersionDetails[r.song_name].push({
        date: d,
        venue: cache[d]?.venue || '',
        rating: parseFloat(r.rating),
      });
    });
  });

  const mostHeardRated = Object.entries(songVersions)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 10)
    .map(([song, count]) => ({
      song, count,
      avg: (songRatings[song].reduce((a,b)=>a+b,0)/songRatings[song].length).toFixed(2),
      versions: (songVersionDetails[song] || [])
        .sort((a,b) => b.rating - a.rating)
        .slice(0, 5),
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

  // ── EXTENDED STATS ──────────────────────────────────────
  // Total songs heard across all attended shows
  let totalSongsHeard = 0, totalSet1Songs = 0, totalSet2Songs = 0, totalEncoreSongs = 0;
  const uniqueSongsSet = new Set();
  const uniqueVenuesSet = new Set();
  const uniqueStatesSet = new Set();
  const showsByYear = {};
  const showsByMonth = { Jan:0,Feb:0,Mar:0,Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,Oct:0,Nov:0,Dec:0 };
  const showsByDow = { Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0 };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const encoreFreq = {};
  let longestEncore = null, longestEncoreCount = 0;
  let firstSongEver = null, lastSongEver = null;
  let totalSet1Count = 0, totalSet2Count = 0, set1ShowCount = 0, set2ShowCount = 0;
  let totalDurSeconds = 0, durCount = 0;
  let totalSet1DurSeconds = 0, set1DurCount = 0;
  let totalSet2DurSeconds = 0, set2DurCount = 0;
  let totalEncoreDur = 0, encoreDurCount = 0;

  showsWithCache.forEach(d => {
    const c = cache[d];
    totalSongsHeard += c.song_count || 0;
    totalSet1Songs += c.set1_count || 0;
    totalSet2Songs += c.set2_count || 0;
    totalEncoreSongs += c.encore_count || 0;
    if (c.set1_count > 0) { totalSet1Count += c.set1_count; set1ShowCount++; }
    if (c.set2_count > 0) { totalSet2Count += c.set2_count; set2ShowCount++; }
    if (c.venue) uniqueVenuesSet.add(c.venue);
    if (c.state) uniqueStatesSet.add(c.state);
    const yr = d.slice(0, 4);
    showsByYear[yr] = (showsByYear[yr] || 0) + 1;
    const dt = new Date(d + 'T12:00:00');
    const mon = MONTHS[dt.getMonth()];
    showsByMonth[mon] = (showsByMonth[mon] || 0) + 1;
    const dow = DAYS[dt.getDay()];
    showsByDow[dow] = (showsByDow[dow] || 0) + 1;
    (c.setlist || []).forEach(s => {
      if (s.song) uniqueSongsSet.add(s.song);
      if (s.set === 'e' || s.set === 'E') {
        if (!encoreFreq[s.song]) encoreFreq[s.song] = { count: 0, last_date: null, last_venue: null };
        encoreFreq[s.song].count++;
        // d is sorted ascending so last occurrence wins
        encoreFreq[s.song].last_date = d;
        encoreFreq[s.song].last_venue = c.venue;
      }
    });
    if ((c.encore_count || 0) > longestEncoreCount) {
      longestEncoreCount = c.encore_count;
      const durPerSong = c.duration_seconds && c.song_count ? c.duration_seconds / c.song_count : null;
      longestEncore = { date: d, venue: c.venue, count: c.encore_count, duration_seconds: durPerSong ? Math.round(durPerSong * c.encore_count) : null };
    }
    if (c.duration_seconds && c.duration_seconds > 0) {
      const dur = parseInt(c.duration_seconds);
      totalDurSeconds += dur;
      durCount++;
      // Estimate set durations proportionally from song counts
      if (c.song_count > 0) {
        if (c.set1_count) {
          totalSet1DurSeconds += Math.round((c.set1_count / c.song_count) * dur);
          set1DurCount++;
        }
        if (c.set2_count) {
          totalSet2DurSeconds += Math.round((c.set2_count / c.song_count) * dur);
          set2DurCount++;
        }
        if (c.encore_count) {
          totalEncoreDur += Math.round((c.encore_count / c.song_count) * dur);
          encoreDurCount++;
        }
      }
    }
  });

  // First and last songs from sorted attended shows
  if (showsWithCache.length) {
    const firstShow = cache[sortedDates.find(d => cache[d])];
    const lastShow = cache[[...sortedDates].reverse().find(d => cache[d])];
    if (firstShow?.setlist?.length) firstSongEver = firstShow.setlist[0].song;
    if (lastShow?.setlist?.length) lastSongEver = lastShow.setlist[lastShow.setlist.length - 1].song;
  }

  const mostCommonEncore = Object.entries(encoreFreq)
    .sort(([,a],[,b]) => b.count - a.count).slice(0, 5)
    .map(([song, data]) => ({ song, count: data.count, last_date: data.last_date, last_venue: data.last_venue }));

  // Consecutive years
  const yearNums = years.map(Number).sort((a,b)=>a-b);
  let maxConsecYears = 1, currentConsec = 1, consecStart = yearNums[0], bestConsecStart = yearNums[0];
  for (let i = 1; i < yearNums.length; i++) {
    if (yearNums[i] === yearNums[i-1] + 1) {
      currentConsec++;
      if (currentConsec > maxConsecYears) { maxConsecYears = currentConsec; bestConsecStart = consecStart; }
    } else {
      currentConsec = 1;
      consecStart = yearNums[i];
    }
  }

  // Days since first show
  const daysSinceFirst = sortedDates[0]
    ? Math.round((Date.now() - new Date(sortedDates[0])) / 86400000)
    : 0;

  // Precise live Phish time from phish.in durations, fallback to 3hr avg
  let totalDurationSeconds = 0;
  let preciseCount = 0;
  showsWithCache.forEach(d => {
    const c = cache[d];
    if (c.duration_seconds && c.duration_seconds > 0) {
      totalDurationSeconds += parseInt(c.duration_seconds);
      preciseCount++;
    } else {
      // Fallback: 3 hours per show
      totalDurationSeconds += 180 * 60;
    }
  });
  // Shows with no cache at all — also use 3hr fallback
  const uncachedCount = attendedDates.length - showsWithCache.length;
  totalDurationSeconds += uncachedCount * 180 * 60;

  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Shows per year avg
  const avgShowsPerYear = years.length > 0 ? (attendedDates.length / years.length).toFixed(1) : 0;

  // Busiest year
  let busiestYear = null, busiestYearCount = 0;
  Object.entries(showsByYear).forEach(([yr, ct]) => {
    if (ct > busiestYearCount) { busiestYearCount = ct; busiestYear = yr; }
  });

  // Era breakdown (1.0: pre-2000, 2.0: 2002-2004, hiatus 2005-2007, 3.0: 2009-2019, 4.0: 2021+)
  const eras = { '1.0': 0, '2.0': 0, '3.0': 0, '4.0': 0 };
  attendedDates.forEach(d => {
    const yr = parseInt(d.slice(0,4));
    if (yr < 2000) eras['1.0']++;
    else if (yr <= 2004) eras['2.0']++;
    else if (yr >= 2009 && yr <= 2019) eras['3.0']++;
    else if (yr >= 2021) eras['4.0']++;
  });

  // Set I vs Set II personal avg (from ratings)
  let set1Total = 0, set1Count = 0, set2Total = 0, set2Count = 0;
  ratedDates.forEach(d => {
    ratings[d].forEach(r => {
      if (!r.rating) return;
      if (r.set_number === '1') { set1Total += parseFloat(r.rating); set1Count++; }
      if (r.set_number === '2') { set2Total += parseFloat(r.rating); set2Count++; }
    });
  });
  const set1PersonalAvg = set1Count > 0 ? (set1Total / set1Count).toFixed(2) : null;
  const set2PersonalAvg = set2Count > 0 ? (set2Total / set2Count).toFixed(2) : null;
  const preferredSet = set1PersonalAvg && set2PersonalAvg
    ? (parseFloat(set2PersonalAvg) > parseFloat(set1PersonalAvg) ? 'SET II' : 'SET I')
    : null;

  // Show density: shows per year you've been a phan
  const showDensity = daysSinceFirst > 0
    ? (attendedDates.length / (daysSinceFirst / 365)).toFixed(1)
    : 0;

  return {
    // Attendance
    total_attended: attendedDates.length,
    years_active: years.length,
    years_list: years,
    first_show: sortedDates[0],
    latest_show: sortedDates[sortedDates.length - 1],
    days_since_first: daysSinceFirst,
    longest_gap: { days: longestGap, from: longestGapFrom, to: longestGapTo },
    longest_run: { shows: maxRun, start: bestRunStart, end: bestRunEnd, songs_heard: runSongsHeard, unique_songs: runUniqueSongs.size, states: [...runStates] },
    consecutive_years: { count: maxConsecYears, start: bestConsecStart },
    avg_shows_per_year: avgShowsPerYear,
    shows_by_year: showsByYear,
    shows_by_month: showsByMonth,
    shows_by_dow: showsByDow,
    // Setlist counts
    total_songs_heard: totalSongsHeard,
    total_set1_songs: totalSet1Songs,
    total_set2_songs: totalSet2Songs,
    total_encore_songs: totalEncoreSongs,
    unique_songs_heard: uniqueSongsSet.size,
    unique_venues: uniqueVenuesSet.size,
    unique_states: uniqueStatesSet.size,
    avg_songs_per_show: showsWithCache.length ? (totalSongsHeard / showsWithCache.length).toFixed(1) : 0,
    avg_set1_length: set1ShowCount ? (totalSet1Count / set1ShowCount).toFixed(1) : 0,
    avg_set2_length: set2ShowCount ? (totalSet2Count / set2ShowCount).toFixed(1) : 0,
    live_duration_seconds: totalDurationSeconds,
    live_duration_minutes: totalMinutes,
    live_duration_hours: totalHours,
    live_duration_days: totalDays,
    precise_show_count: preciseCount,
    avg_show_duration_seconds: durCount > 0 ? Math.round(totalDurSeconds / durCount) : null,
    avg_set1_duration_seconds: set1DurCount > 0 ? Math.round(totalSet1DurSeconds / set1DurCount) : null,
    avg_set2_duration_seconds: set2DurCount > 0 ? Math.round(totalSet2DurSeconds / set2DurCount) : null,
    avg_encore_duration_seconds: encoreDurCount > 0 ? Math.round(totalEncoreDur / encoreDurCount) : null,
    precise_show_count: preciseCount,
    most_common_encore: mostCommonEncore,
    longest_encore: longestEncore,
    first_song_ever: firstSongEver,
    last_song_ever: lastSongEver,
    // Setlist (attended)
    longest_show: longestShow,
    longest_set1: longestSet1,
    longest_set2: longestSet2,
    most_heard_attended: mostHeardAttended,
    rarest_caught: rarestCaught,
    busiest_year: busiestYear ? { year: busiestYear, count: busiestYearCount } : null,
    eras,
    set1_personal_avg: set1PersonalAvg,
    set2_personal_avg: set2PersonalAvg,
    preferred_set: preferredSet,
    show_density: showDensity,
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

    // Ensure duration_seconds column exists (migration)
    await pool.query(`ALTER TABLE show_cache ADD COLUMN IF NOT EXISTS duration_seconds INTEGER`).catch(() => {});

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
          // Also fetch precise duration from phish.in
          const durationSeconds = await fetchPhishInDuration(date);
          await pool.query(`
            INSERT INTO show_cache (
              show_date, venue, city, state, country, tour_name,
              setlist, set1_count, set2_count, encore_count, song_count,
              duration_seconds, fetched_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
            ON CONFLICT (show_date) DO UPDATE SET
              venue=$2, city=$3, state=$4, country=$5, tour_name=$6,
              setlist=$7, set1_count=$8, set2_count=$9, encore_count=$10,
              song_count=$11, duration_seconds=$12, fetched_at=NOW()
          `, [
            date, data.venue, data.city, data.state, data.country, data.tour_name,
            JSON.stringify(data.songs),
            data.set1_count, data.set2_count, data.encore_count, data.song_count,
            durationSeconds
          ]);
          synced++;
        } catch (e) { /* skip failed fetches */ }
      }));
    }

    // Get full cache for attended shows
    const fullCacheRes = await pool.query(
      `SELECT show_date::text as show_date, venue, city, state, setlist,
              set1_count, set2_count, encore_count, song_count, duration_seconds
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





