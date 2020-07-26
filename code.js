/////////////////////////////
//      GLOBAL VARS        //
/////////////////////////////

// You can provide a main and alternate URL, e.g. one for use from the public internet
// and one for use when you are on the same LAN as the machine running Dump1090.
// Select the alternate URL by appending ?alt=true to the URL for UMID1090.
// Normal users won't do this and will therefore use the main public URL, but you
// can bookmark the "alt" version to always use your LAN address for testing.
var DUMP1090_URL = window.location.protocol + "//mciserver.zapto.org/dump1090-fa/";
var DUMP1090_URL_ALT = "http://192.168.1.241/dump1090-fa/";

// Map server URLs - if re-using this code you will need to provide your own Mapbox
// access token in the Mapbox URL. You can still use my style.
var MAPBOX_URL = "https://api.mapbox.com/styles/v1/ianrenton/ckchhz5ks23or1ipf1le41g56/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaWFucmVudG9uIiwiYSI6ImNrY2h4ZzU1ejE1eXoyc25uZjRvMmkyc2IifQ.JN65BkQfwQQIDfpMP_fFIQ";
var OPENAIP_URL = "https://{s}.tile.maps.openaip.net/geowebcache/service/tms/1.0.0/openaip_basemap@EPSG%3A900913@png/{z}/{x}/{y}.png";

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

// From https://en.wikipedia.org/wiki/List_of_airline_codes. I've just added common
// ones for my area because there are a lot of duplicates across different countries
var AIRLINE_CODES = new Map([
  ["RYR", "Ryanair"],
  ["BAW", "British Airways"],
  ["EZY", "EasyJet"],
  ["EXS", "Jet2"],
  ["KLM", "KLM"],
  ["TFL", "TUI"],
  ["TOM", "TUI"],
  ["VIR", "Virgin Atlantic"],
  ["AAL", "American Airlines"],
  ["UAL", "United Airlines"],
  ["DAL", "Delta Airlines"],
  ["TAM", "LATAM Brasil"],
  ["WGN", "Western Global"],
  ["SWN", "West Air Sweden"],
  ["QTR", "Qatar Airways"],
  ["IBE", "Iberia"],
  ["VLG", "Vueling Airlines"],
  ["EIN", "Aer Lingus"],
  ["WUK", "Wizz Air"],
  ["TAP", "TAP Air Portugal"],
  ["FDX", "FedEx"],
  ["UPS", "UPS"],
  ["ETP", "Empire Test Pilots"],
  ["CLF", "Bristol Flying Centre"],
  ["MLT", "Maleth Aero"],
  ["UKP", "Police"],
  ["HLE", "Air Ambulance"],
  ["CG", "Coastguard"],
  ["RRR", "Royal Air Force"],
  ["ASCOT", "Royal Air Force"],
  ["COMET", "Royal Air Force"],
  ["NOH", "RAF Northolt 32 Sqdn"],
  ["AAC", "Army Air Corps"],
  ["SHF", "Joint Helicopter Command"],
  ["BWY", "736 Naval Air Sqdn"],
  ["RCH", "U.S. Air Mobility Command"]
]);
// Symbol overrides for certain airline codes, principally military
var AIRLINE_CODE_SYMBOLS = new Map([
  ["UKP", "EUOPDJ------"],
  ["HLE", "EUOPAF------"],
  ["CG", "SFAPMHH-----"],
  ["RRR", "SFAPMFC-----"],
  ["ASCOT", "SFAPMFC-----"],
  ["COMET", "SFAPMFC-----"],
  ["NOH", "SFAPM-------"],
  ["AAC", "SFAPM-------"],
  ["SHF", "SFAPMHUH----"],
  ["BWY", "SFAPMF------"],
  ["RCH", "SFAPMFC-----"]
]);

// More globals - you should not have to edit beyond this point unless you want
// to change how the software works!
var MACH_TO_KNOTS = 666.739;
var KNOTS_TO_MPS = 0.514444;
var CIVILIAN_AIRCRAFT_SYMBOL = "SUAPCF----";
var BASE_STATION_SYMBOL = "SFGPUUS-----";
var AIRPORT_SYMBOL = "SFGPIBA---H";
var CATEGORY_DESCRIPTIONS = new Map([
  ["A0", ""],
  ["A1", "Light"],
  ["A2", "Small"],
  ["A3", "Large"],
  ["A4", "High Vortex"],
  ["A5", "Heavy"],
  ["A6", "High Perf"],
  ["A7", "Rotary Wing"],
  ["B0", ""],
  ["B1", "Glider"],
  ["B2", "Lighter-than-Air"],
  ["B3", "Para"],
  ["B4", "Ultralight"],
  ["B5", ""],
  ["B6", "UAV"],
  ["B7", "Space"],
  ["C0", ""],
  ["C1", "Emergency Veh."],
  ["C2", "Service Veh."],
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
var historyStore = [];
var dataRefreshIntervalMS = 10000;
var clockOffset = 0; // Local PC time (UTC) minus data time. Used to prevent data appearing as too new or old if the local PC clock is off.
var selectedEntityHex = "";
var snailTrailLength = 500;
var firstFetch = true;
var followSelected = false;
var snailTrailLength = 500;
var snailTrailsMode = 1; // 0 = none, 1 = only selected, 2 = all
var deadReckonTimeMS = 1000; // Fixed on a very short time to always show dead reckoned position, like FlightRadar24
var showAnticipatedTimeMS = 60000;
var dropTrackTimeMS = 300000;
var detailedMap = true;


/////////////////////////////
//        CLASSES          //
/////////////////////////////

// Entity class.
// Altitude is stored in feet, heading/lat/lon in degrees, speed in knots.
class Entity {
  // ICAO Hex code
  hex = null;
  // Fixed (base station) or mobile (aircraft)
  fixed = null;
  // Position history
  positionHistory = [];
  // Heading (deg)
  heading = null;
  // Altitude (ft)
  altitude = null;
  // Altitude rate (ft/s)
  altRate = null;
  // Speed (knots)
  speed = null;
  // Flight ID
  flight = null;
  // Registration / tail number
  registration = null
  // Squawk (4 digit octal)
  squawk = null;
  // Mode S category (A0, A1...)
  category = null;
  // Type derived from hex code
  icaotype = null;
  // Received signal strength (dB)
  rssi = null;
  // Last time any data was updated
  updateTime = null;
  // Last time position was updated
  posUpdateTime = null;
  // Last time altitude rate was updated
  altRateUpdateTime = null;

  // Create new entity
  constructor(hex, fixed) {
    this.hex = hex;
    this.fixed = fixed;
    if (!fixed) {
      this.getMetadata();
    }
  }

  // Get metadata based on the ICAO hex code, using functions from
  // dump1090
  getMetadata() {
    getAircraftData(this.hex, dump1090url).done(function(data) {
      if ("r" in data) {
        this.registration = data.r.trim();
      }
      if ("t" in data) {
        this.icaotype = data.t.trim();
      }
      if ("desc" in data) {
        this.typeDescription = data.desc.trim();
      }
      if ("wtc" in data) {
        this.wtc = data.wtc.trim();
      }
    }.bind(this));
  }

  // Internalise own data from the provided Dump1090 aircraft object
  internalise(a, dataTime) {
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
    var bestAltRate = a.geom_rate / 60.0;
    if (a.baro_rate != null) {
      bestAltRate = a.baro_rate / 60.0;
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
    var seen = moment.unix(dataTime).utc();
    if (a.seen != null) {
      seen = seen.subtract(a.seen, 'seconds');
    }
    var posSeen = null;
    if (a.lat != null) {
      posSeen = moment.unix(dataTime).utc();
      if (a.seen_pos != null) {
        posSeen = posSeen.subtract(a.seen_pos, 'seconds');
      }
    }

    // Set internal variables
    this.rssi = a.rssi;
    this.updateTime = seen;

    if (a.lat != null) {
      this.addPosition(a.lat, a.lon);
    }
    if (bestHeading != null) {
      this.heading = bestHeading;
    }
    if (bestAlt != null) {
      this.altitude = bestAlt;
    }
    if (bestAltRate != null) {
      this.altRate = bestAltRate;
      this.altRateUpdateTime = seen;
    }
    if (a.mach != null) {
      this.speed = bestSpeed;
    }
    if (a.flight != null) {
      this.flight = a.flight.trim();
    }
    if (a.squawk != null) {
      this.squawk = a.squawk;
    }
    if (a.category != null) {
      this.category = a.category.trim();
    }
    if (posSeen != null) {
      this.posUpdateTime = posSeen;
    }
  }

  // Update its position, adding to the history
  addPosition(lat, lon) {
    // Trim the snail trail if required
    this.trimSnailTrail();

    // Add the new entry
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

  // Get the latest known altitude to the nearest 100 ft
  getAltitude() {
    if (this.altitude != null && !isNaN(this.altitude)) {
      return Math.max(0, (this.altitude / 100).toFixed(0) * 100);
    } else {
      return null;
    }
  }

  // Get the dead reckoned altitude based on its last altitude update plus
  // altitude rate at that time
  drAltitude() {
    if (this.altitude != null && !isNaN(this.altitude) && this.altRateUpdateTime != null && this.altRate != null) {
      // Can dead reckon
      var timePassedSec = getTimeInServerRefFrame().diff(this.posUpdateTime) / 1000.0;
      var drAlt = this.altitude + (this.altRate * timePassedSec);
      return Math.max(0, (drAlt / 100).toFixed(0) * 100);
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

  // Gets an altitude for the icon, either getAltitude() or drAltitude() as required
  iconAltitude() {
    var alt = this.getAltitude();
    if (this.oldEnoughToDR() && this.drAltitude() != null) {
      alt = this.drAltitude();
    }
    return alt;
  }

  // Is the track old enough that we should display the track as an anticipated
  // position?
  oldEnoughToShowAnticipated() {
    return !this.fixed && this.posUpdateTime != null && getTimeInServerRefFrame().diff(this.posUpdateTime) > showAnticipatedTimeMS;
  }

  // Is the track old enough that we should dead reckon the position?
  oldEnoughToDR() {
    return !this.fixed && this.posUpdateTime != null && getTimeInServerRefFrame().diff(this.posUpdateTime) > deadReckonTimeMS;
  }

  // Is the track old enough that we should drop it?
  oldEnoughToDelete() {
    return !this.fixed && getTimeInServerRefFrame().diff(this.updateTime) > dropTrackTimeMS;
  }

  // Generate the name for display on the map. Prefer flight ID, then registration,
  // finally just the hex code
  mapDisplayName() {
    if (this.flight != null && this.flight != "") {
      return this.flight;
    } else if (this.registration != null && this.registration != "") {
      return this.registration;
    } else {
      return "HEX " + this.hex;
    }
  }

  // Generate the name for display on the table. Prefer flight ID, then registration,
  // finally blank
  tableDisplayName() {
    if (this.flight != null && this.flight != "") {
      return "<a href='https://flightaware.com/live/flight/" + this.flight + "' target='_blank'>" + this.flight + "</a>";
    } else if (this.registration != null && this.registration != "") {
      return this.registration;
    } else {
      return "---";
    }
  }

  // Generate a "type" for display in the map. Prefer a hex-derived type
  // plus Mode S category description, otherwise just use category.
  mapDisplayType() {
    var type = ""
    if (this.icaotype != null && this.icaotype != "") {
      type = this.icaotype;
      if (this.category != null && this.category != "" && CATEGORY_DESCRIPTIONS.has(this.category) && CATEGORY_DESCRIPTIONS.get(this.category) != "") {
        type = type + " (" + CATEGORY_DESCRIPTIONS.get(this.category) + ")";
      }
    } else if (this.category != null && this.category != "") {
      type = "(" + this.category;
      if (CATEGORY_DESCRIPTIONS.has(this.category) && CATEGORY_DESCRIPTIONS.get(this.category) != "") {
        type = type + " " + CATEGORY_DESCRIPTIONS.get(this.category);
      }
      type = type + ")";
    }
    return type;
  }

  // Generate a "type" for display in the table. Prefer a hex-derived type,
  // otherwise use Mode S category.
  tableDisplayType() {
    if (this.icaotype != null && this.icaotype != "") {
      return "<a href='https://uk.flightaware.com/photos/aircrafttype/" + this.icaotype + "' target='_blank'>" + this.icaotype + "</a>";
    } else if (this.category != null && this.category != "") {
      return "(" + this.category + ")";
    } else {
      return "---";
    }
  }

  // Generate symbol code
  symbolCode() {
    if (this.hex != null && this.hex.startsWith("BASE")) {
      return BASE_STATION_SYMBOL;
    } else if (this.hex != null && this.hex.startsWith("AIRPORT")) {
      return AIRPORT_SYMBOL;
    } else {
      // Generate symbol based on airline code and/or category
      var airlineCode = this.airlineCode();
      var symbol = CIVILIAN_AIRCRAFT_SYMBOL;
      if (airlineCode != null && AIRLINE_CODE_SYMBOLS.has(airlineCode)) {
        symbol = AIRLINE_CODE_SYMBOLS.get(airlineCode);
      } else if (this.category != null && CATEGORY_SYMBOLS.has(this.category)) {
        symbol = CATEGORY_SYMBOLS.get(this.category);
      }

      // Change symbol to "anticipated" if old enough
      if (this.oldEnoughToShowAnticipated()) {
        symbol = symbol.substr(0, 3) + "A" + symbol.substr(4);
      }
      return symbol;
    }
  }

  // Generate first "description" line
  firstDescrip() {
    if (this.hex != null && this.hex.startsWith("BASE")) {
      return BASE_STATION_SOFTWARE[0];
    } else if (this.hex != null && this.hex.startsWith("AIRPORT")) {
      return "";
    } else {
      return this.mapDisplayType();
    }
  }

  // Generate second "description" line. Generally the airline name
  secondDescrip() {
    if (this.hex != null && this.hex.startsWith("BASE")) {
      return BASE_STATION_SOFTWARE[1];
    } else if (this.hex != null && this.hex.startsWith("AIRPORT")) {
      return "";
    } else {
      var airline = "";
      var airlineCode = this.airlineCode();
      if (airlineCode != null) {
        if (AIRLINE_CODES.has(airlineCode)) {
          airline = AIRLINE_CODES.get(airlineCode);
        }
      }
      return airline;
    }
  }

  // Get the airline code from the flight name
  airlineCode() {
    if (this.flight != null && this.flight != "") {
      var matches = /^[a-zA-Z]*/.exec(this.flight.trim());
      return matches[0].toUpperCase();
    }
    return null;
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

    // Generate full symbol for display
    var mysymbol = new ms.Symbol(this.symbolCode(), {
      size: 35,
      staffComments: detailedMap ? this.firstDescrip().toUpperCase() : "",
      additionalInformation: detailedMap ? this.secondDescrip().toUpperCase() : "",
      direction: (this.heading != null) ? this.heading : "",
      altitudeDepth: (this.iconAltitude() != null && detailedMap) ? ("FL" + this.iconAltitude() / 100) : "",
      speed: (this.speed != null && detailedMap) ? (this.speed.toFixed(0) + "KTS") : "",
      type: this.mapDisplayName().toUpperCase(),
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
    if (this.positionHistory.length > 0 && this.oldEnoughToDR() && this.drPosition() != null) {
      var points = [this.position(), this.drPosition()];
      return L.polyline(points, {
        color: (this.entitySelected() ? '#4581CC' : '#007F0E'),
        dashArray: "5 5"
      });
    } else {
      return null;
    }
  }

  // Trim the snail trail if required
  trimSnailTrail() {
    while (this.positionHistory.length >= snailTrailLength) {
      this.positionHistory.shift();
    }
  }
}


/////////////////////////////
//       FUNCTIONS         //
/////////////////////////////

// JSON history retrieval method (only called once at startup). This just
// queries for history data and populates the historyStore variable, this
// is then later used in processHistory().
function requestHistory() {
  var url = dump1090url + "/data/receiver.json";
  $.getJSON(url, function(data) {
    // Got receiver metadata. Set tracker status
    $("span#trackerstatus").html("ONLINE, LOADING HISTORY...");
    setTrackerStatus("waiting");
    // Iterate through all history files. This could be up to 120!
    var historyFileCount = data.history;
    var i;
    for (i = 0; i < historyFileCount; i++) {
      var url = dump1090url + "/data/history_" + i + ".json";
      $.getJSON(url, async function(data) {
        // Got history data, store it. We don't want to process it immediately
        // because history data is not ordered; we need to store it first then
        // order it as soon as we think all the data will have arrived.
        historyStore.push(data);
      });
    }
  });
}

// Take whatever history data we have managed to acquire at this point,
// sort by date, push all the updates into the main data store, delete anything
// old. After this function finishes, we are then ready to start receiving
// live data on top of the historical data.
function processHistory() {
  $("span#trackerstatus").html("ONLINE, PROCESSING HISTORY...");

  // At startup we did one initial retrieve of live data so we had a nice display
  // from the start. Now we have history data to load in which is older. So,
  // delete the existing live data first.
  entities.forEach(function(e) {
    if (e.fixed == false) {
      entities.delete(e.hex);
    }
  });

  // History data could have come in any order, so first sort it.
  historyStore.sort((a, b) => (a.now > b.now) ? 1 : -1);

  // Now use it
  for (item of historyStore) {
    handleData(item, false);
  }

  // Drop anything timed out
  dropTimedOutAircraft();

  // Now trigger retrieval of a new set of live data, to top off the history
  requestLiveData();
}

// JSON live data retrieval method. This is the main data request
// function which gets called every 10 seconds to update the internal
// data store
function requestLiveData() {
  var url = dump1090url + "/data/aircraft.json?_=" + (new Date()).getTime();
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
      // On first fetch, update the display since the separate table updater thread
      // won't be running yet. Subsequently the thread takes over so we don't need
      // to do it here.
      if (firstFetch) {
        updateAll();
      }
      firstFetch = false;
      // Request the next run of the request at the defined interval.
      setTimeout(requestLiveData, dataRefreshIntervalMS);
    }
  });
}

// Handle successful receive of data
async function handleSuccess(result) {
  // Set tracker status
  if (!firstFetch) {
    if (result.aircraft.length > 0) {
      $("span#trackerstatus").html("ONLINE, TRACKING " + result.aircraft.length + " AIRCRAFT");
      setTrackerStatus("good");
    } else {
      $("span#trackerstatus").html("ONLINE, NO AIRCRAFT DETECTED");
      setTrackerStatus("warning");
    }
  }

  // Update the data store
  handleData(result, true);
}

// Update the internal data store with the provided data
function handleData(result, live) {
  // Debug
  //console.log(JSON.stringify(result));

  // Update clock offset (local PC time - data time) - only if data
  // is live rather than historic data being loaded in
  if (live) {
    clockOffset = moment().diff(moment.unix(result.now).utc(), 'seconds');
  }

  // Add/update aircraft in entity list
  for (a of result.aircraft) {
    if (!entities.has(a.hex)) {
      // Doesn't exist, so create
      entities.set(a.hex, new Entity(a.hex, false));
    }
    entities.get(a.hex).internalise(a, result.now);
  }
}

// Handle a failure to receive data
async function handleFailure() {
  $("span#trackerstatus").html("TRACKER OFFLINE");
  setTrackerStatus("error");
}

// Drop any aircraft too old to be displayed
function dropTimedOutAircraft() {
  entities.forEach(function(e) {
    if (e.oldEnoughToDelete()) {
      entities.delete(e.hex);
    }
  });
}

// Update map, table and drop timed out aircraft. Run every second to
// keep the display up to date.
async function updateAll() {
  dropTimedOutAircraft();
  updateMap();
  updateTable();
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
  if (snailTrailsMode > 0) {
    entities.forEach(function(e) {
      if (snailTrailsMode == 2 || e.hex == selectedEntityHex) {
        markersLayer.addLayer(e.trail());
      }
    });
    entities.forEach(function(e) {
      if ((snailTrailsMode == 2 || e.hex == selectedEntityHex) && e.drTrail() != null) {
        markersLayer.addLayer(e.drTrail());
      }
    });
  }

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
  var headerFields = "<th>HEX</th><th>FLIGHT</th><th>SQU</th><th>TYPE</th><th>LAT</th><th>LON</th><th>ALT<br>FL</th><th>HDG<br>DEG</th><th>SPD<br>KTS</th><th>SIG<br>dB</th><th>POS<br/>AGE</th><th>DATA<br/>AGE</th>";
  var header = $('<tr class="data">').html(headerFields);
  table.append(header);

  // Create table rows
  var rows = 0;
  tableList.forEach(function(e) {
    // Only real aircraft
    if (e.fixed == false) {
      // Altitude rate symbol
      var altRateSymb = "";
      if (e.altRate != null && e.altRate > 2) {
        altRateSymb = "\u25b2";
      } else if (e.altRate != null && e.altRate < -2) {
        altRateSymb = "\u25bc";
      }

      // Generate table row
      var rowFields = "<td><a href='https://flightaware.com/live/modes/" + e.hex + "/redirect' target='_blank'>" + e.hex.toUpperCase() + "</a></td>";
      rowFields += "<td>" + e.tableDisplayName() + "</td>";
      rowFields += "<td class='" + getSquawkColor(e.squawk) + "'>" + ((e.squawk != null) ? e.squawk : "---") + "</td>";
      rowFields += "<td>" + e.tableDisplayType() + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[0]).toFixed(4).padStart(7, '0') + ((e.position()[0] >= 0) ? 'N' : 'S')) : "---") + "</td>";
      rowFields += "<td>" + ((e.position() != null) ? (Math.abs(e.position()[1]).toFixed(4).padStart(8, '0') + ((e.position()[1] >= 0) ? 'E' : 'W')) : "---") + "</td>";
      rowFields += "<td>" + ((e.getAltitude() != null && !isNaN(e.getAltitude())) ? ((e.getAltitude() / 100) + altRateSymb) : "---") + "</td>";
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
  // If on mobile and the map is hidden, setView won't work properly,
  // so switch to the map first
  if ($('#map').is(':hidden')) {
    $("div#tote").toggle();
    $("div#map").toggle();
  }
  map.setView(START_LAT_LON, START_ZOOM);
}

// Utility function to get a table cell colour class depending on data age
function getAgeColor(time) {
  if (time != null) {
    var age = getTimeInServerRefFrame().diff(time);
    if (age <= showAnticipatedTimeMS) {
      return "green";
    } else if (age <= dropTrackTimeMS) {
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

// Sets the tracker status CSS class to the provided one, removing any
// others
function setTrackerStatus(newStatus) {
  var options = ["waiting", "good", "warning", "error"];
  for (o of options) {
    if (o == newStatus) {
      $("span#trackerstatus").addClass("trackerstatus" + o);
    } else {
      $("span#trackerstatus").removeClass("trackerstatus" + o);
    }
  }
}

// Utility function to get local PC time with data time offset applied.
function getTimeInServerRefFrame() {
  return moment().subtract(clockOffset, "seconds");
}


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
//     CONTROLS SETUP      //
/////////////////////////////


$("#followSelected").click(function() {
  followSelected = $(this).is(':checked');
});
$("#detailedmap").click(function() {
  detailedMap = $(this).is(':checked');
  updateMap();
});
$("#snailTrails").change(function() {
  snailTrailsMode = parseInt($(this).val());
  updateMap();
});
$("#snailTrailLength").change(function() {
  snailTrailLength = parseInt($(this).val());
  entities.forEach(function(e) { e.trimSnailTrail(); });
  updateMap();
});
$("#refreshTime").change(function() {
  dataRefreshIntervalMS = parseInt($(this).val()) * 1000;
  requestLiveData();
});
$("#deadReckonTime").change(function() {
  deadReckonTimeMS = parseInt($(this).val()) * 1000;
  updateAll();
});
$("#showAnticipatedTime").change(function() {
  showAnticipatedTimeMS = parseInt($(this).val()) * 1000;
  updateAll();
});
$("#dropTrackTime").change(function() {
  dropTrackTimeMS = parseInt($(this).val()) * 1000;
  updateAll();
});


/////////////////////////////
//     ENTITY SETUP        //
/////////////////////////////

var base = new Entity("BASE", true);
base.addPosition(BASE_STATION_POS[0], BASE_STATION_POS[1]);
base.flight = "Base Station";
entities.set("BASE", base);

var i = 0;
for (ap of AIRPORTS) {
  i++;
  var e = new Entity("AIRPORT" + i, true);
  e.addPosition([ap.lat, ap.lon]);
  e.flight = ap.name;
  entities.set("AIRPORT" + i, e);
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
//        KICK-OFF         //
/////////////////////////////

// The loading procedure is quite complex. Dump 1090 provides both history
// data and live data. We want to load the history data first, so we have
// as much info (e.g. snail trails) to plot, however it takes a while to
// load as it can be up to 120 separate requests. So the procedure is:
// 1) Get a single shot of live data, so the display comes up populated ASAP
// 2) Update map and table once, at the end of that process.
// 3) Kick off all the history requests asynchronously
// 4) Wait 9 seconds
// 5) Delete the single shot of live data and replace it with the full
//    history store of data
// 6) Run another single shot of live data, appending to the end of the
//    history
// 7) Update display once, at the end of that process.
// 8) We are now fully up-to-date, so now kick off the two interval
//    processes that will request new live data every 10 seconds, and
//    update the display every second.

// First do a one-off live data request so we have something to display.
requestLiveData();

// Now grab the history data. The request calls are asynchronous,
// so we have an additional call after 9 seconds (just before live data is
// first requested) to unpack and use whatever history data we have at that
// point.
requestHistory();
setTimeout(processHistory, 9000);

// Set up the timed data request & update threads.
// The timed data update is done as a timeout not an interval, and it calls
// its own setTimeout after it finishes, to trigger timed requests. It's
// done this way so we can change the polling interval interactively.
setTimeout(requestLiveData, dataRefreshIntervalMS);
// The display updater is done as an interval, every second.
setInterval(updateAll, 1000);
