export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  // Default to a Spanish female voice - "Rachel" multilingual or user-configured
  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'XrExE9yKIg1WjnnlVkGX';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      return res.status(502).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: 'TTS failed' });
  }
}
