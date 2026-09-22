import {
  Camera,
  Circle,
  ScanSearch,
  Users,
} from "lucide-react";

function LiveCamera() {

  return (

    <section className="dashboard-card live-camera-card">

      <div className="card-header">

        <div>

          <div className="card-title">

            <Camera size={19} />

            <div>

              <h2>
                Live Camera
              </h2>

              <span className="card-subtitle">
                GH-01 • RGB AI SURVEILLANCE
              </span>

            </div>

          </div>

        </div>


        <div className="camera-status">

          <span className="live-dot" />

          LIVE

        </div>

      </div>


      <div className="camera-view">

        <div className="camera-overlay top-left">

          <span className="overlay-label">
            CAM
          </span>

          <strong>
            GH-01
          </strong>

        </div>


        <div className="camera-overlay top-right">

          <span className="live-dot" />

          RGB

        </div>


        <div className="camera-placeholder">

          <Camera
            size={46}
            strokeWidth={1.5}
          />

          <h3>
            RGB AI Camera Feed
          </h3>

          <p>
            Waiting for Raspberry Pi camera stream...
          </p>

          <span>
            1080p • YOLO AI Detection Ready
          </span>

        </div>


        <div className="camera-overlay bottom-left">

          <ScanSearch
            size={13}
          />

          <span>
            AI DETECTION
          </span>

          <strong>
            READY
          </strong>

        </div>


        <div className="camera-overlay bottom-right">

          <Users
            size={13}
          />

          <span>
            OBJECTS
          </span>

          <strong>
            0
          </strong>

        </div>

      </div>

    </section>

  );
}

export default LiveCamera;