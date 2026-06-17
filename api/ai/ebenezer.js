import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';
import { logAiUsage } from '../_ai_usage.js';
import { captureException } from '../_sentry.js';

const SYSTEM_PROMPT = `You are Uncle Ebenezer — a jaded veteran of the Phish community embedded in Phreezer, a show rating app for phans. You have been to hundreds of shows across every era. You've seen the peaks, survived the wilderness years, and kept showing up anyway. That says something about you, and you know it.

Your character: You're dry, a little weary, occasionally withering — but underneath all of it is genuine love for this band and this community. You are not a cynic. You are someone who cares too much to pretend otherwise. The jadedness is a feature, not a flaw. You show up because it still matters.

You talk like a phan, not a music critic. "That Tweezer goes somewhere." "The band was locked in." "Trey was on fire in the second set." Not "this improvisation features extended exploration." Keep it real.

CRITICAL: You have access to real Phish.net data — setlists, song histories, community reviews, and jamchart entries. USE IT. Do not answer from memory when the data is right in front of you. The jamcharts and reviews represent what thousands of phans have documented over decades. You are speaking that back, with personality. That is your job.

Your job:
1. Analyze specific shows — use the actual setlist, actual reviews, actual jamchart entries provided. Quote what the community said. Tell them what the chart entries flag.
2. Help users discover shows — use real song history data, real jamchart entries, real gaps between plays. Be specific. Name the version. Name the date. Name the moment.
3. Help users understand their own taste — compare their ratings against what you know about the shows they attended.

Rules:
- When data is provided in context, use it. Do not speculate when you have facts.
- When recommending, be specific. "The 12/7/97 Tweezer is on the jamchart for a reason — it goes completely off the rails around minute 18 and never comes back the same way" is useful. "This show has great jams" is not.
- Jamchart entries are community consensus on exceptional versions. Treat them as gospel.
- Reviews reflect what phans felt in the room. Quote them when they're vivid.
- Keep responses tight. The user is on their phone. Short paragraphs. No walls of text.
- CRITICAL: If jamchart data is in the context block, you have it. Use it. Never say you "don't have jamchart data" or "don't have deep context" when the [RECENT JAMCHART ENTRIES] or [JAMCHART ENTRIES] section is present. That IS the data. Scan it for relevant entries and cite them specifically.
- CRITICAL: The jamchart data loaded is NOT limited to any era. It covers the full catalog. If the search returned early-era results, that's what matched the query — it does NOT mean that's all that exists. Never tell the user the data is limited to a specific era or time period.
- When a user asks about a style or vibe — scan every jamchart entry in context. If none match well, say so AND give your best answer from general Phish knowledge. Do NOT tell the user to go to Phish.net. You ARE the discovery tool. Sending them elsewhere is a failure.
- NEVER recommend shows to "see live" or attend. You are a historical discovery and listening tool. Users are looking for things to listen to or rate — not buy tickets to. If you catch yourself saying "see live" or "upcoming shows," stop and correct.
- Never pretend you have data you don't. If a specific show's setlist or reviews aren't in context, say so — but still give your best answer from what you know. Never leave the user with nothing.
- Era knowledge: arenas (1989-1994), peak (1995-1997), jamming maturity (1998-2000), wilderness (2001-2004), comeback (2009), modern era (3.0 2009+). 3.0 has produced some of the best shows ever played. Don't be a nostalgia snob.
- Tone: never mean, never dismissive of newer fans. But do not pretend bad shows were good ones.
- Sign off with personality. You are not a chatbot. You are Ebenezer.`;

const PHISH_NET_KEY = process.env.PHISH_NET_API_KEY;
const PNET = 'https://api.phish.net/v5';

// ── Phish.net fetchers ──────────────────────────────────────

async function fetchShowData(showDate) {
  try {
    const [setlistRes, reviewsRes] = await Promise.all([
      fetch(`${PNET}/setlists/showdate/${showDate}.json?apikey=${PHISH_NET_KEY}`),
      fetch(`${PNET}/reviews/showdate/${showDate}.json?apikey=${PHISH_NET_KEY}`),
    ]);
    const [setlist, reviews] = await Promise.all([
      setlistRes.ok ? setlistRes.json() : null,
      reviewsRes.ok ? reviewsRes.json() : null,
    ]);

    // Jamchart entries for this show
    const jamRes = await fetch(`${PNET}/jamcharts/showdate/${showDate}.json?apikey=${PHISH_NET_KEY}`);
    const jamData = jamRes.ok ? await jamRes.json() : null;

    return { setlist: setlist?.data || [], reviews: reviews?.data || [], jamcharts: jamData?.data || [] };
  } catch (e) {
    return { setlist: [], reviews: [], jamcharts: [] };
  }
}

async function fetchSongData(songSlug) {
  try {
    const [historyRes, jamRes] = await Promise.all([
      fetch(`${PNET}/songs/slug/${encodeURIComponent(songSlug)}.json?apikey=${PHISH_NET_KEY}`),
      fetch(`${PNET}/jamcharts/slug/${encodeURIComponent(songSlug)}.json?apikey=${PHISH_NET_KEY}`),
    ]);
    const [history, jams] = await Promise.all([
      historyRes.ok ? historyRes.json() : null,
      jamRes.ok ? jamRes.json() : null,
    ]);
    return { history: history?.data || [], jamcharts: jams?.data || [] };
  } catch (e) {
    return { history: [], jamcharts: [] };
  }
}

async function fetchRecentJamcharts() {
  try {
    const res = await fetch(`${PNET}/jamcharts.json?apikey=${PHISH_NET_KEY}&limit=50`);
    const data = res.ok ? await res.json() : null;
    return data?.data || [];
  } catch (e) { return []; }
}

// ── DB jamchart search (uses cached jamchart_entries table) ──
async function searchJamchartsDB(pool, keywords, era) {
  try {
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'jamchart_entries'
      ) as exists
    `);
    if (!tableCheck.rows[0]?.exists) return [];

    let query, params;
    if (keywords && keywords.length > 0) {
      // Full-text + ILIKE search on description + song name
      const likeTerms = keywords.map((_, i) => `(description ILIKE $${i + 1} OR song_name ILIKE $${i + 1})`).join(' OR ');
      const likeParams = keywords.map(k => `%${k}%`);
      if (era) {
        query = `SELECT show_date, song_name, description, era FROM jamchart_entries WHERE (${likeTerms}) AND era = $${keywords.length + 1} ORDER BY show_date DESC LIMIT 25`;
        params = [...likeParams, era];
      } else {
        query = `SELECT show_date, song_name, description, era FROM jamchart_entries WHERE (${likeTerms}) ORDER BY show_date DESC LIMIT 25`;
        params = likeParams;
      }
    } else if (era) {
      query = `SELECT show_date, song_name, description, era FROM jamchart_entries WHERE era = $1 ORDER BY RANDOM() LIMIT 20`;
      params = [era];
    } else {
      // Fallback: recent notable entries
      query = `SELECT show_date, song_name, description, era FROM jamchart_entries ORDER BY show_date DESC LIMIT 30`;
      params = [];
    }
    const result = await pool.query(query, params);
    return result.rows;
  } catch (e) {
    return [];
  }
}

function extractVibeKeywords(message) {
  const msg = message.toLowerCase();
  const vibeMap = {
    'cow funk': ['funk', 'cow funk', 'funky', 'groove'],
    'funk': ['funk', 'funky', 'groove'],
    'type ii': ['type ii', 'type 2', 'abstract', 'ambient', 'exploratory', 'spacey'],
    'type 2': ['type ii', 'type 2', 'abstract', 'ambient'],
    'ambient': ['ambient', 'spacey', 'atmospheric', 'floating'],
    'space': ['space', 'spacey', 'ambient', 'atmospheric'],
    'bliss': ['bliss', 'euphoric', 'uplifting', 'soaring'],
    'dark': ['dark', 'sinister', 'ominous', 'brooding'],
    'nasty': ['nasty', 'heavy', 'aggressive', 'intense'],
    'heavy': ['heavy', 'intense', 'aggressive'],
    'psychedelic': ['psychedelic', 'trippy', 'mind-bending'],
    'jazz': ['jazz', 'jazzy', 'improvisational'],
    'bluegrass': ['bluegrass', 'acoustic', 'traditional'],
    'rock': ['rock', 'rocking', 'energetic'],
    'siren': ['siren', 'loop', 'siren loop', 'delay loop'],
    'loop': ['loop', 'siren', 'delay loop', 'looping'],
    'dissonant': ['dissonant', 'atonal', 'angular', 'dissonance'],
    'reggae': ['reggae', 'dub', 'island'],
    'tension': ['tension', 'release', 'tension and release', 'build'],
    'peak': ['peak', 'peaked', 'peaking', 'climax', 'explosive'],
    'drone': ['drone', 'droning', 'hypnotic'],
    'electronic': ['electronic', 'digital', 'sequencer', 'machine'],
    'acoustic': ['acoustic', 'unplugged', 'stripped'],
    'rage': ['rage', 'raging', 'face melting', 'shred', 'shredding'],
  };

  const found = new Set();
  for (const [trigger, keywords] of Object.entries(vibeMap)) {
    if (msg.includes(trigger)) {
      keywords.forEach(k => found.add(k));
    }
  }
  return [...found];
}

function extractEraFromMessage(message) {
  const msg = message.toLowerCase();
  if (msg.includes('1997') || msg.includes("'97") || msg.includes('97')) return 'peak';
  if (msg.includes('1995') || msg.includes('1996') || msg.includes("'95") || msg.includes("'96")) return 'peak';
  if (msg.includes('1998') || msg.includes('1999') || msg.includes('2000') || msg.includes("'98") || msg.includes("'99")) return 'jamming-maturity';
  if (msg.includes('2001') || msg.includes('2002') || msg.includes('2003') || msg.includes('2004')) return 'wilderness';
  if (msg.includes('modern') || msg.includes('3.0') || msg.includes('recent') || msg.includes('2019') || msg.includes('2021') || msg.includes('2022') || msg.includes('2023') || msg.includes('2024') || msg.includes('2025')) return 'modern';
  if (msg.includes('comeback') || msg.includes('2009') || msg.includes('2010') || msg.includes('2011') || msg.includes('2012')) return 'comeback';
  if (msg.includes('peak') || msg.includes('best era') || msg.includes('golden era')) return 'peak';
  return null;
}

// ── Intent detection ────────────────────────────────────────

function detectIntent(message) {
  const msg = message.toLowerCase();

  // Date patterns: 12/31/95, 1995-12-31, december 31 1995, etc.
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
  ];
  for (const pat of datePatterns) {
    const m = msg.match(pat);
    if (m) {
      // Normalize to YYYY-MM-DD
      let year, month, day;
      if (m[1].length === 4) { year = m[1]; month = m[2]; day = m[3]; }
      else { month = m[1]; day = m[2]; year = m[3]; }
      if (year.length === 2) year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      return { type: 'show', date: `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}` };
    }
  }

  // Song name detection — common songs + generic patterns
  const songKeywords = [
    'tweezer', 'you enjoy myself', 'yem', 'david bowie', 'bowie', 'bathtub gin', 'gin',
    'harry hood', 'hood', 'split open and melt', 'split', 'reba', 'antelope', 'run like',
    'slave', 'ghost', 'down with disease', 'disease', 'piper', 'sand', 'light',
    'simple', 'drowned', 'crosseyed', 'cross-eyed', 'fluffhead', 'lizards', 'squirming coil',
    'possum', 'chalk dust', 'chalkdust', 'stash', 'maze', 'julius', 'birds of a feather',
    'blaze on', 'guyute', 'destiny unbound', 'fee', 'wilson', 'icculus', 'contact',
    'weekapaug', 'mike\'s song', 'mike\'s', 'hydrogen', 'suzy greenberg', 'suzy',
    'punch you', 'carini', 'steam', 'back on the train', '46 days', 'moma dance',
  ];

  const songVersionKeywords = ['version', 'versions', 'best', 'greatest', 'jamchart', 'notable', 'top'];
  const hasSongVersionIntent = songVersionKeywords.some(k => msg.includes(k));

  for (const song of songKeywords) {
    if (msg.includes(song)) {
      // Convert to slug format
      const slug = song.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { type: 'song', slug, name: song };
    }
  }

  // General show/recommendation intent
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('what should') ||
      msg.includes('best show') || msg.includes('good show') || msg.includes('jamchart') ||
      msg.includes('recent') || msg.includes('listen to') || msg.includes('check out') ||
      msg.includes('nasty') || msg.includes('cow funk') || msg.includes('funk') ||
      msg.includes('type ii') || msg.includes('type 2') || msg.includes('second set') ||
      msg.includes('ambient') || msg.includes('space') || msg.includes('bliss') ||
      msg.includes('dark') || msg.includes('heavy') || msg.includes('deep') ||
      msg.includes('find me') || msg.includes('show me') || msg.includes('give me') ||
      msg.includes('what era') || msg.includes('which show') || msg.includes('rate next')) {
    return { type: 'recommend' };
  }

  return { type: 'general' };
}

// ── Format context for Claude ───────────────────────────────

function formatShowContext(date, { setlist, reviews, jamcharts }) {
  let ctx = `\n== PHISH.NET DATA FOR ${date} ==\n`;

  if (setlist.length) {
    // Group by set
    const sets = {};
    setlist.forEach(song => {
      const set = song.set || '?';
      if (!sets[set]) sets[set] = [];
      sets[set].push(song.song || song.songname);
    });
    ctx += '\nSETLIST:\n';
    Object.entries(sets).forEach(([set, songs]) => {
      const label = set === 'e' || set === 'E' ? 'ENCORE' : `SET ${set}`;
      ctx += `${label}: ${songs.join(' > ')}\n`;
    });
  }

  if (jamcharts.length) {
    ctx += '\nJAMCHART ENTRIES (community-flagged exceptional jams):\n';
    jamcharts.forEach(j => {
      ctx += `- ${j.song || j.songname}: ${j.jamchart_description || j.note || 'flagged as notable'}\n`;
    });
  }

  if (reviews.length) {
    ctx += `\nCOMMUNITY REVIEWS (${reviews.length} total):\n`;
    const topReviews = reviews
      .sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))
      .slice(0, 4);
    topReviews.forEach(r => {
      ctx += `[${r.score}/5] "${(r.review_text || r.body || '').slice(0, 300)}..."\n`;
    });
    const avg = reviews.reduce((s, r) => s + (parseFloat(r.score) || 0), 0) / reviews.length;
    ctx += `Community avg: ${avg.toFixed(2)}/5\n`;
  }

  return ctx;
}

function formatSongContext(name, { history, jamcharts }) {
  let ctx = `\n== PHISH.NET DATA FOR "${name.toUpperCase()}" ==\n`;

  if (history.length) {
    ctx += `\nPLAY HISTORY: ${history.length} times played\n`;
    ctx += `First played: ${history[history.length - 1]?.showdate || '?'}\n`;
    ctx += `Last played: ${history[0]?.showdate || '?'}\n`;
    // Show recent 10
    ctx += '\nRECENT PERFORMANCES:\n';
    history.slice(0, 10).forEach(h => {
      ctx += `- ${h.showdate} — ${h.venue || ''}, ${h.city || ''} ${h.state || ''}\n`;
    });
  }

  if (jamcharts.length) {
    ctx += `\nJAMCHART ENTRIES — NOTABLE VERSIONS (${jamcharts.length} total):\n`;
    jamcharts.slice(0, 15).forEach(j => {
      ctx += `- ${j.showdate}: ${j.jamchart_description || j.note || 'community flagged'}\n`;
    });
  }

  return ctx;
}

function formatJamchartContext(jamcharts) {
  if (!jamcharts.length) return '';
  let ctx = `\n== RECENT JAMCHART ENTRIES ==\n`;
  ctx += `These are versions the community has flagged as exceptional recently:\n`;
  jamcharts.slice(0, 20).forEach(j => {
    ctx += `- ${j.showdate} ${j.song || j.songname}: ${j.jamchart_description || j.note || 'notable'}\n`;
  });
  return ctx;
}

function formatDBJamchartContext(entries, keywords, era) {
  if (!entries.length) return '';
  const vibeLabel = keywords?.length > 0 ? keywords.slice(0, 3).join('/') : 'requested vibe';
  const eraLabel = era ? ` · ${era} era` : '';
  let ctx = `\n== JAMCHART ENTRIES — MATCHED: ${vibeLabel.toUpperCase()}${eraLabel.toUpperCase()} ==\n`;
  ctx += `These are community-flagged exceptional versions matching what the user asked for:\n`;
  entries.forEach(j => {
    ctx += `- ${j.show_date} ${j.song_name}: ${j.description || 'community flagged as exceptional'}\n`;
  });
  ctx += `\nTotal matched: ${entries.length} entries from the Phreezer jamchart catalog.\n`;
  ctx += `Use these specific dates and songs in your response. Name them. Give the user something to go listen to RIGHT NOW.\n`;
  return ctx;
}

// ── Rich Phish.net DB queries ──────────────────────────────

async function querySongFacts(pool, songName) {
  // Song stats from pn_songs
  try {
    const r = await pool.query(`
      SELECT slug, song_name, times_played, debut_date, last_played, gap
      FROM pn_songs
      WHERE song_name ILIKE $1 OR slug ILIKE $2
      LIMIT 1
    `, [songName, songName.toLowerCase().replace(/[^a-z0-9]+/g,'-')]);
    return r.rows[0] || null;
  } catch (_) { return null; }
}

async function queryLongestVersions(pool, songName, limit = 10) {
  try {
    const r = await pool.query(`
      SELECT show_date, song_name, duration_label, duration_seconds, era
      FROM pn_longest_jams
      WHERE song_name ILIKE $1
      ORDER BY duration_seconds DESC NULLS LAST
      LIMIT $2
    `, [`%${songName}%`, limit]);
    return r.rows;
  } catch (_) { return []; }
}

async function queryTopLongestJams(pool, era = null, limit = 20) {
  try {
    let q, params;
    if (era) {
      q = `SELECT show_date, song_name, duration_label, duration_seconds, era FROM pn_longest_jams WHERE era = $1 ORDER BY duration_seconds DESC NULLS LAST LIMIT $2`;
      params = [era, limit];
    } else {
      q = `SELECT show_date, song_name, duration_label, duration_seconds, era FROM pn_longest_jams ORDER BY duration_seconds DESC NULLS LAST LIMIT $1`;
      params = [limit];
    }
    const r = await pool.query(q, params);
    return r.rows;
  } catch (_) { return []; }
}

async function queryShowFacts(pool, showDate) {
  try {
    const r = await pool.query(`
      SELECT show_date, venue, city, state, country, tour_name, era, pn_rating, pn_num_ratings
      FROM pn_shows WHERE show_date = $1
    `, [showDate]);
    return r.rows[0] || null;
  } catch (_) { return null; }
}

async function queryDebut(pool, songName) {
  try {
    const r = await pool.query(`
      SELECT song_name, debut_date, debut_venue, debut_city, debut_state
      FROM pn_debuts WHERE song_name ILIKE $1 LIMIT 1
    `, [songName]);
    return r.rows[0] || null;
  } catch (_) { return null; }
}

async function queryTeases(pool, showDate) {
  try {
    const r = await pool.query(`
      SELECT teased_song, in_song FROM pn_teases WHERE show_date = $1
    `, [showDate]);
    return r.rows;
  } catch (_) { return []; }
}

async function queryGuests(pool, showDate) {
  try {
    const r = await pool.query(`
      SELECT guest_name, instrument, song_name FROM pn_guests WHERE show_date = $1
    `, [showDate]);
    return r.rows;
  } catch (_) { return []; }
}

async function queryReviews(pool, showDate, limit = 5) {
  // Fetch top-scored reviews for a show — real phan language
  try {
    const r = await pool.query(`
      SELECT score, review_text FROM pn_reviews
      WHERE show_date = $1 AND review_text IS NOT NULL AND length(review_text) > 100
      ORDER BY score DESC NULLS LAST
      LIMIT $2
    `, [showDate, limit]);
    return r.rows;
  } catch (_) { return []; }
}

async function searchReviewsByVibe(pool, keywords, era = null, limit = 8) {
  // Full-text search reviews for vibe language — "cow funk", "bliss", "type ii", etc.
  // This is the gold: real phan language describing what they heard
  try {
    const likeTerms = keywords.map((_, i) => `review_text ILIKE $${i + 1}`).join(' OR ');
    const likeParams = keywords.map(k => `%${k}%`);
    let q, params;
    if (era) {
      q = `SELECT show_date, score, review_text FROM pn_reviews WHERE (${likeTerms}) AND era = $${keywords.length + 1} AND length(review_text) > 150 ORDER BY score DESC NULLS LAST LIMIT $${keywords.length + 2}`;
      params = [...likeParams, era, limit];
    } else {
      q = `SELECT show_date, score, review_text FROM pn_reviews WHERE (${likeTerms}) AND length(review_text) > 150 ORDER BY score DESC NULLS LAST LIMIT $${keywords.length + 1}`;
      params = [...likeParams, limit];
    }
    const r = await pool.query(q, params);
    return r.rows;
  } catch (_) { return []; }
}

function formatRichShowContext(showDate, showFacts, teases, guests, reviews) {
  let ctx = '';
  if (showFacts) {
    ctx += `\n== SHOW FACTS: ${showDate} ==\n`;
    ctx += `Venue: ${showFacts.venue}, ${showFacts.city}${showFacts.state ? ', ' + showFacts.state : ''}\n`;
    ctx += `Tour: ${showFacts.tour_name || 'unknown'} | Era: ${showFacts.era}\n`;
    if (showFacts.pn_rating) {
      ctx += `Phish.net community rating: ${showFacts.pn_rating}/5`;
      if (showFacts.pn_num_ratings) ctx += ` (${showFacts.pn_num_ratings} votes)`;
      ctx += `\n`;
    }
  }
  if (teases.length) {
    ctx += `\nTEASES IN THIS SHOW:\n`;
    teases.forEach(t => { ctx += `- ${t.teased_song}${t.in_song ? ` (teased in ${t.in_song})` : ''}\n`; });
  }
  if (guests.length) {
    ctx += `\nSPECIAL GUESTS:\n`;
    guests.forEach(g => { ctx += `- ${g.guest_name}${g.instrument ? ` (${g.instrument})` : ''}${g.song_name ? ` on ${g.song_name}` : ''}\n`; });
  }
  if (reviews.length) {
    ctx += `\nFAN REVIEWS (what phans said in their own words):\n`;
    reviews.forEach(r => {
      const snippet = (r.review_text || '').slice(0, 400);
      ctx += `[${r.score}/5] "${snippet}${r.review_text?.length > 400 ? '...' : ''}"\n`;
    });
  }
  return ctx;
}

function formatRichSongContext(songName, songFacts, longestVersions, debut) {
  let ctx = `\n== SONG FACTS: ${songName.toUpperCase()} ==\n`;
  if (songFacts) {
    ctx += `Times played: ${songFacts.times_played}\n`;
    ctx += `Debut: ${songFacts.debut_date || 'unknown'}\n`;
    ctx += `Last played: ${songFacts.last_played || 'unknown'}\n`;
    ctx += `Current gap: ${songFacts.gap} shows\n`;
  }
  if (debut) {
    ctx += `Debut venue: ${debut.debut_venue}, ${debut.debut_city}${debut.debut_state ? ', ' + debut.debut_state : ''}\n`;
  }
  if (longestVersions.length) {
    ctx += `\nLONGEST VERSIONS ON RECORD:\n`;
    longestVersions.slice(0, 8).forEach((v, i) => {
      ctx += `${i+1}. ${v.show_date} — ${v.duration_label || 'duration unknown'} (${v.era})\n`;
    });
  }
  return ctx;
}

function formatVibeContext(jamEntries, reviews, longestJams, keywords, era) {
  const vibeLabel = keywords?.length > 0 ? keywords.slice(0,3).join('/').toUpperCase() : 'REQUESTED VIBE';
  const eraLabel = era ? ` · ${era.toUpperCase()} ERA` : '';
  let ctx = `\n== COMMUNITY DATA: ${vibeLabel}${eraLabel} ==\n`;
  ctx += `This is what phans actually said and documented about this style of playing:\n\n`;

  if (reviews.length) {
    ctx += `FAN REVIEWS MENTIONING THIS VIBE (in their own words):\n`;
    reviews.forEach(r => {
      const snippet = (r.review_text || '').slice(0, 350);
      ctx += `[${r.show_date}] [${r.score}/5] "${snippet}${r.review_text?.length > 350 ? '...' : ''}"\n\n`;
    });
  }

  if (jamEntries.length) {
    ctx += `\nJAMCHART ENTRIES MATCHING THIS VIBE:\n`;
    jamEntries.forEach(j => {
      ctx += `- ${j.show_date} ${j.song_name}: ${j.description || 'community flagged'}\n`;
    });
  }

  if (longestJams.length) {
    ctx += `\nLONGEST JAMS IN THIS ERA/CONTEXT:\n`;
    longestJams.slice(0, 8).forEach(j => {
      ctx += `- ${j.show_date} ${j.song_name}: ${j.duration_label || 'long'}\n`;
    });
  }

  ctx += `\nUse the specific dates and shows above. Quote what phans said. Give the user something concrete to listen to RIGHT NOW.\n`;
  return ctx;
}

// ── Phreezer aggregate data ────────────────────────────────

async function fetchPhreezeerAggregates(pool) {
  try {
    const [topShows, topSongs, stats] = await Promise.all([
      pool.query(`
        SELECT
          TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date,
          s.venue, s.city, s.state,
          ROUND(AVG(r.rating)::numeric, 2) as avg_score,
          COUNT(DISTINCT r.user_id) as rater_count
        FROM ratings r
        JOIN shows s ON r.show_date = s.show_date
        WHERE r.rating IS NOT NULL
        GROUP BY s.show_date, s.venue, s.city, s.state
        HAVING COUNT(DISTINCT r.user_id) >= 1
        ORDER BY avg_score DESC, rater_count DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT
          song_name,
          ROUND(AVG(rating)::numeric, 2) as avg_score,
          COUNT(*) as total_ratings,
          COUNT(DISTINCT user_id) as unique_raters
        FROM ratings
        WHERE rating IS NOT NULL
        GROUP BY song_name
        HAVING COUNT(*) >= 2
        ORDER BY avg_score DESC, total_ratings DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT
          COUNT(DISTINCT user_id) as total_raters,
          COUNT(DISTINCT show_date) as shows_covered,
          COUNT(*) as total_ratings,
          ROUND(AVG(rating)::numeric, 2) as overall_avg
        FROM ratings WHERE rating IS NOT NULL
      `),
    ]);

    return {
      topShows: topShows.rows,
      topSongs: topSongs.rows,
      stats: stats.rows[0],
    };
  } catch (e) {
    return { topShows: [], topSongs: [], stats: null };
  }
}

function formatPhreezeerContext({ topShows, topSongs, stats }) {
  let ctx = `\n== PHREEZER COMMUNITY DATA ==\n`;
  ctx += `(Aggregated ratings from Phreezer users — never attributed to individuals)\n`;

  if (stats) {
    ctx += `\nOVERALL: ${stats.total_raters} raters, ${stats.shows_covered} shows covered, ${stats.total_ratings} song ratings, community avg ${stats.overall_avg}/5\n`;
  }

  if (topShows.length) {
    ctx += `\nTOP RATED SHOWS BY PHREEZER COMMUNITY:\n`;
    topShows.forEach((s, i) => {
      ctx += `${i + 1}. ${s.show_date} — ${s.venue}, ${s.city}${s.state ? `, ${s.state}` : ''} — ${s.avg_score}/5 (${s.rater_count} raters)\n`;
    });
  }

  if (topSongs.length) {
    ctx += `\nTOP RATED SONGS BY PHREEZER COMMUNITY:\n`;
    topSongs.forEach((s, i) => {
      ctx += `${i + 1}. ${s.song_name} — ${s.avg_score}/5 (${s.total_ratings} ratings from ${s.unique_raters} raters)\n`;
    });
  }

  return ctx;
}

// ── Main handler ────────────────────────────────────────────

export default async function handler(req, res) {
  cors(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' });

  // ── 1. Pull user context from DB ──
  let userContext = '';
  try {
    const pool = getPool();
    const showsResult = await pool.query(`
      SELECT
        TO_CHAR(s.show_date, 'YYYY-MM-DD') as show_date,
        s.venue, s.city, s.state,
        ROUND(AVG(r.rating)::numeric, 2) as overall_rating,
        COUNT(r.id) as song_count,
        COUNT(CASE WHEN r.rating IS NOT NULL THEN 1 END) as rated_count
      FROM ratings r
      JOIN shows s ON r.show_date = s.show_date
      WHERE r.user_id = $1
      GROUP BY s.show_date, s.venue, s.city, s.state
      ORDER BY s.show_date DESC
      LIMIT 200
    `, [user.id]);

    const shows = showsResult.rows;
    const rated = shows.filter(s => s.overall_rating);
    const unrated = shows.filter(s => !s.overall_rating);
    const topRated = [...rated]
      .sort((a, b) => parseFloat(b.overall_rating) - parseFloat(a.overall_rating))
      .slice(0, 10);

    userContext = `\nUSER HISTORY (${shows.length} shows rated):\nRECENTLY RATED (last 20):\n${shows.slice(0, 20).map(s => `${s.show_date} — ${s.venue}, ${s.city}${s.state ? `, ${s.state}` : ''} [${s.overall_rating ? `avg: ${s.overall_rating}/5` : 'rated'}]`).join('\n')}\n\nTOP RATED:\n${topRated.length ? topRated.map(s => `${s.show_date} — ${s.venue} — ${s.overall_rating}/5`).join('\n') : 'No rated shows yet.'}\n\nSTATS: ${shows.length} shows rated${rated.length > 0 ? `, avg ${(rated.reduce((s,r) => s + parseFloat(r.overall_rating), 0) / rated.length).toFixed(2)}/5` : ''}\n`;
  } catch (e) {
    userContext = 'Could not load user history.';
  }

  // ── 1b. Pull Phreezer aggregate data ──
  let phreezeerContext = '';
  try {
    const pool = getPool();
    const aggregates = await fetchPhreezeerAggregates(pool);
    phreezeerContext = formatPhreezeerContext(aggregates);
  } catch (e) {}

  // ── 2. Detect intent + fetch Phish.net data ──
  const intent = detectIntent(message);
  let phishNetContext = '';

  try {
    if (intent.type === 'show') {
      const pool = getPool();
      const [pnetData, showFacts, teases, guests, dbReviews] = await Promise.all([
        PHISH_NET_KEY ? fetchShowData(intent.date) : Promise.resolve({ setlist: [], reviews: [], jamcharts: [] }),
        queryShowFacts(pool, intent.date),
        queryTeases(pool, intent.date),
        queryGuests(pool, intent.date),
        queryReviews(pool, intent.date, 5),
      ]);
      // Combine live Phish.net setlist/jamchart data with rich DB facts + reviews
      phishNetContext = formatShowContext(intent.date, pnetData);
      phishNetContext += formatRichShowContext(intent.date, showFacts, teases, guests, dbReviews);

    } else if (intent.type === 'song') {
      const pool = getPool();
      const [pnetData, songFacts, longestVersions, debut] = await Promise.all([
        PHISH_NET_KEY ? fetchSongData(intent.slug) : Promise.resolve({ history: [], jamcharts: [] }),
        querySongFacts(pool, intent.name),
        queryLongestVersions(pool, intent.name, 10),
        queryDebut(pool, intent.name),
      ]);
      phishNetContext = formatSongContext(intent.name, pnetData);
      phishNetContext += formatRichSongContext(intent.name, songFacts, longestVersions, debut);

    } else if (intent.type === 'recommend' || intent.type === 'general') {
      const vibeKeywords = extractVibeKeywords(message);
      const era = extractEraFromMessage(message);
      const pool = getPool();

      // Pull from all three sources in parallel
      const [dbJams, vibeReviews, longestJams] = await Promise.all([
        searchJamchartsDB(pool, vibeKeywords, era),
        vibeKeywords.length > 0 ? searchReviewsByVibe(pool, vibeKeywords, era, 6) : Promise.resolve([]),
        era ? queryTopLongestJams(pool, era, 10) : Promise.resolve([]),
      ]);

      if (dbJams.length > 0 || vibeReviews.length > 0 || longestJams.length > 0) {
        phishNetContext = formatVibeContext(dbJams, vibeReviews, longestJams, vibeKeywords, era);
      } else if (PHISH_NET_KEY) {
        // Fallback to recent jamcharts from API
        const jams = await fetchRecentJamcharts();
        phishNetContext = formatJamchartContext(jams);
      }
    }
  } catch (e) {
    captureException(e);
  }

  // ── 3. Build messages ──
  const MAX_HISTORY = 10;
  const recentHistory = history.slice(-MAX_HISTORY);

  const contextBlock = `[CONTEXT — not part of conversation]\n${userContext}\n${phreezeerContext}\n${phishNetContext}\n[END CONTEXT]`;

  const messages = [
    { role: 'user', content: contextBlock },
    { role: 'assistant', content: "Got it. I've got your show history and the Phish.net data loaded. What do you need?" },
    ...recentHistory.map(turn => ({ role: turn.role, content: turn.content })),
    { role: 'user', content: message.trim() },
  ];

  // ── 4. Call Claude ──
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'No response' });

    const usage = data?.usage;
    if (usage) {
      logAiUsage({
        userId: user.id,
        feature: 'ebenezer',
        model: 'claude-sonnet-4-6',
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
      });
    }

    if (!ebenezerOptOut) {
      logEbenezerConversation({
        intent: intent?.type || 'general',
        era: extractEraFromMessage(message),
        vibeKeywords: extractVibeKeywords(message),
        messageLength: message.length,
        responseLength: reply.length,
        flagged: false,
      });
    }

    return res.status(200).json({ reply, intent: intent.type });
  } catch (e) {
    captureException(e);
    return res.status(500).json({ error: e.message });
  }
}
