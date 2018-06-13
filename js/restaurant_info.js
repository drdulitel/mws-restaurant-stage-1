let restaurant;
let reviews;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
        self.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: restaurant.latlng,
            scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();

      callback(null, restaurant)
    });
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchReviewFromRestaurantId = (callback) => {
    if (self.reviews) { // reviews already fetched!
        callback(null, self.reviews)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } else {
        DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
            self.reviews = reviews;
           if (!reviews) {
                console.error(error);
                return;
            }
            fillReviewsHTML();
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.srcset = DBHelper.imageUrlForRestaurantSrcset(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Picture of '+restaurant.name+' restaurant';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // indicate favorite button
    favoriteToggle();

  // fetch and fill reviews
   fetchReviewFromRestaurantId();
};

/**
 * Like or Unlike restaurant
 */
favoriteToggle = (favoriteRest = self.restaurant) =>{
    let imgElement = document.getElementById('star');
    var fav = favoriteRest.is_favorite;
    (fav) ? setFavoriteResImg(imgElement) : unsetFavoriteResImg(imgElement);

    imgElement.onclick = function(event){
      fav = !fav;
        saveFavoriteInDb(favoriteRest.id, fav);
        (fav) ? setFavoriteResImg(imgElement) : unsetFavoriteResImg(imgElement);
    };
};
function setFavoriteResImg(imgElement){
    imgElement.src = 'img/star_fav.png';
    imgElement.alt = 'My favorite restaurant';
}
function unsetFavoriteResImg(imgElement){
    imgElement.src = 'img/star_unfav.png';
    imgElement.alt = 'Choose me as favorite restaurant';
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
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}
/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb').children[0];
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const swap_map = () => {
    if (document.getElementById('map').style.display !== 'block')
    {
        document.getElementById('map').style.display = 'block';
        document.getElementById('static_map').style.display = 'none';
    }
};

function submitReview(){
  //todo julia reverse the reviews so the latest will be shown first
  //julia here
  let name = document.getElementById("name").value;
  let review = document.getElementById("reviewText").value;
  let selection = document.getElementById("rating");
  let rating = selection.options[selection.selectedIndex].value;

  let reviewData = {name: name, rating: rating, comments: review, restId: self.restaurant.id}
  if (name != "" && review != ""){

      var date = new Date(Date.now());
      let month = date.getMonth()+1;
      reviewData.date = date.getDate() + '.' + month + '.' + date.getFullYear();

      DBHelper.saveReview(reviewData);

      const container = document.getElementById('reviews-container');
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(reviewData));
      container.appendChild(ul);
  }
}