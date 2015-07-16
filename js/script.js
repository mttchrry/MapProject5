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

var currentLocationWikis = ko.observableArray([]);

var ViewModel = function() {
  var self = this;
  // Store our locations in the viewModel.
  self.mapLocations = ko.observable(new MapLocations());
  
  self.mapOptions = {
    disableDefaultUI: false
  };

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

    this.isVisible(true);

    selfPin.infoWindow = new google.maps.InfoWindow({
      content: name
    });
    // Show Info Listener;
    google.maps.event.addListener(selfPin.marker, 'click', function() {
      self.showMarkerInfo(selfPin);
      //infoWindow.open(map, selfPin.marker);
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
    console.log(currentPin);
    console.log(currentPin());
    self.pins.push(currentPin);
    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));

    // fit the map to the new marker
    self.map.fitBounds(bounds);
    // center the map
    self.map.setCenter(bounds.getCenter());
  };
  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  self.mapGenerateMarkerCallback = function(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      self.createMapMarker(results[0]);
    }
  };

  function buildLocationString(localePiece, lastpeice) {
    lastpeice = lastpeice || false;
    return ((localePiece == undefined || localePiece.length == 0) ? '' : localePiece + ((lastpeice) ? '' : ", "));
  }
  /*
   pinPoster(locations) takes in the array of locations created by locationFinder()
   and fires off Google place searches for each location
  */
  var mapService = new google.maps.places.PlacesService(self.map);

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
      //console.log(localestring);
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

  self.overallLocation = ko.observable({
    center: {
      lat: 41.4822,
      lng: -81.6697
    },
    zoom: 11
  });

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
    //console.log('search is '+ search);
    console.log(self.pins());
    return ko.utils.arrayFilter(self.pins(), function (pin) {
        var match = pin().name().toLowerCase().indexOf(search) >= 0;
        if(pin().address() != undefined)
          match = match || pin().address().toLowerCase().indexOf(search) >= 0;
        pin().isVisible(match); // maps API hide call
        return match;
    });
  };

  self.loadData = function(pin) {
    //clear previous load data
    currentLocationWikis([]);
    // load streetview
    var searchName = pin.name();

    //var NytQueryUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q='+
    //    inputCity +'&api-key=ec612587cb260600bc67a560ab4342ef:8:71766984';

    // $.getJSON(NytQueryUrl, function (data){
    //     console.log(data);
    //     //var JsonData = JSON.parse(data);
    //     $nytHeaderElem.text("New York Times Articles for "+inputCity);
    //     var articles = data.response.docs
    //     var responseSize = data.response.docs.length;
    //     for (var i=0; i< responseSize; i++){
    //         var article = articles[i];
    //         header = article.headline.main;
    //        //console.log('ArticleTitles are : ' + header);
    //         $nytElem.append('<li class="article">'+
    //             '<a href="'+article.web_url+'">'+article.headline.main+'</a>'+
    //             '<p>'+article.snippet+'</p></li>');
    //     }
    // }).error(function(){
    //     $nytHeaderElem.text("New York Times Articles Could Not Be Loaded");
    // });

    var wikiQueryUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
        searchName + '&format=json&callback=wikiCallback';
    console.log(wikiQueryUrl);
    $.ajax({
        url: wikiQueryUrl,
        dataType: "jsonp",
        jsonp: "callback",
        success: function( response ) {

            var articleList = response[1];
            console.log("success = " + articleList);
            for (var i=0; i<articleList.length; i++) {
                var wikiArticle = articleList[i];
                var wikiArticleUrl = 'https://wikipedia.org/wiki/'+wikiArticle;
                currentLocationWikis.push({
                  url: ko.observable(wikiArticleUrl),
                  title: ko.observable(wikiArticle)
                });
            }
            console.log(currentLocationWikis());
        }
        //error: function(response) {
        //    currentLocationWikis.push("Couldn't load links");
        //}
    })
    .fail(function() {
      currentLocationWikis.push("Couldn't load links");
      console.log("Failure = " +currentLocationWikis[0]);
    })

    }
};

google.maps.event.addDomListener(window, 'load', initPageScratch);

function initPageScratch(){
  var vm = new ViewModel();
  vm.initPage();
  ko.applyBindings(vm);
}
