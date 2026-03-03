// 8Track Service Worker
const CACHE_NAME = '8track-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        // Network-first for API calls
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ message: 'You are offline' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503,
                })
            )
        );
    } else {
        // Cache-first for static assets
        event.respondWith(
            caches.match(event.request).then((cached) => cached || fetch(event.request))
        );
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    let data = { title: '8Track', body: 'You have a new notification' };
    try {
        data = event.data.json();
    } catch {
        data.body = event.data?.text() || data.body;
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: data,
        })
    );
});

// Notification click: focus or open app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
