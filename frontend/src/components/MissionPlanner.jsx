import { useEffect, useState } from "react";

import {
  CirclePlay,
  CircleStop,
  Download,
  MapPinned,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Waypoints,
} from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function MissionPlanner() {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [addWaypointMode, setAddWaypointMode] =
    useState(false);

  async function loadMission() {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/mission`
      );

      if (!response.ok) {
        throw new Error(
          "Mission request failed."
        );
      }

      const data =
        await response.json();

      setMission(data);
    } catch (error) {
      console.error(
        "Mission load error:",
        error
      );
    }
  }

  useEffect(() => {
    loadMission();

    const timer = setInterval(
      loadMission,
      2000
    );

    return () =>
      clearInterval(timer);
  }, []);

  /* =======================================================
     MAP WAYPOINT MODE
     ======================================================= */

  useEffect(() => {
    function handleMapWaypointAdded(
      event
    ) {
      if (!event.detail) {
        return;
      }

      loadMission();

      setMessage(
        "Waypoint added to mission."
      );

      setTimeout(
        () => setMessage(""),
        2500
      );
    }

    window.addEventListener(
      "guardian:waypoint-added",
      handleMapWaypointAdded
    );

    return () => {
      window.removeEventListener(
        "guardian:waypoint-added",
        handleMapWaypointAdded
      );
    };
  }, []);

  /* =======================================================
     API ACTION
     ======================================================= */

  async function request(
    endpoint,
    options = {},
    successMessage = ""
  ) {
    setLoading(true);

    try {
      const response =
        await fetch(
          `${BACKEND_URL}${endpoint}`,
          options
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Request failed."
        );
      }

      setMission(
        data.mission || data
      );

      if (successMessage) {
        setMessage(
          successMessage
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Mission operation error:",
        error
      );

      setMessage(
        error.message ||
          "Mission operation failed."
      );

      return null;
    } finally {
      setLoading(false);

      setTimeout(
        () => setMessage(""),
        2500
      );
    }
  }

  /* =======================================================
     WAYPOINT ALTITUDE
     ======================================================= */

  async function updateAltitude(
    waypoint,
    altitude
  ) {
    const value =
      Number(altitude);

    if (
      !Number.isFinite(value) ||
      value < 5 ||
      value > 500
    ) {
      return;
    }

    await request(
      `/api/mission/waypoint/${waypoint.id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          altitude: value,
        }),
      },
      `WP${waypoint.id} altitude updated.`
    );
  }

  /* =======================================================
     DELETE WAYPOINT
     ======================================================= */

  async function deleteWaypoint(
    waypointId
  ) {
    await request(
      `/api/mission/waypoint/${waypointId}`,
      {
        method: "DELETE",
      },
      `WP${waypointId} deleted.`
    );
  }

  /* =======================================================
     CURRENT WAYPOINT
     ======================================================= */

  async function setCurrentWaypoint(
    waypointId
  ) {
    await request(
      `/api/mission/current/${waypointId}`,
      {
        method: "POST",
      },
      `Current waypoint set to WP${waypointId}.`
    );
  }

  /* =======================================================
     CLEAR
     ======================================================= */

  async function clearMission() {
    if (
      !window.confirm(
        "Clear the entire mission?"
      )
    ) {
      return;
    }

    await request(
      "/api/mission",
      {
        method: "DELETE",
      },
      "Mission cleared."
    );
  }

  /* =======================================================
     START
     ======================================================= */

  async function startMission() {
    await request(
      "/api/mission/start",
      {
        method: "POST",
      },
      "Mission started."
    );
  }

  /* =======================================================
     PAUSE
     ======================================================= */

  async function pauseMission() {
    await request(
      "/api/mission/pause",
      {
        method: "POST",
      },
      "Mission paused."
    );
  }

  /* =======================================================
     RESUME
     ======================================================= */

  async function resumeMission() {
    await request(
      "/api/mission/resume",
      {
        method: "POST",
      },
      "Mission resumed."
    );
  }

  /* =======================================================
     STOP
     ======================================================= */

  async function stopMission() {
    await request(
      "/api/mission/stop",
      {
        method: "POST",
      },
      "Mission stopped."
    );
  }

  /* =======================================================
     DOWNLOAD JSON
     ======================================================= */

  function downloadMission() {
    if (!mission) {
      return;
    }

    const blob =
      new Blob(
        [
          JSON.stringify(
            mission,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `${mission.mission_id || "guardian-hawk-mission"}.json`;

    anchor.click();

    URL.revokeObjectURL(url);

    setMessage(
      "Mission JSON downloaded."
    );

    setTimeout(
      () => setMessage(""),
      2500
    );
  }

  /* =======================================================
     ENABLE MAP WAYPOINT MODE
     ======================================================= */

  function enableWaypointMode() {
    const next =
      !addWaypointMode;

    setAddWaypointMode(next);

    window.dispatchEvent(
      new CustomEvent(
        "guardian:map-mode",
        {
          detail: {
            mode: next
              ? "waypoint"
              : "normal",
          },
        }
      )
    );

    setMessage(
      next
        ? "Click the map to add a waypoint."
        : "Waypoint mode disabled."
    );

    setTimeout(
      () => setMessage(""),
      2500
    );
  }

  if (!mission) {
    return (
      <section className="mission-planner-panel">

        <div className="mission-planner-header">
          <div>
            <h2>
              Mission Planner
            </h2>

            <p>
              Loading mission data...
            </p>
          </div>
        </div>

      </section>
    );
  }

  const waypoints =
    mission.waypoints || [];

  return (
    <section className="mission-planner-panel">

      {/* HEADER */}

      <div className="mission-planner-header">

        <div className="mission-planner-title">

          <Waypoints size={19} />

          <div>
            <h2>
              Mission Planner
            </h2>

            <p>
              {mission.mission_id} •{" "}
              {mission.area}
            </p>
          </div>

        </div>

        <div className="mission-status-pill">
          <span></span>

          {mission.status}
        </div>

      </div>

      {/* TOOLBAR */}

      <div className="mission-toolbar">

        <button
          className={`mission-action primary ${
            addWaypointMode
              ? "active"
              : ""
          }`}
          onClick={
            enableWaypointMode
          }
        >
          <Plus size={15} />

          {addWaypointMode
            ? "CLICK MAP"
            : "ADD WAYPOINT"}
        </button>

        <button
          className="mission-action"
          onClick={loadMission}
        >
          <RotateCcw size={15} />

          REFRESH
        </button>

        <button
          className="mission-action"
          onClick={
            downloadMission
          }
        >
          <Download size={15} />

          DOWNLOAD
        </button>

        <button
          className="mission-action danger"
          onClick={
            clearMission
          }
        >
          <Trash2 size={15} />

          CLEAR
        </button>

      </div>

      {/* STATUS MESSAGE */}

      {message && (
        <div className="mission-message">
          {message}
        </div>
      )}

      {/* WAYPOINT TABLE */}

      <div className="mission-table-wrapper">

        <table className="mission-table">

          <thead>
            <tr>
              <th>WP</th>
              <th>STATUS</th>
              <th>LATITUDE</th>
              <th>LONGITUDE</th>
              <th>ALTITUDE</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>

            {waypoints.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="empty-mission"
                >
                  <MapPinned
                    size={22}
                  />

                  <span>
                    No waypoints.
                    Click ADD WAYPOINT
                    and select locations
                    on the map.
                  </span>
                </td>
              </tr>
            ) : (
              waypoints.map(
                (waypoint) => (
                  <tr
                    key={
                      waypoint.id
                    }
                  >

                    <td>
                      <span className="wp-number">
                        {waypoint.id}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`wp-status ${String(
                          waypoint.status
                        ).toLowerCase()}`}
                      >
                        {
                          waypoint.status
                        }
                      </span>
                    </td>

                    <td className="coordinate">
                      {Number(
                        waypoint.latitude
                      ).toFixed(6)}
                    </td>

                    <td className="coordinate">
                      {Number(
                        waypoint.longitude
                      ).toFixed(6)}
                    </td>

                    <td>

                      <div className="altitude-editor">

                        <input
                          type="number"
                          min="5"
                          max="500"
                          defaultValue={
                            waypoint.altitude
                          }
                          onBlur={(event) =>
                            updateAltitude(
                              waypoint,
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <span>
                          m
                        </span>

                      </div>

                    </td>

                    <td>

                      <div className="wp-actions">

                        <button
                          className="wp-current-button"
                          disabled={
                            loading ||
                            waypoint.status ===
                              "CURRENT"
                          }
                          onClick={() =>
                            setCurrentWaypoint(
                              waypoint.id
                            )
                          }
                          title="Set current waypoint"
                        >
                          <MapPinned
                            size={14}
                          />
                        </button>

                        <button
                          className="wp-delete-button"
                          disabled={
                            loading
                          }
                          onClick={() =>
                            deleteWaypoint(
                              waypoint.id
                            )
                          }
                          title="Delete waypoint"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* MISSION CONTROLS */}

      <div className="mission-control-bar">

        <div className="mission-control-group">

          <span className="mission-control-label">
            MISSION CONTROL
          </span>

          <button
            className="mission-control-button start"
            disabled={
              loading ||
              waypoints.length === 0
            }
            onClick={
              startMission
            }
          >
            <Play size={15} />

            START
          </button>

          {mission.status ===
          "PAUSED" ? (
            <button
              className="mission-control-button resume"
              disabled={loading}
              onClick={
                resumeMission
              }
            >
              <Play size={15} />

              RESUME
            </button>
          ) : (
            <button
              className="mission-control-button pause"
              disabled={
                loading ||
                mission.status !==
                  "ACTIVE"
              }
              onClick={
                pauseMission
              }
            >
              <Pause size={15} />

              PAUSE
            </button>
          )}

          <button
            className="mission-control-button stop"
            disabled={
              loading ||
              mission.status ===
                "READY"
            }
            onClick={
              stopMission
            }
          >
            <CircleStop size={15} />

            STOP
          </button>

        </div>

        <div className="mission-progress">

          <div className="mission-progress-top">

            <span>
              MISSION PROGRESS
            </span>

            <strong>
              {mission.progress || 0}%
            </strong>

          </div>

          <div className="mission-progress-track">
            <div
              className="mission-progress-fill"
              style={{
                width: `${
                  mission.progress ||
                  0
                }%`,
              }}
            />
          </div>

        </div>

      </div>

      {/* SIMULATION NOTICE */}

      <div className="mission-simulation-notice">

        <div>
          <strong>
            SIMULATION / PLANNER MODE
          </strong>

          <span>
            Mission editing is active.
            MAVLink upload to a real
            Pixhawk is not enabled yet.
          </span>
        </div>

        <div className="simulation-indicator">
          <CirclePlay size={15} />

          SIMULATION
        </div>

      </div>

    </section>
  );
}

export default MissionPlanner;