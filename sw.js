var restaurantCache = 'restaurant-cache';
var imageRestaurantCache = 'restaurant-image-cache';
var allCaches = [
    restaurantCache,
    imageRestaurantCache
];
/*var urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/idb.js',
    '/js/main.js',
    '/js/restaurant_info.js',

];*/

var urlsToCache = [
    '/mws-restaurant-stage-1/',
    '/mws-restaurant-stage-1/index.html',
    '/mws-restaurant-stage-1/restaurant.html',
    '/mws-restaurant-stage-1/css/styles.css',
    '/mws-restaurant-stage-1/js/dbhelper.js',
    '/mws-restaurant-stage-1/js/idb.js',
    '/mws-restaurant-stage-1/js/main.js',
    '/mws-restaurant-stage-1/js/restaurant_info.js',

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
    if (requestUrl.pathname.startsWith('/photos/')){
        event.respondWith(servePhoto(event.request));
        return;
    }

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

function servePhoto(request){
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