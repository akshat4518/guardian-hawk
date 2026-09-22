import {
  Route,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function MissionProgress() {

  const [mission, setMission] =
    useState(null);

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
          "Mission progress error:",
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


  const progress =
    Number(
      mission?.progress || 0
    );

  const currentWaypoint =
    mission?.current_waypoint ??
    0;

  const totalWaypoints =
    mission?.total_waypoints ??
    0;


  return (

    <section className="dashboard-card mission-progress-card">

      <div className="card-header">

        <div className="card-title">

          <Route size={19} />

          <h2>
            Mission Progress
          </h2>

        </div>

      </div>


      <div className="mission-progress">

        <div className="progress-header">

          <span>
            {mission?.status || "STANDBY"}
          </span>

          <strong>
            {progress}%
          </strong>

        </div>


        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  progress
                )
              )}%`,
            }}
          />

        </div>


        <div className="mission-details">

          <div className="mission-detail">

            <span>
              WAYPOINT
            </span>

            <strong>
              {currentWaypoint} / {totalWaypoints}
            </strong>

          </div>


          <div className="mission-detail">

            <span>
              AREA
            </span>

            <strong>
              {mission?.area || "--"}
            </strong>

          </div>


          <div className="mission-detail">

            <span>
              MISSION
            </span>

            <strong>
              {mission?.mission_id || "--"}
            </strong>

          </div>

        </div>


        <button
          type="button"
          className="abort-mission"
        >
          ABORT MISSION
        </button>

      </div>

    </section>

  );
}

export default MissionProgress;