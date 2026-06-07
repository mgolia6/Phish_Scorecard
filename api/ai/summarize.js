import { cors } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reviews, showDate, venue, city, yearsAgo } = req.body;

  if (!reviews || !reviews.length) {
    return res.status(400).json({ error: 'No reviews provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI not configured' });
  }

  // Send all reviews, not just 8
  const reviewText = reviews
    .filter(r => r.review && r.review.trim().length > 20)
    .map((r, i) => `[${i+1}] ${r.author}: "${r.review.trim()}"`)
    .join('\n\n');

  const prompt = `You are analyzing Phish fan reviews submitted to Phish.net for a specific concert. Your job is to synthesize ALL reviews into a structured breakdown by theme. Use authentic Phish fan language — jams, segues, peak, exploratory, bustout, sandwich, etc.

Show: ${showDate} at ${venue}${city ? `, ${city}` : ''}${yearsAgo ? ` (${yearsAgo} years ago)` : ''}
Total reviews: ${reviews.filter(r => r.review && r.review.trim().length > 20).length}

Fan reviews:
${reviewText}

Read every review carefully. Then produce a structured synthesis in this exact JSON format — no other text, just the JSON:

{
  "overall": "1-2 sentence collective verdict on the show — what the consensus is",
  "themes": [
    { "label": "MUSIC", "text": "What reviewers said about the playing, setlist, jams, highlights" },
    { "label": "VIBE", "text": "Energy of the crowd, atmosphere, flow of the night" },
    { "label": "STANDOUTS", "text": "Specific songs or moments multiple reviewers called out" }
  ],
  "sentiment": "FIRE | SOLID | MIXED | SLEEPER",
  "reviewCount": ${reviews.filter(r => r.review && r.review.trim().length > 20).length}
}

Only include a theme if multiple reviews mention it. Keep each theme to 1-2 tight sentences. Be specific — name actual songs if reviewers mention them.`;

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
    const text = data?.content?.[0]?.text || null;
    if (!text) return res.status(500).json({ error: 'No response from AI' });

    // Strip markdown fences if present, then parse JSON
    try {
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json({ structured: parsed });
    } catch (e) {
      // Fallback: return raw text if JSON parse fails
      return res.status(200).json({ summary: text });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
