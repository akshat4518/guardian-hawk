import {
  ScanSearch,
  Users,
  ShieldAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function DetectionPanel() {

  const [data, setData] =
    useState(null);

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

        const result =
          await response.json();

        if (mounted) {
          setData(result);
        }

      } catch (error) {

        console.error(
          "Detection panel error:",
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


  const locations =
    Array.isArray(
      data?.locations
    )
      ? data.locations
      : [];


  return (

    <section className="dashboard-card detection-card">

      <div className="card-header">

        <div className="card-title">

          <ScanSearch size={19} />

          <h2>
            Detections
          </h2>

        </div>

        <strong>
          {data?.people_detected ?? 0} Detected
        </strong>

      </div>


      <div className="detection-summary">

        <div className="detection-stat">

          <span>
            People
          </span>

          <strong>
            {data?.people_detected ?? 0}
          </strong>

        </div>


        <div className="detection-stat">

          <span>
            Confidence
          </span>

          <strong>
            {data?.confidence
              ? `${data.confidence}%`
              : "--"}
          </strong>

        </div>


        <div className="detection-stat">

          <span>
            Priority
          </span>

          <strong>
            {data?.rescue_priority || "--"}
          </strong>

        </div>

      </div>


      <div className="detection-list">

        {locations.length === 0 ? (

          <div className="empty-state">
            No detections available.
          </div>

        ) : (

          locations.map(
            (person, index) => (

              <div
                className="detection-row"
                key={
                  person.id ??
                  index
                }
              >

                <div className="detection-number">
                  {index + 1}
                </div>


                <div className="detection-info">

                  <strong>
                    Person Detected
                  </strong>

                  <span>
                    {
                      Number(
                        person.latitude
                      ).toFixed(5)
                    }
                    {" , "}
                    {
                      Number(
                        person.longitude
                      ).toFixed(5)
                    }
                  </span>

                </div>


                <div className="detection-confidence">

                  {
                    person.confidence
                      ? `${person.confidence}%`
                      : "--"
                  }

                </div>

              </div>

            )
          )

        )}

      </div>


      <div
        className="detection-footer"
      >

        <ShieldAlert
          size={13}
        />

        <span>
          Rescue Priority:
        </span>

        <strong>
          {data?.rescue_priority || "--"}
        </strong>

      </div>

    </section>

  );
}

export default DetectionPanel;