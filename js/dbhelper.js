/**
 * Common database helper functions.
 */
class DBHelper {

    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    static get DATABASE_URL_REVIEW() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/reviews/`;
    }

    static openRestDB(){
        const indexedDB = idb.open('restaurantsIndexedDB', 1, function (upgradeDb) {
            var objectStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id', autoIncrement: true});
            // objectStore.createIndex('by-name', 'name', {unique: false});
        });
        return indexedDB;
    }

    static openReviewDB(){
        const indexedDB = idb.open('reviewsIndexedDB', 1, function (upgradeDb) {
            var objectStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id', autoIncrement: true});
            objectStore.createIndex('by-rest-id', 'restaurant_id', {unique: false});
        });
        return indexedDB;
    }

    static createObjectStoreFunc(name, db, transactionMode){
        let trans = db.transaction('restaurants', transactionMode);
        return trans.objectStore('restaurants');
    }

    static createIndexedDbRestaurants(restaurantsData){

        var restaurant = {
            db: null,
            init: function () {

                if (restaurant.db) {
                    return Promise.resolve(restaurant.db);
                }

                return DBHelper.openRestDB().then(function (db) {
                    return restaurant.db = db;
                });
            },

            restaurantObjectStore: function (transMode) {
                return restaurant.init().then(function (db) {
                    return DBHelper.createObjectStoreFunc('restaurants', db, transMode);
                })
            }
        };

        restaurant.restaurantObjectStore('readwrite').then(function (restaurantObjectStore) {
            restaurantsData.forEach(function (restaurant) {
                restaurantObjectStore.put(restaurant);
            });
        });
    }


    static createIndexedDbReviews(reviewsData){

        var review = {
            db: null,
            init: function () {

                if (review.db) {
                    return Promise.resolve(review.db);
                }
                return DBHelper.openReviewDB().then(function (db) {
                    return review.db = db;
                });
            },

            reviewObjectStore: function (transMode) {
                return review.init().then(function (db) {
                    return DBHelper.createObjectStoreFunc('reviews', db, transMode);
                })
            }
        };

        review.reviewObjectStore('readwrite').then(function (reviewObjectStore) {
            reviewsData.forEach(function (review) {
                reviewObjectStore.put(review);
            });
        });
    }

    static readIndexedDbReviews(callback){
        return DBHelper.openReviewDB().then(function (db) {
            let store = DBHelper.createObjectStoreFunc('reviews', db, 'readonly');
            store.getAll().then(function (reviewsData) {
                callback(reviewsData);
            });
        });
    }

    static fetchRestaurants(callback) {
        console.log('^^^^^^^^^^^^^^^^^^^^');
        fetch(DBHelper.DATABASE_URL, {})
            .then(response => response.json())
            .then(restaurants => {
                restaurants.forEach(restaurant =>{
                    restaurant.small_img = `${restaurant.id}` + '_400.jpg';
                    restaurant.large_img = `${restaurant.id}` + '.jpg';
                });
                DBHelper.createIndexedDbRestaurants(restaurants);
                callback(null, restaurants);
            })
            .catch(err => requestError(err));

        function requestError(err) {
            console.log(err);
            const error = (`Request failed. The error: ${err}`);

            //try to retrieve data from indexeddb
            DBHelper.readIndexedDbRestaurants(function(data){
                callback(null, data);
            });

            callback(error, null);
        }
    }
    static readIndexedDbRestaurants(callback){
        return DBHelper.openRestDB().then(function (db) {
            let store = DBHelper.createObjectStoreFunc('restaurants', db, 'readonly');
            store.getAll().then(function (restaurantsData) {
                callback(restaurantsData);
            });
        });
    }
  /**
   * Un/Favorite restaurant by its ID.
   */
  static setFavoriteRestaurantById(id, fav, callback) {
      fetch(DBHelper.DATABASE_URL + '/' + id, {
          method: 'POST',
          headers : new Headers(),
          body:JSON.stringify({is_favorite: fav})
      }).then((res) => res.json())
          .then((data) =>  console.log(data))
          .catch((err)=>console.log(err))
  }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      console.log('fetchRestaurantByCuisineAndNeighborhood');
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
      console.log('fetchNeighborhoods');
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
      console.log('fetchCuisines');
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
      return (`/img/${restaurant.photograph}` + '.jpg');
      // return (`/mws-restaurant-stage-1/img/${restaurant.photograph}` + '.jpg');
  }

  static imageUrlForRestaurantSrcset(restaurant) {
      return `/img/${restaurant.small_img} 1x, /img/${restaurant.large_img} 2x`;
      // return `/mws-restaurant-stage-1/img/${restaurant.small_img} 1x, /mws-restaurant-stage-1/img/${restaurant.large_img} 2x`;
  }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {

    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

    /**
     * Save Review
     */
    // static saveReview(reviewData , callback) {
    static saveReview(reviewData) {

        fetch(DBHelper.DATABASE_URL_REVIEW, {
            method: 'POST',
            headers : new Headers(),
            body:JSON.stringify({ restaurant_id: reviewData.restId, name: reviewData.name, rating: reviewData.rating, comments: reviewData.comments })
        }).then((res) => res.json())
            .then((data) =>  console.log(data))
            .catch((err)=>console.log(err))
    }

    //Fetch reviews by restaurant id
    static fetchReviewsByRestaurantId(id, callback) {
       fetch(DBHelper.DATABASE_URL_REVIEW + '?restaurant_id=' + id, {})
            .then(response => response.json())
            .then(reviews => {
                reviews.forEach(review =>{
                    let date = review.updatedAt;
                    if (!review.updatedAt){
                        date = review.createdAt;
                    }
                    //set formatted date
                    let formattedDate = new Date(date);
                    let month = formattedDate.getMonth()+1;
                    review.date = formattedDate.getDate() + '.' + month + '.' + formattedDate.getFullYear();
                });
                DBHelper.createIndexedDbReviews(reviews);
                callback(null, reviews);
            })
            .catch(err => requestError(err));


        function requestError(err) {
            console.log(err);
            const error = (`Request failed. The error: ${err}`);
            //todo julia createIndexDB for reviews
            //try to retrieve review data from indexeddb
            DBHelper.readIndexedDbReviews(function(data){
                callback(null, data);
            });

            callback(error, null);
        }

    }

}
