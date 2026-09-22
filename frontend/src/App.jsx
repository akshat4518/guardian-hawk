import Header from "./components/Header";

import DroneStatus from "./components/DroneStatus";
import PayloadSensors from "./components/PayloadSensors";
import MissionProgress from "./components/MissionProgress";

import LiveCamera from "./components/LiveCamera";
import MapView from "./components/MapView";

import DetectionPanel from "./components/DetectionPanel";
import DisasterHeatmap from "./components/DisasterHeatmap";
import RecentAlerts from "./components/RecentAlerts";

import "./index.css";

function App() {
  return (
    <div className="app">

      <Header />

      <main className="command-dashboard">

        <aside className="left-column">

          <DroneStatus />

          <PayloadSensors />

          <MissionProgress />

        </aside>

        <section className="center-column">

          <LiveCamera />

          <MapView />

        </section>

        <aside className="right-column">

          <DetectionPanel />

          <DisasterHeatmap />

          <RecentAlerts />

        </aside>

      </main>

    </div>
  );
}

export default App;