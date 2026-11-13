import { lazy, ComponentType } from "react";

/**
 * React.lazy that survives a deploy. A tab opened before a deploy asks for chunk files
 * (e.g. PropertyDetailPage-<hash>.js) that no longer exist, which throws "Failed to fetch
 * dynamically imported module". On the first failure we reload once to pick up the new
 * index.html and its current chunk names; a second failure is a real error and is thrown.
 */
const KEY = "chunk-reload-at";

export function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
      return mod;
    } catch (error) {
      let last = 0;
      try { last = Number(sessionStorage.getItem(KEY) || 0); } catch { /* ignore */ }
      if (Date.now() - last > 30000) {
        try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
        window.location.reload();
        return new Promise<{ default: T }>(() => {}); // page is reloading
      }
      throw error;
    }
  });
}
