// Service worker RF03 Izaje: la app abre sin señal.
// Al publicar cambios en index.html, sube VERSION para forzar la actualización.
const VERSION = 'izaje-v1';
const SHELL = ['/izaje/', '/izaje/manifest.webmanifest', '/izaje/icon-192.png', '/izaje/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Solo GET del mismo origen bajo /izaje/; el panel siempre va a la red (datos en vivo)
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/izaje') || u.pathname.includes('panel')) return;
  // Red primero (versión nueva si hay señal), caché como respaldo sin señal
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request.mode === 'navigate' ? '/izaje/' : e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request.mode === 'navigate' ? '/izaje/' : e.request, { ignoreSearch: true }))
  );
});
