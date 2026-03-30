import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../lib/config';

export default function Home() {
  const navigate = useNavigate();
  const [level, setLevel] = useState('beginner');
  const [theme, setTheme] = useState('greetings');
  const [dialect, setDialect] = useState('mexico');
  const [speed, setSpeed] = useState(1.0);

  const handleStart = () => {
    navigate(`/learn?level=${level}&theme=${theme}&dialect=${dialect}&speed=${speed}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
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
        <div className="w-28 h-28 rounded-full overflow-hidden mb-8 ring-2 ring-purple-500/30 ring-offset-4 ring-offset-zinc-950">
          <img src="/sofia-still.png" alt="Sofia" className="w-full h-full object-cover" onError={(e) => {
            e.target.style.display = 'none';
          }} />
        </div>

        {/* Setup Card */}
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-5">

          {/* Dialect Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Which Spanish?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONFIG.DIALECTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDialect(d.id)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all ${
                    dialect === d.id
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="mr-1.5">{d.flag}</span>
                  {d.label}
                  {dialect === d.id && (
                    <span className="block text-xs text-purple-200 mt-0.5">{d.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Your Level
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

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Speech Speed
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CONFIG.SPEED_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all ${
                    speed === s.value
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {s.label}
                  {speed === s.value && (
                    <span className="block text-[10px] text-purple-200 mt-0.5">{s.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Topic
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CONFIG.THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all ${
                    theme === t.id
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-base mb-0.5">{t.icon}</span>
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

        {/* Pitch */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-3 text-zinc-600 text-xs">
            <span>Adaptive AI</span>
            <span className="text-zinc-800">|</span>
            <span>Real conversation</span>
            <span className="text-zinc-800">|</span>
            <span>4 dialects</span>
            <span className="text-zinc-800">|</span>
            <span>Speed control</span>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-zinc-700 text-xs">
        AgentVoz &middot; agentvoz.com
      </footer>
    </div>
  );
}
