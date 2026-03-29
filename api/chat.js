import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt } = req.body;

  if (!messages || !systemPrompt) {
    return res.status(400).json({ error: 'Missing messages or systemPrompt' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
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
