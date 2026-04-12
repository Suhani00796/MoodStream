/* ========================================
   SERVICE WORKER - Offline Capability
   Caches static app files for offline access
   ======================================== */

const CACHE_NAME = 'mood-bot-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/model.js',
    '/manifest.json',
    '/icon.png',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap'
];

// Optional ML model files (if user downloads them)
const OPTIONAL_MODEL_FILES = [
    '/models/model.json',
    '/models/model_quantized.onnx',
    '/models/tokenizer.json'
];

// Install - cache static assets + optional model files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Cache required static files
                return cache.addAll(STATIC_ASSETS)
                    .then(() => {
                        // Try to cache optional model files (don't fail if not present)
                        return Promise.all(
                            OPTIONAL_MODEL_FILES.map(file =>
                                fetch(file)
                                    .then(response => {
                                        if (response.ok) {
                                            return cache.put(file, response);
                                        }
                                    })
                                    .catch(() => console.log(`Service Worker: Model file not found: ${file}`))
                            )
                        );
                    });
            })
            .catch((error) => console.error('Service Worker: Installation failed:', error))
    );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed:', error);
                        return new Response('Offline - Please check your connection', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({ 'Content-Type': 'text/plain' })
                        });
                    });
            })
    );
});

// Handle skip waiting messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});