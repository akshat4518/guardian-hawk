import {
  Camera,
  Map,
  ScanSearch,
  Route,
  Settings,
} from "lucide-react";

function Header() {

  return (

    <header className="command-header">

      <div className="brand">

        <div className="brand-eagle">
          🦅
        </div>

        <div className="brand-text">

          <h1>
            GUARDIAN HAWK
          </h1>

          <p>
            AI-POWERED DISASTER RESPONSE DRONE
          </p>

        </div>

      </div>


      <nav className="main-navigation">

        <button
          className="navigation-item active"
          type="button"
        >

          <Camera size={18} />

          <span>
            Live View
          </span>

        </button>


        <button
          className="navigation-item"
          type="button"
        >

          <Map size={18} />

          <span>
            Map
          </span>

        </button>


        <button
          className="navigation-item"
          type="button"
        >

          <ScanSearch size={18} />

          <span>
            Detections
          </span>

        </button>


        <button
          className="navigation-item"
          type="button"
        >

          <Route size={18} />

          <span>
            Mission
          </span>

        </button>


        <button
          className="navigation-item"
          type="button"
        >

          <Settings size={18} />

          <span>
            Settings
          </span>

        </button>

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