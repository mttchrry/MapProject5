// initial data. 
var MapLocations = function() {

  this.makelocation = function(name, city, street, zip, marker) {
    var loc = {
      name: name,
      street: street,
      zip: zip,
      city: city,
      latlng: '',
      marker: marker, 
      visible: true
    };
    return loc;
  };

  // Storage of locations to mark in Knockout JS observable arrays.
  this.locations = ko.observableArray([
    this.makelocation('Town Hall', 'Ohio City', '1909 W. 25th St.', '44113'),
    this.makelocation('West Side Market', 'Cleveland'),
    this.makelocation('Rockwell Automation', 'Mayfield Heights', '1 Allen Bradley Dr.', '44124'),
    this.makelocation('', 'Cleveland, OH', '4101 Clinton Ave.', '44113'),
    this.makelocation('Quicken Loans Arena', 'Cleveland', '', '44113'),
    this.makelocation('Cleveland Museum of Art', 'Cleveland Heights'),
    this.makelocation('Willoughby Brewing Company', 'Willoughby'),
    this.makelocation('Lizardville', 'bedford heights'),
    this.makelocation('16-bit arcade', 'lakewood OH')
  ]);
}

// The main view model for the entire Map project. 
var ViewModel = function() {
  var self = this;
  // Store our locations in the viewModel.
  self.mapLocations = ko.observable(new MapLocations());
  
  self.mapOptions = {
    disableDefaultUI: true,
    scrollwheel: false
  };

  self.currentLocationWikis = ko.observableArray([]);
  self.currentLocationYelp = ko.observable({});

  // This next line makes `map` a new Google Map JavaScript Object and attaches it to
  // <div id="map">, which is appended as part of an exercise late in the course.
  self.map = new google.maps.Map(document.querySelector('#map'), self.mapOptions);

  self.pins = ko.observableArray([]);
  self.locationIndex;

  self.selectedPin;

  self.showMarkerInfo = function(pin){
    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.
    var map = pin.infoWindow.getMap();

    if(map == null || map == "undefined")
    {
      if(self.selectedPin != null || self.selectedPin != undefined)
        self.selectedPin.infoWindow.close();
      pin.infoWindow.open(self.map, pin.marker);
      self.selectedPin = pin;
    }
    else
    {
      pin.infoWindow.close();
      self.selectedPin = undefined;
    }

    self.loadData(pin);
  };

  // we have to give it access to the map object, so that
  // it can register and de-register itself
  var Pin = function Pin(map, name, lat, lon, address) {
    //var marker;
    var selfPin = this;
    this.name = ko.observable(name);
    this.lat = ko.observable(lat);
    this.lon = ko.observable(lon);
    this.address = ko.observable(address);

    selfPin.marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lon),
      animation: google.maps.Animation.DROP
    });

    this.isVisible = ko.observable(false);

    this.isVisible.subscribe(function(currentState) {
      if (currentState) {
        selfPin.marker.setMap(map);
      } else {
        selfPin.marker.setMap(null);
      }
    });
    // initialize markers as visible.
    this.isVisible(true);

    selfPin.infoWindow = new google.maps.InfoWindow({
      content: name
    });
    // Show Info Listener;
    google.maps.event.addListener(selfPin.marker, 'click', function() {
      self.showMarkerInfo(selfPin);
    });
  }

  /*createMapMarker(placeData) reads Google Places search results to create map pins.
    placeData is the object returned from search results containing information
    about a single location.
    */
  self.createMapMarker = function(placeData) {
    // The next lines save location data from the search result object to local variables
    var lat = placeData.geometry.location.lat(); // latitude from the place service
    var lon = placeData.geometry.location.lng(); // longitude from the place service
    var name = placeData.name; // name of the place from the place service
    var address = placeData.formatted_address;
    var bounds = window.mapBounds; // current boundaries of the map window

    var currentPin = ko.observable(new Pin(self.map, name, lat, lon, address));
    console.log(placeData);
    self.pins.push(currentPin);
    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));

    // fit the map to the new marker
    self.map.fitBounds(bounds);
    // center the map
    self.map.setCenter(bounds.getCenter());
  };

  
  // callback(results, status) makes sure the search returned results for a location.
  // If so, it creates a new map marker for that location.
  self.mapGenerateMarkerCallback = function(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      self.createMapMarker(results[0]);
    }
  };

  // format the location information into a query-able string
  function buildLocationString(localePiece, lastpeice) {
    lastpeice = lastpeice || false;
    return ((localePiece == undefined || localePiece.length == 0) ? '' : localePiece + ((lastpeice) ? '' : ", "));
  }

  // need map services to do the search for locations. 
  var mapService = new google.maps.places.PlacesService(self.map);

  // pin one poster at a time. 
  self.pinNextPoster = function(locations) {  

    if(self.locationIndex == undefined)
      self.locationIndex = 0;

    if (self.locationIndex < locations.length) {
      var locale = locations[self.locationIndex]
      var localestring = buildLocationString(locale.name) +
        buildLocationString(locale.street) +
        buildLocationString(locale.city) +
        buildLocationString(locale.zip, true);
      var request = {
        query: localestring
      };
      mapService.textSearch(request, self.mapGenerateMarkerCallback);
      self.locationIndex = self.locationIndex + 1;
    }
  };

  // takes a list of locations to pin, in basic form.
  self.pinPoster = function (locations) {
    // Iterates through the array of locations, creates a search object for each location
    for (var place in locations) {
      // Actually searches the Google Maps API for location data and runs the callback
      // function with the search results after each search.
      setTimeout(function() {
        self.pinNextPoster(locations);
      }, (10));
    }
  };

  self.filterString = ko.observable('');

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  // starting method to pin all posters on load
  self.initPage = function() {
    self.pinPoster(self.mapLocations().locations());
  };

  // keep a computed list of the filtered items. 
  self.filteredPins= ko.computed(function(){
    var filterPins = self.pins();
    return ko.utils.arrayFilter(filterPins, function(thisPin) {
      return thisPin().isVisible();
    });
  });

  // set the visibility on the markers to match the filter. 
  self.filterMarkers = function() {
    var search = self.filterString().toLowerCase();
    return ko.utils.arrayFilter(self.pins(), function (pin) {
        var match = pin().name().toLowerCase().indexOf(search) >= 0;
        if(pin().address() != undefined)
          match = match || pin().address().toLowerCase().indexOf(search) >= 0;
        pin().isVisible(match); // maps API hide call
        return match;
    });
  };

  // Gets the Wiki and Yelp API calls and sets the data on the observabled for the 
  // UI to consume.
  self.loadData = function(pin) {
    //clear previous load data
    self.currentLocationWikis([]);
    
    // load streetview
    var searchName = pin.name();

    // Need to set up OATH stuff to request data from the Yelp API. 
    var auth = {
      //
      // Update with your auth tokens.
      //
      consumerKey: "nNMOhr2KqE44OV4SQUpjoQ",
      consumerSecret: "Q7tHS8DLPnKeuij-Dn8_D2cl45M",
      accessToken: "r3I86GuOVVIL-waceeBi_hM97rPLQp-I",
      // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
      // You wouldn't actually want to expose your access token secret like this in a real application.
      accessTokenSecret: "Tm9zngdcBUaGH8E3FwnfQ5hnBrI",
      serviceProvider: {
        signatureMethod: "HMAC-SHA1"
      }
    };
    var terms = searchName;
    var near = 'Cleveland';
    var accessor = {
      consumerSecret: auth.consumerSecret,
      tokenSecret: auth.accessTokenSecret
    };
    parameters = [];
    parameters.push(['term', terms]);
    parameters.push(['location', near]);
    parameters.push(['callback', 'cb']);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
    var message = {
      'action': 'http://api.yelp.com/v2/search',
      'method': 'GET',
      'parameters': parameters
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
    console.log(parameterMap);
    $.ajax({
      'url': message.action,
      'data': parameterMap,
      'cache': true,
      'dataType': 'jsonp',
      'jsonpCallback': 'cb',
      'success': function(data, textStats, XMLHttpRequest) {
            // we got data! Save it to the observable.
            var businesses = data.businesses;
            if(businesses.length > 0) 
                self.currentLocationYelp(businesses[0]);
            else
              self.currentLocationYelp({name: 'No Business Found'});
            console.log(self.currentLocationYelp());
        }
    })
    .fail(function() {
      self.currentLocationYelp({name: "Couldn't load links"});
      console.log("Failure = " + self.currentLocationYelp());
    })

    // simple wiki API query, much more user friendly that OATH.
    var wikiQueryUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
        searchName + '&format=json&callback=wikiCallback';
    $.ajax({
        url: wikiQueryUrl,
        dataType: "jsonp",
        jsonp: "callback",
        success: function( response ) {

            var articleList = response[1];
            for (var i=0; i<articleList.length && i <3; i++) {
                var wikiArticle = articleList[i];
                var wikiArticleUrl = 'https://wikipedia.org/wiki/'+wikiArticle;
                self.currentLocationWikis.push({
                  url: ko.observable(wikiArticleUrl),
                  title: ko.observable(wikiArticle)
                });
            }
        }
    })
    .fail(function() {
      var errorTitle = {
        title: ko.observable("Couldn't Load Links"),
        url: ko.observable("")
      };
      self.currentLocationWikis.push(errorTitle);
    })
    }
};

google.maps.event.addDomListener(window, 'load', initPageScratch);

function initPageScratch(){
  var vm = new ViewModel();
  vm.initPage();
  ko.applyBindings(vm);
}
