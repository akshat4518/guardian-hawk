import {
  Flame,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function DisasterHeatmap() {

  const [data, setData] =
    useState(null);

  useEffect(() => {

    let mounted = true;

    async function loadData() {

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

        const result =
          await response.json();

        if (mounted) {
          setData(result);
        }

      } catch (error) {

        console.error(
          "Heatmap data error:",
          error
        );

      }

    }

    loadData();

    const timer =
      setInterval(
        loadData,
        3000
      );

    return () => {

      mounted = false;

      clearInterval(timer);

    };

  }, []);


  const detections =
    Number(
      data?.people_detected || 0
    );

  const confidence =
    Number(
      data?.confidence || 0
    );

  let intensity = "LOW";

  if (detections >= 10) {
    intensity = "HIGH";
  } else if (detections >= 5) {
    intensity = "MEDIUM";
  }


  return (

    <section className="dashboard-card heatmap-card">

      <div className="card-header">

        <div className="card-title">

          <Flame size={19} />

          <h2>
            Disaster Heatmap
          </h2>

        </div>

        <span>
          AI ANALYSIS
        </span>

      </div>


      <div className="heatmap-container">

        <div className="heatmap-grid" />

        <div className="heatmap-title">

          AI DISASTER INTENSITY

        </div>


        <div className="heatmap-zone zone-one" />

        <div className="heatmap-zone zone-two" />

        <div className="heatmap-zone zone-three" />


        <div className="heatmap-point point-one" />

        <div className="heatmap-point point-two" />

        <div className="heatmap-point point-three" />


        <span className="heatmap-zone-label zone-a">
          ZONE A
        </span>

        <span className="heatmap-zone-label zone-b">
          ZONE B
        </span>

        <span className="heatmap-zone-label zone-c">
          ZONE C
        </span>


        <div className="heatmap-legend">

          <div className="heatmap-legend-title">
            DISASTER INTENSITY
          </div>

          <div className="heat-gradient" />

          <div className="heat-labels">

            <span>
              LOW
            </span>

            <span>
              MEDIUM
            </span>

            <span>
              HIGH
            </span>

          </div>

        </div>


        <div className="heatmap-metrics">

          <div className="heatmap-metric">

            <span>
              DETECTIONS
            </span>

            <strong>
              {detections}
            </strong>

          </div>


          <div className="heatmap-metric">

            <span>
              CONFIDENCE
            </span>

            <strong>
              {confidence
                ? `${confidence}%`
                : "--"}
            </strong>

          </div>


          <div className="heatmap-metric">

            <span>
              INTENSITY
            </span>

            <strong>
              {intensity}
            </strong>

          </div>

        </div>

      </div>

    </section>

  );
}

export default DisasterHeatmap;