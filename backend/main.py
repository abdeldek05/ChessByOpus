"""API minimale : enregistre la base de lancement confirmée par l'utilisateur.

Nginx proxie /api/ vers ce service sur le port 8000 (le préfixe /api/ est
retiré par le proxy_pass, donc cette app reçoit directement /missions).
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from simulate import simulate

DB_PATH = Path(__file__).parent / "missions.db"

app = FastAPI()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id TEXT NOT NULL,
            site_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            confirmed_at TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mission_id INTEGER NOT NULL REFERENCES missions(id),
            radar_template_id TEXT NOT NULL,
            radar_range_km REAL NOT NULL,
            radar_ceiling_m REAL NOT NULL,
            radar_rotating INTEGER NOT NULL,
            radar_min_rcs_m2 REAL NOT NULL,
            detection_threshold_sec REAL NOT NULL DEFAULT 30,
            mesange_configs TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    # Migration sûre : ajoute la colonne aux bases déjà créées sans elle.
    try:
        connection.execute(
            "ALTER TABLE scenarios ADD COLUMN detection_threshold_sec REAL NOT NULL DEFAULT 30"
        )
    except sqlite3.OperationalError:
        pass  # colonne déjà présente
    return connection


class MissionPayload(BaseModel):
    siteId: str
    siteName: str
    latitude: float
    longitude: float


class MesangeLaunchConfigPayload(BaseModel):
    id: str
    role: str = "PAWN"
    launchSiteId: str = ""
    azimuthDeg: float
    inclinationDeg: float
    launchDelaySec: float = 0


class ScenarioPayload(BaseModel):
    radarTemplateId: str
    radarRangeKm: float
    radarCeilingM: float
    radarRotating: bool
    radarMinRcsM2: float
    detectionThresholdSec: float = 30
    mesangeConfigs: list[MesangeLaunchConfigPayload]


@app.post("/missions")
def create_mission(payload: MissionPayload):
    confirmed_at = datetime.now(timezone.utc).isoformat()

    connection = get_connection()
    cursor = connection.execute(
        """
        INSERT INTO missions (site_id, site_name, latitude, longitude, confirmed_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (payload.siteId, payload.siteName, payload.latitude, payload.longitude, confirmed_at),
    )
    connection.commit()
    mission_id = cursor.lastrowid
    connection.close()

    return {"id": mission_id, "confirmedAt": confirmed_at}


@app.get("/missions")
def list_missions():
    connection = get_connection()
    rows = connection.execute(
        "SELECT id, site_id, site_name, latitude, longitude, confirmed_at FROM missions ORDER BY id DESC"
    ).fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "siteId": row[1],
            "siteName": row[2],
            "latitude": row[3],
            "longitude": row[4],
            "confirmedAt": row[5],
        }
        for row in rows
    ]


@app.post("/missions/{mission_id}/scenario")
def create_scenario(mission_id: int, payload: ScenarioPayload):
    created_at = datetime.now(timezone.utc).isoformat()
    mesange_configs_json = json.dumps([config.model_dump() for config in payload.mesangeConfigs])

    connection = get_connection()
    cursor = connection.execute(
        """
        INSERT INTO scenarios (
            mission_id, radar_template_id, radar_range_km, radar_ceiling_m,
            radar_rotating, radar_min_rcs_m2, detection_threshold_sec,
            mesange_configs, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            mission_id,
            payload.radarTemplateId,
            payload.radarRangeKm,
            payload.radarCeilingM,
            int(payload.radarRotating),
            payload.radarMinRcsM2,
            payload.detectionThresholdSec,
            mesange_configs_json,
            created_at,
        ),
    )
    connection.commit()
    scenario_id = cursor.lastrowid
    connection.close()

    return {"id": scenario_id, "missionId": mission_id, "createdAt": created_at}


class SimulatePayload(BaseModel):
    latitude: float
    longitude: float
    elevationDeg: float  # angle de tir (90 = vertical)
    azimuthDeg: float  # cap
    siteElevationM: float = 0.0
    temperatureC: float | None = None  # météo du site → densité de l'air


@app.post("/simulate")
def run_simulation(payload: SimulatePayload):
    """Lance la vraie simulation de vol RocketPy et renvoie la trajectoire JSON.

    Physique complète (poussée mesurée, masses/CD du prédesign, atmosphère du
    site) : trajectoire échantillonnée + apogée, portée, vitesse max, temps de
    vol. Utilisée par l'écran de lancement pour animer + calculer la détection.
    """
    try:
        result = simulate(
            latitude=payload.latitude,
            longitude=payload.longitude,
            elevation_deg=payload.elevationDeg,
            azimuth_deg=payload.azimuthDeg,
            site_elevation_m=payload.siteElevationM,
            temperature_c=payload.temperatureC,
        )
        return {"status": "ready", "flight": result}
    except Exception as error:  # noqa: BLE001 — on remonte l'échec proprement au front
        return {"status": "failed", "error": str(error)}


@app.get("/scenarios")
def list_scenarios():
    connection = get_connection()
    rows = connection.execute(
        """
        SELECT
            scenarios.id, scenarios.mission_id, scenarios.radar_template_id,
            scenarios.radar_range_km, scenarios.radar_ceiling_m, scenarios.radar_rotating,
            scenarios.radar_min_rcs_m2, scenarios.detection_threshold_sec,
            scenarios.mesange_configs, scenarios.created_at,
            missions.site_name, missions.latitude, missions.longitude
        FROM scenarios
        JOIN missions ON missions.id = scenarios.mission_id
        ORDER BY scenarios.id DESC
        """
    ).fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "missionId": row[1],
            "radarTemplateId": row[2],
            "radarRangeKm": row[3],
            "radarCeilingM": row[4],
            "radarRotating": bool(row[5]),
            "radarMinRcsM2": row[6],
            "detectionThresholdSec": row[7],
            "mesangeConfigs": json.loads(row[8]),
            "createdAt": row[9],
            "siteName": row[10],
            "latitude": row[11],
            "longitude": row[12],
        }
        for row in rows
    ]
