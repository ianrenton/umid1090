/////////////////////////////
//      GLOBAL VARS        //
/////////////////////////////

// You can provide a main and fallback URL, e.g. one for use from the public internet
// and one for use when you are on the same LAN as the machine running Dump1090
var DUMP1090_URL = "http://mciserver.zapto.org:7654/dump1090-fa/data/aircraft.json";
var DUMP1090_URL_FALLBACK = "http://192.168.1.241:8081/dump1090-fa/data/aircraft.json";

// Map server URLs - if re-using this code you will need to provide your own Mapbox
// access token in the Mapbox URL. You can still use my style.
var MAPBOX_URL = "https://api.mapbox.com/styles/v1/ianrenton/ckchhz5ks23or1ipf1le41g56/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaWFucmVudG9uIiwiYSI6ImNrY2h4ZzU1ejE1eXoyc25uZjRvMmkyc2IifQ.JN65BkQfwQQIDfpMP_fFIQ";
var OPENAIP_URL = "http://{s}.tile.maps.openaip.net/geowebcache/service/tms/1.0.0/openaip_basemap@EPSG%3A900913@png/{z}/{x}/{y}.png";

// Base station position and map default position/zoom
var BASE_STATION_POS = [50.75128, -1.90168];
var BASE_STATION_SOFTWARE = ["PiAware 3.8.1", "dump1090-fa"];
var START_LAT_LON = [50.75128, -1.90168];
var START_ZOOM = 10;

// Airports - you can add some with their own symbols if you like by following this
// example, although I find it gets cluttered when using the OpenAIP layer as well
var AIRPORTS = [
  //    {name: "Bournemouth Airport", lat: 50.78055, lon: -1.83938},
  //    {name: "Southampton Airport", lat: 50.95177, lon: -1.35625}
];

// More globals - you should not have to edit beyond this point unless you want
// to change how the software works!
var MACH_TO_KNOTS = 666.739;
var KNOTS_TO_MPS = 0.514444;
var DEAD_RECKON_TIME_MS = 60000;
var DROP_TRACK_TIME_MS = 300000;
var CIVILIAN_AIRCRAFT_SYMBOL = "SUAPCF----";
var BASE_STATION_SYMBOL = "SFGPUUS-----";
var AIRPORT_SYMBOL = "SFGPIBA---H";
var CATEGORY_DESCRIPTIONS = new Map([
  ["A0", "Aircraft"],
  ["A1", "Light Aircraft"],
  ["A2", "Small Aircraft"],
  ["A3", "Large Aircraft"],
  ["A4", "High Vortex Aircraft"],
  ["A5", "Heavy Aircraft"],
  ["A6", "High Performance Aircraft"],
  ["A7", "Rotorcraft"],
  ["B0", "Misc Air"],
  ["B1", "Glider/sailplane"],
  ["B2", "Lighter-than-Air"],
  ["B3", "Parachutist/Skydiver"],
  ["B4", "Ultralight/hang-glider/paraglider"],
  ["B5", "Reserved"],
  ["B6", "UAV"],
  ["B7", "Space vehicle"],
  ["C0", "Ground Track"],
  ["C1", "Emergency Vehicle"],
  ["C2", "Service Vehicle"],
  ["C3", "Obstruction"]
]);
var CATEGORY_SYMBOLS = new Map([
  ["A0", "SUAPCF----"],
  ["A1", "SUAPCF----"],
  ["A2", "SUAPCF----"],
  ["A3", "SUAPCF----"],
  ["A4", "SUAPCF----"],
  ["A5", "SUAPCF----"],
  ["A6", "SUAPCF----"],
  ["A7", "SUAPCH----"],
  ["B0", "SUAPC-----"],
  ["B1", "SUAPC-----"],
  ["B2", "SUAPCL----"],
  ["B3", "SUAPC-----"],
  ["B4", "SUAPC-----"],
  ["B5", "SUAPC-----"],
  ["B6", "SUAPMFQ---"],
  ["B7", "SUPPL-----"],
  ["C0", "SUGP------"],
  ["C1", "SUGP------"],
  ["C2", "SUGP------"],
  ["C3", "SUGP------"]
]);

var entities = new Map(); // ICAO -> Entity
var dump1090url = DUMP1090_URL;
var currentServerWorkedOnce = false;


/////////////////////////////
//        CLASSES          //
/////////////////////////////

// Entity class.
// Altitude is stored in metres, heading/lat/lon in degrees, speed in knots.
class Entity {
  // Create new entity
  constructor(icao, fixed, lat, lon, heading, altitude, speed, name, squawk, category, symbol, desc1, desc2, rssi, updateTime, posUpdateTime) {
    this.icao = icao;
    this.fixed = fixed;
    this.positionHistory = [];
    if (lat != null) {
      this.positionHistory.push([lat, lon]);
    }
    this.heading = heading;
    this.altitude = altitude;
    this.speed = speed;
    this.name = (name != null) ? name.trim().replace(/^\s+|\s+$/g, '') : "";
    this.squawk = squawk;
    this.category = category;
    this.symbol = symbol;
    this.desc1 = (desc1 != null) ? desc1.trim().replace(/^\s+|\s+$/g, '') : "";
    this.desc2 = (desc2 != null) ? desc2.trim().replace(/^\s+|\s+$/g, '') : "";
    this.rssi = rssi;
    this.updateTime = updateTime;
    this.posUpdateTime = posUpdateTime;
  }

  // Update its position, adding to the history
  addPosition(lat, lon) {
    this.positionHistory.push([lat, lon]);
  }

  // Get the latest known position
  position() {
    return this.positionHistory[this.positionHistory.length - 1];
  }

  // Get the dead reckoned position based on its last position update plus
  // course and speed at that time
  drPosition() {
    if (this.position() != null && this.posUpdateTime != null && this.speed != null && this.heading != null) {
      // Can dead reckon
      var timePassedSec = moment().diff(this.posUpdateTime) / 1000.0;
      var speedMps = this.speed * KNOTS_TO_MPS;
      var newPos = destVincenty(this.position()[0], this.position()[1], this.heading, timePassedSec * speedMps);
      return newPos;
    } else {
      return null;
    }
  }

  // Is the track old enough that we should display the dead reckoned
  // position instead of the real one?
  oldEnoughToDR() {
    return !this.fixed && this.posUpdateTime != null && moment().diff(this.posUpdateTime) > DEAD_RECKON_TIME_MS;
  }

  // Is the track old enough that we should drop it?
  oldEnoughToDelete() {
    return !this.fixed && moment().diff(this.updateTime) > DROP_TRACK_TIME_MS;
  }

  // Generate a Milsymbol icon for the entity
  icon() {
    // No point returning an icon if we don't know where to draw it
    if (this.position() == null) {
      return null;
    }
    var lat = this.position()[0];
    var lon = this.position()[1];

    // Change symbol to "anticipated" if dead reckoning
    var symbol = this.symbol;
    if (this.oldEnoughToDR()) {
      symbol = symbol.substr(0, 3) + "A" + this.substr(4);
    }

    // Generate full symbol for display
    var mysymbol = new ms.Symbol(this.symbol, {
      size: 35,
      staffComments: this.desc1.toUpperCase(),
      additionalInformation: this.desc2.toUpperCase(),
      direction: (this.heading != null) ? this.heading : "",
      altitudeDepth: (this.altitude != null) ? (this.altitude.toFixed(0) + "M") : "",
      speed: (this.speed != null) ? (this.speed().toFixed(0) + "KTS") : "",
      type: (this.name != null) ? this.name.toUpperCase() : "",
      dtg: (this.fixed ? "" : this.posUpdateTime.utc().format("DDHHmmss[Z]MMMYY").toUpperCase()),
      location: Math.abs(lat).toFixed(4).padStart(7, '0') + ((lat >= 0) ? 'N' : 'S') + Math.abs(lon).toFixed(4).padStart(8, '0') + ((lon >= 0) ? 'E' : 'W')
    });
    mysymbol = mysymbol.setOptions({
      size: 30,
      civilianColor: false
    });

    // Build into a Leaflet icon and return
    return L.icon({
      iconUrl: mysymbol.toDataURL(),
      iconAnchor: [mysymbol.getAnchor().x, mysymbol.getAnchor().y],
    });
  }

  // Generate a map marker (a positioned equivalent of icon()). This will be
  // placed at the last known position, or the dead reckoned position if DR
  // should be used
  marker() {
    var pos = this.position();
    var icon = this.icon();
    // If we are dead reckoning position, use that instead to place the marker
    if (this.oldEnoughToDR() && this.drPosition() != null) {
      pos = this.drPosition();
    }
    if (pos != null && icon != null) {
      return L.marker(pos, {
        icon: icon
      });
    } else {
      return null;
    }
  }

  // Generate a snail trail polyline for the entity
  trail() {
    var tmp = this.positionHistory.slice();
    if (this.oldEnoughToDR() && this.drPosition() != null) {
      tmp.push(this.drPosition());
    }
    return L.polyline(tmp, {
      color: '#007F0E'
    });
  }
}


/////////////////////////////
//       FUNCTIONS         //
/////////////////////////////

// JSON data retrieval method
function requestData() {
  var url = dump1090url + "?_=" + (new Date()).getTime();
  $.ajax({
    url: url,
    dataType: 'json',
    timeout: 9000,
    success: async function(result) {
      handleData(result);
    },
    error: function() {
      handleFailure();
    },
    complete: function() {
      updateAll();
    }
  });
}

// Handle successful receive of data
async function handleData(result) {
  // Debug
  console.log(JSON.stringify(result));

  // Set tracker status
  currentServerWorkedOnce = true;
  if (result.aircraft.length > 0) {
    $("span#trackerstatus").html("ONLINE, TRACKING " + result.aircraft.length + " AIRCRAFT");
    $("span#trackerstatus").removeClass("trackerstatuserror");
    $("span#trackerstatus").removeClass("trackerstatuswarning");
    $("span#trackerstatus").addClass("trackerstatusgood");
  } else {
    $("span#trackerstatus").html("ONLINE, NO AIRCRAFT DETECTED");
    $("span#trackerstatus").removeClass("trackerstatuserror");
    $("span#trackerstatus").addClass("trackerstatuswarning");
    $("span#trackerstatus").removeClass("trackerstatusgood");
  }

  // Add/update aircraft in entity list
  for (a of result.aircraft) {
    // Get "best" versions of some parameters that have multiple variants
    // conveying similar information
    var bestHeading = a.track;
    if (a.mag_heading != null) {
      bestHeading = a.mag_heading;
    }
    if (a.true_heading != null) {
      bestHeading = a.true_heading;
    }
    var bestAlt = a.alt_geom;
    if (a.alt_baro != null) {
      bestAlt = a.alt_baro;
    }
    var bestSpeed = null;
    if (a.mach != null) {
      bestSpeed = a.mach * MACH_TO_KNOTS;
    }
    if (a.ias != null) {
      bestSpeed = a.ias;
    }
    if (a.tas != null) {
      bestSpeed = a.tas;
    }
    if (a.gs != null) {
      bestSpeed = a.gs;
    }

    // Update time adjustment
    var seen = moment();
    if (a.seen != null) {
      seen = seen.subtract(a.seen, 'seconds');
    }
    var posSeen = null;
    if (a.lat != null) {
      posSeen = moment();
      if (a.seen_pos != null) {
        posSeen = posSeen.subtract(a.seen_pos, 'seconds');
      }
    }

    // Implied symbol
    var symbol = CIVILIAN_AIRCRAFT_SYMBOL;
    if (a.category != null && CATEGORY_SYMBOLS.has(a.category)) {
        symbol = CATEGORY_SYMBOLS.get(a.category);
    }
    // Implied category description
    var catDescrip = "";
    if (a.category != null && CATEGORY_DESCRIPTIONS.has(a.category)) {
        catDescrip = a.category + " " + CATEGORY_DESCRIPTIONS.get(a.category);
    }

    // Now create or update the entity.
    if (!entities.has(a.hex)) {
      // Doesn't exist, so create
      entities.set(a.hex, new Entity(a.hex, false, a.lat, a.lon, bestHeading, bestAlt, bestSpeed, a.flight, a.squawk, a.category, symbol, catDescrip, "", a.rssi, seen, posSeen));
    } else {
      // Exists, so update
      var e = entities.get(a.hex);
      if (a.lat != null) {
        e.addPosition(a.lat, a.lon);
      }
      if (bestHeading != null) {
        e.heading = bestHeading;
      }
      if (bestAlt != null) {
        e.altitude = bestAlt;
      }
      if (a.mach != null) {
        e.speed = bestSpeed;
      }
      if (a.flight != null) {
        e.name = a.flight;
      }
      if (a.squawk != null) {
        e.squawk = a.squawk;
      }
      if (a.category != null) {
        e.category = a.category;
        e.desc1 = catDescrip;
        e.symbol = symbol;
      }
      e.rssi = a.rssi;
      e.updateTime = seen;
      e.posUpdateTime = posSeen;
    }
  }
}

// Handle a failure to receive data
async function handleFailure() {
  if (dump1090url == DUMP1090_URL && !currentServerWorkedOnce) {
    $("span#trackerstatus").html("TRYING FALLBACK SERVER...");
    $("span#trackerstatus").removeClass("trackerstatusgood");
    $("span#trackerstatus").removeClass("trackerstatuswarning");
    $("span#trackerstatus").addClass("trackerstatuserror");
    dump1090url = DUMP1090_URL_FALLBACK;
  } else {
    $("span#trackerstatus").html("TRACKER OFFLINE");
    $("span#trackerstatus").removeClass("trackerstatusgood");
    $("span#trackerstatus").removeClass("trackerstatuswarning");
    $("span#trackerstatus").addClass("trackerstatuserror");
  }
}

// Adjust entities if they need to have their symbol changed or be dropped,
// then call updates on the map and table.
async function updateAll() {
  // Refresh the display
  dropTimedOutAircraft();
  updateMap();
  updateTable();
}

// Drop any aircraft too old to be displayed
function dropTimedOutAircraft() {
  entities.forEach(function(e) {
    if (e.oldEnoughToDelete()) {
      entities.delete(e.icao);
    }
  });
}

// Update map, clearing old markers and drawing new ones
async function updateMap() {
  // Remove existing markers
  markersLayer.clearLayers();

  // Add entity markers to map
  entities.forEach(function(e) {
    if (e.marker() != null) {
      markersLayer.addLayer(e.marker());
    }
  });

  // Add snail trails to map
  entities.forEach(function(e) {
    markersLayer.addLayer(e.trail());
  });
}

// Update track table
async function updateTable() {
  // Sort data for table
  tableList = Array.from(entities.values());
  tableList.sort((a, b) => (a.icao > b.icao) ? 1 : -1);

  // Create header
  var table = $('<table>');
  table.addClass('tracktable');
  var headerFields = "<th>ICAO</th><th>IDENT</th><th>SQU</th><th>CAT</th><th>LAT</th><th>LON</th><th>ALT<br>M</th><th>HDG<br>DEG</th><th>SPD<br>KTS</th><th>SIG<br>dB</th><th>POS<br/>AGE</th><th>DATA<br/>AGE</th>";
  var header = $('<tr class="data">').html(headerFields);
  table.append(header);

  // Create table rows
  var rows = 0;
  tableList.forEach(function(e) {
    // Only real aircraft
    if (e.fixed == false) {
      var rowFields = "<td>" + e.icao.toUpperCase() + "</td>";
      rowFields += "<td>" + ((e.name != null) ? "<a href='https://flightaware.com/live/flight/" + e.name + "'>" + e.name + "</a>" : "UNK") + "</td>";
      rowFields += "<td>" + ((e.squawk != null) ? e.squawk : "UNK") + "</td>";
      rowFields += "<td>" + ((e.category != null) ? e.category : "UNK") + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[0]).toFixed(4).padStart(7, '0') + ((e.position()[0] >= 0) ? 'N' : 'S')) : "UNK") + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[1]).toFixed(4).padStart(8, '0') + ((e.position()[1] >= 0) ? 'E' : 'W')) : "UNK") + "</td>";
      rowFields += "<td>" + ((e.altitude != null) ? e.altitude.toFixed(0) : "UNK") + "</td>";
      rowFields += "<td>" + ((e.heading != null) ? e.heading.toFixed(0) : "UNK") + "</td>";
      rowFields += "<td>" + ((e.speed != null) ? e.speed.toFixed(0) : "UNK") + "</td>";
      rowFields += "<td>" + e.rssi + "</td>";
      rowFields += "<td class='" + getAgeColor(e.posUpdateTime) + "'>" + ((e.posUpdateTime != null) ? moment().diff(e.posUpdateTime, 'seconds') : "N/A") + "</td>";
      rowFields += "<td class='" + getAgeColor(e.updateTime) + "'>" + ((e.updateTime != null) ? moment().diff(e.updateTime, 'seconds') : "N/A") + "</td>";
      var row = $('<tr>').html(rowFields);

      // Add to table
      table.append(row);
      rows++;
    }
  });
  if (rows == 0) {
    table.append($('<tr>').html("<td colspan=12><div class='tablenodata'>NO DATA</div></td>"));
  }

  // Update DOM
  $('#tracktablearea').html(table);
}

// Utility function to get a table cell colour class depending on data age
function getAgeColor(time) {
  if (time != null) {
    var age = moment().diff(time, 'seconds');
    if (age <= DEAD_RECKON_TIME_MS) {
      return "green";
    } else if (age <= DROP_TRACK_TIME_MS) {
      return "orange";
    }
  }
  return "red";
}


/////////////////////////////
//       MAP SETUP         //
/////////////////////////////

// Create map and set initial view
var map = L.map('map', {
  zoomControl: false
})
map.setView(START_LAT_LON, START_ZOOM);
var markersLayer = new L.LayerGroup();
markersLayer.addTo(map);

// Add background layers
L.tileLayer(MAPBOX_URL).addTo(map);
L.tileLayer(OPENAIP_URL, {
  maxZoom: 14,
  minZoom: 4,
  tms: true,
  subdomains: '12',
  opacity: 0.3
}).addTo(map);


/////////////////////////////
//     ENTITY SETUP        //
/////////////////////////////

var i = 0;
entities.set(i, new Entity(i, true, BASE_STATION_POS[0], BASE_STATION_POS[1], null, null, null, "Base Station", null, null, BASE_STATION_SYMBOL, BASE_STATION_SOFTWARE[0], BASE_STATION_SOFTWARE[1], null, moment()));
for (ap of AIRPORTS) {
  i++;
  entities.set(i, new Entity(i, true, ap.lat, ap.lon, null, null, null, ap.name, null, null, AIRPORT_SYMBOL, "", "", null, moment()));
}
updateMap();


/////////////////////////////
//          INIT           //
/////////////////////////////

// Set up the timed data request & update threads.
// Request data now and every 10 sec, this also updates the table at that point
// but additionally update the table every second so you see the data age counting
requestData();
setInterval(requestData, 10000);
setInterval(updateTable, 1000);