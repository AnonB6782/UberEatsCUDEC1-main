const staticCacheName = 'site-static-v2';
const assets = [
  '/',
  '/index.html',
  '/pages/about.html',
  '/pages/contact.html',
  '/pages/pedidos.html',
  '/js/app.js',
  '/js/ui.js',
  '/js/pedidos.js',
  '/js/firebase.js',
  '/js/qrcode.min.js',
  '/css/styles.css',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Evento de instalación resiliente
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Precachando archivos estáticos...');
      // Intentar cachar recurso por recurso para evitar colapsos por un 404
      return Promise.allSettled(
        assets.map(asset => cache.add(asset).catch(err => console.warn(`No se pudo cachar: ${asset}`, err)))
      );
    })
  );
});