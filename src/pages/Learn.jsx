import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useConversation } from '../hooks/useConversation';
import Avatar from '../components/Avatar';
import Subtitles from '../components/Subtitles';
import ChatHistory from '../components/ChatHistory';
import { CONFIG } from '../lib/config';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Learn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const level = searchParams.get('level') || 'beginner';
  const theme = searchParams.get('theme') || 'greetings';
  const dialectParam = searchParams.get('dialect') || 'mexico';
  const speedParam = parseFloat(searchParams.get('speed')) || 1.0;

  const dialectConfig = CONFIG.DIALECTS.find(d => d.id === dialectParam);

  const {
    messages,
    isListening,
    isSpeaking,
    isThinking,
    currentSubtitles,
    karaokeWords,
    karaokeIndex,
    started,
    error,
    callState,
    duration,
    startConversation,
    stopConversation,
    sendToLLM,
  } = useConversation();

  useEffect(() => {
    if (callState === 'idle' && !started) {
      startConversation(level, theme, dialectParam, speedParam);
    }
  }, []);

  const handleEnd = () => {
    stopConversation();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">
            <span className="text-white">Agent</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Voz</span>
          </h1>
          {dialectConfig && (
            <span className="text-sm">{dialectConfig.flag}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {callState === 'active' && (
            <span className="text-xs text-zinc-400 tabular-nums bg-zinc-900 px-3 py-1 rounded-full">
              {formatTime(duration)}
            </span>
          )}
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
        {/* Chat history */}
        <div className="w-full flex-shrink-0">
          <ChatHistory messages={messages} />
        </div>

        {/* Center: Avatar + Subtitles */}
        <div className="flex flex-col items-center gap-8 flex-1 justify-center">
          <Avatar
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            callState={callState}
          />
          <Subtitles
            subtitles={currentSubtitles}
            karaokeWords={karaokeWords}
            karaokeIndex={karaokeIndex}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center px-4">{error}</p>
        )}

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-4 pb-4">
          <div className="flex items-center gap-2">
            {callState === 'active' && (
              <>
                <span className={`w-2 h-2 rounded-full ${
                  isSpeaking ? 'bg-emerald-400' :
                  isListening ? 'bg-blue-400 animate-pulse' :
                  isThinking ? 'bg-amber-400 animate-pulse' :
                  'bg-zinc-600'
                }`} />
                <span className="text-zinc-500 text-xs">
                  {isSpeaking ? 'Sofia is speaking...' :
                   isListening ? 'Listening — speak now' :
                   isThinking ? 'Processing...' :
                   'Connected'}
                </span>
              </>
            )}
            {callState === 'connecting' && (
              <span className="text-purple-400 text-xs animate-pulse">Connecting to Sofia...</span>
            )}
          </div>

          {/* Text input fallback */}
          {callState === 'active' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.elements.text;
                if (input.value.trim()) {
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
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
