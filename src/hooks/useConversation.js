import { useState, useRef, useCallback } from 'react';
import { getSystemPrompt, getGreeting } from '../lib/prompts';

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

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const messagesRef = useRef([]);

  // Keep ref in sync for use in callbacks
  messagesRef.current = messages;

  const playBrowserTTS = useCallback((text) => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;

      // Try to find a Spanish voice
      const voices = synth.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    });
  }, []);

  const playAudio = useCallback(async (spanishText) => {
    setIsSpeaking(true);
    try {
      // Try ElevenLabs API first
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spanishText }),
      });

      if (!res.ok) throw new Error('TTS API failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      // Fallback to browser TTS
      console.log('Falling back to browser TTS');
      await playBrowserTTS(spanishText);
      setIsSpeaking(false);
    }
  }, [playBrowserTTS]);

  const sendToLLM = useCallback(async (userText) => {
    setIsThinking(true);
    setError(null);

    const userMessage = { role: 'user', content: userText };
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);

    // Build chat history for API (only role + content)
    const chatHistory = updatedMessages.map(m => ({
      role: m.role,
      content: m.role === 'user' ? m.content : m.spanish || m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          systemPrompt: getSystemPrompt(level, theme),
        }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const data = await res.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.spanish,
        spanish: data.spanish,
        english: data.english,
        correction: data.correction,
        correctionEnglish: data.correctionEnglish,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentSubtitles({ spanish: data.spanish, english: data.english });
      setIsThinking(false);

      // Show correction briefly if there is one
      if (data.correction) {
        setCurrentSubtitles({
          spanish: data.correction,
          english: data.correctionEnglish || 'Correction',
          isCorrection: true,
        });
        await new Promise(r => setTimeout(r, 3000));
        setCurrentSubtitles({ spanish: data.spanish, english: data.english });
      }

      await playAudio(data.spanish);
    } catch (err) {
      console.error('LLM error:', err);
      setIsThinking(false);
      setError('Sofia is having trouble responding. Please try again.');
    }
  }, [level, theme, playAudio]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    // Accept both English and Spanish input
    recognition.lang = level === 'advanced' ? 'es-MX' : 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (transcript.trim()) {
        sendToLLM(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [level, sendToLLM]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const startConversation = useCallback(async (selectedLevel, selectedTheme) => {
    setLevel(selectedLevel);
    setTheme(selectedTheme);
    setMessages([]);
    setStarted(true);
    setError(null);

    const greeting = getGreeting(selectedLevel, selectedTheme);

    const assistantMessage = {
      role: 'assistant',
      content: greeting.spanish,
      spanish: greeting.spanish,
      english: greeting.english,
    };

    setMessages([assistantMessage]);
    setCurrentSubtitles({ spanish: greeting.spanish, english: greeting.english });

    await playAudio(greeting.spanish);
  }, [playAudio]);

  const stopConversation = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioRef.current) audioRef.current.pause();
    setStarted(false);
    setMessages([]);
    setCurrentSubtitles(null);
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);
  }, []);

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
    startListening,
    stopListening,
    startConversation,
    stopConversation,
    sendToLLM,
  };
}
