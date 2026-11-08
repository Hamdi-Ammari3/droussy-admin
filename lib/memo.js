import "server-only";

// Tiny in-process cache: the lists are re-read from Firestore at most every
// TTL_MS, and every admin change clears them at once (read-your-own-writes).
const TTL_MS = 30_000;
const store = new Map();

export function memo(key, loader) {
  return async () => {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
    const promise = loader().catch((err) => {
      store.delete(key);
      throw err;
    });
    store.set(key, { at: Date.now(), promise });
    return promise;
  };
}

export function invalidate(...keys) {
  keys.forEach((k) => store.delete(k));
}
