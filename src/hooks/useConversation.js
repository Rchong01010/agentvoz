import { useState, useRef, useCallback } from 'react';
import VapiModule from '@vapi-ai/web';
import { CONFIG } from '../lib/config';

const Vapi = VapiModule.default || VapiModule;

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || '7b4daf13-8ad4-4f82-892a-60292ef9b476';
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || '551e2290-9efe-4825-9f7c-6063dc28c2fe';

// Base system prompt — dialect hint gets appended
const BASE_SYSTEM_PROMPT = `You are Sofia, a warm and encouraging AI Spanish language tutor on AgentVoz.
You are patient, fun, and adaptive.

The student is learning Spanish through real conversation with you. This is NOT a classroom.
You are having a natural, friendly chat — like talking to a friend who helps you practice.

RULES:
1. Speak ONLY in Spanish. This is immersive learning.
2. Keep responses SHORT — 1-3 sentences max. This is a conversation, not a lecture.
3. Adapt to the student's level. If they speak English, respond with simple Spanish and repeat key words.
4. If they make a mistake, gently correct by naturally using the correct form in your response.
5. Ask follow-up questions to keep the conversation flowing.
6. Be encouraging! Use regional expressions of approval when they try.
7. Start with greetings and simple topics. Escalate complexity as they improve.
8. If the student seems stuck, offer the English word and teach the Spanish equivalent.
9. NEVER break character. You are Sofia, not an AI.
10. NEVER speak more than 3 sentences at a time.

Your personality: Warm, patient, slightly playful, genuinely excited when the student improves.`;

export function useConversation() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentSubtitles, setCurrentSubtitles] = useState(null);
  const [karaokeWords, setKaraokeWords] = useState([]);
  const [karaokeIndex, setKaraokeIndex] = useState(-1);
  const [level, setLevel] = useState('beginner');
  const [theme, setTheme] = useState('greetings');
  const [dialect, setDialect] = useState('mexico');
  const [speed, setSpeed] = useState(1.0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [duration, setDuration] = useState(0);

  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const karaokeTimerRef = useRef(null);

  // Karaoke: reveal words one by one over the speech duration
  const startKaraoke = useCallback((text, durationEstimate) => {
    const words = text.split(/\s+/);
    setKaraokeWords(words);
    setKaraokeIndex(0);

    // Estimate ~200ms per word at normal speed, adjusted for speech speed
    const msPerWord = Math.max(150, (durationEstimate || words.length * 200) / words.length);

    let idx = 0;
    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);

    karaokeTimerRef.current = setInterval(() => {
      idx++;
      if (idx >= words.length) {
        clearInterval(karaokeTimerRef.current);
        setKaraokeIndex(words.length);
      } else {
        setKaraokeIndex(idx);
      }
    }, msPerWord / speed);
  }, [speed]);

  const stopKaraoke = useCallback(() => {
    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    setKaraokeWords([]);
    setKaraokeIndex(-1);
  }, []);

  const getVapi = useCallback(() => {
    if (vapiRef.current) return vapiRef.current;
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setCallState('active');
      setStarted(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });

    vapi.on('call-end', () => {
      setCallState('idle');
      setStarted(false);
      setIsSpeaking(false);
      setIsListening(false);
      setIsThinking(false);
      stopKaraoke();
      if (timerRef.current) clearInterval(timerRef.current);
    });

    vapi.on('speech-start', () => {
      setIsSpeaking(true);
      setIsListening(false);
      setIsThinking(false);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
      setIsListening(true);
      // When speech ends, reveal all remaining karaoke words
      setKaraokeIndex(prev => prev >= 0 ? 999 : prev);
    });

    // Listen for all message types to find LLM output
    vapi.on('message', (msg) => {
      // Model output — this is the REAL text the LLM generated (proper Spanish)
      if (msg.type === 'model-output' && msg.output) {
        const spanishText = msg.output;
        handleAssistantMessage(spanishText);
      }

      // Conversation update — alternative source for LLM text
      if (msg.type === 'conversation-update' && msg.conversation) {
        const lastMsg = msg.conversation[msg.conversation.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg?.content) {
          handleAssistantMessage(lastMsg.content);
        }
      }

      // Fallback: use transcript if we haven't gotten LLM text
      // But mark it as transcript-sourced so we can tell the difference
      if (msg.type === 'transcript') {
        if (msg.role === 'assistant' && msg.transcriptType === 'final') {
          // Only use if we don't already have a message for this turn
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && !lastMsg.fromLLM) {
              // We already added this from transcript, skip
              return prev;
            }
            if (lastMsg?.role === 'assistant' && lastMsg.fromLLM) {
              // LLM text already captured, skip transcript
              return prev;
            }
            // No LLM text yet — use transcript as fallback
            const text = msg.transcript;
            return [...prev, {
              role: 'assistant',
              content: text,
              spanish: text,
              english: null,
              fromLLM: false,
            }];
          });
        }

        if (msg.role === 'user' && msg.transcriptType === 'final') {
          setMessages(prev => [...prev, { role: 'user', content: msg.transcript }]);
          setIsListening(false);
          setIsThinking(true);
        }
      }
    });

    vapi.on('error', (err) => {
      console.error('VAPI error:', err);
      setCallState('error');
      setError('Connection lost. Please try again.');
      setIsSpeaking(false);
      setIsListening(false);
      stopKaraoke();
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return vapi;
  }, [stopKaraoke]);

  // Process assistant message from LLM output (real Spanish text)
  const handleAssistantMessage = useCallback((spanishText) => {
    // Avoid duplicates
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg?.spanish === spanishText) {
        return prev; // Already have this message
      }
      // Remove any transcript-sourced fallback for this turn
      const filtered = lastMsg?.role === 'assistant' && !lastMsg.fromLLM
        ? prev.slice(0, -1)
        : prev;
      return [...filtered, {
        role: 'assistant',
        content: spanishText,
        spanish: spanishText,
        english: null,
        fromLLM: true,
      }];
    });

    // Show subtitle + start karaoke
    setCurrentSubtitles({ spanish: spanishText, english: 'Translating...' });
    startKaraoke(spanishText);

    // Translate async
    translateText(spanishText).then(english => {
      setCurrentSubtitles(prev =>
        prev?.spanish === spanishText ? { ...prev, english } : prev
      );
      setMessages(prev => prev.map((m) =>
        m.spanish === spanishText && !m.english ? { ...m, english } : m
      ));
    });
  }, [startKaraoke]);

  const translateText = async (spanishText) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spanishText }),
      });
      if (!res.ok) return spanishText;
      const data = await res.json();
      return data.english || spanishText;
    } catch {
      return spanishText;
    }
  };

  const startConversation = useCallback(async (selectedLevel, selectedTheme, selectedDialect, selectedSpeed) => {
    const dialectConfig = CONFIG.DIALECTS.find(d => d.id === selectedDialect) || CONFIG.DIALECTS[0];

    setLevel(selectedLevel);
    setTheme(selectedTheme);
    setDialect(selectedDialect);
    setSpeed(selectedSpeed || 1.0);
    setMessages([]);
    setError(null);
    setCallState('connecting');
    setCurrentSubtitles(null);
    stopKaraoke();

    // Build dialect-aware system prompt
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nDIALECT INSTRUCTIONS:\n${dialectConfig.promptHint}\n\nThe student's level is: ${selectedLevel}. Adjust complexity accordingly.`;

    // Build first message based on dialect
    const greetings = {
      mexico: '¡Hola! Me llamo Sofía. Soy tu tutora de español. ¿Cómo te llamas?',
      spain: '¡Hola! Me llamo Sofía. Soy tu tutora de español. ¿Cómo te llamas, tío?',
      argentina: '¡Hola! Me llamo Sofía. Soy tu tutora de español. ¿Cómo te llamás, che?',
      nicaragua: '¡Hola! Me llamo Sofía. Soy tu tutora de español. ¿Cómo te llamás? Ideay, ¡contame!',
    };

    try {
      const vapi = getVapi();
      // Override only system prompt and first message for dialect
      await vapi.start(ASSISTANT_ID, {
        firstMessage: greetings[selectedDialect] || greetings.mexico,
        model: {
          messages: [{ role: 'system', content: systemPrompt }],
        },
        metadata: { level: selectedLevel, theme: selectedTheme, dialect: selectedDialect },
      });
    } catch (err) {
      console.error('Failed to start VAPI call:', err);
      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Microphone blocked. Allow mic access in your browser settings.');
      } else if (msg.includes('NotFound')) {
        setError('No microphone found.');
      } else {
        setError(`Could not connect to Sofia: ${msg.slice(0, 100)}`);
      }
      setCallState('error');
    }
  }, [getVapi, stopKaraoke]);

  const stopConversation = useCallback(() => {
    vapiRef.current?.stop();
    setCallState('idle');
    setStarted(false);
    setMessages([]);
    setCurrentSubtitles(null);
    setIsSpeaking(false);
    setIsListening(false);
    setIsThinking(false);
    stopKaraoke();
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopKaraoke]);

  const sendToLLM = useCallback(async (userText) => {
    if (vapiRef.current && callState === 'active') {
      vapiRef.current.send({
        type: 'add-message',
        message: { role: 'user', content: userText },
      });
      setMessages(prev => [...prev, { role: 'user', content: userText }]);
      setIsThinking(true);
    }
  }, [callState]);

  return {
    messages,
    isListening,
    isSpeaking,
    isThinking,
    currentSubtitles,
    karaokeWords,
    karaokeIndex,
    level,
    theme,
    dialect,
    speed,
    started,
    error,
    callState,
    duration,
    startConversation,
    stopConversation,
    sendToLLM,
  };
}
