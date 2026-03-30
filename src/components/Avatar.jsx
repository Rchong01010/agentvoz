import { useRef, useEffect } from 'react';

const PULSE_COLORS = {
  idle: 'from-purple-500/20 to-pink-500/20',
  listening: 'from-blue-500/40 to-cyan-500/40',
  thinking: 'from-amber-500/30 to-orange-500/30',
  speaking: 'from-emerald-500/40 to-teal-500/40',
  connecting: 'from-purple-500/30 to-pink-500/30',
};

export default function Avatar({ isListening, isSpeaking, isThinking, callState }) {
  const videoRef = useRef(null);

  const state = callState === 'connecting' ? 'connecting' :
    isListening ? 'listening' :
    isThinking ? 'thinking' :
    isSpeaking ? 'speaking' : 'idle';

  // Adjust video playback rate based on state
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = state === 'speaking' ? 1 : 0.6;
  }, [state]);

  const stateLabel = {
    idle: 'Ready',
    connecting: 'Connecting...',
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
          className={`absolute -inset-4 rounded-full bg-gradient-to-br ${PULSE_COLORS[state]} blur-xl transition-all duration-500 ${
            state !== 'idle' ? 'animate-pulse' : ''
          }`}
        />

        {/* Avatar circle */}
        <div className={`relative w-48 h-48 rounded-full overflow-hidden border-2 transition-colors duration-300 ${
          state === 'listening' ? 'border-blue-400' :
          state === 'thinking' ? 'border-amber-400' :
          state === 'speaking' ? 'border-emerald-400' :
          state === 'connecting' ? 'border-purple-400 animate-pulse' :
          'border-zinc-700'
        }`}>
          {/* Try video first, fallback to gradient */}
          <video
            ref={videoRef}
            src="/sofia-loop.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide video on error, show fallback
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback: still image or gradient */}
          <div
            className="w-full h-full items-center justify-center"
            style={{ display: 'none' }}
          >
            <img
              src="/sofia-still.png"
              alt="Sofia"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 items-center justify-center" style={{ display: 'none' }}>
              <span className="text-7xl">👩🏽</span>
            </div>
          </div>
        </div>

        {/* Status indicator dot */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-zinc-950 ${
          state === 'listening' ? 'bg-blue-400 animate-pulse' :
          state === 'thinking' ? 'bg-amber-400 animate-pulse' :
          state === 'speaking' ? 'bg-emerald-400 animate-pulse' :
          state === 'connecting' ? 'bg-purple-400 animate-pulse' :
          'bg-zinc-600'
        }`} />
      </div>

      {/* State label */}
      <p className={`text-sm font-medium transition-colors duration-300 ${
        state === 'listening' ? 'text-blue-400' :
        state === 'thinking' ? 'text-amber-400' :
        state === 'speaking' ? 'text-emerald-400' :
        state === 'connecting' ? 'text-purple-400' :
        'text-zinc-500'
      }`}>
        {stateLabel[state]}
      </p>
    </div>
  );
}
