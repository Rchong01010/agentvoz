import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../lib/config';
import StreakBadge from '../components/StreakBadge';
import VocabProgress from '../components/VocabProgress';

export default function Home() {
  const navigate = useNavigate();
  const [level, setLevel] = useState('beginner');
  const [dialect, setDialect] = useState('mexico');

  const handleQuickStart = () => {
    navigate(`/learn?level=${level}&theme=free&dialect=${dialect}&speed=1`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
          {/* Logo */}
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight mb-4">
            <span className="text-white">Agent</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Voz</span>
          </h1>

          <p className="text-zinc-400 text-xl sm:text-2xl max-w-lg leading-relaxed">
            Learn Spanish through real conversation with an AI tutor who speaks your dialect.
          </p>

          {/* Sofia avatar with glowing ring */}
          <div className="mt-12 mb-10 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 blur-xl scale-110" />
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-2 ring-purple-500/50 ring-offset-4 ring-offset-zinc-950">
              <img
                src="/sofia-still.png"
                alt="Sofia, your AI Spanish tutor"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <p className="text-zinc-500 text-sm mb-10">
            Meet Sofia. She adapts to your level, speaks four dialects, and never judges.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={() => document.getElementById('quick-start').scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Conversation
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className="flex-1 py-4 px-6 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-lg hover:bg-zinc-900 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Follow a Lesson Path
            </button>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <div className="text-center py-6 border-t border-b border-zinc-900">
        <p className="text-zinc-500 text-sm tracking-wide">
          Join <span className="text-zinc-300 font-medium">500+ learners</span> practicing with Sofia
        </p>
      </div>

      {/* ── Your Progress ── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <StreakBadge />
          <VocabProgress />
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Real Conversation',
              desc: 'No flashcards, no scripts. Talk with Sofia like you would with a friend in Mexico City, Madrid, or Buenos Aires.',
              icon: (
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              ),
            },
            {
              title: '4 Spanish Dialects',
              desc: 'Mexican, Castilian, Argentine, or Nicaraguan. Sofia switches vocabulary, slang, and pronunciation to match.',
              icon: (
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.732-3.558" />
                </svg>
              ),
            },
            {
              title: 'Adaptive AI',
              desc: 'Sofia adjusts her speed, complexity, and corrections to your level. She grows with you as you improve.',
              icon: (
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-900">
        <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            {
              step: '1',
              title: 'Choose your dialect',
              desc: 'Pick the Spanish you want to learn. Each dialect has unique slang, grammar, and rhythm.',
              icon: (
                <svg className="w-10 h-10 text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                </svg>
              ),
            },
            {
              step: '2',
              title: 'Start talking',
              desc: 'Hit the microphone and speak. Sofia responds in real time with voice and text.',
              icon: (
                <svg className="w-10 h-10 text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              ),
            },
            {
              step: '3',
              title: 'Sofia adapts to you',
              desc: 'She matches your pace, corrects gently, and pushes you when you are ready for more.',
              icon: (
                <svg className="w-10 h-10 text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.step}>
              {item.icon}
              <div className="mt-4 mb-1 text-xs font-mono text-purple-400 tracking-widest uppercase">Step {item.step}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section id="quick-start" className="max-w-lg mx-auto px-6 py-24 border-t border-zinc-900">
        <h2 className="text-3xl font-bold text-center mb-3">Start a conversation</h2>
        <p className="text-zinc-500 text-center text-sm mb-10">Pick your dialect and level. Sofia handles the rest.</p>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-6">
          {/* Dialect */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Which Spanish?</label>
            <div className="grid grid-cols-2 gap-2">
              {CONFIG.DIALECTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDialect(d.id)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition-all ${
                    dialect === d.id
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'
                  }`}
                >
                  <span className="mr-2">{d.flag}</span>
                  {d.label}
                  {dialect === d.id && (
                    <span className="block text-xs text-purple-200 mt-0.5">{d.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Your level</label>
            <div className="grid grid-cols-3 gap-2">
              {CONFIG.LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-3 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                    level === l
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Go */}
          <button
            onClick={handleQuickStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Talk to Sofia
          </button>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-md mx-auto px-6 py-24 border-t border-zinc-900">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-purple-400 font-medium tracking-wider uppercase mb-2">AgentVoz Pro</p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-white">$9.99</span>
            <span className="text-zinc-500 text-lg">/month</span>
          </div>
          <p className="text-zinc-400 text-sm mb-6">Unlimited conversations with Sofia. Cancel anytime.</p>
          <ul className="text-left text-sm text-zinc-400 space-y-2 mb-8">
            {['Unlimited AI conversations', '4 Spanish dialects', '18 structured lessons', 'Real-time subtitles & translation', 'Speed control', 'New lessons added weekly'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {f}
              </li>
            ))}
          </ul>
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
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Subscribe Now
          </button>
          <p className="text-zinc-600 text-xs mt-3">Try free first. Subscribe when you're ready.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-zinc-900">
        <p className="text-zinc-700 text-xs tracking-wide">AgentVoz &middot; agentvoz.com</p>
      </footer>
    </div>
  );
}
