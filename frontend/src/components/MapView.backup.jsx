import { useEffect, useMemo, useState } from "react";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polygon,
  Polyline,
  useMap,
} from "@vis.gl/react-google-maps";

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


/* =========================================================
   FALLBACK POSITION
   Only used if backend telemetry is unavailable.
   ========================================================= */

const FALLBACK_POSITION = {
  lat: 26.4499,
  lng: 80.3319,
};


/* =========================================================
   LIVE MAP FOLLOW CONTROLLER
   ========================================================= */

function LiveMapController({
  position,
  followDrone,
}) {
  const map = useMap();

  useEffect(() => {

    if (!map) {
      return;
    }

    if (!followDrone) {
      return;
    }

    if (!position) {
      return;
    }

    map.panTo({
      lat: position.lat,
      lng: position.lng,
    });

  }, [
    map,
    position?.lat,
    position?.lng,
    followDrone,
  ]);

  return null;
}


/* =========================================================
   MAIN MAP
   ========================================================= */

function MapView() {

  const [telemetry, setTelemetry] =
    useState(null);

  const [mission, setMission] =
    useState(null);

  const [detections, setDetections] =
    useState(null);

  const [gpsPosition, setGpsPosition] =
    useState(null);

  const [gpsValid, setGpsValid] =
    useState(false);

  const [followDrone, setFollowDrone] =
    useState(true);


  /* =======================================================
     TELEMETRY
     ======================================================= */

  useEffect(() => {

    let mounted = true;

    async function loadTelemetry() {

      try {

        const response =
          await fetch(
            `${BACKEND_URL}/api/telemetry?t=${Date.now()}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `Telemetry HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!mounted) {
          return;
        }

        setTelemetry(data);

        const latitude =
          Number(data.latitude);

        const longitude =
          Number(data.longitude);

        const validLatitude =
          Number.isFinite(latitude) &&
          latitude >= -90 &&
          latitude <= 90;

        const validLongitude =
          Number.isFinite(longitude) &&
          longitude >= -180 &&
          longitude <= 180;

        if (
          validLatitude &&
          validLongitude
        ) {

          setGpsPosition({
            lat: latitude,
            lng: longitude,
          });

          setGpsValid(true);

        } else {

          setGpsValid(false);

        }

      } catch (error) {

        console.error(
          "Live GPS telemetry error:",
          error
        );

        if (mounted) {
          setGpsValid(false);
        }

      }
    }


    loadTelemetry();

    const timer =
      setInterval(
        loadTelemetry,
        1000
      );


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

        const response =
          await fetch(
            `${BACKEND_URL}/api/mission?t=${Date.now()}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (mounted) {
          setMission(data);
        }

      } catch (error) {

        console.error(
          "Mission data error:",
          error
        );

      }
    }


    loadMission();

    const timer =
      setInterval(
        loadMission,
        3000
      );


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

        const response =
          await fetch(
            `${BACKEND_URL}/api/detections?t=${Date.now()}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (mounted) {
          setDetections(data);
        }

      } catch (error) {

        console.error(
          "Detection data error:",
          error
        );

      }
    }


    loadDetections();

    const timer =
      setInterval(
        loadDetections,
        3000
      );


    return () => {

      mounted = false;

      clearInterval(timer);

    };

  }, []);


  /* =======================================================
     ACTUAL MAP POSITION
     ======================================================= */

  const dronePosition =
    gpsPosition ||
    FALLBACK_POSITION;


  /* =======================================================
     FLIGHT PATH
     ======================================================= */

  const flightPath =
    useMemo(() => {

      if (
        !Array.isArray(
          mission?.flight_path
        )
      ) {
        return [];
      }

      return mission.flight_path
        .map((point) => {

          return {
            lat:
              Number(point.latitude),

            lng:
              Number(point.longitude),
          };

        })
        .filter(
          (point) =>
            Number.isFinite(point.lat) &&
            Number.isFinite(point.lng)
        );

    }, [mission]);


  /* =======================================================
     SEARCH AREA
     ======================================================= */

  const searchArea =
    useMemo(() => {

      if (flightPath.length < 2) {
        return [];
      }

      const latitudes =
        flightPath.map(
          point => point.lat
        );

      const longitudes =
        flightPath.map(
          point => point.lng
        );

      const minLat =
        Math.min(...latitudes);

      const maxLat =
        Math.max(...latitudes);

      const minLng =
        Math.min(...longitudes);

      const maxLng =
        Math.max(...longitudes);

      const padding =
        0.00045;

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


  /* =======================================================
     SURVIVORS
     ======================================================= */

  const survivors =
    useMemo(() => {

      if (
        !Array.isArray(
          detections?.locations
        )
      ) {
        return [];
      }

      return detections.locations

        .map(
          (person, index) => {

            return {
              ...person,

              id:
                person.id ??
                index,

              latitude:
                Number(
                  person.latitude
                ),

              longitude:
                Number(
                  person.longitude
                ),
            };

          }
        )

        .filter(
          person =>
            Number.isFinite(
              person.latitude
            ) &&
            Number.isFinite(
              person.longitude
            )
        );

    }, [detections]);


  /* =======================================================
     GOOGLE MAP KEY CHECK
     ======================================================= */

  if (!GOOGLE_MAPS_API_KEY) {

    return (
      <section className="dashboard-card map-card">

        <div className="card-header">

          <div className="card-title">

            <MapIcon size={19} />

            <h2>
              Map View
            </h2>

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

          <h2>
            Map View
          </h2>

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

            {
              gpsValid
                ? "LIVE GPS"
                : "GPS UNAVAILABLE"
            }

          </span>

        </div>

      </div>


      {/* ==================================================
          GOOGLE SATELLITE MAP
          ================================================== */}

      <div className="command-map">

        <APIProvider
          apiKey={
            GOOGLE_MAPS_API_KEY
          }

          libraries={[
            "marker",
          ]}
        >

          <Map

            defaultCenter={
              FALLBACK_POSITION
            }

            defaultZoom={17}

            mapTypeId="satellite"

            mapId="DEMO_MAP_ID"

            gestureHandling="greedy"

            disableDefaultUI={false}

            clickableIcons={false}

            streetViewControl={false}

            fullscreenControl={true}

            mapTypeControl={true}

            zoomControl={true}

            style={{
              width: "100%",
              height: "100%",
            }}

          >

            <LiveMapController
              position={
                gpsPosition
              }
              followDrone={
                followDrone
              }
            />


            {/* SEARCH AREA */}

            {searchArea.length >= 3 && (

              <Polygon

                paths={
                  searchArea
                }

                options={{

                  fillColor:
                    "#ff5b38",

                  fillOpacity:
                    0.08,

                  strokeColor:
                    "#ff7657",

                  strokeOpacity:
                    0.55,

                  strokeWeight:
                    2,

                  clickable:
                    false,

                }}

              />

            )}


            {/* FLIGHT PATH */}

            {flightPath.length >= 2 && (

              <Polyline

                path={
                  flightPath
                }

                options={{

                  strokeColor:
                    "#32d66d",

                  strokeOpacity:
                    0.85,

                  strokeWeight:
                    3,

                  clickable:
                    false,

                }}

              />

            )}


            {/* HOME */}

            {mission?.home && (

              <AdvancedMarker

                position={{

                  lat:
                    Number(
                      mission.home.latitude
                    ),

                  lng:
                    Number(
                      mission.home.longitude
                    ),

                }}

              >

                <div className="map-home-marker">

                  H

                </div>

              </AdvancedMarker>

            )}


            {/* WAYPOINTS */}

            {Array.isArray(
              mission?.waypoints
            ) &&

              mission.waypoints.map(
                waypoint => (

                  <AdvancedMarker

                    key={
                      `waypoint-${waypoint.id}`
                    }

                    position={{

                      lat:
                        Number(
                          waypoint.latitude
                        ),

                      lng:
                        Number(
                          waypoint.longitude
                        ),

                    }}

                  >

                    <div
                      className={
                        `map-waypoint ${
                          String(
                            waypoint.status ||
                            ""
                          ).toLowerCase()
                        }`
                      }
                    >

                      {
                        waypoint.id
                      }

                    </div>

                  </AdvancedMarker>

                )
              )
            }


            {/* SURVIVORS */}

            {survivors.map(
              person => (

                <AdvancedMarker

                  key={
                    `survivor-${person.id}`
                  }

                  position={{

                    lat:
                      person.latitude,

                    lng:
                      person.longitude,

                  }}

                >

                  <div
                    className={
                      `map-survivor ${
                        String(
                          person.priority ||
                          "medium"
                        ).toLowerCase()
                      }`
                    }
                  >

                    <span />

                  </div>

                </AdvancedMarker>

              )
            )}


            {/* LIVE DRONE */}

            <AdvancedMarker
              position={
                dronePosition
              }
            >

              <div className="map-drone">

                <Navigation
                  size={17}
                />

              </div>

            </AdvancedMarker>

          </Map>

        </APIProvider>


        {/* MAP TELEMETRY */}

        <div className="map-live-status">

          <div>

            <span>
              DRONE
            </span>

            <strong>
              {
                telemetry?.drone_id ||
                "GH-01"
              }
            </strong>

          </div>


          <div>

            <span>
              ALT
            </span>

            <strong>

              {
                Number(
                  telemetry?.altitude || 0
                ).toFixed(1)
              }

              {" m"}

            </strong>

          </div>


          <div>

            <span>
              SAT
            </span>

            <strong>
              {
                telemetry?.satellites ??
                "--"
              }
            </strong>

          </div>


          <div>

            <span>
              SOURCE
            </span>

            <strong>
              {
                telemetry?.simulation_mode
                  ? "SIM"
                  : "PIXHAWK"
              }
            </strong>

          </div>

        </div>


        {/* COORDINATES */}

        <div className="map-coordinates">

          <Target
            size={12}
          />

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
              followDrone
                ? "active"
                : ""
            }`
          }

          onClick={() =>
            setFollowDrone(
              value => !value
            )
          }

        >

          <Navigation
            size={11}
          />

          {
            followDrone
              ? "FOLLOW DRONE"
              : "FOLLOW OFF"
          }

        </button>


        {/* DETECTION COUNT */}

        <div className="map-detection-count">

          <Users
            size={12}
          />

          <span>

            {
              detections?.people_detected ??
              0
            }

          </span>

          <small>
            PEOPLE
          </small>

        </div>


        {/* LEGEND */}

        <div className="map-legend">

          <div>

            <span className="legend-drone">

              <Navigation
                size={10}
              />

            </span>

            <span>
              Drone
            </span>

          </div>


          <div>

            <span className="legend-waypoint" />

            <span>
              Waypoint
            </span>

          </div>


          <div>

            <span className="legend-person" />

            <span>
              Detected Person
            </span>

          </div>


          <div>

            <span className="legend-area" />

            <span>
              Search Area
            </span>

          </div>

        </div>

      </div>

    </section>

  );
}


export default MapView;