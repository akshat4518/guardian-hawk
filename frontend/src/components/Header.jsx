import {
  Camera,
  Map,
  ScanSearch,
  Route,
  Settings,
} from "lucide-react";

function Header({ activePage, onNavigate }) {
  const navigation = [
    {
      id: "live",
      label: "Live View",
      icon: Camera,
    },
    {
      id: "map",
      label: "Map",
      icon: Map,
    },
    {
      id: "detections",
      label: "Detections",
      icon: ScanSearch,
    },
    {
      id: "mission",
      label: "Mission",
      icon: Route,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <header className="command-header">
      <div className="brand">
        <div className="brand-eagle">
          🦅
        </div>

        <div className="brand-text">
          <h1>GUARDIAN HAWK</h1>

          <p>
            AI-POWERED DISASTER RESPONSE DRONE
          </p>
        </div>
      </div>

      <nav className="main-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`navigation-item ${
                activePage === item.id
                  ? "active"
                  : ""
              }`}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />

              <span>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="connection-area">
        <div className="connection">
          <span className="connection-dot" />

          <div>
            <strong>
              Connected
            </strong>

            <span>
              Drone: GH-01
            </span>
          </div>
        </div>

        <div className="header-time">
          <span>
            SEP 21, 2026
          </span>

          <strong>
            LIVE
          </strong>
        </div>
      </div>
    </header>
  );
}

export default Header;