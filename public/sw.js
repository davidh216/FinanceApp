// Service Worker for FinanceApp
// This file provides offline functionality and caching

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Enable workbox logging in development (commented out since process.env is not available)
// if (process.env.NODE_ENV === 'development') {
//   workbox.setConfig({ debug: true });
// }

// Set cache names
const CACHE_NAME = 'finance-app-v1';
const STATIC_CACHE = 'finance-app-static-v1';
const DYNAMIC_CACHE = 'finance-app-dynamic-v1';
const API_CACHE = 'finance-app-api-v1';

// Cache strategies
const { strategies } = workbox;

// Cache static assets (CSS, JS, images) with cache-first strategy
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new strategies.CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API responses with network-first strategy
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.hostname.includes('firebase'),
  new strategies.NetworkFirst({
    cacheName: API_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// Cache HTML pages with network-first strategy
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new strategies.NetworkFirst({
    cacheName: DYNAMIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache Firebase SDK files
workbox.routing.registerRoute(
  ({ url }) => url.hostname.includes('firebaseapp.com') || url.hostname.includes('googleapis.com'),
  new strategies.StaleWhileRevalidate({
    cacheName: 'firebase-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Handle offline fallback
workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/offline.html');
  }
  return Response.error();
});

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json',
        '/favicon.ico',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from FinanceApp',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FinanceApp', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync any pending transactions or budget updates
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get pending data from IndexedDB
async function getPendingData() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

// Sync pending data with server
async function syncPendingData(pendingData) {
  // This would typically send data to the server
  // For now, just log
  console.log('Syncing pending data:', pendingData);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache update notifications
    console.log('Cache updated:', event.data.payload);
  }
}); 