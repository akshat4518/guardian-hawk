import { Radio, Plane, ShieldCheck } from "lucide-react";

import DroneStatus from "./DroneStatus";
import FlightControl from "./FlightControl";
import MissionPlanner from "./MissionPlanner";
import "./MissionControl.css";

function MissionControl() {
  return (
    <main className="mission-control-page">
      <div className="mission-control-topbar">
        <div className="mission-control-title">
          <div className="mission-control-icon">
            <Plane size={20} />
          </div>

          <div>
            <h1>MISSION CONTROL</h1>
            <p>ArduPilot Ground Control Interface</p>
          </div>
        </div>

        <div className="mission-control-status">
          <div className="mission-status-item">
            <Radio size={15} />
            <span>MAVLink</span>
            <strong>SIMULATION</strong>
          </div>

          <div className="mission-status-item">
            <ShieldCheck size={15} />
            <span>Safety</span>
            <strong>READY</strong>
          </div>
        </div>
      </div>

      <div className="mission-control-grid">
        <section className="mission-vehicle-column">
          <DroneStatus />
        </section>

        <section className="mission-planner-column">
          <MissionPlanner />
        </section>

        <section className="mission-flight-column">
          <FlightControl />
        </section>
      </div>
    </main>
  );
}

export default MissionControl;