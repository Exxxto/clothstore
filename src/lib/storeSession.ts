const STORE_SESSION_KEY = "clothstore.store.session.v1";

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getStoreSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(STORE_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const next = generateSessionId();
  window.localStorage.setItem(STORE_SESSION_KEY, next);
  return next;
}
