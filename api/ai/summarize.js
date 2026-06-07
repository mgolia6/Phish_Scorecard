import { cors } from '../_auth.js';
import { getPool } from '../_db.js';

// Strips markdown fences and parses JSON — handles both string and object inputs
function parseStructured(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw; // already parsed (JSONB from Postgres)
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch cached vibe check for a show
  if (req.method === 'GET') {
    const { showDate } = req.query;
    if (!showDate) return res.status(400).json({ error: 'showDate required' });
    try {
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS vibe_checks (show_date VARCHAR(10) PRIMARY KEY, structured JSONB, review_count INT, generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, model VARCHAR(50))`).catch(() => {});
      const result = await pool.query(
        'SELECT structured, review_count, generated_at FROM vibe_checks WHERE show_date = $1',
        [showDate]
      );
      if (result.rows.length) {
        const structured = parseStructured(result.rows[0].structured);
        // Bad cache entry — delete it so it regenerates
        if (!structured || !structured.overall) {
          await pool.query('DELETE FROM vibe_checks WHERE show_date = $1', [showDate]).catch(() => {});
          return res.status(404).json({ error: 'No vibe check cached' });
        }
        return res.status(200).json({
          structured,
          reviewCount: result.rows[0].review_count,
          cached: true,
          generatedAt: result.rows[0].generated_at,
        });
      }
      return res.status(404).json({ error: 'No vibe check cached' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reviews, showDate, venue, city, yearsAgo } = req.body;

  if (!showDate) return res.status(400).json({ error: 'showDate required' });

  // Ensure table exists
  try {
    const pool = getPool();
    await pool.query(`CREATE TABLE IF NOT EXISTS vibe_checks (show_date VARCHAR(10) PRIMARY KEY, structured JSONB, review_count INT, generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, model VARCHAR(50))`);
  } catch (e) {}

  // Check cache first
  try {
    const pool = getPool();
    const cached = await pool.query(
      'SELECT structured, review_count FROM vibe_checks WHERE show_date = $1',
      [showDate]
    );
    if (cached.rows.length) {
      const structured = parseStructured(cached.rows[0].structured);
      if (structured && structured.overall) {
        return res.status(200).json({ structured, reviewCount: cached.rows[0].review_count, cached: true });
      }
      // Bad cache — delete and regenerate
      await pool.query('DELETE FROM vibe_checks WHERE show_date = $1', [showDate]).catch(() => {});
    }
  } catch (e) {
    // DB error — proceed to generate anyway
  }

  if (!reviews || !reviews.length) {
    return res.status(400).json({ error: 'No reviews provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' });

  const validReviews = reviews.filter(r => r.review && r.review.trim().length > 20);
  if (!validReviews.length) {
    return res.status(400).json({ error: 'No review text found' });
  }

  const reviewText = validReviews
    .map((r, i) => `[${i+1}] ${r.author}: "${r.review.trim()}"`)
    .join('\n\n');

  const prompt = `You are analyzing Phish fan reviews submitted to Phish.net for a specific concert. Synthesize ALL reviews into a structured breakdown by theme. Use authentic Phish fan language — jams, segues, peak, exploratory, bustout, etc.

Show: ${showDate} at ${venue}${city ? `, ${city}` : ''}${yearsAgo ? ` (${yearsAgo} years ago)` : ''}
Reviews analyzed: ${validReviews.length}

${reviewText}

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:

{"overall":"1-2 sentence collective verdict on this show","themes":[{"label":"MUSIC","text":"What reviewers said about the playing, setlist, jams, highlights — name specific songs"},{"label":"VIBE","text":"Energy, atmosphere, crowd, flow of the night"},{"label":"STANDOUTS","text":"Specific songs or moments multiple reviewers flagged"}],"sentiment":"FIRE or SOLID or MIXED or SLEEPER","reviewCount":${validReviews.length}}

Only include a theme if multiple reviews mention it. Name actual songs. Be specific. Return ONLY the JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data));
      return res.status(500).json({ error: 'Anthropic API error', status: response.status, detail: data?.error?.message || JSON.stringify(data) });
    }
    const text = data?.content?.[0]?.text || null;
    if (!text) {
      console.error('No text in Anthropic response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No response from AI', detail: JSON.stringify(data) });
    }

    const structured = parseStructured(text);
    if (!structured || !structured.overall) {
      return res.status(500).json({ error: 'AI returned unparseable response', raw: text });
    }

    // Store in cache
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO vibe_checks (show_date, structured, review_count, model)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (show_date) DO UPDATE SET
           structured = EXCLUDED.structured,
           review_count = EXCLUDED.review_count,
           generated_at = CURRENT_TIMESTAMP,
           model = EXCLUDED.model`,
        [showDate, JSON.stringify(structured), validReviews.length, 'claude-haiku-4-5-20251001']
      );
    } catch (e) {
      console.error('Cache write failed:', e.message);
    }

    return res.status(200).json({ structured, cached: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

