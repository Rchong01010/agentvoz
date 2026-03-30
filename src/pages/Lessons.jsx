import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IMMERSION_LEVELS, getLessonsForLevel, LESSONS } from '../lib/curriculum';
import { CONFIG } from '../lib/config';
import { isLessonCompleted, getCompletedCountForLevel, getTotalCompleted } from '../lib/progress';

export default function Lessons() {
  const navigate = useNavigate();
  const [dialect, setDialect] = useState(CONFIG.DEFAULT_DIALECT);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <svg
              className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Agent</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Voz</span>
            </h1>
          </Link>
          <span className="text-sm text-zinc-500">Lessons</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Dialect Selector */}
        {/* Progress summary */}
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Your Progress</p>
            <p className="text-xs text-zinc-500 mt-0.5">{getTotalCompleted()} of {LESSONS.length} lessons completed</p>
          </div>
          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(getTotalCompleted() / LESSONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-10">
          <label className="block text-sm font-medium text-zinc-400 mb-3">
            Which Spanish?
          </label>
          <div className="flex gap-2 flex-wrap">
            {CONFIG.DIALECTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDialect(d.id)}
                className={`py-2 px-4 rounded-full text-sm font-medium transition-all ${
                  dialect === d.id
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span className="mr-1.5">{d.flag}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journey Path */}
        <div className="relative">
          {IMMERSION_LEVELS.map((level, levelIdx) => {
            const lessons = getLessonsForLevel(level.id);
            const isLast = levelIdx === IMMERSION_LEVELS.length - 1;

            return (
              <div key={level.id} className="relative">
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className="absolute left-6 top-16 bottom-0 w-px"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.05))',
                    }}
                  />
                )}

                {/* Level Header */}
                <div className="relative flex items-start gap-4 mb-5">
                  {/* Level node */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {level.icon}
                  </div>

                  <div className="pt-0.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">
                        {level.label}
                      </h2>
                      <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">
                        {getCompletedCountForLevel(level.id, LESSONS)}/{lessons.length}
                      </span>
                    </div>
                    <p className={`text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r ${level.color} mt-0.5`}>
                      {level.ratio}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Lesson Cards */}
                <div className="ml-14 mb-10 space-y-3">
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => navigate(`/learn?lesson=${lesson.id}&dialect=${dialect}`)}
                      className="w-full text-left group"
                    >
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-purple-900/10 active:scale-[0.99]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-zinc-600">{lesson.id}</span>
                              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white truncate">
                                {lesson.title}
                              </h3>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                              {lesson.description}
                            </p>

                            {/* Vocab Tags */}
                            {lesson.vocabTargets.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {lesson.vocabTargets.slice(0, 5).map((word) => (
                                  <span
                                    key={word}
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} bg-opacity-10 text-white/70`}
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                  >
                                    {word}
                                  </span>
                                ))}
                                {lesson.vocabTargets.length > 5 && (
                                  <span className="text-[10px] text-zinc-600 px-2 py-0.5">
                                    +{lesson.vocabTargets.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Completed check or arrow */}
                          {isLessonCompleted(lesson.id) ? (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          ) : (
                            <svg
                              className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="py-6 text-center text-zinc-700 text-xs">
        AgentVoz &middot; agentvoz.com
      </footer>
    </div>
  );
}
