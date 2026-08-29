// Guarded sessionStorage access.
//
// Reading window.sessionStorage is not guaranteed to succeed: browsers set to
// block site data, and the private modes of some browsers, throw a
// SecurityError on the property access itself rather than returning null. A
// stored token is a convenience, never a prerequisite for rendering, so every
// operation degrades to "no stored value" instead of propagating.
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
      // Nothing to clear if storage was never reachable.
    }
  }
};
