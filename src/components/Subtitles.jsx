export default function Subtitles({ subtitles, karaokeWords, karaokeIndex }) {
  if (!subtitles) return null;

  const hasKaraoke = karaokeWords && karaokeWords.length > 0 && karaokeIndex >= 0;

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 px-4">
      {subtitles.isCorrection && (
        <p className="text-center text-xs font-medium text-amber-400 tracking-wider uppercase">
          Correction
        </p>
      )}

      {/* Spanish text — karaoke style */}
      <div className="text-center text-xl font-semibold leading-relaxed">
        {hasKaraoke ? (
          <p>
            {karaokeWords.map((word, i) => (
              <span
                key={i}
                className={`transition-all duration-150 ${
                  i <= karaokeIndex
                    ? subtitles.isCorrection ? 'text-amber-300' : 'text-white'
                    : 'text-zinc-700'
                }`}
              >
                {word}{i < karaokeWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        ) : (
          <p className={subtitles.isCorrection ? 'text-amber-300' : 'text-white'}>
            {subtitles.spanish}
          </p>
        )}
      </div>

      {/* English translation */}
      <p className="text-center text-base text-zinc-400 leading-relaxed">
        {subtitles.english}
      </p>
    </div>
  );
}
