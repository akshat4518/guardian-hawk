import { useEffect, useMemo, useRef, useState } from "react";

import {
  Map as MapIcon,
  Navigation,
  Target,
  Users,
} from "lucide-react";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

const FALLBACK_POSITION = {
  lat: 26.4499,
  lng: 80.3319,
};


/* =========================================================
   GOOGLE MAPS SCRIPT LOADER
   Uses the Google Maps JavaScript API directly.
   This keeps the rest of the Guardian Hawk dashboard unchanged.
   ========================================================= */

function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  // Google recommends the Dynamic Library Import bootstrap loader.
  // It guarantees that importLibrary() exists and avoids the timing issue
  // caused by checking google.maps.Map from a script load event.
  if (window.google?.maps?.importLibrary) {
    return Promise.all([
      window.google.maps.importLibrary("maps"),
      window.google.maps.importLibrary("marker"),
    ]).then(() => window.google.maps);
  }

  if (window.__guardianHawkGoogleMapsPromise) {
    return window.__guardianHawkGoogleMapsPromise;
  }

  window.__guardianHawkGoogleMapsPromise = new Promise((resolve, reject) => {
    let timeoutId = null;
    let script;

    const fail = (error) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      window.__guardianHawkGoogleMapsPromise = null;
      reject(error);
    };

    // Do not reuse an old direct-loader script from a previous Vite hot reload.
    const oldScript = document.getElementById("guardian-hawk-google-maps");
    if (oldScript) {
      oldScript.remove();
    }

    const google = (window.google = window.google || {});
    const maps = (google.maps = google.maps || {});

    if (maps.importLibrary) {
      Promise.all([
        maps.importLibrary("maps"),
        maps.importLibrary("marker"),
      ])
        .then(() => resolve(maps))
        .catch(fail);
      return;
    }

    const requestedLibraries = new Set();
    let bootstrapPromise;

    const loadBootstrap = () => {
      if (bootstrapPromise) return bootstrapPromise;

      bootstrapPromise = new Promise((bootstrapResolve, bootstrapReject) => {
        const params = new URLSearchParams();
        params.set("libraries", Array.from(requestedLibraries).join(","));
        params.set("key", apiKey);
        params.set("v", "weekly");
        params.set("loading", "async");

        const callbackName = "__guardianHawkGoogleMapsReady";
        params.set("callback", `google.maps.${callbackName}`);

        maps[callbackName] = () => {
          delete maps[callbackName];
          bootstrapResolve();
        };

        script = document.createElement("script");
        script.id = "guardian-hawk-google-maps";
        script.src =
          `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        script.async = true;
        script.defer = true;
        script.onerror = () =>
          bootstrapReject(
            new Error(
              "Google Maps JavaScript API could not be loaded. Check the API key, Maps JavaScript API, billing, and HTTP referrer restrictions."
            )
          );

        document.head.appendChild(script);
      });

      return bootstrapPromise;
    };

    // Install the same Dynamic Library Import contract used by Google's
    // official bootstrap loader.
    maps.importLibrary = (libraryName) => {
      requestedLibraries.add(libraryName);

      return loadBootstrap().then(() => {
        if (libraryName === "maps") {
          return {
            Map: maps.Map,
            RenderingType: maps.RenderingType,
            MapTypeId: maps.MapTypeId,
          };
        }

        if (libraryName === "marker") {
          return {
            AdvancedMarkerElement:
              maps.marker?.AdvancedMarkerElement,
            PinElement: maps.marker?.PinElement,
          };
        }

        return maps[libraryName] || maps;
      });
    };

    Promise.all([
      maps.importLibrary("maps"),
      maps.importLibrary("marker"),
    ])
      .then(() => {
        if (!maps.Map) {
          throw new Error(
            "Google Maps loaded, but the Maps library did not initialize."
          );
        }
        resolve(maps);
      })
      .catch(fail);

    timeoutId = window.setTimeout(() => {
      fail(
        new Error(
          "Google Maps JavaScript API timed out before the Maps library became available."
        )
      );
    }, 20000);
  });

  return window.__guardianHawkGoogleMapsPromise;
}

/* =========================================================
   ADVANCED MARKER HELPERS
   Google recommends AdvancedMarkerElement instead of the
   deprecated legacy google.maps.Marker class.
   ========================================================= */

function createMarkerContent({
  text = "",
  background = "#1597ff",
  size = 18,
  shape = "circle",
  fontSize = 11,
  rotate = 0,
}) {
  const element = document.createElement("div");

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.boxSizing = "border-box";
  element.style.background = background;
  element.style.color = "#ffffff";
  element.style.fontSize = `${fontSize}px`;
  element.style.fontWeight = "700";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.lineHeight = "1";
  element.style.border = "2px solid #ffffff";
  element.style.boxShadow = "0 1px 5px rgba(0,0,0,.55)";
  element.style.transform = `rotate(${rotate}deg)`;
  element.style.pointerEvents = "none";

  if (shape === "circle") {
    element.style.borderRadius = "50%";
  } else if (shape === "arrow") {
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.clipPath = "polygon(50% 0%, 100% 100%, 50% 76%, 0% 100%)";
    element.style.border = "none";
    element.style.boxShadow = "none";
  } else {
    element.style.borderRadius = "5px";
  }

  element.textContent = text;
  return element;
}

function removeAdvancedMarker(marker) {
  if (marker) {
    marker.map = null;
  }
}


/* =========================================================
   MAIN MAP
   ========================================================= */

function MapView() {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);

  const droneMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const waypointMarkersRef = useRef([]);
  const survivorMarkersRef = useRef([]);
  const flightPathRef = useRef(null);
  const searchAreaRef = useRef(null);

  const [telemetry, setTelemetry] = useState(null);
  const [mission, setMission] = useState(null);
  const [detections, setDetections] = useState(null);

  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsValid, setGpsValid] = useState(false);

  const [followDrone, setFollowDrone] = useState(true);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  /* =======================================================
     TELEMETRY
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadTelemetry() {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/telemetry?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Telemetry HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!mounted) {
          return;
        }

        setTelemetry(data);

        const latitude = Number(data.latitude);
        const longitude = Number(data.longitude);

        const validLatitude =
          Number.isFinite(latitude) &&
          latitude >= -90 &&
          latitude <= 90;

        const validLongitude =
          Number.isFinite(longitude) &&
          longitude >= -180 &&
          longitude <= 180;

        if (validLatitude && validLongitude) {
          setGpsPosition({
            lat: latitude,
            lng: longitude,
          });

          setGpsValid(true);
        } else {
          setGpsValid(false);
        }
      } catch (error) {
        console.error("Live GPS telemetry error:", error);

        if (mounted) {
          setGpsValid(false);
        }
      }
    }

    loadTelemetry();

    const timer = setInterval(loadTelemetry, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     MISSION
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadMission() {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/mission?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (mounted) {
          setMission(data);
        }
      } catch (error) {
        console.error("Mission data error:", error);
      }
    }

    loadMission();

    const timer = setInterval(loadMission, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     DETECTIONS
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadDetections() {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/detections?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (mounted) {
          setDetections(data);
        }
      } catch (error) {
        console.error("Detection data error:", error);
      }
    }

    loadDetections();

    const timer = setInterval(loadDetections, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     MAP DATA
     ======================================================= */

  const dronePosition =
    gpsPosition ||
    FALLBACK_POSITION;

  const flightPath = useMemo(() => {
    if (!Array.isArray(mission?.flight_path)) {
      return [];
    }

    return mission.flight_path
      .map((point) => ({
        lat: Number(point.latitude),
        lng: Number(point.longitude),
      }))
      .filter(
        (point) =>
          Number.isFinite(point.lat) &&
          Number.isFinite(point.lng)
      );
  }, [mission]);

  const searchArea = useMemo(() => {
    if (flightPath.length < 2) {
      return [];
    }

    const latitudes = flightPath.map((point) => point.lat);
    const longitudes = flightPath.map((point) => point.lng);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const padding = 0.00045;

    return [
      {
        lat: minLat - padding,
        lng: minLng - padding,
      },
      {
        lat: minLat - padding,
        lng: maxLng + padding,
      },
      {
        lat: maxLat + padding,
        lng: maxLng + padding,
      },
      {
        lat: maxLat + padding,
        lng: minLng - padding,
      },
    ];
  }, [flightPath]);

  const survivors = useMemo(() => {
    if (!Array.isArray(detections?.locations)) {
      return [];
    }

    return detections.locations
      .map((person, index) => ({
        ...person,
        id: person.id ?? index,
        latitude: Number(person.latitude),
        longitude: Number(person.longitude),
      }))
      .filter(
        (person) =>
          Number.isFinite(person.latitude) &&
          Number.isFinite(person.longitude)
      );
  }, [detections]);

  /* =======================================================
     INITIALIZE GOOGLE MAP
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!GOOGLE_MAPS_API_KEY) {
        setMapError("Google Maps API key is not configured.");
        return;
      }

      try {
        await loadGoogleMaps(
          GOOGLE_MAPS_API_KEY
        );

        if (cancelled || !mapElementRef.current) {
          return;
        }

        const googleMaps = window.google.maps;
        const { Map: GoogleMap } =
          await googleMaps.importLibrary("maps");
        await googleMaps.importLibrary("marker");

        if (cancelled || !mapElementRef.current || !GoogleMap) {
          throw new Error("Google Maps Map library is unavailable.");
        }

        const map = new GoogleMap(
          mapElementRef.current,
          {
            center: FALLBACK_POSITION,
            zoom: 17,
            mapTypeId: "satellite",
            gestureHandling: "greedy",
            clickableIcons: false,
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
            zoomControl: true,
            mapId: "DEMO_MAP_ID",
          }
        );

        mapRef.current = map;

        setMapReady(true);
        setMapError("");

        googleMaps.event.addListenerOnce(
          map,
          "tilesloaded",
          () => {
            if (!cancelled) {
              setMapReady(true);
              setMapError("");
            }
          }
        );
      } catch (error) {
        console.error("Guardian Hawk Google Maps error:", error);

        if (!cancelled) {
          setMapReady(false);
          setMapError(
            error?.message ||
              "Google Maps could not be loaded."
          );
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (droneMarkerRef.current) {
        removeAdvancedMarker(droneMarkerRef.current);
        droneMarkerRef.current = null;
      }

      if (homeMarkerRef.current) {
        removeAdvancedMarker(homeMarkerRef.current);
        homeMarkerRef.current = null;
      }

      waypointMarkersRef.current.forEach(
        (marker) => removeAdvancedMarker(marker)
      );

      survivorMarkersRef.current.forEach(
        (marker) => removeAdvancedMarker(marker)
      );

      waypointMarkersRef.current = [];
      survivorMarkersRef.current = [];

      if (flightPathRef.current) {
        flightPathRef.current.setMap(null);
        flightPathRef.current = null;
      }

      if (searchAreaRef.current) {
        searchAreaRef.current.setMap(null);
        searchAreaRef.current = null;
      }

      mapRef.current = null;
    };
  }, []);

  /* =======================================================
     UPDATE MAP CENTER
     ======================================================= */

  useEffect(() => {
    if (!mapRef.current || !followDrone) {
      return;
    }

    mapRef.current.panTo(dronePosition);
  }, [
    dronePosition.lat,
    dronePosition.lng,
    followDrone,
  ]);

  /* =======================================================
     DRAW MAP OBJECTS
     ======================================================= */

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const map = mapRef.current;

    /* -----------------------------
       DRONE MARKER
       ----------------------------- */

    if (!droneMarkerRef.current) {
      const AdvancedMarkerElement =
        googleMaps.marker?.AdvancedMarkerElement;

      if (!AdvancedMarkerElement) {
        throw new Error(
          "Google Maps AdvancedMarkerElement is unavailable. The marker library did not load."
        );
      }

      droneMarkerRef.current =
        new AdvancedMarkerElement({
          map,
          position: dronePosition,
          title: "Guardian Hawk Drone",
          zIndex: 100,
          content: createMarkerContent({
            background: "#1597ff",
            size: 26,
            shape: "arrow",
            rotate: 0,
          }),
        });
    } else {
      droneMarkerRef.current.position = dronePosition;
    }

    /* -----------------------------
       FLIGHT PATH
       ----------------------------- */

    if (flightPathRef.current) {
      flightPathRef.current.setMap(null);
      flightPathRef.current = null;
    }

    if (flightPath.length >= 2) {
      flightPathRef.current =
        new googleMaps.Polyline({
          map,
          path: flightPath,
          strokeColor: "#32d66d",
          strokeOpacity: 0.85,
          strokeWeight: 3,
          clickable: false,
          zIndex: 10,
        });
    }

    /* -----------------------------
       SEARCH AREA
       ----------------------------- */

    if (searchAreaRef.current) {
      searchAreaRef.current.setMap(null);
      searchAreaRef.current = null;
    }

    if (searchArea.length >= 3) {
      searchAreaRef.current =
        new googleMaps.Polygon({
          map,
          paths: searchArea,
          fillColor: "#ff5b38",
          fillOpacity: 0.08,
          strokeColor: "#ff7657",
          strokeOpacity: 0.55,
          strokeWeight: 2,
          clickable: false,
          zIndex: 5,
        });
    }

    /* -----------------------------
       HOME
       ----------------------------- */

    if (homeMarkerRef.current) {
      removeAdvancedMarker(homeMarkerRef.current);
      homeMarkerRef.current = null;
    }

    if (mission?.home) {
      const homePosition = {
        lat: Number(mission.home.latitude),
        lng: Number(mission.home.longitude),
      };

      if (
        Number.isFinite(homePosition.lat) &&
        Number.isFinite(homePosition.lng)
      ) {
        const AdvancedMarkerElement =
          googleMaps.marker?.AdvancedMarkerElement;

        if (!AdvancedMarkerElement) {
          throw new Error(
            "Google Maps AdvancedMarkerElement is unavailable. The marker library did not load."
          );
        }

        homeMarkerRef.current =
          new AdvancedMarkerElement({
            map,
            position: homePosition,
            title: "Home",
            zIndex: 40,
            content: createMarkerContent({
              text: "H",
              background: "#111b23",
              size: 24,
              fontSize: 12,
            }),
          });
      }
    }

    /* -----------------------------
       WAYPOINTS
       ----------------------------- */

    waypointMarkersRef.current.forEach(
      (marker) => removeAdvancedMarker(marker)
    );

    waypointMarkersRef.current = [];

    if (Array.isArray(mission?.waypoints)) {
      mission.waypoints.forEach((waypoint) => {
        const position = {
          lat: Number(waypoint.latitude),
          lng: Number(waypoint.longitude),
        };

        if (
          !Number.isFinite(position.lat) ||
          !Number.isFinite(position.lng)
        ) {
          return;
        }

        const AdvancedMarkerElement =
          googleMaps.marker?.AdvancedMarkerElement;

        if (!AdvancedMarkerElement) {
          return;
        }

        const marker =
          new AdvancedMarkerElement({
            map,
            position,
            title: `Waypoint ${waypoint.id}`,
            zIndex: 30,
            content: createMarkerContent({
              text: String(waypoint.id),
              background: "#22c77a",
              size: 20,
              fontSize: 9,
            }),
          });

        waypointMarkersRef.current.push(marker);
      });
    }

    /* -----------------------------
       SURVIVORS
       ----------------------------- */

    survivorMarkersRef.current.forEach(
      (marker) => removeAdvancedMarker(marker)
    );

    survivorMarkersRef.current = [];

    survivors.forEach((person) => {
      const AdvancedMarkerElement =
        googleMaps.marker?.AdvancedMarkerElement;

      if (!AdvancedMarkerElement) {
        return;
      }

      const marker =
        new AdvancedMarkerElement({
          map,
          position: {
            lat: person.latitude,
            lng: person.longitude,
          },
          title: "Detected Person",
          zIndex: 50,
          content: createMarkerContent({
            background: "#ff3d4d",
            size: 16,
          }),
        });

      survivorMarkersRef.current.push(marker);
    });
  }, [
    mapReady,
    dronePosition.lat,
    dronePosition.lng,
    mission,
    flightPath,
    searchArea,
    survivors,
  ]);

  /* =======================================================
     KEY CHECK
     ======================================================= */

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <section className="dashboard-card map-card">
        <div className="card-header">
          <div className="card-title">
            <MapIcon size={19} />
            <h2>Map View</h2>
          </div>
        </div>

        <div className="map-error">
          Google Maps API key is not configured.
        </div>
      </section>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="dashboard-card map-card">

      <div className="card-header">

        <div className="card-title">
          <MapIcon size={19} />
          <h2>Map View</h2>
        </div>

        <div className="map-status">
          <span
            className={
              gpsValid
                ? "gps-live-dot"
                : "gps-waiting-dot"
            }
          />

          <span>
            {gpsValid
              ? "LIVE GPS"
              : "GPS UNAVAILABLE"}
          </span>
        </div>

      </div>

      <div
        className="command-map"
        style={{
          position: "relative",
          width: "100%",
          height: "382px",
          minHeight: "382px",
          overflow: "hidden",
        }}
      >

        {/* REAL GOOGLE MAP CANVAS */}

        <div
          ref={mapElementRef}
          className="google-map-canvas"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* MAP LOADING / ERROR */}

        {!mapReady && (
          <div className="map-loading-overlay">
            <div>
              <MapIcon size={26} />
              <strong>
                {mapError
                  ? "GOOGLE MAPS UNAVAILABLE"
                  : "LOADING GOOGLE MAPS"}
              </strong>

              <span>
                {mapError ||
                  "Connecting to Google Maps satellite imagery..."}
              </span>
            </div>
          </div>
        )}

        {/* MAP TELEMETRY */}

        <div className="map-live-status">

          <div>
            <span>DRONE</span>
            <strong>
              {telemetry?.drone_id || "GH-01"}
            </strong>
          </div>

          <div>
            <span>ALT</span>
            <strong>
              {Number(
                telemetry?.altitude || 0
              ).toFixed(1)}
              {" m"}
            </strong>
          </div>

          <div>
            <span>SAT</span>
            <strong>
              {telemetry?.satellites ?? "--"}
            </strong>
          </div>

          <div>
            <span>SOURCE</span>
            <strong>
              {telemetry?.simulation_mode
                ? "SIM"
                : "PIXHAWK"}
            </strong>
          </div>

        </div>

        {/* COORDINATES */}

        <div className="map-coordinates">

          <Target size={12} />

          <span>
            {dronePosition.lat.toFixed(6)}
            {" , "}
            {dronePosition.lng.toFixed(6)}
          </span>

        </div>

        {/* FOLLOW BUTTON */}

        <button
          type="button"
          className={
            `map-follow-button ${
              followDrone ? "active" : ""
            }`
          }
          onClick={() =>
            setFollowDrone(
              (value) => !value
            )
          }
        >
          <Navigation size={11} />

          {followDrone
            ? "FOLLOW DRONE"
            : "FOLLOW OFF"}
        </button>

        {/* DETECTION COUNT */}

        <div className="map-detection-count">

          <Users size={12} />

          <span>
            {detections?.people_detected ?? 0}
          </span>

          <small>PEOPLE</small>

        </div>

        {/* LEGEND */}

        <div className="map-legend">

          <div>
            <span className="legend-drone">
              <Navigation size={10} />
            </span>
            <span>Drone</span>
          </div>

          <div>
            <span className="legend-waypoint" />
            <span>Waypoint</span>
          </div>

          <div>
            <span className="legend-person" />
            <span>Detected Person</span>
          </div>

          <div>
            <span className="legend-area" />
            <span>Search Area</span>
          </div>

        </div>

      </div>
    </section>
  );
}

export default MapView;
