const STORAGE_KEY = 'agentvoz_vocab';
export const TARGET_WORDS = 2000;

// Common Spanish stop words to exclude from tracking
const STOP_WORDS = new Set([
  'a', 'al', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'lo', 'los', 'me',
  'mi', 'no', 'o', 'por', 'que', 'se', 'si', 'su', 'te', 'tu', 'un', 'una',
  'y', 'ya', 'e', 'le', 'les', 'nos', 'con', 'para', 'pero', 'como', 'más',
  'muy', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'yo', 'tú', 'él',
  'ella', 'we', 'the', 'is', 'are', 'and', 'or', 'to', 'a', 'i', 'you',
  'it', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'do', 'does',
]);

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { words: {} };
  } catch { return { words: {} }; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function extractWords(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[¿¡.,!?;:"""''()[\]{}]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function looksSpanish(word) {
  return /[áéíóúñü]/.test(word) ||
    /^(hola|gracias|por|favor|bien|mal|cómo|qué|cuánto|dónde|soy|estoy|tengo|quiero|puedo|vamos|bueno|casa|amigo|familia|comida|agua|café|tiempo|día|noche|grande|pequeño|bonito|mucho|poco|ahora|aquí|allí|siempre|nunca|también|después|antes|porque|cuando|donde|mientras|aunque|desde|hasta|entre|sobre|bajo|durante|según|hacia|contra|mediante)\b/.test(word);
}

export function addHeardWords(spanishText) {
  const data = getData();
  const words = extractWords(spanishText);
  for (const w of words) {
    if (!data.words[w]) {
      data.words[w] = { firstSeen: new Date().toISOString(), timesHeard: 0, timesProduced: 0, mastered: false };
    }
    data.words[w].timesHeard += 1;
  }
  save(data);
}

export function addProducedWords(text) {
  const data = getData();
  const words = extractWords(text).filter(w => looksSpanish(w) || data.words[w]);
  for (const w of words) {
    if (!data.words[w]) {
      data.words[w] = { firstSeen: new Date().toISOString(), timesHeard: 0, timesProduced: 0, mastered: false };
    }
    data.words[w].timesProduced += 1;
    if (data.words[w].timesProduced >= 3 && !data.words[w].mastered) {
      data.words[w].mastered = true;
    }
  }
  save(data);
}

export function getStats() {
  const data = getData();
  const allWords = Object.entries(data.words);
  const mastered = allWords.filter(([, v]) => v.mastered);
  const recent = allWords
    .sort((a, b) => new Date(b[1].firstSeen) - new Date(a[1].firstSeen))
    .slice(0, 10)
    .map(([word]) => word);

  return {
    totalWords: allWords.length,
    totalMastered: mastered.length,
    masteredList: mastered.map(([w]) => w),
    recentWords: recent,
  };
}

export function getProgress() {
  const { totalMastered } = getStats();
  return Math.min(100, Math.round((totalMastered / TARGET_WORDS) * 100));
}
