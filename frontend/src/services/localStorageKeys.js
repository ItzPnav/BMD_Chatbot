/**
 * Centralized localStorage key constants
 */
export const STORAGE_KEYS = {
  UI_STATE: 'bmd_ui_state',
  RECENT_CHATS: 'bmd_recent_chats',
  ADMIN_LAST_FILTER: 'bmd_admin_last_filter',
  ADMIN_LAST_SELECTED_CHAT: 'bmd_admin_last_selected_chat'
};

/**
 * Get UI state from localStorage
 */
export const getUIState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    return stored ? JSON.parse(stored) : { open: false, fullscreen: false };
  } catch {
    return { open: false, fullscreen: false };
  }
};

/**
 * Save UI state to localStorage
 */
export const saveUIState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save UI state:', error);
  }
};

/**
 * Get cached recent chats
 */
export const getCachedChats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_CHATS);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const expiresAt = data.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEYS.RECENT_CHATS);
      return null;
    }
    return data.chats;
  } catch {
    return null;
  }
};

/**
 * Cache recent chats (expires after 30 minutes)
 */
export const cacheChats = (chats) => {
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    localStorage.setItem(
      STORAGE_KEYS.RECENT_CHATS,
      JSON.stringify({ chats, expiresAt })
    );
  } catch (error) {
    console.error('Failed to cache chats:', error);
  }
};

