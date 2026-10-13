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

Chaque menace est rejouée sur SA trajectoire, celle qui est aussi affichée en
3D : le Roi et la Dame sur le vol RocketPy (la Dame simplement tourné vers son
cap, doctrine du leurre premium), le Pion sur sa cloche parabolique propre (voir
pawn_track.py). Le bilan reste ainsi cohérent avec ce que l'écran montre.

Les LEURRES détectés avant le Roi coûtent du temps de classification à
l'opérateur (Dame 8 s, Pion 3 s) : le préavis effectif du Roi en est réduit.
Le verdict final vient du MEILLEUR radar ; en cas d'échec, la cause dominante
est expliquée en clair (horizon, portée, plafond, cône).
"""

from __future__ import annotations

import math

from pawn_track import build_pawn_track

EARTH_R = 6371000.0

# --- Cible Mesange : SER (m²) selon l'aspect ---
RCS_NOSE_M2 = 0.08  # vue de face (nez) : petite section
RCS_SIDE_M2 = 1.2  # vue de flanc : cylindre 0.23 m × ~4.5 m

# --- Signature radar par rôle (doctrine CHESS) ---
# La Dame est un LEURRE PREMIUM : sa SER est délibérément amplifiée (réflecteurs
# passifs type Luneburg, ou géométrie plus réfléchissante) pour "briller" sur le
# radar et attirer l'accroche/la classification de l'opérateur AVANT le Roi — le
# radar la détecte donc de plus loin (R_eff croît en σ^¼, voir _first_detection).
# Le Roi (menace furtive) et le Pion (saturation, jetable) gardent la SER nue.
RCS_ROLE_MULTIPLIER = {"QUEEN": 6.0}

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
    rcs_multiplier: float = 1.0,
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
    max_elev = float(radar.get("maxElevationDeg", CONE_OF_SILENCE_ELEV_DEG))


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
        sigma = _aspect_rcs(vx, vy, vz, lx, ly, lz) * rcs_multiplier
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
        if elev_deg > max_elev:
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


def _build_per_radar(
    radars: list[dict],
    per_threat: list[dict],
    king_index: int,
    king_impact: float,
) -> list[dict]:
    """Bilan INDIVIDUEL de chaque radar : ce que CE radar aurait vu, seul.

    Le verdict global reste un verdict de RÉSEAU (le Roi est-il accroché à temps
    par au moins un radar — voir compute_detection). Ce détail répond à une autre
    question, celle que se pose un défenseur : « lequel de mes radars a fait le
    travail, et lequel est aveugle ? ». Sans lui, un scénario à deux radars
    n'affichait qu'un agrégat, sans jamais dire lequel avait accroché.

    Le COÛT DES LEURRES est ici propre à chaque radar : seuls les leurres que CE
    radar détecte lui coûtent du temps de classification. Un radar qui ne voit pas
    les Pions n'est pas distrait par eux — c'est ce qui rend visible lequel des
    deux est vulnérable à la saturation.
    """
    per_radar: list[dict] = []

    for index, radar in enumerate(radars):
        king_hit = per_threat[king_index]["hits"][index]
        detected_at = king_hit["detectedAt"]

        # Menaces que CE radar voit (toutes confondues).
        seen = sum(1 for t in per_threat if t["hits"][index]["detectedAt"] is not None)

        # Coût de classification propre : leurres que CE radar accroche avant le
        # Roi, ou dans sa fenêtre de tri (même règle que le bilan global).
        own_cost = 0.0
        own_breakdown: dict[str, float] = {}
        if detected_at is not None:
            for threat_index, threat in enumerate(per_threat):
                if threat_index == king_index:
                    continue
                hit_at = threat["hits"][index]["detectedAt"]
                if hit_at is None or hit_at > detected_at + CLASSIFICATION_WINDOW_SEC:
                    continue
                cost = CONFUSION_COST_SEC.get(threat["role"], 3.0)
                own_breakdown[threat["role"]] = own_breakdown.get(threat["role"], 0.0) + cost
                own_cost += cost

        own_threshold = float(radar.get("detectionThresholdSec", 30.0))
        if detected_at is None:
            verdict = "missed"
            lead: float | None = None
        else:
            effective = min(king_impact, detected_at + own_cost)
            lead = max(0.0, king_impact - effective)
            verdict = "detected" if lead >= own_threshold else "late"

        per_radar.append(
            {
                "id": radar.get("id") or f"radar-{index + 1}",
                "name": radar.get("name") or f"Radar {index + 1}",
                "verdict": verdict,
                "leadTimeSec": None if lead is None else round(lead),
                "requiredLeadSec": round(own_threshold),
                "detectedAtSec": None if detected_at is None else round(detected_at),
                "acquisitionDistanceKm": None if detected_at is None else round(king_hit["distanceKm"], 1),
                "blockReason": king_hit["reason"] if detected_at is None else None,
                "detectedCount": seen,
                "decoyCostSec": round(own_cost),
                "decoyBreakdown": [
                    {"role": role, "costSec": round(cost)} for role, cost in own_breakdown.items()
                ],
            }
        )

    return per_radar


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
    # Échelle des cloches de Pion : dérivées de la portée RÉELLE du Roi (voir
    # pawn_track.PAWN_RANGE_FACTOR), comme côté front. L'inclinaison du Pion
    # n'est qu'un facteur de proportion de sa cloche ; à défaut, celle du Roi.
    king_range_m = float(flight.get("rangeM", 0.0))
    king_inclination = float(king.get("inclinationDeg", 45.0))

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

        # PION : sa PROPRE cloche parabolique — EXACTEMENT celle affichée en 3D
        # (port de decoyTrajectory.ts, voir pawn_track.py). Le détecter sur le vol
        # du Roi tourné donnait un bilan incohérent avec le visuel : le Pion
        # héritait des 204 s de vol et 36 km d'apogée du Roi (et de sa SER nue,
        # voir RCS_ROLE_MULTIPLIER), donc tout radar voyant le Roi voyait
        # fatalement tous les Pions — un 3/3 systématique, quel que soit le
        # scénario, alors que l'écran montrait des cloches courtes et basses.
        # DAME : reste le vol du Roi tourné, ce qu'elle EST par doctrine (leurre
        # premium, même profil, SER amplifiée) — et ce que le front affiche aussi.
        if role == "PAWN":
            pawn_inclination = threat.get("inclinationDeg")
            threat_track = build_pawn_track(
                azimuth_deg=float(threat.get("azimuthDeg", 0.0)),
                inclination_deg=float(pawn_inclination if pawn_inclination is not None else king_inclination),
                king_range_m=king_range_m,
            )
        elif abs(delta_az) < 1e-9:
            threat_track = track
        else:
            threat_track = [
                {"t": p["t"], "z": p["z"], **dict(zip(("x", "y"), _rotate_track(p["x"], p["y"], delta_az)))}
                for p in track
            ]

        rcs_multiplier = RCS_ROLE_MULTIPLIER.get(role, 1.0)
        best_t: float | None = None
        best_dist = 0.0
        block_reason: str | None = None
        # Résultat de CHAQUE radar sur CETTE menace, conservé au lieu d'être
        # écrasé par le minimum : c'est la matrice qui permet le bilan par radar
        # (voir _build_per_radar). Auparavant seule la meilleure accroche
        # survivait, et l'identité du radar gagnant était même perdue.
        threat_hits: list[dict] = []
        for radar, (r_east, r_north) in zip(radars, radar_offsets):
            t_detect, dist_km, reason = _first_detection(
                radar, r_east, r_north, threat_track, delay, rcs_multiplier
            )
            threat_hits.append({"detectedAt": t_detect, "distanceKm": dist_km, "reason": reason})
            if t_detect is not None and (best_t is None or t_detect < best_t):
                best_t, best_dist = t_detect, dist_km
            elif t_detect is None and block_reason is None:
                block_reason = reason

        per_threat.append(
            {
                "role": role,
                "detectedAt": best_t,
                "distanceKm": best_dist,
                "reason": block_reason,
                "hits": threat_hits,
                "impactSec": flight_time + delay,
            }
        )

    king_index = next(i for i, t in enumerate(threats) if t is king)
    king_result = per_threat[king_index]
    detected_count = sum(1 for r in per_threat if r["detectedAt"] is not None)
    threshold = max(float(r.get("detectionThresholdSec", 30.0)) for r in radars)
    # Bilan individuel de chaque radar — calculé dans TOUS les cas, y compris
    # quand le Roi n'est jamais accroché : savoir POURQUOI chaque radar l'a raté
    # (horizon, portée, plafond, cône) est justement l'information utile là.
    per_radar = _build_per_radar(radars, per_threat, king_index, king_impact)

    # --- Roi jamais accroché : cause dominante expliquée. ---
    if king_result["detectedAt"] is None:
        reason = king_result["reason"] or "never within radar coverage"
        return {
            **_empty_result(len(threats), f"The King was never locked: {reason}."),
            "verdict": "missed",
            "detectedCount": detected_count,
            "perRadar": per_radar,
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
        # Détail par radar : quel radar a accroché, quand, et à quel coût — le
        # verdict ci-dessus reste celui du RÉSEAU (meilleure accroche).
        "perRadar": per_radar,
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
        # Toujours présent pour que le contrat soit stable côté front (le seul cas
        # qui laisse cette liste vide est « aucun radar posé »). Les appelants qui
        # ont un détail à donner l'écrasent.
        "perRadar": [],
    }
