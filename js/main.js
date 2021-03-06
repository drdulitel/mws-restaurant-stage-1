let restaurants,
    neighborhoods,
    cuisines
var map
var markers = []

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  self.updatedRest = true;
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
 addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'lazyimg restaurant-img';
  // image.srcset = DBHelper.imageUrlForRestaurantSrcset(restaurant);
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);

  image.src = "img/placeholder.jpg";
  image.dataset.srcset = DBHelper.imageUrlForRestaurantSrcset(restaurant);
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Picture of '+restaurant.name+' restaurant';
  li.append(image);

  const favImgWrapper = document.createElement('div');
  const favImg = document.createElement('img');
  favImg.className = 'star';
  var fav = restaurant.is_favorite;
  (fav) ? setFavoriteResImg(favImg) : unsetFavoriteResImg(favImg);
  //favImg.value = restaurant.id;
  favImg.dataset.fav = fav;
  favImg.onclick = function(){
      fav = !fav;
      saveFavoriteInDb(restaurant.id, fav);
      (fav) ? setFavoriteResImg(favImg) : unsetFavoriteResImg(favImg);
      favImg.dataset.fav = fav;
  };
  favImgWrapper.append(favImg);
  li.append(favImgWrapper);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label','View Details of '+restaurant.name+' restaurant');
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li
}
function saveFavoriteInDb(favoriteRestId, fav){
    DBHelper.setFavoriteRestaurantById(favoriteRestId, fav, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
            console.error(error);
            return;
        }
        callback(null, restaurant)
    });
}

function setFavoriteResImg(imgElement){
    imgElement.src = 'img/star_fav.png';
    imgElement.alt = 'My favorite restaurant';
}
function unsetFavoriteResImg(imgElement){
    imgElement.src = 'img/star_unfav.png';
    imgElement.alt = 'Choose me as favorite restaurant';
}
/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

self.addEventListener('fetch', function(event){
});

//swap between the static google map to the interactive map
const swap_map = () => {
    if (document.getElementById('map').style.display !== 'block')
    {
        document.getElementById('map').style.display = 'block';
        document.getElementById('static_map').style.display = 'none';
    }
}

document.onreadystatechange = function() {
    if(document.readyState === "complete") {
        var lazyRestImages = [].slice.call(document.querySelectorAll("img.lazyimg"));
        if ("IntersectionObserver" in window) {
            let lazyRestImageObserver = new IntersectionObserver(function (entries, observer) {
                  entries.forEach(function (entry) {
                      if (entry.isIntersecting) {
                          let lazyRestImage = entry.target;
                          if (lazyRestImage.dataset.src) lazyRestImage.src = lazyRestImage.dataset.src;
                          if (lazyRestImage.dataset.srcset) lazyRestImage.srcset = lazyRestImage.dataset.srcset;
                          lazyRestImage.classList.remove("lazyimg");
                          lazyRestImageObserver.unobserve(lazyRestImage);
                      }
                  });
              });
            lazyRestImages.forEach(function (lazyRestImage) {
                lazyRestImageObserver.observe(lazyRestImage);
            });
        }
    }
}