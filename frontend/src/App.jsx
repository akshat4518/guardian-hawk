import { useState } from "react";

import Header from "./components/Header";

import DroneStatus from "./components/DroneStatus";
import PayloadSensors from "./components/PayloadSensors";
import MissionProgress from "./components/MissionProgress";

import LiveCamera from "./components/LiveCamera";
import MapView from "./components/MapView";

import DetectionPanel from "./components/DetectionPanel";
import DisasterHeatmap from "./components/DisasterHeatmap";
import RecentAlerts from "./components/RecentAlerts";

import MissionControl from "./components/MissionControl";

import "./index.css";

function LiveView() {
  return (
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
  );
}

function App() {
  const [activePage, setActivePage] =
    useState("live");

  return (
    <div className="app">
      <Header
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {activePage === "live" && (
        <LiveView />
      )}

      {activePage === "mission" && (
        <MissionControl />
      )}

      {activePage === "map" && (
        <LiveView />
      )}

      {activePage === "detections" && (
        <LiveView />
      )}

      {activePage === "settings" && (
        <LiveView />
      )}
    </div>
  );
}

export default App;