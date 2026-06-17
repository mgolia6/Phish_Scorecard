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
- Never pretend you have data you don't. If a show isn't in the provided context, say so.
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
      msg.includes('recent') || msg.includes('listen to') || msg.includes('check out')) {
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
  let ctx = '\n== RECENT JAMCHART ENTRIES ==\n';
  ctx += 'These are versions the community has flagged as exceptional recently:\n';
  jamcharts.slice(0, 20).forEach(j => {
    ctx += `- ${j.showdate} ${j.song || j.songname}: ${j.jamchart_description || j.note || 'notable'}\n`;
  });
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
    if (intent.type === 'show' && PHISH_NET_KEY) {
      const data = await fetchShowData(intent.date);
      phishNetContext = formatShowContext(intent.date, data);
    } else if (intent.type === 'song' && PHISH_NET_KEY) {
      const data = await fetchSongData(intent.slug);
      phishNetContext = formatSongContext(intent.name, data);
    } else if ((intent.type === 'recommend' || intent.type === 'general') && PHISH_NET_KEY) {
      const jams = await fetchRecentJamcharts();
      phishNetContext = formatJamchartContext(jams);
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

    return res.status(200).json({ reply, intent: intent.type });
  } catch (e) {
    captureException(e);
    return res.status(500).json({ error: e.message });
  }
}
