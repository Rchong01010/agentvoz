import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Rate limiting (in-memory, per-instance).
// LIMITATION: Resets on Vercel cold starts. Acceptable for abuse prevention;
// for strict enforcement, upgrade to Vercel KV or Upstash Redis.
const rateMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW; }
  entry.count++;
  rateMap.set(ip, entry);
  if (entry.count > RATE_LIMIT) return res.status(429).json({ error: 'Too many requests' });

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  if (text.length > 1000) {
    return res.status(400).json({ error: 'Text too long (max 1000 chars)' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a Spanish to English translator. Translate the following Spanish text to natural English. Return ONLY the English translation, nothing else.',
        },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const english = completion.choices[0]?.message?.content?.trim();
    return res.status(200).json({ english });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Translation failed', english: text });
  }
}
