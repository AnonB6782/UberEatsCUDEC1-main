// sw.js
const staticCacheName = 'site-static-v3';

// Usar rutas relativas sin la barra '/' al inicio
const assets = [
  './',
  './index.html',
  './pages/about.html',
  './pages/contact.html',
  './pages/pedidos.html',
  './js/app.js',
  '/js/ui.js', // ¡Cuidado! Esta línea fallará en GitHub Pages si no es './js/ui.js'
  './js/pedidos.js',
  './js/firebase.js',
  './js/qrcode.min.js',
  './css/styles.css',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Precachando archivos estáticos...');
      return Promise.allSettled(
        assets.map(asset => cache.add(asset).catch(err => console.warn(`No se pudo cachar: ${asset}`, err)))
      );
    })
  );
});