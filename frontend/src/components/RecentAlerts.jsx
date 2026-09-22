import {
  Bell,
} from "lucide-react";

function RecentAlerts() {

  const alerts = [

    {
      time: "14:26",
      message: "Person detected (92%)",
    },

    {
      time: "14:24",
      message: "Person detected (87%)",
    },

    {
      time: "14:21",
      message: "Person detected (90%)",
    },

    {
      time: "14:18",
      message: "Entering search area B",
    },

    {
      time: "14:15",
      message: "Mission started",
    },

  ];


  return (

    <section className="dashboard-card alerts-card">

      <div className="card-header">

        <div className="card-title">

          <Bell size={19} />

          <h2>
            Recent Alerts
          </h2>

        </div>

        <button
          type="button"
          className="view-all"
        >
          View All →
        </button>

      </div>


      <div className="alert-list">

        {alerts.map(
          (alert) => (

            <div
              className="alert-row"
              key={
                `${alert.time}-${alert.message}`
              }
            >

              <span>
                {alert.time}
              </span>

              <strong>
                {alert.message}
              </strong>

            </div>

          )
        )}

      </div>

    </section>

  );
}

export default RecentAlerts;