import { useRef, useEffect, useState } from 'react';

const PULSE_COLORS = {
  idle: 'from-purple-500/20 to-pink-500/20',
  listening: 'from-blue-500/40 to-cyan-500/40',
  thinking: 'from-amber-500/30 to-orange-500/30',
  speaking: 'from-emerald-500/40 to-teal-500/40',
  connecting: 'from-purple-500/30 to-pink-500/30',
};

export default function Avatar({ isListening, isSpeaking, isThinking, callState }) {
  const imgRef = useRef(null);
  const [mouthOpen, setMouthOpen] = useState(0); // 0-1 mouth animation
  const [headTilt, setHeadTilt] = useState(0); // subtle head movement
  const animFrameRef = useRef(null);

  const state = callState === 'connecting' ? 'connecting' :
    isListening ? 'listening' :
    isThinking ? 'thinking' :
    isSpeaking ? 'speaking' : 'idle';

  // Audio-reactive mouth animation when speaking
  useEffect(() => {
    if (state !== 'speaking') {
      setMouthOpen(0);
      setHeadTilt(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Simulate mouth movement with rhythmic pattern
    // Real audio analysis would use Web Audio API analyzer on the output stream
    // but VAPI handles audio internally, so we simulate natural speech rhythm
    let t = 0;
    const animate = () => {
      t += 0.15;
      // Natural speech rhythm: mix of frequencies for realistic movement
      const mouth = Math.abs(
        Math.sin(t * 2.3) * 0.4 +
        Math.sin(t * 3.7) * 0.3 +
        Math.sin(t * 5.1) * 0.2 +
        Math.sin(t * 7.3) * 0.1
      );
      // Subtle head movement
      const tilt = Math.sin(t * 0.4) * 1.5 + Math.sin(t * 0.7) * 0.8;

      setMouthOpen(Math.min(1, mouth));
      setHeadTilt(tilt);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state]);

  // Gentle idle breathing animation
  const idleBreathing = state === 'idle' || state === 'listening';

  const stateLabel = {
    idle: 'Ready',
    connecting: 'Connecting...',
    listening: 'Listening...',
    thinking: 'Sofia is thinking...',
    speaking: 'Sofia is speaking...',
  };

  // Dynamic transform based on state
  const avatarTransform = state === 'speaking'
    ? `rotate(${headTilt}deg) scale(${1 + mouthOpen * 0.02})`
    : idleBreathing
      ? undefined // CSS animation handles this
      : 'scale(1)';

  return (
    <div className="flex flex-col items-center gap-4">
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
          {/* Sofia image with animation */}
          <div
            className={`w-full h-full ${idleBreathing ? 'animate-[breathe_4s_ease-in-out_infinite]' : ''}`}
            style={{
              transform: avatarTransform,
              transition: state === 'speaking' ? 'none' : 'transform 0.3s ease',
            }}
          >
            <img
              ref={imgRef}
              src="/sofia-still.png"
              alt="Sofia"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Mouth overlay — semi-transparent dark area that pulses to simulate talking */}
          {state === 'speaking' && (
            <div
              className="absolute bottom-[22%] left-1/2 -translate-x-1/2 rounded-full bg-black/20 pointer-events-none"
              style={{
                width: `${18 + mouthOpen * 14}%`,
                height: `${2 + mouthOpen * 8}%`,
                opacity: 0.15 + mouthOpen * 0.2,
                transition: 'none',
                filter: 'blur(2px)',
              }}
            />
          )}
        </div>

        {/* Audio visualizer rings when speaking */}
        {state === 'speaking' && (
          <>
            <div
              className="absolute inset-0 rounded-full border border-emerald-400/30 pointer-events-none"
              style={{
                transform: `scale(${1.05 + mouthOpen * 0.08})`,
                opacity: 0.3 + mouthOpen * 0.4,
              }}
            />
            <div
              className="absolute inset-0 rounded-full border border-emerald-400/15 pointer-events-none"
              style={{
                transform: `scale(${1.1 + mouthOpen * 0.12})`,
                opacity: 0.15 + mouthOpen * 0.2,
              }}
            />
          </>
        )}

        {/* Status dot */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-zinc-950 ${
          state === 'listening' ? 'bg-blue-400 animate-pulse' :
          state === 'thinking' ? 'bg-amber-400 animate-pulse' :
          state === 'speaking' ? 'bg-emerald-400' :
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
