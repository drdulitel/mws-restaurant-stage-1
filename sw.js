var restaurantCache = 'restaurant-cache';
var imageRestaurantCache = 'restaurant-image-cache';
var allCaches = [
    restaurantCache,
    imageRestaurantCache
];

var urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles_restaurant.css',
    '/css/styles_restaurants.css',
    '/css/styles_media_max350.css',
    '/css/styles_media_min351max600.css',
    '/css/styles_media_min601max700.css',
    '/css/styles_media_min701max900.css',
    '/css/styles_media_min901.css',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js',
];


self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(restaurantCache)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    var requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.startsWith('/img/')){
        event.respondWith(serveImg(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                    if (response) {
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
                        caches.open(restaurantCache)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

function serveImg(request){
    var storageUrl = request.url.replace(/-\d+px\.jpg$/,'');
    return caches.open(imageRestaurantCache).then(function(cache){
        return caches.match(storageUrl).then(function(response){
           if  (response) return response;

           return fetch(request).then(function(networkResponse){
               cache.put(storageUrl, networkResponse.clone());
               return networkResponse;
           });
        });
    });
}

/*
self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
            return cacheName.startsWith('assets-') && !CachesAll.includes(cacheName);
        }).map(function (cacheName) {
            return allCaches['delete'](cacheName);
        }));
    }));
});*/
