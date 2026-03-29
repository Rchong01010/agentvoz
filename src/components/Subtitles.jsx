export default function Subtitles({ subtitles }) {
  if (!subtitles) return null;

  return (
    <div className="w-full max-w-lg mx-auto space-y-2 px-4">
      {subtitles.isCorrection && (
        <p className="text-center text-xs font-medium text-amber-400 tracking-wider uppercase">
          Correction
        </p>
      )}

      {/* Spanish text */}
      <p className={`text-center text-xl font-semibold leading-relaxed ${
        subtitles.isCorrection ? 'text-amber-300' : 'text-white'
      }`}>
        {subtitles.spanish}
      </p>

      {/* English translation */}
      <p className="text-center text-base text-zinc-400 leading-relaxed">
        {subtitles.english}
      </p>
    </div>
  );
}
