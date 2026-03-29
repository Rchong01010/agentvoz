import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useConversation } from '../hooks/useConversation';
import Avatar from '../components/Avatar';
import Subtitles from '../components/Subtitles';
import MicButton from '../components/MicButton';
import ChatHistory from '../components/ChatHistory';

export default function Learn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const level = searchParams.get('level') || 'beginner';
  const theme = searchParams.get('theme') || 'greetings';

  const {
    messages,
    isListening,
    isSpeaking,
    isThinking,
    currentSubtitles,
    started,
    error,
    startListening,
    stopListening,
    startConversation,
    stopConversation,
    sendToLLM,
  } = useConversation();

  useEffect(() => {
    if (!started) {
      startConversation(level, theme);
    }
  }, []);

  const handleEnd = () => {
    stopConversation();
    navigate('/');
  };

  // Keyboard shortcut: spacebar to toggle mic
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else if (!isSpeaking && !isThinking) {
          startListening();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isListening, isSpeaking, isThinking, startListening, stopListening]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div>
          <h1 className="text-lg font-semibold">
            <span className="text-white">Agent</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Voz</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 capitalize bg-zinc-900 px-3 py-1 rounded-full">
            {level}
          </span>
          <button
            onClick={handleEnd}
            className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
          >
            End
          </button>
        </div>
      </header>

      {/* Main conversation area */}
      <main className="flex-1 flex flex-col items-center justify-between py-8 gap-6">
        {/* Top section: Chat history (scrollable) */}
        <div className="w-full flex-shrink-0">
          <ChatHistory messages={messages} />
        </div>

        {/* Center: Avatar + Subtitles */}
        <div className="flex flex-col items-center gap-8 flex-1 justify-center">
          <Avatar
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
          />
          <Subtitles subtitles={currentSubtitles} />
        </div>

        {/* Error display */}
        {error && (
          <p className="text-red-400 text-sm text-center px-4">{error}</p>
        )}

        {/* Bottom: Mic + text input fallback */}
        <div className="flex flex-col items-center gap-4 pb-4">
          <MicButton
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            onStart={startListening}
            onStop={stopListening}
          />
          <p className="text-zinc-600 text-xs">
            {isListening ? 'Speak now...' : 'Tap mic or press Space to talk'}
          </p>

          {/* Text input fallback for browsers without speech recognition */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.text;
              if (input.value.trim() && !isSpeaking && !isThinking) {
                sendToLLM(input.value.trim());
                input.value = '';
              }
            }}
            className="flex gap-2 w-full max-w-sm px-4"
          >
            <input
              name="text"
              type="text"
              placeholder="Or type here..."
              disabled={isSpeaking || isThinking}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSpeaking || isThinking}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
