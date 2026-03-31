import { getStats, getProgress, TARGET_WORDS } from '../lib/vocabulary';

export default function VocabProgress({ compact = false }) {
  const { totalWords, totalMastered, recentWords } = getStats();
  const progress = getProgress();
  const radius = compact ? 20 : 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <svg width={48} height={48} className="rotate-[-90deg]">
          <circle cx={24} cy={24} r={radius} fill="none" stroke="rgb(39 39 42)" strokeWidth={3} />
          <circle cx={24} cy={24} r={radius} fill="none" stroke="url(#grad)" strokeWidth={3}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
          </linearGradient></defs>
        </svg>
        <div>
          <p className="text-xs font-bold text-white">{totalMastered}</p>
          <p className="text-[10px] text-zinc-500">words</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <svg width={80} height={80} className="rotate-[-90deg] flex-shrink-0">
          <circle cx={40} cy={40} r={radius} fill="none" stroke="rgb(39 39 42)" strokeWidth={4} />
          <circle cx={40} cy={40} r={radius} fill="none" stroke="url(#gradV)" strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          <defs><linearGradient id="gradV" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
          </linearGradient></defs>
        </svg>
        <div>
          <p className="text-lg font-bold text-white">{totalMastered} <span className="text-zinc-500 text-sm font-normal">/ {TARGET_WORDS}</span></p>
          <p className="text-xs text-zinc-500">words mastered</p>
          <p className="text-xs text-purple-400 mt-1">{progress}% to conversational fluency</p>
        </div>
      </div>
      {recentWords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recentWords.slice(0, 6).map(w => (
            <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
