var CACHE = 'restaurant-cache';
var urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js',

];
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                    if (response) {
                        console.log("The response is:" + response);
                        return response;
                    }
                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        var responseToCache = response.clone();
                        caches.open(CACHE)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});