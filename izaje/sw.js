// Service worker RF03 Izaje: la app abre sin señal.
// Al publicar cambios en index.html, sube VERSION para forzar la actualización.
// Rutas relativas: funciona tanto en la raíz de un dominio como bajo /izaje/.
const VERSION = 'izaje-v4';
const BASE = new URL('./', self.location).href;          // ej: https://x.vercel.app/ o .../izaje/
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'].map(p => new URL(p, BASE).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Solo GET del mismo origen dentro del scope; el panel siempre va a la red (datos en vivo)
  if (e.request.method !== 'GET' || !u.href.startsWith(BASE) || u.pathname.includes('panel')) return;
  const key = e.request.mode === 'navigate' ? BASE : e.request;
  // Red primero (versión nueva si hay señal), caché como respaldo sin señal
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(key, cp)); }
      return r;
    }).catch(() => caches.match(key, { ignoreSearch: true }))
  );
});
