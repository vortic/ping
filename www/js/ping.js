var maps = google.maps;

var HttpClient = function() {
    this.request = function(params) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    params.callback && params.callback(httpRequest.responseText);
                } else {
                    params.error && params.error();
                }
            }
        };
        httpRequest.open(params.type, params.url + (params.type === "GET" ? params.content : ""));
        httpRequest.send(params.type === "GET" ? null : params.content);
    };
};

function div(content) {
    return "<div>" + content + "</div>";
}

function setContent(id, content) {
    document.getElementById(id).textContent = content;
}

function setStatus(message) {
    setContent("server-status", message);
}

function url(path) {
    return "http://10.0.0.2:8080/" + path;
}

function positionUrl(position) {
    var url = "?id=" + myName.replace(" ", "\0");
    return url + (position ? "&lat=" + position.coords.latitude + "&long=" + position.coords.longitude : "");
}

function myIcon() {
    return {
        url: "img/" + myName + ".jpeg?hack=" + Date.now(),
        scaledSize: new maps.Size(32, 32)
    };
}

function ping(myLocation) {
    setStatus("Pinging server...");
    var client = new HttpClient();
    client.request({
        type: "GET",
        url: url("ping"),
        content: positionUrl(myLocation),
        callback: function(json) {
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
        },
        error: function() {
            setStatus("Could not connect to the server"
                    + (myLocation ? ", but location loaded successfully!" : "."));
        }
    });
}

// set upon first login--remembered via localStorage
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
        document.getElementById('ping').onclick = function() {
            app.findMe();
        };
        document.getElementById('logout').onclick = function() {
            logout();
        };
        document.getElementById('change-picture').onsubmit = function() {
            if (! this.file || ! this.file.value) {
                alert("No image specified.");
                return false;
            }
            var data = new FormData(this);
            data.append("name", myName);
            var client = new HttpClient();
            client.request({
                type: "POST",
                url: url("ping"),
                content: data,
                callback: function() {
                    if (app.markers[myName]) {
                        app.markers[myName].setIcon(myIcon());
                    }
                },
                error: function() {
                    alert("An error occured trying to update your image. Please try again later.");
                }
            });
            return false;
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
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
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
                    icon: myIcon(),
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
        // center the map if it's the first load
        if (params.center) {
            app.map.setCenter(pos);
        }
        // If the marker already exists, update its position--otherwise, create a new Marker and
        // InfoWindow.
        if (params.title in app.markers) {
            app.markers[params.title].setPosition(pos);
        } else {
            var marker = app.markers[params.title] = new maps.Marker({
                position: pos,
                map: app.map,
                icon: params.icon,
                title: params.title
            });
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
        }
        return app.markers[params.title];
    }
};

function logout() {
    window.localStorage.removeItem("username");
    window.location.reload();
}

function setUsername() {
    myName = window.localStorage.getItem("username");
    if (! myName) {
        while (! myName || ! myName.trim()) {
            myName = prompt("Pick a username:", "");
        }
        window.localStorage.setItem("username", myName);
    }
    setContent("name", myName);
}

setUsername();

app.initialize();