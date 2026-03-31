import { getStreak, isActiveToday, getMilestone } from '../lib/streaks';

export default function StreakBadge({ compact = false }) {
  const { currentStreak, longestStreak, totalDays } = getStreak();
  const active = isActiveToday();
  const milestone = getMilestone(currentStreak);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-base ${active ? 'opacity-100' : 'opacity-40'}`}>🔥</span>
        <span className={`text-xs font-bold tabular-nums ${active ? 'text-amber-400' : 'text-zinc-600'}`}>
          {currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-3xl ${active ? '' : 'opacity-30'}`}>🔥</span>
          <div>
            <p className={`text-lg font-bold ${active ? 'text-amber-400' : 'text-zinc-500'}`}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-zinc-500">
              {active ? 'Keep it going!' : 'Practice today to keep your streak!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-600">Best: {longestStreak}</p>
          <p className="text-xs text-zinc-600">Total: {totalDays}d</p>
        </div>
      </div>
      {milestone && currentStreak === milestone && (
        <div className="mt-3 text-center py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-sm font-medium text-amber-400">
            🎉 {milestone}-day streak! Amazing dedication!
          </p>
        </div>
      )}
    </div>
  );
}
