/* ========================================
   SERVICE WORKER - True Offline Capability
   Caches app files and ML model for offline access
   ======================================== */

const CACHE_NAME = 'mood-bot-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './model.js',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
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
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache the response for future use
                        // Only cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed:', error);
                        
                        // Could return a custom offline page here
                        return new Response('Offline - Please check your connection', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
// Register Service Worker for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker: Registered ✅'))
            .catch(err => console.log('Service Worker: Error ❌', err));
    });
}