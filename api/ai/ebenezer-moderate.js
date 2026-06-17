const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MODERATION_PROMPT = `You are a content moderator for a Phish music fan app.

Evaluate the following user message. The app allows:
- Swearing and profanity (fine)
- Strong opinions about music and shows
- Crude humor, sarcasm
- Any Phish-related topic

The app does NOT allow:
- Racial, ethnic, or religious slurs
- Sexist, homophobic, or transphobic language
- Hate speech targeting any person or group
- Political hate speech

Respond with ONLY a JSON object:
{"allowed": true} if acceptable
{"allowed": false, "reason": "brief reason"} if it should be blocked`;

export async function moderateMessage(message) {
  const lower = message.toLowerCase();
  const hardBlock = ['nigger','nigga','faggot','fag ','kike','spic','chink','tranny','wetback','beaner','gook'];
  for (const word of hardBlock) {
    if (lower.includes(word)) return { allowed: false, reason: 'hate speech' };
  }
  if (message.length < 20) return { allowed: true };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        messages: [{ role: 'user', content: MODERATION_PROMPT + '\n\nMessage: "' + message + '"' }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || '{"allowed": true}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (_) {
    return { allowed: true };
  }
}
