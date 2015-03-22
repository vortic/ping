var maps = google.maps;

var HttpClient = function() {
    this.get = function(url, content, callback, error) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    callback(httpRequest.responseText);
                } else {
                    error();
                }
            }
        };
        httpRequest.open("GET", url + content);
        httpRequest.send();
    };
};

function div(content) {
    return "<div>" + content + "</div>";
}

function setStatus(message) {
    document.getElementById("server-status").textContent = message;
}

function ping(myLocation) {
    myPosition = myLocation;
    setStatus("Pinging server...");
    var client = new HttpClient();
    client.get("http://localhost:8080/ping", positionUrl(myLocation), function(json) {
        var positions = JSON.parse(json);
        for (var id in positions) {
            var position = positions[id];
            app.placePerson({
                position: {
                    coords: {
                        latitude: position.latitude,
                        longitude: position.longitude
                    }
                },
                title: id
            });
        }
        if (Object.keys(app.markers).length && Object.keys(app.markers)[0] !== myName) {
            var bounds = new maps.LatLngBounds();
            for (var id in app.markers) {
                var marker = app.markers[id];
                bounds.extend(marker.getPosition());
            }
            app.map.fitBounds(bounds);
        }
        setStatus("Successfully pinged the server"
                + (myLocation ? "!" : ", but we couldn't find your location."));
    }, function() {
        setStatus("Could not connect to the server"
                + (myLocation ? ", but location loaded successfully!" : "."));
    });
}

function positionUrl(position) {
    var url = "?id=" + myName.replace(" ", "\0");
    return url + (position ? "&lat=" + position.coords.latitude + "&long=" + position.coords.longitude : "");
}

// assigned upon registration with the server
var myPosition;
// set upon first login--remembered via cookie
var myName;

var app = {
    map: null, // google.maps.Map
    markers: null, // a hash of google.maps.Marker objects
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        document.getElementById('click').onclick = function() {
            var event = document.createEvent("HTMLEvents");
            event.initEvent('deviceready', true, true);
            event.eventName = 'deviceready';
            document.getElementById('click').dispatchEvent(event);
        };
        document.getElementById('refresh').onclick = function() {
            ping(myPosition);
        };
        document.getElementById('logout').onclick = function() {
            logout();
        };
        app.map = new maps.Map(document.getElementById('map-canvas'), {
            zoom: 12,
            mapTypeId: maps.MapTypeId.ROADMAP
        });
        app.markers = {};
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        this.findMe();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    findMe: function() {
        if(navigator.geolocation) {
            setStatus("loading location...");
            navigator.geolocation.getCurrentPosition(function(position) {
                app.placePerson({
                    position: position,
                    icon: {
                        url: "img/mugshot.jpeg",
                        scaledSize: new maps.Size(32, 32)
                    },
                    title: myName,
                    center: true
                });
                ping(position);
            },function() {
                ping();
            });
        } else {
            setStatus("Geolocation does not seem to be supported.");
        }
        document.getElementById('click').setAttribute('style', 'display:none;');
    },
    placePerson: function(params) {
        var coords = params.position.coords;
        var pos = new maps.LatLng(coords.latitude, coords.longitude);
        if (params.center) {
            app.map.setCenter(pos);
        }

        if (params.title in app.markers) {
            app.markers[params.title].setPosition(pos);
        } else {
            app.markers[params.title] = new maps.Marker({
                position: pos,
                map: app.map,
                icon: params.icon,
                title: params.title
            });
        }
        var marker = app.markers[params.title];

        var geocoder = new maps.Geocoder();
        geocoder.geocode({ latLng: pos }, function(results, status) {
            if (status === maps.GeocoderStatus.OK) {
                var infoWindow = new maps.InfoWindow({
                    content: div(results[0].formatted_address),
                    maxWidth: 150
                });
                maps.event.addListener(marker, 'click', function() {
                    infoWindow.open(app.map, marker);
                });
            }
        });

        return marker;
    }
};

// writes a cookie with the supplied username, set to expire in a year
function writeUsernameCookie(name) {
    var d = new Date();
    d.setTime(d.getTime() + (365 * 1000 * 60 * 60 * 24));
    document.cookie = "username=" + name + ";expires=" + d.toUTCString();
}

function readUsernameCookie() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf("username=") === 0) {
            myName = cookie.substring("username=".length);
        }
    };
}

function logout() {
    document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
}

function setUsername() {
    readUsernameCookie();
    if (! myName) {
        while (! myName || ! myName.trim()) {
            myName = prompt("Pick a username:", "");
        }
        writeUsernameCookie(myName);
    }
}

setUsername();

app.initialize();