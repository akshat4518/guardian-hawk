from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from mavlink_service import mavlink_service


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Guardian Hawk Backend",
    description="AI-powered disaster response drone backend",
    version="1.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MISSION STATE
# =========================================================

mission_state = {
    "mission_id": "GH-MISSION-001",
    "status": "READY",
    "progress": 0,
    "area": "Search Zone A",
    "current_waypoint": 1,
    "total_waypoints": 5,

    "home": {
        "latitude": 26.4492,
        "longitude": 80.3308,
    },

    "waypoints": [
        {
            "id": 1,
            "latitude": 26.4500,
            "longitude": 80.3310,
            "altitude": 35,
            "status": "PENDING",
        },
        {
            "id": 2,
            "latitude": 26.4508,
            "longitude": 26.3320,
            "altitude": 40,
            "status": "PENDING",
        },
        {
            "id": 3,
            "latitude": 26.4514,
            "longitude": 26.3330,
            "altitude": 40,
            "status": "PENDING",
        },
        {
            "id": 4,
            "latitude": 26.4507,
            "longitude": 26.3340,
            "altitude": 35,
            "status": "PENDING",
        },
        {
            "id": 5,
            "latitude": 26.4497,
            "longitude": 26.3334,
            "altitude": 30,
            "status": "PENDING",
        },
    ],

    "flight_path": [
        {
            "latitude": 26.4492,
            "longitude": 80.3308,
        },
        {
            "latitude": 26.4500,
            "longitude": 80.3310,
        },
        {
            "latitude": 26.4508,
            "longitude": 80.3320,
        },
    ],
}


# Fix the intentionally separated coordinates above.
mission_state["waypoints"][1]["longitude"] = 80.3320
mission_state["waypoints"][2]["longitude"] = 80.3330
mission_state["waypoints"][3]["longitude"] = 80.3340
mission_state["waypoints"][4]["longitude"] = 80.3334


# =========================================================
# PYDANTIC MODELS
# =========================================================

class WaypointCreate(BaseModel):
    latitude: float
    longitude: float
    altitude: float = Field(default=40, ge=5, le=500)


class WaypointUpdate(BaseModel):
    altitude: Optional[float] = Field(
        default=None,
        ge=5,
        le=500,
    )


class MissionUpload(BaseModel):
    waypoints: list[WaypointCreate]


# =========================================================
# HELPERS
# =========================================================

def rebuild_mission():

    waypoints = mission_state["waypoints"]

    mission_state["total_waypoints"] = len(
        waypoints
    )

    if not waypoints:
        mission_state["current_waypoint"] = 0
        mission_state["progress"] = 0
        mission_state["flight_path"] = [
            mission_state["home"]
        ]
        return

    current = mission_state["current_waypoint"]

    if current < 1:
        current = 1

    if current > len(waypoints):
        current = len(waypoints)

    mission_state["current_waypoint"] = current

    flight_path = [
        {
            "latitude": mission_state["home"]["latitude"],
            "longitude": mission_state["home"]["longitude"],
        }
    ]

    for waypoint in waypoints:
        flight_path.append(
            {
                "latitude": waypoint["latitude"],
                "longitude": waypoint["longitude"],
            }
        )

    mission_state["flight_path"] = flight_path

    if len(waypoints) > 0:
        mission_state["progress"] = round(
            (
                (current - 1)
                / len(waypoints)
            )
            * 100
        )


def update_waypoint_statuses():

    current = mission_state["current_waypoint"]

    for waypoint in mission_state["waypoints"]:

        if waypoint["id"] < current:
            waypoint["status"] = "COMPLETED"

        elif waypoint["id"] == current:
            waypoint["status"] = "CURRENT"

        else:
            waypoint["status"] = "PENDING"


def renumber_waypoints():

    for index, waypoint in enumerate(
        mission_state["waypoints"],
        start=1,
    ):
        waypoint["id"] = index

    mission_state["total_waypoints"] = len(
        mission_state["waypoints"]
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "system": "GUARDIAN HAWK",
        "status": "online",
        "service": "FastAPI Backend",
        "version": "1.1.0",
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# TELEMETRY
# =========================================================

@app.get("/api/telemetry")
def get_telemetry():

    telemetry = (
        mavlink_service.get_telemetry()
    )

    return {
        **telemetry,
        "timestamp":
            datetime.utcnow().isoformat(),
    }


# =========================================================
# AI DETECTIONS
# =========================================================

@app.get("/api/detections")
def get_detections():

    return {
        "people_detected": 12,
        "confidence": 94.7,
        "rescue_priority": "HIGH",
        "disaster_severity": "SEVERE",
        "disaster_type": "EARTHQUAKE",

        "locations": [
            {
                "id": 1,
                "latitude": 26.4501,
                "longitude": 80.3324,
                "confidence": 96.2,
                "priority": "HIGH",
            },
            {
                "id": 2,
                "latitude": 26.4506,
                "longitude": 80.3312,
                "confidence": 93.8,
                "priority": "HIGH",
            },
            {
                "id": 3,
                "latitude": 26.4494,
                "longitude": 80.3328,
                "confidence": 94.1,
                "priority": "MEDIUM",
            },
        ],
    }


# =========================================================
# GET MISSION
# =========================================================

@app.get("/api/mission")
def get_mission():

    update_waypoint_statuses()

    return mission_state


# =========================================================
# ADD WAYPOINT
# =========================================================

@app.post("/api/mission/waypoint")
def add_waypoint(
    waypoint: WaypointCreate,
):

    next_id = (
        len(mission_state["waypoints"])
        + 1
    )

    new_waypoint = {
        "id": next_id,
        "latitude": waypoint.latitude,
        "longitude": waypoint.longitude,
        "altitude": waypoint.altitude,
        "status": "PENDING",
    }

    mission_state["waypoints"].append(
        new_waypoint
    )

    if (
        mission_state["current_waypoint"]
        == 0
    ):
        mission_state["current_waypoint"] = 1

    renumber_waypoints()
    rebuild_mission()
    update_waypoint_statuses()

    return {
        "success": True,
        "message": "Waypoint added.",
        "waypoint": new_waypoint,
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# UPDATE WAYPOINT
# =========================================================

@app.patch(
    "/api/mission/waypoint/{waypoint_id}"
)
def update_waypoint(
    waypoint_id: int,
    waypoint: WaypointUpdate,
):

    target = None

    for item in mission_state["waypoints"]:

        if item["id"] == waypoint_id:
            target = item
            break

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="Waypoint not found.",
        )

    if waypoint.altitude is not None:
        target["altitude"] = (
            waypoint.altitude
        )

    rebuild_mission()
    update_waypoint_statuses()

    return {
        "success": True,
        "waypoint": target,
        "mission": mission_state,
    }


# =========================================================
# DELETE WAYPOINT
# =========================================================

@app.delete(
    "/api/mission/waypoint/{waypoint_id}"
)
def delete_waypoint(
    waypoint_id: int,
):

    original_length = len(
        mission_state["waypoints"]
    )

    mission_state["waypoints"] = [
        waypoint
        for waypoint
        in mission_state["waypoints"]
        if waypoint["id"] != waypoint_id
    ]

    if (
        len(mission_state["waypoints"])
        == original_length
    ):
        raise HTTPException(
            status_code=404,
            detail="Waypoint not found.",
        )

    renumber_waypoints()

    if mission_state["waypoints"]:

        if (
            mission_state["current_waypoint"]
            > len(
                mission_state["waypoints"]
            )
        ):
            mission_state[
                "current_waypoint"
            ] = len(
                mission_state["waypoints"]
            )

    else:
        mission_state[
            "current_waypoint"
        ] = 0

    rebuild_mission()
    update_waypoint_statuses()

    return {
        "success": True,
        "message": "Waypoint deleted.",
        "mission": mission_state,
    }


# =========================================================
# CLEAR MISSION
# =========================================================

@app.delete("/api/mission")
def clear_mission():

    mission_state["waypoints"] = []

    mission_state["current_waypoint"] = 0
    mission_state["total_waypoints"] = 0
    mission_state["progress"] = 0
    mission_state["status"] = "READY"

    rebuild_mission()

    return {
        "success": True,
        "message": "Mission cleared.",
        "mission": mission_state,
    }


# =========================================================
# UPLOAD / SAVE MISSION
# =========================================================

@app.post("/api/mission/upload")
def upload_mission(
    mission: MissionUpload,
):

    mission_state["waypoints"] = []

    for index, waypoint in enumerate(
        mission.waypoints,
        start=1,
    ):

        mission_state["waypoints"].append(
            {
                "id": index,
                "latitude": waypoint.latitude,
                "longitude": waypoint.longitude,
                "altitude": waypoint.altitude,
                "status": "PENDING",
            }
        )

    mission_state[
        "current_waypoint"
    ] = 1 if mission.waypoints else 0

    mission_state["status"] = "READY"

    rebuild_mission()
    update_waypoint_statuses()

    return {
        "success": True,
        "message":
            "Mission uploaded to simulation.",
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# SET CURRENT WAYPOINT
# =========================================================

@app.post(
    "/api/mission/current/{waypoint_id}"
)
def set_current_waypoint(
    waypoint_id: int,
):

    if not mission_state["waypoints"]:
        raise HTTPException(
            status_code=400,
            detail="Mission has no waypoints.",
        )

    valid = any(
        waypoint["id"] == waypoint_id
        for waypoint
        in mission_state["waypoints"]
    )

    if not valid:
        raise HTTPException(
            status_code=404,
            detail="Waypoint not found.",
        )

    mission_state[
        "current_waypoint"
    ] = waypoint_id

    rebuild_mission()
    update_waypoint_statuses()

    return {
        "success": True,
        "message":
            f"Current waypoint set to {waypoint_id}.",
        "mission": mission_state,
    }


# =========================================================
# START MISSION
# =========================================================

@app.post("/api/mission/start")
def start_mission():

    if not mission_state["waypoints"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot start an empty mission.",
        )

    mission_state["status"] = "ACTIVE"

    if mission_state[
        "current_waypoint"
    ] < 1:
        mission_state[
            "current_waypoint"
        ] = 1

    rebuild_mission()
    update_waypoint_statuses()

    mavlink_service.set_mode(
        "AUTO"
    )

    return {
        "success": True,
        "message": "Mission started.",
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# PAUSE MISSION
# =========================================================

@app.post("/api/mission/pause")
def pause_mission():

    if mission_state["status"] != "ACTIVE":
        return {
            "success": False,
            "message":
                "Mission is not currently active.",
            "mission": mission_state,
        }

    mission_state["status"] = "PAUSED"

    return {
        "success": True,
        "message": "Mission paused.",
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# RESUME MISSION
# =========================================================

@app.post("/api/mission/resume")
def resume_mission():

    if mission_state["status"] != "PAUSED":
        return {
            "success": False,
            "message":
                "Mission is not paused.",
            "mission": mission_state,
        }

    mission_state["status"] = "ACTIVE"

    mavlink_service.set_mode(
        "AUTO"
    )

    return {
        "success": True,
        "message": "Mission resumed.",
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# STOP MISSION
# =========================================================

@app.post("/api/mission/stop")
def stop_mission():

    mission_state["status"] = "READY"

    mavlink_service.set_mode(
        "LOITER"
    )

    return {
        "success": True,
        "message": "Mission stopped.",
        "mission": mission_state,
        "simulation_mode":
            mavlink_service.simulation_mode,
    }


# =========================================================
# MAVLINK STATUS
# =========================================================

@app.get("/api/mavlink/status")
def mavlink_status():

    return {
        "connected":
            mavlink_service.connected,

        "simulation_mode":
            mavlink_service.simulation_mode,

        "drone_id":
            mavlink_service.drone_id,
    }


# =========================================================
# FLIGHT COMMANDS
# =========================================================

@app.post("/api/flight/arm")
def arm_drone():

    return mavlink_service.arm()


@app.post("/api/flight/disarm")
def disarm_drone():

    return mavlink_service.disarm()


@app.post("/api/flight/takeoff")
def takeoff_drone(
    altitude: float = 30,
):

    return mavlink_service.takeoff(
        altitude
    )


@app.post("/api/flight/land")
def land_drone():

    return mavlink_service.land()


@app.post("/api/flight/rtl")
def rtl_drone():

    return mavlink_service.rtl()


@app.post("/api/flight/mode")
def set_flight_mode(
    mode: str,
):

    return mavlink_service.set_mode(
        mode
    )


@app.post("/api/flight/goto")
def goto_location(
    latitude: float,
    longitude: float,
    altitude: Optional[float] = None,
):

    return mavlink_service.goto(
        latitude=latitude,
        longitude=longitude,
        altitude=altitude,
    )


@app.post("/api/mission/guided")
def guided_target(
    latitude: float,
    longitude: float,
    altitude: float = 40,
):

    return mavlink_service.goto(
        latitude=latitude,
        longitude=longitude,
        altitude=altitude,
    )