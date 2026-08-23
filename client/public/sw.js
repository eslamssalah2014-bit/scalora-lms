/**
 * Scalora LMS - Progressive Web App Service Worker
 * Cache Strategy: Strict Static Assets Only
 *
 * CRITICAL RULE:
 * Dynamic data (API responses, Messages, Notifications, Feed, Group Chat,
 * Profile, Courses, and Supabase Realtime) must NEVER be cached.
 */

const CACHE_NAME = 'scalora-static-v2';

// ONLY immutable static shell assets are precached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/scalora-logo.png',
  '/scalora-icon-transparent.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-512x512-maskable.png',
  '/apple-touch-icon.png',
];

// STRICT EXCLUSION LIST: Never intercept or cache these paths
const EXCLUDED_PATTERNS = [
  '/api/',
  '/api/messages',
  '/api/notifications',
  '/api/community',
  '/api/community/chat',
  '/api/realtime',
  '/api/courses',
  '/api/enrollments',
  '/api/auth',
  '/api/trainers',
  '/api/admin',
  '/api/payments',
  '/api/progress',
  '/api/quizzes',
  '/realtime',
  'supabase.co',
];

// 1. Install Event: Precache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clear all legacy/stale caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Strict filtering
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // RULE A: Pass-through non-HTTP requests and non-GET mutations immediately
  if (!url.startsWith('http') || request.method !== 'GET') {
    return;
  }

  // RULE B: HARD BYPASS for all API endpoints, Realtime streams, and Supabase connections
  // The Service Worker does NOT touch or cache any dynamic responses
  const isExcluded = EXCLUDED_PATTERNS.some((pattern) => url.includes(pattern));
  if (isExcluded) {
    return; // Let browser make live network request directly
  }

  // RULE C: HTML Page Navigation (Single-Page App Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        // Only if network fails completely, return cached index.html or offline fallback
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;
        const offlinePage = await caches.match('/offline.html');
        return (
          offlinePage ||
          new Response('You are offline. Please reconnect to continue.', {
            headers: { 'Content-Type': 'text/plain' },
          })
        );
      })
    );
    return;
  }

  // RULE D: Static Assets (Stylesheets, JavaScript bundles, Web Fonts, Images)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.endsWith('.png') ||
    url.endsWith('.jpg') ||
    url.endsWith('.svg') ||
    url.endsWith('.webp') ||
    url.endsWith('.woff2') ||
    url.endsWith('.css') ||
    url.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache while fetching fresh asset in background (Stale While Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // RULE E: All other requests pass directly to the network
});

// 4. Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'Scalora LMS',
    body: 'You have a new update in your courses or community.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open Scalora' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
