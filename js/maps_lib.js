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

        // maintains map centerpoint for responsive design
        google.maps.event.addDomListener(self.map, 'idle', function () {
            self.calculateCenter();
        });
        google.maps.event.addDomListener(window, 'resize', function () {
            self.map.setCenter(self.map_centroid);
        });
        self.searchrecords = null;

        //reset filters
        $("#search_address").val(self.convertToPlainString($.address.parameter('address')));
        var loadRadius = self.convertToPlainString($.address.parameter('radius'));
        if (loadRadius != "")
            $("#search_radius").val(loadRadius);
        else
            $("#search_radius").val(self.searchRadius);

        $(":checkbox").prop("checked", "checked");
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
            for (var i = 0; i < data.events.length; i++) {
              var markerToAdd = {};
              //markerToAdd.position = {lat: 37.734646, lng:-122.463708 };
              var event = data.events[i];
              var locations = event.locations;
              console.log("Event Name:" + i +" " + event.name);
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
          self.setZoom();

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
            if (address.toLowerCase().indexOf(self.locationScope) === -1) {
                address = address; // + " " + self.locationScope; //SMO why self location scope? Removing it for now
            }
            //alert("Address to get geocode for " + address);
            self.geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    self.currentPinpoint = results[0].geometry.location;
                    console.log("Geocode is back:" + self.currentPinpoint);
                    var map = self.map;

                    $.address.parameter('address', encodeURIComponent(address));
                    $.address.parameter('radius', encodeURIComponent(self.searchRadius));
                    map.setCenter(self.currentPinpoint);
                    map.setZoom();

                    if (self.addrMarkerImage != '') {
                        self.addrMarker = new google.maps.Marker({
                            position: self.currentPinpoint,
                            map: self.map,
                            icon: self.addrMarkerImage,
                            animation: google.maps.Animation.DROP,
                            title: address
                        });
                    }
                    var geoCondition = " AND ST_INTERSECTS(" + self.locationColumn + ", CIRCLE(LATLNG" + self.currentPinpoint.toString() + "," + self.searchRadius + "))";
                    callback(geoCondition);
                    self.drawSearchRadiusCircle(self.currentPinpoint);
                } else {
                    alert("We could not find your address: " + status);
                    callback('');
                }
            });
        } else {
            callback('');
        }
    };

    MapsLib.prototype.doSearch = function () {
        var self = this;
        self.clearSearch();
        var address = $("#search_address").val();
        self.searchRadius = $("#search_radius").val();
        //-----custom filters-----
        //-----end of custom filters-----

        self.getgeoCondition(address, function (geoCondition) {
            self.submitSearch(self.map, geoCondition);
        });

    };

    MapsLib.prototype.reset = function () {
        $.address.parameter('address','');
        $.address.parameter('radius','');
        window.location.reload();
    };

    MapsLib.prototype.addrFromLatLng = function (latLngPoint) {
        var self = this;
        self.geocoder.geocode({
            'latLng': latLngPoint
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    $('#search_address').val(results[1].formatted_address);
                    $('.hint').focus();
                    self.doSearch();
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

    MapsLib.prototype.query = function (query_opts, callback) {
        var queryStr = [],
            self = this;
        queryStr.push("SELECT " + query_opts.select);
        queryStr.push(" FROM " + self.fusionTableId);
        // where, group and order clauses are optional
        if (query_opts.where && query_opts.where != "") {
            queryStr.push(" WHERE " + query_opts.where);
        }
        if (query_opts.groupBy && query_opts.groupBy != "") {
            queryStr.push(" GROUP BY " + query_opts.groupBy);
        }
        if (query_opts.orderBy && query_opts.orderBy != "") {
            queryStr.push(" ORDER BY " + query_opts.orderBy);
        }
        if (query_opts.offset && query_opts.offset !== "") {
            queryStr.push(" OFFSET " + query_opts.offset);
        }
        if (query_opts.limit && query_opts.limit !== "") {
            queryStr.push(" LIMIT " + query_opts.limit);
        }
        var theurl = {
            base: "https://www.googleapis.com/fusiontables/v1/query?sql=",
            queryStr: queryStr,
            key: self.googleApiKey
        };
        $.ajax({
            url: [theurl.base, encodeURIComponent(theurl.queryStr.join(" ")), "&key=", theurl.key].join(''),
            dataType: "json"
        }).done(function (response) {
            //console.log(response);
            if (callback) callback(response);
        }).fail(function(response) {
            self.handleError(response);
        });
    };

    MapsLib.prototype.handleError = function (json) {
        if (json.error !== undefined) {
            var error = json.responseJSON.error.errors;
            console.log("Error in Fusion Table call!");
            for (var row in error) {
                console.log(" Domain: " + error[row].domain);
                console.log(" Reason: " + error[row].reason);
                console.log(" Message: " + error[row].message);
            }
        }
    };
    /*
    MapsLib.prototype.getCount = function (whereClause) {
        var self = this;
        var selectColumns = "Count()";
        self.query({
            select: selectColumns,
            where: whereClause
        }, function (json) {
            self.displaySearchCount(json);
        });
    };*/

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

    MapsLib.prototype.addCommas = function (nStr) {
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
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
                self.addrFromLatLng(coords);
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
