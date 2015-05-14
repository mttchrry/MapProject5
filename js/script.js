
function makelocation(name, city, street, zip, latlng, marker){
    var loc = ko.observable(
    {
        name: name,
        street: street,
        zip: zip,
        city: city,
        latlng: latlng,
        marker: marker
    })
    return loc;
};


// Storage of locations to mark in Knockout JS observable arrays.
var Locations = ko.observableArray([
    makelocation('Town Hall','Ohio City', '1909 W. 25th St.','44113'),
    makelocation('West Side Market', 'Cleveland')
])

function loadData() {

    var $body = $('body');
    var $wikiElem = $('#wikipedia-links');
    var $nytHeaderElem = $('#nytimes-header');
    var $nytElem = $('#nytimes-articles');
    var $greeting = $('#greeting');

    // clear out old data before new request
    $wikiElem.text("");
    $nytElem.text("");

    // load streetview
    var inputStreet = $('#street').val();
    var inputCity = $('#city').val();
    var address = inputStreet + ', ' + inputCity;
    $greeting.text('So, you want to live at '+ address+ '?');


    var streetimgaddress = 'https://maps.googleapis.com/maps/api/streetview?location=' +
         address + '&size=600x400';
    $body.append('<img class="bgimg" src="'+ streetimgaddress + '">');


    var NytQueryUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q='+
        inputCity +'&api-key=ec612587cb260600bc67a560ab4342ef:8:71766984';

    $.getJSON(NytQueryUrl, function (data){
        console.log(data);
        //var JsonData = JSON.parse(data);
        $nytHeaderElem.text("New York Times Articles for "+inputCity);
        var articles = data.response.docs
        var responseSize = data.response.docs.length;
        for (var i=0; i< responseSize; i++){
            var article = articles[i];
            header = article.headline.main;
           //console.log('ArticleTitles are : ' + header);
            $nytElem.append('<li class="article">'+
                '<a href="'+article.web_url+'">'+article.headline.main+'</a>'+
                '<p>'+article.snippet+'</p></li>');
        }
    }).error(function(){
        $nytHeaderElem.text("New York Times Articles Could Not Be Loaded");
    });

    var wikiQueryUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
        inputCity + '&format=json&callback=wikiCallback';

    $.ajax({
        url: wikiQueryUrl,
        dataType: "jsonp",
        jsonp: "callback",
        success: function( response ) {
            var articleList = response[1];
            for (var i=0; i<articleList.length; i++) {
                var wikiArticle = articleList[i];
                var wikiArticleUrl = 'https://wikipedia.org/wiki/'+wikiArticle;
                $wikiElem.append('<li><a href="'+wikiArticleUrl+'">'+wikiArticle
                    +'</a></li>');
            }
        },
        error: function(response) {
            $wikiElem.text("Couldn't load links");
        }
    })

    return false;
};

$('#form-container').submit(loadData);

// loadData();
