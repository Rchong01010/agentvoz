import { useState, useRef, useCallback } from 'react';
import VapiModule from '@vapi-ai/web';
import { CONFIG } from '../lib/config';
import { getLesson, buildLessonPrompt } from '../lib/curriculum';
import ASSISTANTS from '../lib/assistants.json';

const Vapi = VapiModule.default || VapiModule;

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || '7b4daf13-8ad4-4f82-892a-60292ef9b476';

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
  const pendingKaraokeRef = useRef(null); // words waiting for speech-start
  const pendingLessonRef = useRef(null);

  const stopKaraoke = useCallback(() => {
    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    pendingKaraokeRef.current = null;
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

      // If there's a pending lesson, inject it after connection
      if (pendingLessonRef.current) {
        const lesson = pendingLessonRef.current;
        pendingLessonRef.current = null;
        // Send lesson instructions as a system-like message to Sofia
        setTimeout(() => {
          vapi.send({
            type: 'add-message',
            message: {
              role: 'system',
              content: buildLessonPrompt(lesson),
            },
          });
        }, 2000); // Wait for Sofia's greeting to finish
      }
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

      // START karaoke when speech actually begins
      const words = pendingKaraokeRef.current;
      if (words && words.length > 0) {
        if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
        let idx = 0;
        setKaraokeIndex(0);
        // ~280ms per word — tuned for ElevenLabs Spanish speech rate
        const msPerWord = Math.max(180, 280);
        karaokeTimerRef.current = setInterval(() => {
          idx++;
          if (idx >= words.length) {
            clearInterval(karaokeTimerRef.current);
            setKaraokeIndex(words.length);
          } else {
            setKaraokeIndex(idx);
          }
        }, msPerWord);
        pendingKaraokeRef.current = null;
      }
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
      setIsListening(true);
      // Reveal all remaining karaoke words
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
      setKaraokeIndex(prev => prev >= 0 ? 999 : prev);
    });

    // Listen for ALL message types to capture LLM text BEFORE speech
    vapi.on('message', (msg) => {
      // Log all message types for debugging (remove later)
      if (msg.type !== 'transcript') {
        console.log('VAPI msg:', msg.type, msg);
      }

      // Conversation update — fires BEFORE TTS, contains LLM response text
      if (msg.type === 'conversation-update') {
        const convo = msg.conversation || [];
        const lastMsg = convo[convo.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg?.content) {
          const spanishText = lastMsg.content;
          // Show subtitle immediately (all dimmed, waiting for speech)
          const words = spanishText.trim().split(/\s+/);
          setKaraokeWords(words);
          setKaraokeIndex(-1); // All dimmed — karaoke starts on speech-start
          setCurrentSubtitles({ spanish: spanishText, english: 'Translating...' });

          // Store words for speech-start to pick up
          pendingKaraokeRef.current = words;

          // Add to message history (avoid duplicates)
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && last?.spanish === spanishText) return prev;
            return [...prev, {
              role: 'assistant',
              content: spanishText,
              spanish: spanishText,
              english: null,
            }];
          });

          // Translate async
          translateText(spanishText).then(english => {
            setCurrentSubtitles(prev =>
              prev?.spanish === spanishText ? { ...prev, english } : prev
            );
            setMessages(prev => prev.map(m =>
              m.spanish === spanishText && !m.english ? { ...m, english } : m
            ));
          });
        }
      }

      // Transcript — fallback for subtitles if conversation-update doesn't fire
      if (msg.type === 'transcript') {
        // ASSISTANT partial — real-time subtitle update
        if (msg.role === 'assistant' && msg.transcriptType === 'partial') {
          const partialText = msg.transcript;
          if (partialText && partialText.trim()) {
            setCurrentSubtitles(prev => {
              // Only update if we don't already have LLM text showing
              if (prev?.spanish && prev.spanish.length > partialText.length) return prev;
              return { spanish: partialText, english: prev?.english || '' };
            });
          }
        }

        // ASSISTANT final — ensure we have the complete text
        if (msg.role === 'assistant' && msg.transcriptType === 'final') {
          const spanishText = msg.transcript;
          if (spanishText && spanishText.trim().length > 1) {
            // Only add to messages if conversation-update didn't already
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') return prev; // Already captured
              return [...prev, {
                role: 'assistant',
                content: spanishText,
                spanish: spanishText,
                english: null,
              }];
            });

            // Reveal all karaoke words
            const words = spanishText.trim().split(/\s+/);
            setKaraokeWords(words);
            setKaraokeIndex(words.length);

            // Translate if not already done
            setCurrentSubtitles(prev => {
              if (prev?.english && prev.english !== 'Translating...') return prev;
              translateText(spanishText).then(english => {
                setCurrentSubtitles(p =>
                  p?.spanish === spanishText ? { ...p, english } : p
                );
                setMessages(p => p.map(m =>
                  m.spanish === spanishText && !m.english ? { ...m, english } : m
                ));
              });
              return { spanish: spanishText, english: prev?.english || 'Translating...' };
            });
          }
        }

        // USER final — add to history
        if (msg.role === 'user' && msg.transcriptType === 'final') {
          if (msg.transcript && msg.transcript.trim()) {
            setMessages(prev => [...prev, { role: 'user', content: msg.transcript }]);
          }
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

  const startConversation = useCallback(async (selectedLevel, selectedTheme, selectedDialect, selectedSpeed, lessonId) => {
    const dialectConfig = CONFIG.DIALECTS.find(d => d.id === selectedDialect) || CONFIG.DIALECTS[0];

    setLevel(selectedLevel);
    setTheme(selectedTheme || (lessonId ? 'lesson' : 'free'));
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

    // If a lesson is specified, queue it for injection after call connects
    if (lessonId) {
      const lesson = getLesson(lessonId);
      if (lesson) {
        pendingLessonRef.current = lesson;
      }
    }

    try {
      const vapi = getVapi();
      // Select the right assistant for this dialect
      const assistantId = ASSISTANTS[selectedDialect] || ASSISTANTS.mexico;
      await vapi.start(assistantId);
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
