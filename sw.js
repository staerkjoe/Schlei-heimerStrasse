/**
 * WG-Kasse Schleißheimer Straße - Service Worker
 * Ermöglicht schnelles Laden und Offline-PWA-Support
 */

const CACHE_NAME = 'wg-kasse-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Nicht für Google Apps Script POST Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  // Für Apps Script URLs immer direkt ins Netz
  if (event.request.url.includes('script.google.com') || event.request.url.includes('script.googleusercontent.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Cache First, dann im Hintergrund aktualisieren falls möglich
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* offline */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
