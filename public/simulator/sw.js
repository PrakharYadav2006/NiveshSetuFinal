// Offline support. Network first (so updates always show), cache as the fallback.
// AI calls are never cached.
const VERSION = 'niveshsetu-sim-v4';
const SHELL = ['./', 'index.html', 'app.js', 'data.js', 'engine.js', 'metrics.js', 'coach.js', 'alerts.js', 'i18n.js', 'chart.js', 'voice.js',
  '../shared/ui.css', '../shared/safety.js', '../shared/theme.js', '../shared/brand.js', '../shared/listen.js', '../shared/gate.js', '../shared/reasoning.js', '../shared/profile.js', '../shared/tips.js', '../shared/lessons.js', '../shared/lessons.sizes.json',
  'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(SHELL.map((u) => c.add(u).catch(() => {})));
    try { const m = await (await fetch('audio/manifest.json')).json(); await Promise.all(Object.values(m).map((f) => c.add('audio/' + f).catch(() => {}))); } catch {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Delete every older cache of this app (including caches from before the rename).
    for (const k of await caches.keys()) if (k !== VERSION && !k.startsWith('niveshsetu-demo')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      if (r.ok) (await caches.open(VERSION)).put(e.request, r.clone());
      return r;
    } catch {
      return (await caches.match(e.request)) || Response.error();
    }
  })());
});
