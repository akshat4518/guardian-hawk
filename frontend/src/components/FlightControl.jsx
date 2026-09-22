import { useEffect, useState } from "react";

import {
  Power,
  PlaneTakeoff,
  RotateCcw,
  ArrowDownToLine,
  Play,
  Pause,
  Square,
  Radio,
  RefreshCw,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

function FlightControl() {
  const [telemetry, setTelemetry] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/telemetry`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setTelemetry(data);
      setConnectionError(false);
    } catch (error) {
      console.error(
        "Flight control telemetry error:",
        error
      );

      setTelemetry(null);
      setConnectionError(true);
    }
  };

  useEffect(() => {
    fetchTelemetry();

    const interval = setInterval(
      fetchTelemetry,
      2000
    );

    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (endpoint) => {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Command failed: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      setMessage(
        data.message ||
          (data.success
            ? "Command accepted"
            : "Command completed")
      );

      await fetchTelemetry();

    } catch (error) {
      console.error(
        "Flight command error:",
        error
      );

      setMessage(
        "Command failed. Check backend connection."
      );
    } finally {
      setBusy(false);
    }
  };

  const armed = telemetry?.armed ?? false;
  const flightMode =
    telemetry?.flight_mode ?? "—";

  const connected =
    Boolean(telemetry?.connected) &&
    !connectionError;

  const simulationMode =
    telemetry?.simulation_mode ?? true;

  return (
    <section className="flight-control-panel">

      {/* Header */}
      <div className="flight-control-header">

        <div>
          <h2>
            <Radio size={18} />
            Flight Control
          </h2>

          <p>
            ArduPilot Mission Control
          </p>
        </div>

        <div className="flight-mode">
          <span>MODE</span>
          <strong>{flightMode}</strong>
        </div>

      </div>

      {/* MAVLink connection */}
      <div className="flight-connection">

        <span
          className={
            connected
              ? "connection-dot connected"
              : "connection-dot"
          }
        />

        <span>
          {connected
            ? "MAVLink Connected"
            : "MAVLink Offline"}
        </span>

        {!connected && (
          <button
            type="button"
            onClick={fetchTelemetry}
            className="connection-refresh"
            title="Retry connection"
          >
            <RefreshCw size={14} />
          </button>
        )}

      </div>

      {/* Vehicle status */}
      <div className="arm-status">

        <span>VEHICLE STATUS</span>

        <strong
          className={
            armed
              ? "armed"
              : "disarmed"
          }
        >
          {armed
            ? "ARMED"
            : "DISARMED"}
        </strong>

      </div>

      {/* Safety */}
      <div className="control-group">

        <div className="control-label">
          Safety
        </div>

        <div className="control-buttons">

          <button
            className="control-button arm-button"
            onClick={() =>
              sendCommand(
                "/api/flight/arm"
              )
            }
            disabled={
              busy ||
              !connected ||
              armed
            }
          >
            <Power size={17} />
            ARM
          </button>

          <button
            className="control-button"
            onClick={() =>
              sendCommand(
                "/api/flight/disarm"
              )
            }
            disabled={
              busy ||
              !connected ||
              !armed
            }
          >
            <Power size={17} />
            DISARM
          </button>

        </div>
      </div>

      {/* Flight */}
      <div className="control-group">

        <div className="control-label">
          Flight
        </div>

        <div className="control-buttons">

          <button
            className="control-button"
            onClick={() =>
              sendCommand(
                "/api/flight/takeoff?altitude=30"
              )
            }
            disabled={
              busy ||
              !connected ||
              !armed
            }
          >
            <PlaneTakeoff size={17} />
            TAKEOFF
          </button>

          <button
            className="control-button"
            onClick={() =>
              sendCommand(
                "/api/flight/rtl"
              )
            }
            disabled={
              busy ||
              !connected
            }
          >
            <RotateCcw size={17} />
            RTL
          </button>

          <button
            className="control-button"
            onClick={() =>
              sendCommand(
                "/api/flight/land"
              )
            }
            disabled={
              busy ||
              !connected
            }
          >
            <ArrowDownToLine size={17} />
            LAND
          </button>

        </div>
      </div>

      {/* Mission */}
      <div className="control-group">

        <div className="control-label">
          Mission
        </div>

        <div className="control-buttons">

          <button
            className="control-button"
            onClick={() =>
              setMessage(
                "Mission start requested"
              )
            }
            disabled={
              busy ||
              !connected
            }
          >
            <Play size={17} />
            START
          </button>

          <button
            className="control-button"
            onClick={() =>
              setMessage(
                "Mission pause requested"
              )
            }
            disabled={
              busy ||
              !connected
            }
          >
            <Pause size={17} />
            PAUSE
          </button>

          <button
            className="control-button"
            onClick={() =>
              setMessage(
                "Mission stop requested"
              )
            }
            disabled={
              busy ||
              !connected
            }
          >
            <Square size={17} />
            STOP
          </button>

        </div>
      </div>

      {/* Command message */}
      {message && (
        <div className="command-message">
          {message}
        </div>
      )}

      {/* Safety notice */}
      <div className="control-warning">

        <strong>
          {simulationMode
            ? "SIMULATION MODE"
            : "LIVE VEHICLE"}
        </strong>

        <p>
          {simulationMode
            ? "Commands currently affect the simulated vehicle state only."
            : "Commands can affect the connected aircraft."}
        </p>

      </div>

    </section>
  );
}

export default FlightControl;