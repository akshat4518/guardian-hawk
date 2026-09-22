import math
import time


class MAVLinkService:

    def __init__(self):

        # ============================================
        # CONNECTION
        # ============================================

        self.connected = False

        # True  = simulation/testing
        # False = real Pixhawk MAVLink
        self.simulation_mode = True

        self.drone_id = "GH-01"


        # ============================================
        # FLIGHT STATE
        # ============================================

        self.flight_mode = "AUTO"

        self.armed = False


        # ============================================
        # GPS
        # ============================================

        # Simulation starting position.
        #
        # These values are NOT the real drone GPS.
        # They are only used while simulation_mode=True.

        self.latitude = 26.449900
        self.longitude = 80.331900


        # ============================================
        # TELEMETRY
        # ============================================

        self.altitude = 42.6
        self.speed = 8.4
        self.battery = 78
        self.satellites = 14
        self.heading = 182


        # ============================================
        # SIMULATION
        # ============================================

        self.simulation_start = time.time()

        self.simulation_origin_latitude = (
            self.latitude
        )

        self.simulation_origin_longitude = (
            self.longitude
        )


    # ================================================
    # CONNECT
    # ================================================

    def connect(self):

        if self.simulation_mode:

            self.connected = True

            return True

        return False


    # ================================================
    # DISCONNECT
    # ================================================

    def disconnect(self):

        self.connected = False


    # ================================================
    # SIMULATED GPS
    # ================================================

    def _update_simulation(self):

        if not self.simulation_mode:

            return


        elapsed = (
            time.time()
            - self.simulation_start
        )


        # Simulated flight radius.
        #
        # Approximately 100 meters around
        # the starting coordinate.

        radius = 0.0010


        # Change position continuously.

        angle = elapsed / 20.0


        self.latitude = (
            self.simulation_origin_latitude
            + math.sin(angle) * radius
        )


        self.longitude = (
            self.simulation_origin_longitude
            + math.cos(angle) * radius
        )


        # Simulated heading.

        self.heading = int(
            (
                math.degrees(angle)
                + 90
            )
            % 360
        )


    # ================================================
    # TELEMETRY
    # ================================================

    def get_telemetry(self):

        # Update simulated GPS before
        # returning telemetry.

        self._update_simulation()


        return {

            "drone_id":
                self.drone_id,

            "connected":
                self.connected,

            "simulation_mode":
                self.simulation_mode,

            "armed":
                self.armed,

            "flight_mode":
                self.flight_mode,

            "latitude":
                self.latitude,

            "longitude":
                self.longitude,

            "altitude":
                self.altitude,

            "speed":
                self.speed,

            "battery":
                self.battery,

            "satellites":
                self.satellites,

            "heading":
                self.heading,

        }


    # ================================================
    # FLIGHT MODE
    # ================================================

    def set_mode(
        self,
        mode: str
    ):

        self.flight_mode = (
            mode.upper()
        )


        return {

            "success":
                True,

            "flight_mode":
                self.flight_mode,

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # ARM
    # ================================================

    def arm(self):

        self.armed = True


        return {

            "success":
                True,

            "armed":
                True,

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # DISARM
    # ================================================

    def disarm(self):

        self.armed = False


        return {

            "success":
                True,

            "armed":
                False,

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # TAKEOFF
    # ================================================

    def takeoff(
        self,
        altitude: float
    ):

        if not self.armed:

            return {

                "success":
                    False,

                "message":
                    "Drone must be armed before takeoff.",

            }


        self.flight_mode = "GUIDED"

        self.altitude = float(
            altitude
        )


        return {

            "success":
                True,

            "message":
                "Takeoff command accepted.",

            "target_altitude":
                self.altitude,

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # LAND
    # ================================================

    def land(self):

        self.flight_mode = "LAND"


        return {

            "success":
                True,

            "message":
                "Land command accepted.",

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # RTL
    # ================================================

    def rtl(self):

        self.flight_mode = "RTL"


        return {

            "success":
                True,

            "message":
                "RTL command accepted.",

            "simulation_mode":
                self.simulation_mode,

        }


    # ================================================
    # GOTO
    # ================================================

    def goto(
        self,
        latitude,
        longitude,
        altitude=None
    ):

        self.flight_mode = "GUIDED"


        self.latitude = float(
            latitude
        )

        self.longitude = float(
            longitude
        )


        if altitude is not None:

            self.altitude = float(
                altitude
            )


        return {

            "success":
                True,

            "message":
                "Guided target accepted.",

            "target": {

                "latitude":
                    self.latitude,

                "longitude":
                    self.longitude,

                "altitude":
                    self.altitude,

            },

            "simulation_mode":
                self.simulation_mode,

        }


# ====================================================
# GLOBAL MAVLINK SERVICE
# ====================================================

mavlink_service = MAVLinkService()

mavlink_service.connect()