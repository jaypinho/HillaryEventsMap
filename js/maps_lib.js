(function (window, undefined) {
    var MapsLib = function (options) {
        var self = this;

        options = options || {};

        this.markers = [];
        this.infowindows = [];

        this.recordName = options.recordName || "event"; //for showing a count of results
        this.recordNamePlural = options.recordNamePlural || "events";
        this.searchRadius = options.searchRadius || 16100; //in meters ~ 10 miles
        //alert(this.searchRadius);

        // Found at https://console.developers.google.com/
        // Important! this key is for demonstration purposes. please register your own.
        this.googleApiKey = options.googleApiKey || "",

        // appends to all address searches if not present
        this.locationScope = options.locationScope || "";

        // zoom level when map is loaded (bigger is more zoomed in)
        this.defaultZoom = options.defaultZoom || 11;

        // center that your map defaults to
        this.map_centroid = new google.maps.LatLng(options.map_center[0], options.map_center[1]);

        // marker image for your searched address
        if (typeof options.addrMarkerImage !== 'undefined') {
            if (options.addrMarkerImage != "")
                this.addrMarkerImage = options.addrMarkerImage;
            else
                this.addrMarkerImage = ""
        }
        else
            this.addrMarkerImage = "images/blue-pushpin.png"

    	this.currentPinpoint = null;
    	$("#result_count").html("");

        this.myOptions = {
            zoom: this.defaultZoom,
            center: this.map_centroid,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.geocoder = new google.maps.Geocoder();
        this.map = new google.maps.Map($("#map_canvas")[0], this.myOptions);
        console.log("doing again");

        // maintains map centerpoint for responsive design
        google.maps.event.addDomListener(self.map, 'idle', function () {
            self.calculateCenter();
        });

        google.maps.event.addDomListener(window, 'resize', function () {
            self.map.setCenter(self.map_centroid);
            console.log(self.map.getCenter().lat());
        });
        self.searchrecords = null;

        //reset filters
        $("#search_address").val(self.convertToPlainString($.address.parameter('address')));
        var loadRadius = self.convertToPlainString($.address.parameter('radius'));
        if (loadRadius != "")
            $("#search_radius").val(loadRadius);
        else
            $("#search_radius").val(self.searchRadius);

        // $(":checkbox").prop("checked", "checked");
        $("#result_box").hide();

        //-----custom initializers-----
        //-----end of custom initializers-----

        //run the default search when page loads
        self.doSearch();
        if (options.callback) options.callback(self);
    };

    MapsLib.prototype.getSearchRadiusInMiles = function() {
      var self = this;
      if (self.searchRadius >= 1610000) return 1000; // 1,000 miles
      else if (self.searchRadius >= 805000) return 500; // 500 miles
      else if (self.searchRadius >= 402500) return 250; // 250 miles
      else if (self.searchRadius >= 161000) return 100; // 100 miles
      else if (self.searchRadius >= 80500) return 50; // 50 miles
      else if (self.searchRadius >= 40250) return 25; // 25 miles
      else if (self.searchRadius >= 16100) return 10; // 10 miles
      else if (self.searchRadius >= 8050) return 5; // 5 miles
      else if (self.searchRadius >= 3220) return 2; // 2 miles
      else if (self.searchRadius >= 1610) return 1; // 1 mile
      else if (self.searchRadius >= 805) return 0.5; // 1/2 mile
      else if (self.searchRadius >= 400) return 0.25; // 1/4 mile
      else return 250;
    };

    MapsLib.prototype.submitSearch = function (map, geoCondition) {
        var self = this;
        // Get Info for Hillary website
        // Call this for numRows//https://www.hillaryclinton.com/api/events/events?lat=37.734646&lng=-122.463708&radius=250&earliestTime=2016-03-06T18%3A33%3A13.297Z&status=confirmed&visibility=public&perPage=100&onepage=1&_=1457303591599
        //alert("Before call");
        console.log("self.currentPinpoint" + self.currentPinpoint);
        current_pinpoint = self.currentPinpoint || self.map_centroid;
        var req_lat = current_pinpoint.lat();
        var req_long = current_pinpoint.lng();
        console.log("Request events for lat: " + req_lat + " lng:" + req_long);
        var currentDate = new Date();//$.now().toISOString();
        var earliestTime = encodeURIComponent(currentDate.toISOString());
        console.log(earliestTime);
        //alert("SearchRadius in miles1" + self.searchRadius);
        var jqxhr = $.getJSON( "https://www.hillaryclinton.com/api/events/events?lat="+req_lat+"&lng="+req_long+"&radius="+self.getSearchRadiusInMiles()+"&earliestTime="+earliestTime+"&status=confirmed&visibility=public&perPage=50&onepage=1&_=1457303591599",
          function(data) {
            console.log( "The data is " + data );
          })
          .done(function(data) {
            //console.log("result" + JSON.stringify(data));
            $("#results_detail").empty();
            var all_events = data.events.sort(function(a, b) {return new Date (a.startDate) - new Date(b.startDate);});
            for (var i = 0; i < all_events.length; i++) {
              var markerToAdd = {};
              //markerToAdd.position = {lat: 37.734646, lng:-122.463708 };
              var event = all_events[i];
              var locations = event.locations;
              for (var j=0; j < locations.length; j++) {
                var current_location = locations[j];
                var latitude = parseFloat(current_location.latitude);
                var longitude = parseFloat(current_location.longitude);
                //console.log(longitude);
                markerToAdd.position = { lat: latitude, lng: longitude};
                markerToAdd.map = map;
                markerToAdd.title = event.name;
                self.addmarker(markerToAdd, {id:event.id, details:event.description, lookupId:event.lookupId});
              }
              var formattedDate = '';
              if(new Date(event.startDate).toLocaleDateString() == new Date(event.endDate).toLocaleDateString())
                {formattedDate = new Date(event.endDate).toLocaleTimeString()}
              else
                {formattedDate = new Date(event.endDate).toLocaleString()}
              $("#results_detail").append('<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><i class="glyphicon glyphicon-pushpin"></i> '
              +event.name+'</h3></div><div class="panel-body"><i class="glyphicon glyphicon-time"></i> '
              +new Date(event.startDate).toLocaleString()+'-'+formattedDate
              +'<br><i class="glyphicon glyphicon-link"></i> '+event.description+'</div></div>');
            }
            self.displaySearchCount(data.events.length);
          })
          .fail(function() {
            console.log( "error" );
          })
          .always(function() {
            console.log( "complete" );
          });

          // Perform other work here ...
          if ($('#autorefresh')[0].checked == false) {
            self.setZoom();
          }

          // Set another completion function for the request above
          jqxhr.complete(function() {
            console.log( "second complete" );
          });
    };

    MapsLib.prototype.addmarker = function(opts, place) {
        var self = this;
        var marker = new google.maps.Marker(opts);
        marker.place_id = place.id;
        self.markers[place.id] = marker;
        var infowindow = new google.maps.InfoWindow({
          content: opts.title + "<br/>"+place.details + " <a href='https://www.hillaryclinton.com/events/view/" + place.lookupId +"'>RSVP</a>"
        });

        self.infowindows[place.id] = infowindow;
        var map = self.map;

        google.maps.event.addListener(marker, 'click', function() {
          self.infowindows[marker.place_id].open(map,marker);
        });
    };

    MapsLib.prototype.setZoom = function() {
      var self = this;
      var map = self.map;
      // set zoom level based on search radius
      if (self.searchRadius >= 1610000) map.setZoom(5); // 1,000 miles
      else if (self.searchRadius >= 805000) map.setZoom(7); // 500 miles
      else if (self.searchRadius >= 402500) map.setZoom(8); // 250 miles
      else if (self.searchRadius >= 161000) map.setZoom(9); // 100 miles
      else if (self.searchRadius >= 80500) map.setZoom(10); // 50 miles
      else if (self.searchRadius >= 40250) map.setZoom(11); // 25 miles
      else if (self.searchRadius >= 16100) map.setZoom(12); // 10 miles
      else if (self.searchRadius >= 8050) map.setZoom(13); // 5 miles
      else if (self.searchRadius >= 3220) map.setZoom(14); // 2 miles
      else if (self.searchRadius >= 1610) map.setZoom(15); // 1 mile
      else if (self.searchRadius >= 805) map.setZoom(16); // 1/2 mile
      else if (self.searchRadius >= 400) map.setZoom(17); // 1/4 mile
      else map.setZoom(17);
    };

    MapsLib.prototype.getgeoCondition = function (address, callback) {
        var self = this;
        if (address !== "") {
            if (typeof address == 'string' && address.toLowerCase().indexOf(self.locationScope) === -1) {
                address = address; // + " " + self.locationScope; //SMO why self location scope? Removing it for now
            }
            //alert("Address to get geocode for " + address);
            if (typeof address == 'string') {
              self.geocoder.geocode({'address': address}, function (results, status) {self.generateCenterMarker(results, status, address, callback)});
            }
            else {
              self.generateCenterMarker([{geometry: {location: {lat: function () {return 40.6676035;}, lng: function () {return -73.9878978;}}}}], 'no_geocode', '', callback);
            }
        } else {
            callback('');
        }
    };

    MapsLib.prototype.generateCenterMarker = function (results, status, address, callback) {
      var self = this;
      if (status === google.maps.GeocoderStatus.OK || status === 'no_geocode') {
        console.log(results);
        self.currentPinpoint = results[0].geometry.location;
        console.log("Geocode is back:" + self.currentPinpoint);
        var map = this.map;

        if (address != '') {
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(self.searchRadius));
        }
        if ($('#autorefresh')[0].checked == false) {
          map.setCenter(self.currentPinpoint);
          map.setZoom();
        }

        if (self.addrMarkerImage != '') {
            self.addrMarker = new google.maps.Marker({
                position: ($('#autorefresh')[0].checked ? self.map.getCenter() : self.currentPinpoint),
                map: self.map,
                icon: self.addrMarkerImage,
                animation: google.maps.Animation.DROP,
                title: (typeof address == 'string' ? address : '')
            });
        }
        var geoCondition = " AND ST_INTERSECTS(" + self.locationColumn + ", CIRCLE(LATLNG" + self.currentPinpoint.toString() + "," + self.searchRadius + "))";
        callback(geoCondition);
        self.drawSearchRadiusCircle(($('#autorefresh')[0].checked ? self.map.getCenter() : self.currentPinpoint));
      } else {
        alert("We could not find your address: " + status);
        callback('');
      }
    };

    MapsLib.prototype.doSearch = function () {
        var self = this;
        self.clearSearch();
        self.searchRadius = $("#search_radius").val();
        if ($('#autorefresh')[0].checked) {
          self.getgeoCondition(self.map.getCenter(), function (geoCondition) {
              self.submitSearch(self.map, geoCondition);
          });
        } else {
          self.getgeoCondition($("#search_address").val(), function (geoCondition) {
              self.submitSearch(self.map, geoCondition);
          });
        }
    };

    MapsLib.prototype.reset = function () {
        $.address.parameter('address','');
        $.address.parameter('radius','');
        window.location.reload();
    };

    MapsLib.prototype.addrFromLatLng = function (latLngPoint, callback) {
        var self = this;
        self.geocoder.geocode({
            'latLng': latLngPoint
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    if (callback) {
                      callback(results[1].formatted_address);
                    }
                    // $('.hint').focus();
                    // self.doSearch();
                }
            } else {
                alert("Geocoder failed due to: " + status);
            }
        });
    };

    MapsLib.prototype.drawSearchRadiusCircle = function (point) {
        var self = this;
        var circleOptions = {
            strokeColor: "#4b58a6",
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: "#4b58a6",
            fillOpacity: 0.05,
            map: self.map,
            center: point,
            clickable: false,
            zIndex: -1,
            radius: parseInt(self.searchRadius)
        };
        self.searchRadiusCircle = new google.maps.Circle(circleOptions);
    };

    MapsLib.prototype.displaySearchCount = function (count) {
        var self = this;

        /*var numRows = 0;
        if (json["rows"] != null) {
            numRows = json["rows"][0];
        }*/
        var name = self.recordNamePlural;
        if (count == 1) {
            name = self.recordName;
        }
        $("#result_box").fadeOut(function () {
            $("#result_count").html(count +" " + name + " found");
        });
        $("#result_box").fadeIn();
    };

    // maintains map centerpoint for responsive design
    MapsLib.prototype.calculateCenter = function () {
        var self = this;
        center = self.map.getCenter();
    };

    //converts a slug or query string in to readable text
    MapsLib.prototype.convertToPlainString = function (text) {
        if (text === undefined) return '';
        return decodeURIComponent(text);
    };

    MapsLib.prototype.clearSearch = function () {
        var self = this;
        if (self.searchrecords && self.searchrecords.getMap)
            self.searchrecords.setMap(null);
        if (self.addrMarker && self.addrMarker.getMap)
            self.addrMarker.setMap(null);
        if (self.searchRadiusCircle && self.searchRadiusCircle.getMap)
            self.searchRadiusCircle.setMap(null);
    };

    MapsLib.prototype.findMe = function () {
        var self = this;
        var foundLocation;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var accuracy = position.coords.accuracy;
                var coords = new google.maps.LatLng(latitude, longitude);
                self.map.panTo(coords);
                self.addrFromLatLng(coords, function(results) {$('#search_address').val(results);});
                self.doSearch();
                self.map.setZoom(14);
                jQuery('#map_canvas').append('<div id="myposition"><i class="fontello-target"></i></div>');
                setTimeout(function () {
                    jQuery('#myposition').remove();
                }, 3000);
            }, function error(msg) {
                alert('Please enable your GPS position feature.');
            }, {
                //maximumAge: 600000,
                //timeout: 5000,
                enableHighAccuracy: true
            });
        } else {
            alert("Geolocation API is not supported in your browser.");
        }
    };
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = MapsLib;
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return MapsLib;
        });
    } else {
        window.MapsLib = MapsLib;
    }

})(window);
