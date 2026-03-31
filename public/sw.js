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

  // Ignore:
  // 1. Non-GET requests (POST, PUT, DELETE, etc.)
  // 2. Non-HTTP schemes (chrome-extension, etc.)
  // 3. Supabase Auth/API calls (they usually handle their own caching/headers)
  // 4. Localhost dev websocket (Vite/HMR)
  if (
    request.method !== 'GET' || 
    !url.protocol.startsWith('http') ||
    url.host.includes('supabase.co') ||
    url.pathname.includes('socket.io') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Bypassing service worker for localhost HTML/navigation during dev 
  // to avoid 'Failed to fetch' errors when the server restarts or has hmr issues
  if (url.hostname === 'localhost') {
    return;
  }

  // Active interception disabled to prevent fetch errors
  // event.respondWith(...)
});
