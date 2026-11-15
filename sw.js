// Popeye AI service worker: offline app shell
const VERSION = 'popeye-v1.2.0';
const LIBCACHE = 'lib-cache-v1';
const FACES = Array.from({ length: 42 }, (_, i) => './faces/f' + String(i).padStart(2, '0') + '.jpg');
const SFX = ['tap', 'send', 'recv', 'open', 'close', 'error', 'toggle', 'dice1', 'dice2', 'dice3', 'door_open', 'door_close', 'creak', 'draw', 'slash', 'chop', 'coins', 'book', 'book_open', 'latch', 'cloth', 'step', 'clang', 'leather', 'laser', 'zap', 'power_up', 'power_down', 'beep', 'j_start', 'j_success', 'j_level', 'j_item', 'j_fail', 'j_defeat'].map((n) => './sfx/' + n + '.wav');
const SHELL = ['./', './index.html', './app.js', './style.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
    try { await c.addAll(FACES.concat(SFX)); } catch (err) {}
    try { const l = await caches.open(LIBCACHE); if (!(await l.match(LIB))) await l.add(LIB); } catch (err) {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('popeye-') && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
async function networkFirst(req) {
  const c = await caches.open(VERSION);
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', signal: ctl.signal });
    clearTimeout(t);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    clearTimeout(t);
    const hit = await c.match(req, { ignoreSearch: true });
    return hit || new Response('Offline', { status: 503 });
  }
}
async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
  return res;
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (/\/(faces|sfx)\//.test(url.pathname)) { e.respondWith(cacheFirst(req, VERSION)); return; }
    e.respondWith(networkFirst(req));
    return;
  }
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'tessdata.projectnaptha.com') e.respondWith(cacheFirst(req, LIBCACHE));
});
