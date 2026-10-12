const CACHE_NAME = 'bible-tracker-static-v1';
const PRECACHE_URLS = ['/offline.html', '/pwa-icon.svg', '/pwa-icon-maskable.svg'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith('bible-tracker-static-') && key !== CACHE_NAME)
                    .map((key) => caches.delete(key)),
            ),
        ),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return (await cache.match('/offline.html')) || Response.error();
            }),
        );
        return;
    }

    const isStaticAsset =
        ['script', 'style', 'image', 'font'].includes(request.destination) ||
        url.pathname.startsWith('/build/');

    if (!isStaticAsset) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return (await cache.match(request)) || Response.error();
            }),
    );
});
