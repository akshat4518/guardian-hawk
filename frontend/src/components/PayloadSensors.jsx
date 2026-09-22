import {
  Camera,
  Cpu,
  Navigation,
  Radar,
} from "lucide-react";

function PayloadSensors() {

  return (

    <section className="dashboard-card payload-card">

      <div className="card-header">

        <div className="card-title">

          <Radar size={19} />

          <h2>
            Payload & Sensors
          </h2>

        </div>

      </div>


      <div className="sensor-list">

        <div className="sensor-row">

          <Camera />

          <span>
            RGB Camera
          </span>

          <strong>
            Active (1080p)
          </strong>

        </div>


        <div className="sensor-row">

          <Radar />

          <span>
            LiDAR (TF-LUNA)
          </span>

          <strong>
            2.8 m
          </strong>

        </div>


        <div className="sensor-row">

          <Navigation />

          <span>
            GPS (NEO-M8N)
          </span>

          <strong>
            Connected
          </strong>

        </div>


        <div className="sensor-row">

          <Cpu />

          <span>
            Pixhawk
          </span>

          <strong>
            MAVLink
          </strong>

        </div>

      </div>

    </section>

  );
}

export default PayloadSensors;