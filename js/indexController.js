// var indexedDB = window.indexedDB;
var openDb = idb.open('restaurantsDataBase', 1, function(upgradeDb){
    var objectStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    objectStore.createIndex('by-name', 'name', {unique: false});
    objectStore.transaction.oncomplete = function(event) {
        var restaurantObjectStore = db.transaction("restaurants", "readwrite").objectStore("restaurants");
        restaurantData.forEach(function(restaurant) {
            restaurantObjectStore.add(restaurant);
        });
    };

});
/*
openDb.onsuccess = function(event){
    console.log(openDb.result);
    console.log(event.target.result);

    var db = openDb.result;

    var trans = db.transaction("myObjectStore", "readwrite");
    var store = trans.objectStore("myObjectStore");
    var index = store.index("NameIndex");
}*/
openDb.onerror = function(){
    console.log('There was an error: ' + openDb.errorCode);
}
