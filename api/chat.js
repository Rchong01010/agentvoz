import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Server-defined system prompt — never accept from client
const SYSTEM_PROMPT = `You are Sofia, a warm and encouraging Spanish language tutor. Help the student practice conversational Spanish. Respond primarily in Spanish with occasional English explanations when needed. Keep responses concise and conversational. Always return valid JSON with "response" (your message) and "translation" (English translation) fields.`;

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

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  // Input length validation
  if (messages.some(m => m.content && m.content.length > 2000)) {
    return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
  }

  // Strip system messages — only the server defines the system prompt
  const userMessages = messages.filter(m => m.role !== 'system');

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...userMessages,
      ],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
