var MapLocations = function() {

  this.makelocation = function(name, city, street, zip, marker) {
    var loc = {
      name: name,
      street: street,
      zip: zip,
      city: city,
      latlng: '',
      marker: marker
    };
    return loc;
  };

  // Storage of locations to mark in Knockout JS observable arrays.
  this.locations = ko.observableArray([
    this.makelocation('Town Hall', 'Ohio City', '1909 W. 25th St.', '44113'),
    this.makelocation('West Side Market', 'Cleveland'),
    this.makelocation('Rockwell Automation', 'Mayfield Heights', '1 Allen Bradley Dr.', '44124'),
    this.makelocation('', 'Cleveland', '4101 Clinton Ave.'),
    this.makelocation('Quicken Loans Arena', 'Cleveland', '', '44113'),
    this.makelocation('Cleveland Museum of Art', 'Cleveland Heights'),
    this.makelocation('Willoughby Brewing Company', 'Willoughby'),
    this.makelocation('Lizardville', 'bedford heights')
  ]);
}

var ViewModel = function() {
  // Store our locations in the viewModel.
  this.mapLocations = ko.observable(new MapLocations());
  
  this.mapOptions = {
    disableDefaultUI: false
  };

  // This next line makes `map` a new Google Map JavaScript Object and attaches it to
  // <div id="map">, which is appended as part of an exercise late in the course.
  this.map = new google.maps.Map(document.querySelector('#map'), this.mapOptions);

  this.locationIndex;
  /*
    createMapMarker(placeData) reads Google Places search results to create map pins.
    placeData is the object returned from search results containing information
    about a single location.
    */
  this.createMapMarker = function(placeData) {
    console.log(placeData);
    // The next lines save location data from the search result object to local variables
    var lat = placeData.geometry.location.lat(); // latitude from the place service
    var lon = placeData.geometry.location.lng(); // longitude from the place service
    var name = placeData.formatted_address; // name of the place from the place service
    var bounds = window.mapBounds; // current boundaries of the map window

    console.log(this.map);
    console.log(map);

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: this.map,
      position: placeData.geometry.location,
      title: name
    });
    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.
    var infoWindow = new google.maps.InfoWindow({
      content: name
    });

    // hmmmm, I wonder what this is about...
    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.open(this.map, marker);
    });

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    this.map.fitBounds(bounds);
    // center the map
    this.map.setCenter(bounds.getCenter());
  }.bind(this)
  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  this.mapGenerateMarkerCallback = function(results, status) {
    console.log(status);
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      this.createMapMarker(results[0]);
    }
  }.bind(this)

  function buildLocationString(localePiece, lastpeice) {
    lastpeice = lastpeice || false;
    return ((localePiece == undefined || localePiece.length == 0) ? '' : localePiece + ((lastpeice) ? '' : ", "));
  }
  /*
   pinPoster(locations) takes in the array of locations created by locationFinder()
   and fires off Google place searches for each location
  */
  this.pinNextPoster = function(locations) {
    var service = new google.maps.places.PlacesService(this.map);

    if(this.locationIndex == undefined)
      this.locationIndex = 0;

    if (this.locationIndex < locations.length) {
      var locale = locations[this.locationIndex]
      var localestring = buildLocationString(locale.name) +
        buildLocationString(locale.address) +
        buildLocationString(locale.city) +
        buildLocationString(locale.zip, true);
      var request = {
        query: localestring
      };
      //console.log("request is:" + request.query);
      console.log(this.mapGenerateMarkerCallback);
      service.textSearch(request, this.mapGenerateMarkerCallback);
      this.locationIndex = this.locationIndex + 1;
    }
  };

  // takes a list of locations to pin, in basic form.
  this.pinPoster = function (locations) {
    // Iterates through the array of locations, creates a search object for each location
    for (var place in locations) {
      // Actually searches the Google Maps API for location data and runs the callback
      // function with the search results after each search.
      setTimeout(function() {
        this.pinNextPoster(locations);
      }.bind(this), (500 * place));
    }
  };

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  this.overallLocation = ko.observable({
    center: {
      lat: 41.4822,
      lng: -81.6697
    },
    zoom: 11
  });

  this.initPage = function() {
    this.pinPoster(this.mapLocations().locations());
  };
}

//map = new google.maps.Map(document.querySelector('#map'), this.mapOptions);

google.maps.event.addDomListener(window, 'load', initPageScratch);

function initPageScratch(){
  vm = new ViewModel();
  vm.initPage();
}
// function loadData() {

//     var $body = $('body');
//     var $wikiElem = $('#wikipedia-links');
//     var $nytHeaderElem = $('#nytimes-header');
//     var $nytElem = $('#nytimes-articles');
//     var $greeting = $('#greeting');

//     // clear out old data before new request
//     $wikiElem.text("");
//     $nytElem.text("");

//     // load streetview
//     var inputStreet = $('#street').val();
//     var inputCity = $('#city').val();
//     var address = inputStreet + ', ' + inputCity;
//     $greeting.text('So, you want to live at '+ address+ '?');

//     var NytQueryUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q='+
//         inputCity +'&api-key=ec612587cb260600bc67a560ab4342ef:8:71766984';

//     $.getJSON(NytQueryUrl, function (data){
//         console.log(data);
//         //var JsonData = JSON.parse(data);
//         $nytHeaderElem.text("New York Times Articles for "+inputCity);
//         var articles = data.response.docs
//         var responseSize = data.response.docs.length;
//         for (var i=0; i< responseSize; i++){
//             var article = articles[i];
//             header = article.headline.main;
//            //console.log('ArticleTitles are : ' + header);
//             $nytElem.append('<li class="article">'+
//                 '<a href="'+article.web_url+'">'+article.headline.main+'</a>'+
//                 '<p>'+article.snippet+'</p></li>');
//         }
//     }).error(function(){
//         $nytHeaderElem.text("New York Times Articles Could Not Be Loaded");
//     });

//     var wikiQueryUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
//         inputCity + '&format=json&callback=wikiCallback';

//     $.ajax({
//         url: wikiQueryUrl,
//         dataType: "jsonp",
//         jsonp: "callback",
//         success: function( response ) {
//             var articleList = response[1];
//             for (var i=0; i<articleList.length; i++) {
//                 var wikiArticle = articleList[i];
//                 var wikiArticleUrl = 'https://wikipedia.org/wiki/'+wikiArticle;
//                 $wikiElem.append('<li><a href="'+wikiArticleUrl+'">'+wikiArticle
//                     +'</a></li>');
//             }
//         },
//         error: function(response) {
//             $wikiElem.text("Couldn't load links");
//         }
//     })

//     return false;
// };

// $('#form-container').submit(loadData);