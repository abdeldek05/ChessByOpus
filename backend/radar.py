"""Moteur de détection radar : le VRAI modèle physique côté serveur.

Pour chaque radar posé par le client (avec TOUTES ses caractéristiques : portée,
plafond, rotation + vitesse, SER minimale détectable, hauteur d'antenne, seuil
de préavis) et pour chaque menace (Roi + leurres), on rejoue la trajectoire
RocketPy échantillon par échantillon et on vérifie les conditions physiques :

  1. Horizon radar (courbure terrestre, réfraction standard 4/3) :
     d_horizon = 4.12 · (√h_antenne + √h_cible) km — sous l'horizon = invisible.
  2. Équation radar : portée effective selon la SER de la cible par rapport à la
     sensibilité réglée : R_eff = min(R_spec, R_spec·(σ/σ_min)^¼).
  3. SER d'ASPECT : la Mesange vue de face (nez) renvoie ~0.08 m², de flanc
     ~1.2 m² — interpolée selon l'angle vitesse / ligne de visée.
  4. Plafond d'altitude (ceilingM).
  5. Cône de silence : élévation > ~70° au-dessus du radar = zone aveugle.
  6. Balayage : radar ROTATIF → l'accroche attend le passage du faisceau sur
     l'azimut de la cible (analytique, selon la vitesse en tr/min).

Les LEURRES détectés avant le Roi coûtent du temps de classification à
l'opérateur (Dame 8 s, Pion 3 s) : le préavis effectif du Roi en est réduit.
Le verdict final vient du MEILLEUR radar ; en cas d'échec, la cause dominante
est expliquée en clair (horizon, portée, plafond, cône).
"""

from __future__ import annotations

import math

EARTH_R = 6371000.0

# --- Cible Mesange : SER (m²) selon l'aspect ---
RCS_NOSE_M2 = 0.08  # vue de face (nez) : petite section
RCS_SIDE_M2 = 1.2  # vue de flanc : cylindre 0.23 m × ~4.5 m

# --- Limites génériques d'un radar de veille ---
CONE_OF_SILENCE_ELEV_DEG = 70.0  # au-delà : zone aveugle au zénith
HORIZON_FACTOR = 4.12  # d_km = 4.12(√h1_m + √h2_m), réfraction 4/3 incluse

# --- Coût de classification d'un leurre détecté avant le Roi (s) ---
CONFUSION_COST_SEC = {"QUEEN": 8.0, "PAWN": 3.0}
# Fenêtre de classification : un leurre détecté jusqu'à N s APRÈS le Roi coûte
# quand même (l'opérateur doit trier toutes les pistes simultanées).
CLASSIFICATION_WINDOW_SEC = 10.0


def _enu_offset(site_lat: float, site_lng: float, lat: float, lng: float) -> tuple[float, float]:
    """Décalage (est, nord) en mètres d'un point lat/lng par rapport au site."""
    lat_rad = math.radians(site_lat)
    east = math.radians(lng - site_lng) * math.cos(lat_rad) * EARTH_R
    north = math.radians(lat - site_lat) * EARTH_R
    return east, north


def _rotate_track(x: float, y: float, delta_az_deg: float) -> tuple[float, float]:
    """Tourne un point (est, nord) de delta azimut HORAIRE (leurres : même vol,
    autre cap). Vérif : le nord (0,1) tourné de +90° donne l'est (1,0)."""
    a = math.radians(delta_az_deg)
    cos_a, sin_a = math.cos(a), math.sin(a)
    return x * cos_a + y * sin_a, -x * sin_a + y * cos_a


def _aspect_rcs(vx: float, vy: float, vz: float, lx: float, ly: float, lz: float) -> float:
    """SER selon l'angle entre l'axe fusée (vitesse) et la ligne de visée radar :
    nez pointé vers le radar = petite SER, flanc exposé = grande SER."""
    v_norm = math.sqrt(vx * vx + vy * vy + vz * vz)
    l_norm = math.sqrt(lx * lx + ly * ly + lz * lz)
    if v_norm < 1e-6 or l_norm < 1e-6:
        return RCS_SIDE_M2
    cos_angle = abs(vx * lx + vy * ly + vz * lz) / (v_norm * l_norm)
    sin_sq = max(0.0, 1.0 - cos_angle * cos_angle)
    return RCS_NOSE_M2 + (RCS_SIDE_M2 - RCS_NOSE_M2) * sin_sq


def _first_detection(
    radar: dict,
    radar_east: float,
    radar_north: float,
    track: list[dict],
    delay_sec: float,
) -> tuple[float | None, float, str | None]:
    """Premier instant (horloge mission) où CE radar accroche CETTE trajectoire.

    Renvoie (t_detection, distance_km_acquisition, None) si accrochée, sinon
    (None, 0, raison_dominante) — la condition qui a bloqué au plus près.
    """
    range_m = float(radar["rangeKm"]) * 1000.0
    ceiling_m = float(radar["ceilingM"])
    h_ant = float(radar.get("antennaHeightM", 4.0))
    min_rcs = max(0.01, float(radar.get("minRcsM2", 1.0)))
    rotating = bool(radar.get("rotating", True))
    rpm = max(1.0, float(radar.get("rotationRpm", 40.0)))

    best_block: tuple[float, str] | None = None  # (slant le plus proche, raison)
    prev: dict | None = None

    for p in track:
        x, y, z = p["x"], p["y"], p["z"]
        t_mission = p["t"] + delay_sec

        lx, ly, lz = x - radar_east, y - radar_north, z - h_ant
        horiz = math.hypot(lx, ly)
        slant = math.sqrt(horiz * horiz + lz * lz)

        # Vitesse (axe fusée) approx. par différence avec l'échantillon précédent.
        if prev is not None:
            vx, vy, vz = x - prev["x"], y - prev["y"], z - prev["z"]
        else:
            vx, vy, vz = 0.0, 0.0, 1.0
        prev = p

        # 1. Horizon radar (courbure terrestre).
        horizon_m = HORIZON_FACTOR * (math.sqrt(h_ant) + math.sqrt(max(0.0, z))) * 1000.0
        if horiz > horizon_m:
            if best_block is None or slant < best_block[0]:
                best_block = (slant, "below the radar horizon (Earth curvature)")
            continue

        # 2. + 3. Portée effective selon la SER d'aspect vs sensibilité réglée.
        sigma = _aspect_rcs(vx, vy, vz, lx, ly, lz)
        r_eff = min(range_m, range_m * (sigma / min_rcs) ** 0.25)
        if slant > r_eff:
            if best_block is None or slant < best_block[0]:
                best_block = (slant, "out of effective range for its radar cross-section")
            continue

        # 4. Plafond.
        if z > ceiling_m:
            if best_block is None or slant < best_block[0]:
                best_block = (slant, "above the radar altitude ceiling")
            continue

        # 5. Cône de silence au zénith.
        elev_deg = math.degrees(math.atan2(lz, horiz)) if horiz > 1e-6 else 90.0
        if elev_deg > CONE_OF_SILENCE_ELEV_DEG:
            if best_block is None or slant < best_block[0]:
                best_block = (slant, "inside the overhead cone of silence")
            continue

        # 6. Accroche géométrique : le radar rotatif attend le passage du faisceau.
        if rotating:
            beam_rate = rpm * 6.0  # deg/s (rpm × 360 / 60)
            beam_az = (beam_rate * t_mission) % 360.0
            target_az = (math.degrees(math.atan2(lx, ly)) + 360.0) % 360.0
            wait = ((target_az - beam_az) % 360.0) / beam_rate
            return t_mission + wait, slant / 1000.0, None
        return t_mission, slant / 1000.0, None

    reason = best_block[1] if best_block else "never within radar coverage"
    return None, 0.0, reason


def compute_detection(
    site_latitude: float,
    site_longitude: float,
    radars: list[dict],
    threats: list[dict],
    flight: dict,
) -> dict:
    """Bilan de mission complet : détection du Roi et des leurres par tous les
    radars, coût de classification des leurres, verdict vs seuil de préavis.

    `radars` : [{latitude, longitude, rangeKm, ceilingM, rotating, rotationRpm,
    minRcsM2, antennaHeightM, detectionThresholdSec}] ;
    `threats` : [{role, azimuthDeg, launchDelaySec}] (le Roi inclus) ;
    `flight` : sortie de simulate() — trajectoire ENU du Roi.
    """
    track = flight["trajectory"]
    flight_time = float(flight["flightTimeSec"])

    king = next((t for t in threats if t.get("role") == "KING"), threats[0] if threats else None)
    if king is None or not radars or not track:
        return _empty_result(len(threats), "No radar or no threat in the scenario.")

    king_az = float(king.get("azimuthDeg", 0.0))
    king_delay = float(king.get("launchDelaySec", 0.0))
    king_impact = flight_time + king_delay

    radar_offsets = [
        _enu_offset(site_latitude, site_longitude, float(r["latitude"]), float(r["longitude"]))
        for r in radars
    ]

    # --- Détection de CHAQUE menace par CHAQUE radar (meilleure accroche). ---
    per_threat: list[dict] = []
    for threat in threats:
        role = threat.get("role", "PAWN")
        delay = float(threat.get("launchDelaySec", 0.0))
        delta_az = float(threat.get("azimuthDeg", 0.0)) - king_az

        # Leurres : même profil de vol que le Roi, tourné vers LEUR azimut.
        if abs(delta_az) < 1e-9:
            threat_track = track
        else:
            threat_track = [
                {"t": p["t"], "z": p["z"], **dict(zip(("x", "y"), _rotate_track(p["x"], p["y"], delta_az)))}
                for p in track
            ]

        best_t: float | None = None
        best_dist = 0.0
        block_reason: str | None = None
        for radar, (r_east, r_north) in zip(radars, radar_offsets):
            t_detect, dist_km, reason = _first_detection(radar, r_east, r_north, threat_track, delay)
            if t_detect is not None and (best_t is None or t_detect < best_t):
                best_t, best_dist = t_detect, dist_km
            elif t_detect is None and block_reason is None:
                block_reason = reason

        per_threat.append(
            {"role": role, "detectedAt": best_t, "distanceKm": best_dist, "reason": block_reason}
        )

    king_result = next(r for r, t in zip(per_threat, threats) if t is king)
    detected_count = sum(1 for r in per_threat if r["detectedAt"] is not None)
    threshold = max(float(r.get("detectionThresholdSec", 30.0)) for r in radars)

    # --- Roi jamais accroché : cause dominante expliquée. ---
    if king_result["detectedAt"] is None:
        reason = king_result["reason"] or "never within radar coverage"
        return {
            **_empty_result(len(threats), f"The King was never locked: {reason}."),
            "verdict": "missed",
            "detectedCount": detected_count,
        }

    # --- Coût des leurres : tout leurre détecté avant le Roi OU dans sa fenêtre
    #     de classification distrait l'opérateur (pistes simultanées à trier). ---
    decoy_costs: dict[str, float] = {}
    for result in per_threat:
        if result is king_result or result["detectedAt"] is None:
            continue
        if result["detectedAt"] <= king_result["detectedAt"] + CLASSIFICATION_WINDOW_SEC:
            cost = CONFUSION_COST_SEC.get(result["role"], 3.0)
            decoy_costs[result["role"]] = decoy_costs.get(result["role"], 0.0) + cost
    total_cost = sum(decoy_costs.values())

    effective_detection = min(king_impact, king_result["detectedAt"] + total_cost)
    lead = max(0.0, king_impact - effective_detection)
    verdict = "detected" if lead >= threshold else "late"

    cause = None
    if verdict == "late":
        cause = f"Lock too late: {round(lead)} s warning vs {round(threshold)} s required."
        if total_cost > 0:
            cause += f" Decoys cost {round(total_cost)} s of classification time."

    return {
        "verdict": verdict,
        "leadTimeSec": round(lead),
        "acquisitionDistanceKm": round(king_result["distanceKm"], 1),
        "detectedCount": detected_count,
        "totalThreats": len(threats),
        "firstPossibleDetectionSec": round(king_result["detectedAt"]),
        "decoyCostSec": round(total_cost),
        "decoyBreakdown": [
            {"role": role, "costSec": round(cost)} for role, cost in decoy_costs.items()
        ],
        "cause": cause,
    }


def _empty_result(total_threats: int, cause: str) -> dict:
    return {
        "verdict": "missed",
        "leadTimeSec": None,
        "acquisitionDistanceKm": None,
        "detectedCount": 0,
        "totalThreats": total_threats,
        "firstPossibleDetectionSec": None,
        "decoyCostSec": None,
        "decoyBreakdown": [],
        "cause": cause,
    }
