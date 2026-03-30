import { useState, useRef, useCallback, useEffect } from 'react';
import VapiModule from '@vapi-ai/web';
// CJS/ESM interop: the constructor is at .default when imported as ESM
const Vapi = VapiModule.default || VapiModule;

// Public keys (not secrets) - safe to embed client-side
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || '7b4daf13-8ad4-4f82-892a-60292ef9b476';
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || '551e2290-9efe-4825-9f7c-6063dc28c2fe';

export function useConversation() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentSubtitles, setCurrentSubtitles] = useState(null);
  const [level, setLevel] = useState('beginner');
  const [theme, setTheme] = useState('greetings');
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle | connecting | active | error
  const [duration, setDuration] = useState(0);

  const vapiRef = useRef(null);
  const timerRef = useRef(null);

  const getVapi = useCallback(() => {
    if (vapiRef.current) return vapiRef.current;
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    // --- VAPI Event Handlers ---

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
      if (timerRef.current) clearInterval(timerRef.current);
    });

    vapi.on('speech-start', () => {
      setIsSpeaking(true);
      setIsListening(false);
      setIsThinking(false);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
      // After Sofia stops speaking, we're listening again
      setIsListening(true);
    });

    // Capture transcripts for subtitles
    vapi.on('message', (msg) => {
      if (msg.type === 'transcript') {
        if (msg.role === 'assistant' && msg.transcriptType === 'final') {
          const spanishText = msg.transcript;

          // Add to messages
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: spanishText,
            spanish: spanishText,
            english: null, // Will be filled by translation
          }]);

          // Show Spanish subtitle immediately
          setCurrentSubtitles({ spanish: spanishText, english: 'Translating...' });

          // Fire async translation
          translateText(spanishText).then(english => {
            setCurrentSubtitles(prev =>
              prev?.spanish === spanishText ? { ...prev, english } : prev
            );
            // Update message with translation
            setMessages(prev => prev.map((m, i) =>
              i === prev.length - 1 && m.spanish === spanishText
                ? { ...m, english }
                : m
            ));
          });
        }

        if (msg.role === 'user' && msg.transcriptType === 'final') {
          const userText = msg.transcript;
          setMessages(prev => [...prev, { role: 'user', content: userText }]);
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
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return vapi;
  }, []);

  // Translation helper
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

  const startConversation = useCallback(async (selectedLevel, selectedTheme) => {
    setLevel(selectedLevel);
    setTheme(selectedTheme);
    setMessages([]);
    setError(null);
    setCallState('connecting');
    setCurrentSubtitles(null);

    try {
      const vapi = getVapi();
      await vapi.start(ASSISTANT_ID);
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
  }, [getVapi]);

  const stopConversation = useCallback(() => {
    vapiRef.current?.stop();
    setCallState('idle');
    setStarted(false);
    setMessages([]);
    setCurrentSubtitles(null);
    setIsSpeaking(false);
    setIsListening(false);
    setIsThinking(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // For text input fallback — send text through VAPI
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
    level,
    theme,
    started,
    error,
    callState,
    duration,
    startConversation,
    stopConversation,
    sendToLLM,
  };
}
