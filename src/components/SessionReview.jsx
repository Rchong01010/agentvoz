import { getStreak } from '../lib/streaks';
import { getStats } from '../lib/vocabulary';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MILESTONES = {
  'L1-01': 'You can greet someone in Spanish!',
  'L1-02': 'You can ask and answer "how are you?"',
  'L1-03': 'You can count to 10 in Spanish!',
  'L1-04': 'You know the essential polite phrases!',
  'L1-05': 'You can order coffee in Spanish!',
  'L2-01': 'You can introduce yourself in Spanish!',
  'L2-02': 'You can order a full meal at a restaurant!',
  'L2-03': 'You can ask for directions!',
  'L2-04': 'You can go shopping in Spanish!',
  'L2-05': 'You can describe people in Spanish!',
};

export default function SessionReview({ messages, duration, lessonId, onClose, onStartNew }) {
  const streak = getStreak();
  const vocab = getStats();
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const userMessages = messages.filter(m => m.role === 'user');
  const userWords = userMessages.reduce((sum, m) => sum + (m.content?.split(/\s+/).length || 0), 0);
  const milestone = lessonId ? MILESTONES[lessonId] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 text-center">
          <p className="text-2xl font-bold text-white">Session Complete</p>
          <p className="text-sm text-zinc-500 mt-1">{formatDuration(duration)} conversation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-zinc-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{assistantMessages.length}</p>
            <p className="text-xs text-zinc-500">exchanges</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{userWords}</p>
            <p className="text-xs text-zinc-500">words spoken</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
              🔥 {streak.currentStreak}
            </p>
            <p className="text-xs text-zinc-500">day streak</p>
          </div>
        </div>

        {/* Milestone */}
        {milestone && (
          <div className="mx-6 mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <p className="text-sm font-medium text-emerald-400">🎉 {milestone}</p>
          </div>
        )}

        {/* Vocab */}
        {vocab.recentWords.length > 0 && (
          <div className="p-6 border-b border-zinc-800">
            <p className="text-sm font-medium text-zinc-300 mb-3">Words encountered</p>
            <div className="flex flex-wrap gap-1.5">
              {vocab.recentWords.map(w => (
                <span key={w} className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {w}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-3">{vocab.totalMastered}/{2000} words mastered ({Math.round(vocab.totalMastered / 2000 * 100)}%)</p>
          </div>
        )}

        {/* Transcript preview */}
        <div className="p-6 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-3">Conversation</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.slice(0, 10).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600/30 text-blue-200'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {msg.spanish || msg.content}
                  {msg.english && <p className="text-zinc-500 text-[10px] mt-0.5">{msg.english}</p>}
                </div>
              </div>
            ))}
            {messages.length > 10 && (
              <p className="text-xs text-zinc-600 text-center">+ {messages.length - 10} more messages</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-3">
          <button onClick={onStartNew}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all">
            Start Another Conversation
          </button>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
