import { getPool } from '../_db.js';
import { verifyToken, cors } from '../_auth.js';
import { logAiUsage } from '../_ai_usage.js';

const SYSTEM_PROMPT = `You are Uncle Ebenezer, a Phish analyst and discovery engine embedded in Phreezer — a show rating app for phans. You have been to hundreds of shows spanning every era. You are opinionated, knowledgeable, and direct.

You talk like a phan, not a music critic. "That Tweezer goes somewhere." "The band was locked in." "Trey was on fire in the second set." Not "this improvisation features extended exploration."

Your job is two things:
1. Analyze specific shows when asked — setlist shape, key jams, how it fits the era/tour, what made it notable
2. Help the user discover shows worth rating or revisiting from their history, or recommend shows to seek out based on what they're in the mood for

Rules:
- When recommending, be specific. Name the jam. Name the song. Name the moment. "The Disease opens up around the 12-minute mark and goes deep space for another 8" is useful. "This show has great jams" is useless.
- You are NOT a trivia bot. Stay in your lane — show analysis and discovery only.
- Keep responses tight. The user is on their phone. No walls of text. Break into short paragraphs.
- If someone asks about a show you have no data on, say so directly and tell them what you do know.
- You have access to the user's attended shows and ratings. Reference them when relevant. If they rated a show highly, acknowledge it. If they haven't rated a show, suggest they do.
- Era knowledge: you know the arenas (1989-1994), the peak (1995-1997), the jamming maturity (1998-2000), the wilderness (2001-2004), the comeback (2009), the modern era (2.0, 3.0). Weight your recommendations accordingly but don't be a nostalgia snob — 3.0 has produced some of the best shows.
- Personality: opinionated but not a gatekeeper. Welcoming to people still building their Phish knowledge.`;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' });

  // Pull user context from DB
  let userContext = '';
  try {
    const pool = getPool();

    // Attended shows + ratings
    const showsResult = await pool.query(`
      SELECT 
        a.show_date,
        a.venue,
        a.city,
        a.state,
        r.overall_rating,
        r.notes
      FROM user_attendance a
      LEFT JOIN user_ratings r ON r.user_id = a.user_id AND r.show_date = a.show_date
      WHERE a.user_id = $1
      ORDER BY a.show_date DESC
      LIMIT 200
    `, [user.id]);

    const shows = showsResult.rows;
    const rated = shows.filter(s => s.overall_rating);
    const unrated = shows.filter(s => !s.overall_rating);

    const topRated = [...rated]
      .sort((a, b) => parseFloat(b.overall_rating) - parseFloat(a.overall_rating))
      .slice(0, 10);

    userContext = `
USER'S PHISH HISTORY (${shows.length} shows attended):
${shows.length === 0 ? 'No shows imported yet.' : ''}

RECENTLY ATTENDED (last 20):
${shows.slice(0, 20).map(s => `${s.show_date} — ${s.venue}, ${s.city}${s.state ? `, ${s.state}` : ''}${s.overall_rating ? ` [rated: ${s.overall_rating}/5]` : ' [unrated]'}`).join('\n')}

TOP RATED SHOWS:
${topRated.length ? topRated.map(s => `${s.show_date} — ${s.venue} — ${s.overall_rating}/5${s.notes ? ` ("${s.notes.substring(0, 80)}")` : ''}`).join('\n') : 'No rated shows yet.'}

STATS:
- Total attended: ${shows.length}
- Rated: ${rated.length}
- Unrated: ${unrated.length}
${rated.length > 0 ? `- Avg rating: ${(rated.reduce((s, r) => s + parseFloat(r.overall_rating), 0) / rated.length).toFixed(2)}/5` : ''}
`;
  } catch (e) {
    userContext = 'Could not load user show history.';
  }

  // Build fading memory — keep last 10 turns, oldest get lighter weight
  // We just include them all; Claude handles the context naturally
  const MAX_HISTORY = 10;
  const recentHistory = history.slice(-MAX_HISTORY);

  const messages = [
    // Inject user context as a system-like first user message
    {
      role: 'user',
      content: `[CONTEXT — not part of conversation]\n${userContext}\n[END CONTEXT]`
    },
    {
      role: 'assistant',
      content: "Got it. I've got your show history loaded. What do you need?"
    },
    // Replay conversation history
    ...recentHistory.map(turn => ({
      role: turn.role,
      content: turn.content
    })),
    // Current message
    {
      role: 'user',
      content: message.trim()
    }
  ];

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
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'No response' });

    // Log usage — fire and forget
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

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

