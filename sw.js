const CACHE_NAME = 'cuber-v1';

// Todos los recursos estáticos necesarios para que la app y los íconos funcionen offline
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'css/materialize.min.css',
  'js/materialize.min.js',
  'js/index.js',
  'js/db.js',
  'js/firebase.js',
  'iconos/icon-16x16.png',
  'iconos/icon-192x192.png',
  'iconos/icon-384x384.png',
  'iconos/icon-512x512.png',
  'iconos/icon-192x192-maskable.png',
  'iconos/icon-512x512-maskable.png',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// 1. INSTALACIÓN: Precargar todos los archivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Precachando archivos estáticos...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés antiguas si cambias la versión
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
});

// 3. FETCH: Responder desde la caché si el archivo existe; si no, ir a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});