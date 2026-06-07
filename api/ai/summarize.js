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

  const reviewText = reviews
    .filter(r => r.review && r.review.trim().length > 20)
    .slice(0, 8)
    .map((r, i) => `Review ${i+1} (${r.author}): "${r.review.trim()}"`)
    .join('\n\n');

  const prompt = `You are summarizing Phish fan reviews of a concert. Be concise, vivid, capture the collective vibe. Use Phish fan language naturally. Do not mention you're summarizing reviews — just describe the show.

Show: ${showDate} at ${venue}${city ? `, ${city}` : ''} — ${yearsAgo} years ago

Fan reviews:
${reviewText}

Write 2-3 sentences on what made this show memorable. Be specific. No fluff.`;

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
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || null;
    if (!text) return res.status(500).json({ error: 'No response from AI' });
    return res.status(200).json({ summary: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
