import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../lib/config';

export default function Home() {
  const navigate = useNavigate();
  const [level, setLevel] = useState('beginner');
  const [theme, setTheme] = useState('greetings');

  const handleStart = () => {
    navigate(`/learn?level=${level}&theme=${theme}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="text-white">Agent</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Voz</span>
          </h1>
          <p className="text-zinc-400 mt-3 text-lg">
            Have real conversations in Spanish with your AI tutor
          </p>
          <p className="text-zinc-600 mt-1 text-sm">
            Not flashcards. Not scripts. Real conversation.
          </p>
        </div>

        {/* Sofia Preview */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 flex items-center justify-center mb-10 ring-2 ring-purple-500/30 ring-offset-4 ring-offset-zinc-950">
          <span className="text-6xl">👩🏽</span>
        </div>

        {/* Setup Card */}
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Your Spanish Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONFIG.LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                    level === l
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Conversation Topic
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONFIG.THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all ${
                    theme === t.id
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="mr-1.5">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Conversation with Sofia
          </button>
        </div>

        {/* Social proof / pitch */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-zinc-500 text-sm">
            Powered by AI. Adapts to your level in real-time.
          </p>
          <div className="flex items-center justify-center gap-4 text-zinc-600 text-xs">
            <span>No scripts</span>
            <span className="text-zinc-800">|</span>
            <span>Real conversation</span>
            <span className="text-zinc-800">|</span>
            <span>Instant feedback</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-zinc-700 text-xs">
        AgentVoz by A Team &middot; agentvoz.com
      </footer>
    </div>
  );
}
