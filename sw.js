self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Permite que la app cargue online sin bloquear las peticiones
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
