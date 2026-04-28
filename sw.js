// Sphere Service Worker v1.0
// Caches the app shell for offline use

const CACHE_NAME = 'sphere-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache all core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', function(e) {
  // Only handle GET requests
  if(e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if(cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(e.request).then(function(response) {
        // Only cache valid responses
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var toCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, toCache);
        });
        return response;
      }).catch(function() {
        // Network failed and not in cache — return offline page
        return caches.match('/index.html');
      });
    })
  );
});
