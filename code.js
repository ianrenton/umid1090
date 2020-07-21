/////////////////////////////
//      GLOBAL VARS        //
/////////////////////////////

// You can provide a main and alternate URL, e.g. one for use from the public internet
// and one for use when you are on the same LAN as the machine running Dump1090.
// Select the alternate URL by appending ?alt=true to the URL for UMID1090.
// Normal users won't do this and will therefore use the main public URL, but you
// can bookmark the "alt" version to always use your LAN address for testing.
var DUMP1090_URL = "http://mciserver.zapto.org/dump1090-fa/data/aircraft.json";
var DUMP1090_URL_ALT = "http://192.168.1.241:8081/dump1090-fa/data/aircraft.json";

// Map server URLs - if re-using this code you will need to provide your own Mapbox
// access token in the Mapbox URL. You can still use my style.
var MAPBOX_URL = "https://api.mapbox.com/styles/v1/ianrenton/ckchhz5ks23or1ipf1le41g56/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaWFucmVudG9uIiwiYSI6ImNrY2h4ZzU1ejE1eXoyc25uZjRvMmkyc2IifQ.JN65BkQfwQQIDfpMP_fFIQ";
var OPENAIP_URL = "http://{s}.tile.maps.openaip.net/geowebcache/service/tms/1.0.0/openaip_basemap@EPSG%3A900913@png/{z}/{x}/{y}.png";

// Base station position and map default position/zoom
var BASE_STATION_POS = [50.75128, -1.90168];
var BASE_STATION_SOFTWARE = ["PiAware 3.8.1", "dump1090-fa"];
var START_LAT_LON = [50.75128, -1.90168];
var START_ZOOM = 9;

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
  ["A6", "High Perf Aircraft"],
  ["A7", "Rotary Wing"],
  ["B0", "Misc Air"],
  ["B1", "Glider/sailplane"],
  ["B2", "Lighter-than-Air"],
  ["B3", "Parachutist/Skydiver"],
  ["B4", "Ultralight/hang/paraglider"],
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
var EMERGENCY_SQUAWKS = ["7500", "7600", "7700"];
var entities = new Map(); // hex -> Entity
var clockOffset = 0; // Local PC time (UTC) minus data time. Used to prevent data appearing as too new or old if the local PC clock is off.
var selectedEntityHex = "";
var followSelected = false;
var detailedMap = true;


/////////////////////////////
//        CLASSES          //
/////////////////////////////

// Entity class.
// Altitude is stored in feet, heading/lat/lon in degrees, speed in knots.
class Entity {
  // Create new entity
  constructor(hex, fixed, lat, lon, heading, altitude, altRate, speed, name, squawk, category, symbol, desc1, desc2, rssi, updateTime, posUpdateTime) {
    this.hex = hex;
    this.fixed = fixed;
    this.positionHistory = [];
    if (lat != null) {
      this.positionHistory.push([lat, lon]);
    }
    this.heading = heading;
    this.altitude = altitude;
    this.altRate = altRate;
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
      var timePassedSec = getTimeInServerRefFrame().diff(this.posUpdateTime) / 1000.0;
      var speedMps = this.speed * KNOTS_TO_MPS;
      var newPos = destVincenty(this.position()[0], this.position()[1], this.heading, timePassedSec * speedMps);
      return newPos;
    } else {
      return null;
    }
  }

  // Gets a position for the icon, either position() or drPosition() as required
  iconPosition() {
    var pos = this.position();
    // If we are dead reckoning position, use that instead to place the marker
    if (this.oldEnoughToDR() && this.drPosition() != null) {
      pos = this.drPosition();
    }
    return pos;
  }

  // Is the track old enough that we should display the dead reckoned
  // position instead of the real one?
  oldEnoughToDR() {
    return !this.fixed && this.posUpdateTime != null && getTimeInServerRefFrame().diff(this.posUpdateTime) > DEAD_RECKON_TIME_MS;
  }

  // Is the track old enough that we should drop it?
  oldEnoughToDelete() {
    return !this.fixed && getTimeInServerRefFrame().diff(this.updateTime) > DROP_TRACK_TIME_MS;
  }

  // Generate a Milsymbol icon for the entity
  icon() {
    // No point returning an icon if we don't know where to draw it
    if (this.iconPosition() == null) {
      return null;
    }

    // Get position for display
    var lat = this.iconPosition()[0];
    var lon = this.iconPosition()[1];

    // Change symbol to "anticipated" if dead reckoning
    var symbol = this.symbol;
    if (this.oldEnoughToDR()) {
      symbol = symbol.substr(0, 3) + "A" + symbol.substr(4);
    }

    // Generate full symbol for display
    var mysymbol = new ms.Symbol(symbol, {
      size: 35,
      staffComments: detailedMap ? this.desc1.toUpperCase() : "",
      additionalInformation: detailedMap ? this.desc2.toUpperCase() : "",
      direction: (this.heading != null) ? this.heading : "",
      altitudeDepth: (this.altitude != null && detailedMap) ? (this.altitude.toFixed(0) + "FT") : "",
      speed: (this.speed != null && detailedMap) ? (this.speed.toFixed(0) + "KTS") : "",
      type: (this.name != null && this.name != "") ? this.name.toUpperCase() : "HEX " + this.hex.toUpperCase(),
      dtg: ((!this.fixed && this.posUpdateTime != null && detailedMap) ? this.posUpdateTime.utc().format("DDHHmmss[Z]MMMYY").toUpperCase() : ""),
      location: detailedMap ? (Math.abs(lat).toFixed(4).padStart(7, '0') + ((lat >= 0) ? 'N' : 'S') + Math.abs(lon).toFixed(4).padStart(8, '0') + ((lon >= 0) ? 'E' : 'W')) : ""
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
    var pos = this.iconPosition();
    var icon = this.icon();
    if (pos != null && icon != null) {
      // Create marker
      var m = L.marker(pos, {
        icon: icon
      });
      // Set the click action for the marker
      var hex = this.hex;
      m.on('click', (function(hex) {
        return function() {
          iconSelect(hex);
        };
      })(hex));
      return m;
    } else {
      return null;
    }
  }

  // Check if the entity is currently selected
  entitySelected() {
    return this.hex == selectedEntityHex;
  }

  // Generate a snail trail polyline for the entity based on its
  // reported positions
  trail() {
    return L.polyline(this.positionHistory, {
      color: (this.entitySelected() ? '#4581CC' : '#007F0E')
    });
  }

  // Generate a snail trail line for the entity joining its
  // last reported position with the current dead reckoned
  // position, or null if not dead reckoning.
  drTrail() {
    if (this.positionHistory.length > 0 && this.oldEnoughToDR()) {
      var points = [this.position(), this.drPosition()];
      return L.polyline(points, {
        color: (this.entitySelected() ? '#4581CC' : '#007F0E'),
        dashArray: "5 5"
      });
    } else {
      return null;
    }
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
      handleSuccess(result);
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
async function handleSuccess(result) {

  // Set tracker status
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

  // Update the data store
  handleData(result, true);
}

// Update the internal data store with the provided data
function handleData(result, live) {
  // Debug
  console.log(JSON.stringify(result));

  // Update clock offset (local PC time - data time) - only if data
  // is live rather than historic data being loaded in
  if (live) {
    clockOffset = moment().diff(moment.unix(result.now).utc(), 'seconds');
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
    var bestAltRate = a.geom_rate;
    if (a.baro_rate != null) {
      bestAltRate = a.baro_rate;
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
    var seen = moment.unix(result.now).utc();
    if (a.seen != null) {
      seen = seen.subtract(a.seen, 'seconds');
    }
    var posSeen = null;
    if (a.lat != null) {
      posSeen = moment.unix(result.now).utc();
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
      entities.set(a.hex, new Entity(a.hex, false, a.lat, a.lon, bestHeading, bestAlt, bestAltRate, bestSpeed, a.flight, a.squawk, a.category, symbol, catDescrip, "", a.rssi, seen, posSeen));
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
      if (bestAltRate != null) {
        e.altRate = bestAltRate;
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
      if (posSeen != null) {
        e.posUpdateTime = posSeen;
      }
    }
  }
}

// Handle a failure to receive data
async function handleFailure() {
  $("span#trackerstatus").html("TRACKER OFFLINE");
  $("span#trackerstatus").removeClass("trackerstatusgood");
  $("span#trackerstatus").removeClass("trackerstatuswarning");
  $("span#trackerstatus").addClass("trackerstatuserror");
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
      entities.delete(e.hex);
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
  entities.forEach(function(e) {
    if (e.drTrail() != null) {
      markersLayer.addLayer(e.drTrail());
    }
  });

  // Follow selected entity
  if (followSelected) {
    panTo(selectedEntityHex);
  }
}

// Update track table
async function updateTable() {
  // Sort data for table
  tableList = Array.from(entities.values());
  tableList.sort((a, b) => (a.hex > b.hex) ? 1 : -1);

  // Create header
  var table = $('<table>');
  table.addClass('tracktable');
  var headerFields = "<th>HEX</th><th>FLIGHT</th><th>SQU</th><th>CAT</th><th>LAT</th><th>LON</th><th>ALT<br>FT</th><th>HDG<br>DEG</th><th>SPD<br>KTS</th><th>SIG<br>dB</th><th>POS<br/>AGE</th><th>DATA<br/>AGE</th>";
  var header = $('<tr class="data">').html(headerFields);
  table.append(header);

  // Create table rows
  var rows = 0;
  tableList.forEach(function(e) {
    // Only real aircraft
    if (e.fixed == false) {
      // Altitude rate symbol
      var altRateSymb = "";
      if (e.altRate != null && e.altRate > 100) {
        altRateSymb = "\u25b2";
      } else if (e.altRate != null && e.altRate < -100) {
        altRateSymb = "\u25bc";
      }

      // Generate table row
      var rowFields = "<td><a href='https://flightaware.com/live/modes/" + e.hex + "/redirect' target='_blank'>" + e.hex.toUpperCase() + "</a></td>";
      rowFields += "<td>" + ((e.name != null && e.name != "") ? ("<a href='https://flightaware.com/live/flight/" + e.name + "' target='_blank'>" + e.name + "</a>") : "---") + "</td>";
      rowFields += "<td class='" + getSquawkColor(e.squawk) + "'>" + ((e.squawk != null) ? e.squawk : "---") + "</td>";
      rowFields += "<td>" + ((e.category != null) ? e.category : "---") + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[0]).toFixed(4).padStart(7, '0') + ((e.position()[0] >= 0) ? 'N' : 'S')) : "---") + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[1]).toFixed(4).padStart(8, '0') + ((e.position()[1] >= 0) ? 'E' : 'W')) : "---") + "</td>";
      rowFields += "<td>" + ((e.altitude != null) ? (e.altitude.toFixed(0) + altRateSymb) : "---") + "</td>";
      rowFields += "<td>" + ((e.heading != null) ? e.heading.toFixed(0) : "---") + "</td>";
      rowFields += "<td>" + ((e.speed != null) ? e.speed.toFixed(0) : "---") + "</td>";
      rowFields += "<td>" + e.rssi + "</td>";
      rowFields += "<td class='" + getAgeColor(e.posUpdateTime) + "'>" + ((e.posUpdateTime != null) ? getTimeInServerRefFrame().diff(e.posUpdateTime, 'seconds') : "N/A") + "</td>";
      rowFields += "<td class='" + getAgeColor(e.updateTime) + "'>" + ((e.updateTime != null) ? getTimeInServerRefFrame().diff(e.updateTime, 'seconds') : "N/A") + "</td>";
      var row = $('<tr name=' + e.hex + '>').html(rowFields);
      if (e.entitySelected()) {
        row.addClass("selected");
      }

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

// Function called when an icon is clicked. Just set entity as selected.
async function iconSelect(hex) {
  select(hex);
}

// Function called when a table row is clicked. Set entity as selected and zoom
// to it.
async function tableSelect(hex) {
  panTo(hex);
  select(hex);
}

// Select the selected track
async function select(hex) {
  selectedEntityHex = hex;
  $("button#deselect").prop('disabled', false);
  updateMap();
  updateTable();
}

// Deselect the selected track
async function deselect() {
  selectedEntityHex = "";
  $("button#deselect").prop('disabled', true);
  updateMap();
  updateTable();
}

// Pan to an entity, given its hex code
async function panTo(hex) {
  var e = entities.get(hex);
  if (e != null && e.iconPosition() != null) {
    var pos = e.iconPosition();
    map.panTo(e.iconPosition());
  }
}

// Go back to starting view
function defaultZoom() {
  map.setView(START_LAT_LON, START_ZOOM);
}

// Utility function to get a table cell colour class depending on data age
function getAgeColor(time) {
  if (time != null) {
    var age = getTimeInServerRefFrame().diff(time);
    if (age <= DEAD_RECKON_TIME_MS) {
      return "green";
    } else if (age <= DROP_TRACK_TIME_MS) {
      return "orange";
    }
  }
  return "red";
}

// Utility function to get a table cell colour class depending on squawk code
function getSquawkColor(squawk) {
  if (squawk != null && EMERGENCY_SQUAWKS.includes(squawk)) {
    return "red";
  } else {
    return "";
  }
}

// Utility function to get local PC time with data time offset applied.
function getTimeInServerRefFrame() {
  return moment().subtract(clockOffset, "seconds");
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
//      TABLE SETUP        //
/////////////////////////////

// Clicking selects the entity
$(document).on("click", "tr", function(e) {
  tableSelect($(e.currentTarget).attr("name"));
});


/////////////////////////////
//     CHECKBOX SETUP      //
/////////////////////////////


$("#followSelected").click(function() {
    followSelected = $(this).is(':checked');
});
$("#detailedmap").click(function() {
    detailedMap = $(this).is(':checked');
    updateMap();
});


/////////////////////////////
//     ENTITY SETUP        //
/////////////////////////////

var i = 0;
entities.set(i, new Entity(i, true, BASE_STATION_POS[0], BASE_STATION_POS[1], null, null, null, null, "Base Station", null, null, BASE_STATION_SYMBOL, BASE_STATION_SOFTWARE[0], BASE_STATION_SOFTWARE[1], null, moment()));
for (ap of AIRPORTS) {
  i++;
  entities.set(i, new Entity(i, true, ap.lat, ap.lon, null, null, null, null, ap.name, null, null, AIRPORT_SYMBOL, "", "", null, moment()));
}
updateMap();


/////////////////////////////
//   MOBILE PANEL SWITCH   //
/////////////////////////////
$("div#mobileswitcher").click(function() {
  $("div#tote").toggle();
  $("div#map").toggle();
});


/////////////////////////////
//          INIT           //
/////////////////////////////

// Pick which URL to use based on the query string parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var dump1090url = DUMP1090_URL;
if (urlParams.get("alt") == "true") {
  dump1090url = DUMP1090_URL_ALT;
}

// Set up the timed data request & update threads.
// Request data now and every 10 sec, this also updates the table at that point
// but additionally update the table every second so you see the data age counting
requestData();
setInterval(requestData, 10000);
setInterval(updateTable, 1000);
