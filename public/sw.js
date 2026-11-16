const STATIC_CACHE = 'bible-tracker-static-v2';
const OFFLINE_PREFIX = 'bible-tracker-offline-v2-';
const BASE_FILES = ['/offline.html', '/pwa-icon.svg', '/pwa-icon-maskable.svg'];
let preparing;

function prepareShell() {
    if (preparing) return preparing;
    preparing = (async () => {
        const response = await fetch('/build/manifest.json', {
            cache: 'reload',
            credentials: 'omit',
        });
        if (!response.ok) throw new Error('Build manifest unavailable');
        const manifest = await response.json();
        const entry = manifest['resources/js/offline-app.tsx'];
        if (!entry?.file) throw new Error('Offline reader unavailable');
        const cacheName =
            OFFLINE_PREFIX + entry.file.replace(/[^a-z0-9.-]/gi, '_');
        const cache = await caches.open(cacheName);
        const visited = new Set();
        async function cacheAsset(path) {
            const url = new URL('/build/' + path, self.location.origin);
            if (
                url.origin !== self.location.origin ||
                !url.pathname.startsWith('/build/')
            )
                throw new Error('Invalid asset path');
            if (visited.has(url.href)) return;
            visited.add(url.href);
            const asset = await fetch(url, {
                credentials: 'omit',
                cache: 'reload',
            });
            if (!asset.ok) throw new Error('Asset unavailable');
            if (url.pathname.endsWith('.css')) {
                const css = await asset.clone().text();
                const fonts = [
                    ...css.matchAll(/url\(["']?([^"')]+)["']?\)/g),
                ].map((match) => new URL(match[1], url));
                for (const font of fonts)
                    if (
                        font.origin === self.location.origin &&
                        font.pathname.startsWith('/build/')
                    )
                        await cacheAsset(font.pathname.slice('/build/'.length));
            }
            await cache.put(url, asset);
        }
        const entries = new Set();
        async function cacheEntry(key) {
            if (entries.has(key)) return;
            entries.add(key);
            const item = manifest[key];
            if (!item) throw new Error('Missing entry');
            await cacheAsset(item.file);
            for (const file of [...(item.css || []), ...(item.assets || [])])
                await cacheAsset(file);
            for (const dependency of item.imports || [])
                await cacheEntry(dependency);
        }
        await cacheEntry('resources/js/offline-app.tsx');
        await cacheEntry('resources/css/app.css');
        const shell = await fetch('/offline', {
            credentials: 'omit',
            cache: 'reload',
        });
        const shellHtml = await shell.clone().text();
        if (
            !shell.ok ||
            !shellHtml.includes('id="offline-app"') ||
            !shellHtml.includes(`/build/${entry.file}`)
        )
            throw new Error('Invalid shell');
        await cache.put('/offline', shell);
        for (const key of await caches.keys())
            if (key.startsWith(OFFLINE_PREFIX) && key !== cacheName)
                await caches.delete(key);
    })().finally(() => {
        preparing = undefined;
    });
    return preparing;
}
async function offlineShell() {
    for (const key of (await caches.keys())
        .filter((key) => key.startsWith(OFFLINE_PREFIX))
        .reverse()) {
        const response = await (await caches.open(key)).match('/offline');
        if (response) return response;
    }
    return (
        (await (await caches.open(STATIC_CACHE)).match('/offline.html')) ||
        Response.error()
    );
}
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            await (await caches.open(STATIC_CACHE)).addAll(BASE_FILES);
            await prepareShell().catch(() => undefined);
            await self.skipWaiting();
        })(),
    );
});
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            for (const key of await caches.keys())
                if (
                    key.startsWith('bible-tracker-static-') &&
                    key !== STATIC_CACHE
                )
                    await caches.delete(key);
            await self.clients.claim();
        })(),
    );
});
self.addEventListener('message', (event) => {
    if (event.data?.type === 'PREPARE_OFFLINE')
        event.waitUntil(
            prepareShell()
                .then(() => event.ports[0]?.postMessage({ ok: true }))
                .catch(() => event.ports[0]?.postMessage({ ok: false })),
        );
});
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) =>
                    response.status >= 500 ? offlineShell() : response,
                )
                .catch(offlineShell),
        );
        return;
    }
    if (request.headers.has('X-Inertia')) {
        event.respondWith(
            fetch(request).catch(() => {
                const match = url.pathname.match(
                    /^\/bible\/((?:[1-3])?[A-Z]{2,3})\/(\d+)$/,
                );
                const target = new URL('/offline', url.origin);
                if (match) {
                    target.searchParams.set('book', match[1]);
                    target.searchParams.set('chapter', match[2]);
                }
                if (url.searchParams.has('translation'))
                    target.searchParams.set(
                        'translation',
                        url.searchParams.get('translation'),
                    );
                return new Response('', {
                    status: 409,
                    headers: {
                        'X-Inertia-Location': target.pathname + target.search,
                    },
                });
            }),
        );
        return;
    }
    // Account HTML, JSON, avatars and other private responses are never cached.
    if (
        !url.pathname.startsWith('/build/') &&
        !BASE_FILES.includes(url.pathname)
    )
        return;
    event.respondWith(
        fetch(request)
            .then(async (response) => {
                if (response.ok)
                    await (
                        await caches.open(STATIC_CACHE)
                    )
                        .put(request, response.clone())
                        .catch(() => undefined);
                return response;
            })
            .catch(
                async () => (await caches.match(request)) || Response.error(),
            ),
    );
});
