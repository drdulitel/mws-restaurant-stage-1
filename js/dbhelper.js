/**
 * Common database helper functions.
 */
class DBHelper {

    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    static openDB(){
        const indexedDB = idb.open('restaurantsIndexedDB', 1, function (upgradeDb) {
            var objectStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id', autoIncrement: true});
            // objectStore.createIndex('by-name', 'name', {unique: false});
        });
        return indexedDB;
    }

    static createObjectStore(db, transactionMode){
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

                return DBHelper.openDB().then(function (db) {
                    return restaurant.db = db;
                });
            },

            restaurantObjectStore: function (transMode) {
                return restaurant.init().then(function (db) {
                    return DBHelper.createObjectStore(db, transMode);
                })
            }
        };

        restaurant.restaurantObjectStore('readwrite').then(function (restaurantObjectStore) {
            restaurantsData.forEach(function (restaurant) {
                restaurantObjectStore.put(restaurant);
            });
        });


    }
    static readIndexedDbRestaurants(callback){
        return DBHelper.openDB().then(function (db) {
            let store = DBHelper.createObjectStore(db, 'readonly');
            store.getAll().then(function (restaurantsData) {
                callback(restaurantsData);
            });
        });
    }

    static fetchRestaurants(callback) {

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
     * Save
     */
    static saveReview(id, review, reviewerName , callback) {
        fetch(DBHelper.DATABASE_URL + '/' + id, {
            method: 'POST',
            headers : new Headers(),
            body:JSON.stringify({is_favorite: fav})
        }).then((res) => res.json())
            .then((data) =>  console.log(data))
            .catch((err)=>console.log(err))
    }

}
