// Popeye AI service worker: keeps the app usable offline.
// Model files are cached separately by WebLLM and are never touched here.
const VERSION = 'popeye-v1.1.1';
const SHELL = ['./', './index.html', './app.js', './style.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
    try { await cache.add(LIB); } catch (err) { /* cached on first use instead */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('popeye-') && key !== VERSION) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(req));
  }
});

// Online: always fetch the newest app files (so updates arrive on the first open).
// Offline or very slow network: fall back to the cached copy.
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(req.url, { signal: ctrl.signal, cache: 'no-cache', credentials: 'same-origin' });
    clearTimeout(timer);
    if (res && res.ok) { cache.put(req, res.clone()); return res; }
    const hit = await cache.match(req, { ignoreSearch: true });
    return hit || res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    return hit || new Response('Offline, and this page is not cached yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (hit) {
    event.waitUntil(network);
    return hit;
  }
  const res = await network;
  return res || new Response('Offline, and this page is not cached yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

