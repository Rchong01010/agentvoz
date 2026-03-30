import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
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
