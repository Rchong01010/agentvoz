import { useState, useEffect } from 'react';

const PULSE_COLORS = {
  idle: 'from-purple-500/20 to-pink-500/20',
  listening: 'from-blue-500/40 to-cyan-500/40',
  thinking: 'from-amber-500/30 to-orange-500/30',
  speaking: 'from-emerald-500/40 to-teal-500/40',
};

export default function Avatar({ isListening, isSpeaking, isThinking }) {
  const [pulseScale, setPulseScale] = useState(1);

  const state = isListening ? 'listening' : isThinking ? 'thinking' : isSpeaking ? 'speaking' : 'idle';

  useEffect(() => {
    if (state === 'idle') {
      setPulseScale(1);
      return;
    }

    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.08 : 1);
    }, state === 'thinking' ? 800 : 500);

    return () => clearInterval(interval);
  }, [state]);

  const stateLabel = {
    idle: 'Ready',
    listening: 'Listening...',
    thinking: 'Sofia is thinking...',
    speaking: 'Sofia is speaking...',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar container with animated ring */}
      <div className="relative">
        {/* Outer pulse ring */}
        <div
          className={`absolute -inset-4 rounded-full bg-gradient-to-br ${PULSE_COLORS[state]} blur-xl transition-all duration-500`}
          style={{ transform: `scale(${pulseScale})` }}
        />

        {/* Avatar circle */}
        <div className={`relative w-48 h-48 rounded-full overflow-hidden border-2 transition-colors duration-300 ${
          state === 'listening' ? 'border-blue-400' :
          state === 'thinking' ? 'border-amber-400' :
          state === 'speaking' ? 'border-emerald-400' :
          'border-zinc-700'
        }`}>
          {/* Sofia placeholder - gradient avatar */}
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 flex items-center justify-center">
            <span className="text-7xl">👩🏽</span>
          </div>
        </div>

        {/* Status indicator dot */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-zinc-950 ${
          state === 'listening' ? 'bg-blue-400 animate-pulse' :
          state === 'thinking' ? 'bg-amber-400 animate-pulse' :
          state === 'speaking' ? 'bg-emerald-400 animate-pulse' :
          'bg-zinc-600'
        }`} />
      </div>

      {/* State label */}
      <p className={`text-sm font-medium transition-colors duration-300 ${
        state === 'listening' ? 'text-blue-400' :
        state === 'thinking' ? 'text-amber-400' :
        state === 'speaking' ? 'text-emerald-400' :
        'text-zinc-500'
      }`}>
        {stateLabel[state]}
      </p>
    </div>
  );
}
