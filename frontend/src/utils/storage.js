// Browsers set to block site data throw on the sessionStorage access itself
// rather than returning null. A stored token is never a prerequisite for
// rendering, so every operation degrades to "no stored value".
export const sessionStore = {
  get(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nothing to clear if storage is unreachable.
    }
  }
};
