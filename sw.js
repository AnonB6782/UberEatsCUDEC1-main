self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('sw-cache').then(function(cache) {
            return cache.add('index.html');
        })
    );
});