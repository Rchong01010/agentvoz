export default function MicButton({ isListening, isSpeaking, isThinking, onStart, onStop }) {
  const disabled = isSpeaking || isThinking;

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
        disabled
          ? 'bg-zinc-800 cursor-not-allowed opacity-50'
          : isListening
            ? 'bg-red-500 hover:bg-red-600 scale-110'
            : 'bg-white hover:bg-zinc-200 hover:scale-105'
      }`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? (
        /* Stop icon */
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        /* Mic icon */
        <svg className="w-8 h-8 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}

      {/* Listening pulse rings */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
          <span className="absolute -inset-2 rounded-full border-2 border-red-400 opacity-30 animate-pulse" />
        </>
      )}
    </button>
  );
}
