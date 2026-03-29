/**
 * Basic Service Worker for Leidenschaft Klub PWA
 */
const CACHE_NAME = 'leidenschaft-v1';

self.addEventListener('install', (event) => {
  // skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // claim clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (like POST) and ignore Chrome-extension schemes or non-HTTP schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Provide a generic response for failed fetches (offline mode support can be added here)
  event.respondWith(
    fetch(request).catch(err => {
      // If the fetch fails (e.g., offline), we could serve a cached asset here.
      console.warn('[SW] Fetch failed for:', request.url, err);
      // For now just fail cleanly
      throw err;
    })
  );
});
