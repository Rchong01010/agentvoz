const STORAGE_KEY = 'agentvoz_streak';

function today() {
  return new Date().toISOString().split('T')[0];
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      currentStreak: 0, lastActiveDate: null, longestStreak: 0, totalDays: 0,
    };
  } catch { return { currentStreak: 0, lastActiveDate: null, longestStreak: 0, totalDays: 0 }; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function recordActivity() {
  const data = getData();
  const t = today();
  if (data.lastActiveDate === t) return data; // already recorded today

  if (data.lastActiveDate === yesterday()) {
    data.currentStreak += 1;
  } else {
    data.currentStreak = 1;
  }

  data.lastActiveDate = t;
  data.totalDays += 1;
  if (data.currentStreak > data.longestStreak) data.longestStreak = data.currentStreak;
  save(data);
  return data;
}

export function getStreak() { return getData(); }
export function isActiveToday() { return getData().lastActiveDate === today(); }

export function getMilestone(streak) {
  const milestones = [100, 60, 30, 14, 7, 3];
  for (const m of milestones) {
    if (streak >= m) return m;
  }
  return null;
}
