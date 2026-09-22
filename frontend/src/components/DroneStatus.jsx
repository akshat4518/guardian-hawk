import {
  Gauge,
  BatteryMedium,
  MapPin,
  Navigation,
  Radio,
  Satellite,
} from "lucide-react";

import { useEffect, useState } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function DroneStatus() {

  const [telemetry, setTelemetry] =
    useState(null);

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
          return;
        }

        const data =
          await response.json();

        if (mounted) {
          setTelemetry(data);
        }

      } catch (error) {

        console.error(
          "Drone telemetry error:",
          error
        );

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


  const altitude =
    Number(
      telemetry?.altitude || 0
    );

  const speed =
    Number(
      telemetry?.speed || 0
    );

  const battery =
    Number(
      telemetry?.battery || 0
    );

  const satellites =
    telemetry?.satellites ?? "--";

  const latitude =
    Number(
      telemetry?.latitude
    );

  const longitude =
    Number(
      telemetry?.longitude
    );

  const gpsValid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);


  return (

    <section className="dashboard-card drone-status-card">

      <div className="card-header">

        <div className="card-title">

          <Navigation size={19} />

          <h2>
            Drone Status
          </h2>

        </div>

        <span
          className={
            `status-badge ${
              telemetry?.connected
                ? "active"
                : "offline"
            }`
          }
        >

          {
            telemetry?.connected
              ? "CONNECTED"
              : "OFFLINE"
          }

        </span>

      </div>


      <div className="status-list">

        <div className="status-row">

          <Gauge size={16} />

          <span>
            Altitude
          </span>

          <strong>
            {altitude.toFixed(1)} m
          </strong>

        </div>


        <div className="status-row">

          <Gauge size={16} />

          <span>
            Speed
          </span>

          <strong>
            {speed.toFixed(1)} m/s
          </strong>

        </div>


        <div className="status-row">

          <BatteryMedium size={16} />

          <span>
            Battery
          </span>

          <div className="battery-value">

            <div className="battery-bar">

              <div
                className="battery-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      battery
                    )
                  )}%`,
                }}
              />

            </div>

            <strong>
              {battery}%
            </strong>

          </div>

        </div>


        <div className="status-row">

          <MapPin size={16} />

          <span>
            GPS
          </span>

          <strong
            className="gps-value"
          >

            {
              gpsValid
                ? `${latitude.toFixed(5)} N`
                : "--"
            }

            <br />

            {
              gpsValid
                ? `${longitude.toFixed(5)} E`
                : ""
            }

          </strong>

        </div>


        <div className="status-row">

          <Navigation size={16} />

          <span>
            Flight Mode
          </span>

          <strong>
            {
              telemetry?.flight_mode ||
              "--"
            }
          </strong>

        </div>


        <div className="status-row">

          <Satellite size={16} />

          <span>
            Satellites
          </span>

          <strong>
            {satellites}
          </strong>

        </div>


        <div className="status-row">

          <Radio size={16} />

          <span>
            Signal
          </span>

          <strong
            className="signal-good"
          >
            MAVLink
          </strong>

        </div>

      </div>


      <div className="telemetry-source">

        <span>
          DATA SOURCE
        </span>

        <strong>
          {
            telemetry?.simulation_mode
              ? "SIMULATION"
              : "PIXHAWK"
          }
        </strong>

      </div>

    </section>

  );
}

export default DroneStatus;