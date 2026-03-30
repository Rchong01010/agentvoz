import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useConversation } from '../hooks/useConversation';
import Avatar from '../components/Avatar';
import Subtitles from '../components/Subtitles';
import ChatHistory from '../components/ChatHistory';
import { CONFIG } from '../lib/config';
import { getLesson } from '../lib/curriculum';
import { hasFreeTrial, incrementConversation, getRemainingFree, FREE_CONVERSATION_LIMIT } from '../lib/freeTrial';

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
  const lessonId = searchParams.get('lesson') || null;

  const dialectConfig = CONFIG.DIALECTS.find(d => d.id === dialectParam);
  const lesson = lessonId ? getLesson(lessonId) : null;
  const isSubscribed = searchParams.get('subscribed') === 'true';
  const [showPaywall, setShowPaywall] = useState(false);

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
    // Check free trial before starting
    if (!isSubscribed && !hasFreeTrial()) {
      setShowPaywall(true);
      return;
    }

    if (callState === 'idle' && !started) {
      incrementConversation();
      startConversation(level, theme, dialectParam, speedParam, lessonId);
    }
  }, []);

  const handleEnd = () => {
    stopConversation();
    navigate('/');
  };

  // Paywall screen
  if (showPaywall) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 ring-2 ring-purple-500/30 ring-offset-4 ring-offset-zinc-950">
            <img src="/sofia-still.png" alt="Sofia" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You've used your free conversations</h2>
          <p className="text-zinc-400 mb-8">
            You had {FREE_CONVERSATION_LIMIT} free conversations with Sofia. Subscribe to keep learning with unlimited access.
          </p>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/create-checkout', { method: 'POST' });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch (err) {
                console.error('Checkout error:', err);
              }
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98] mb-4"
          >
            Subscribe for $9.99/month
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

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
          {!isSubscribed && getRemainingFree() > 0 && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {getRemainingFree()} free left
            </span>
          )}
          {lesson && (
            <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
              {lesson.title}
            </span>
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
