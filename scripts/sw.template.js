/**
 * Service worker template for the hosted build. The build injects the
 * versioned cache name and the exact list of files it emitted, so the
 * worker only ever serves URLs the build produced, from its own cache —
 * never from other caches on the origin — and every deploy invalidates
 * cleanly by changing the cache name.
 *
 * Emitted by the aged:service-worker plugin in vite.config.ts; the
 * placeholders below are replaced at build time. Not used by the
 * single-file build, which runs from file:// without a service worker.
 */

const CACHE = "__CACHE_NAME__";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached !== undefined) {
        return cached;
      }
      if (request.mode === "navigate") {
        const shell = await cache.match("./");
        if (shell !== undefined) {
          return shell;
        }
      }
      return fetch(request);
    })(),
  );
});
