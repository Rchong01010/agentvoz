const STORAGE_KEY = 'agentvoz_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

/** Mark a lesson as completed */
export function completeLesson(lessonId) {
  const progress = getProgress();
  progress[lessonId] = {
    completed: true,
    completedAt: new Date().toISOString(),
    attempts: (progress[lessonId]?.attempts || 0) + 1,
  };
  saveProgress(progress);
}

/** Record a lesson attempt (started but not necessarily completed) */
export function recordAttempt(lessonId) {
  const progress = getProgress();
  progress[lessonId] = {
    ...progress[lessonId],
    lastAttempt: new Date().toISOString(),
    attempts: (progress[lessonId]?.attempts || 0) + 1,
  };
  saveProgress(progress);
}

/** Check if a lesson is completed */
export function isLessonCompleted(lessonId) {
  return getProgress()[lessonId]?.completed || false;
}

/** Get number of completed lessons for a level */
export function getCompletedCountForLevel(level, lessons) {
  const progress = getProgress();
  return lessons.filter(l => l.level === level && progress[l.id]?.completed).length;
}

/** Get all progress data */
export function getAllProgress() {
  return getProgress();
}

/** Get total completed lessons */
export function getTotalCompleted() {
  const progress = getProgress();
  return Object.values(progress).filter(p => p.completed).length;
}
