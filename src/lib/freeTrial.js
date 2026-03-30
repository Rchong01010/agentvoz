const STORAGE_KEY = 'agentvoz_conversations';
const FREE_LIMIT = 3;

export function getConversationCount() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function incrementConversation() {
  try {
    const count = getConversationCount() + 1;
    localStorage.setItem(STORAGE_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

export function hasFreeTrial() {
  return getConversationCount() < FREE_LIMIT;
}

export function getRemainingFree() {
  return Math.max(0, FREE_LIMIT - getConversationCount());
}

export const FREE_CONVERSATION_LIMIT = FREE_LIMIT;
