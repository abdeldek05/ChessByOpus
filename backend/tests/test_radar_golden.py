"""Golden tests du moteur radar — photographie du comportement ACTUEL (v1).

Ces tests figent ce que `radar.compute_detection` renvoie aujourd'hui sur deux
scénarios synthétiques déterministes (trajectoire parabolique construite ici,
zéro RocketPy, zéro réseau). Ils définissent « ne pas casser » pendant la
refonte radar-v2 : tant qu'ils sont verts, le contrat et les verdicts du moteur
v1 sont intacts. Un changement de comportement VOULU (correction de bug,
nouveau modèle) doit mettre à jour ces valeurs explicitement, commit dédié.

Les tests unitaires du bas verrouillent chaque brique physique isolément
(rotation, SER d'aspect, horizon, σ^¼, plafond, cône, attente faisceau) et la
cloche du Pion — y compris son exigence d'équivalence avec decoyTrajectory.ts.
"""

import math

import pytest

from pawn_track import GRAVITY_MS2, PAWN_APOGEE_RATIO, PAWN_RANGE_FACTOR, build_pawn_track
from radar import (
    RCS_NOSE_M2,
    RCS_SIDE_M2,
    _aspect_rcs,
    _first_detection,
    _rotate_track,
    compute_detection,
)


def parabolic_track(range_m, apogee_m, duration_s, dt, azimuth_deg):
    """Trajectoire de référence : cloche parabolique ENU, même format que simulate()."""
    ax = math.sin(math.radians(azimuth_deg))
    ay = math.cos(math.radians(azimuth_deg))
    track = []
    t = 0.0
    while t <= duration_s:
        frac = t / duration_s
        s = range_m * frac
        z = max(0.0, 4.0 * apogee_m * frac * (1.0 - frac))
        track.append({"t": t, "x": ax * s, "y": ay * s, "z": z})
        t += dt
    return track


FLIGHT = {
    "trajectory": parabolic_track(40000.0, 12000.0, 200.0, 1.0, 0.0),
    "flightTimeSec": 200.0,
    "rangeM": 40000.0,
}
RADARS = [
    {
        "id": "gm400-test", "name": "GM400 test",
        "latitude": 43.2, "longitude": 6.1,
        "rangeKm": 120.0, "ceilingM": 25000.0,
        "rotating": True, "rotationRpm": 10.0,
        "minRcsM2": 1.0, "antennaHeightM": 5.0,
        "detectionThresholdSec": 60.0,
    },
    {
        "id": "gf300-test", "name": "GF300 test",
        "latitude": 43.05, "longitude": 5.9,
        "rangeKm": 80.0, "ceilingM": 15000.0,
        "rotating": True, "rotationRpm": 60.0,
        "minRcsM2": 1.0, "antennaHeightM": 5.0,
        "detectionThresholdSec": 45.0,
    },
]
THREATS = [
    {"role": "KING", "azimuthDeg": 0.0, "launchDelaySec": 0.0, "inclinationDeg": 80.0},
    {"role": "QUEEN", "azimuthDeg": 60.0, "launchDelaySec": 5.0},
    {"role": "PAWN", "azimuthDeg": -30.0, "launchDelaySec": 10.0, "inclinationDeg": 45.0},
]


# --------------------------------------------------------------------------
# Goldens de bout en bout
# --------------------------------------------------------------------------

def test_golden_nominal_deux_radars_trois_menaces():
    result = compute_detection(43.0, 6.0, RADARS, THREATS, FLIGHT)
    assert result == {
        "verdict": "detected",
        "leadTimeSec": 188,
        "acquisitionDistanceKm": 9.7,
        "detectedCount": 3,
        "totalThreats": 3,
        "firstPossibleDetectionSec": 1,
        "decoyCostSec": 11,
        "decoyBreakdown": [
            {"role": "QUEEN", "costSec": 8},
            {"role": "PAWN", "costSec": 3},
        ],
        "cause": None,
        "perRadar": [
            {
                "id": "gm400-test",
                "name": "GM400 test",
                "verdict": "detected",
                "leadTimeSec": 189,
                "requiredLeadSec": 60,
                "detectedAtSec": 3,
                "acquisitionDistanceKm": 23.5,
                "blockReason": None,
                "detectedCount": 3,
                "decoyCostSec": 8,
                "decoyBreakdown": [{"role": "QUEEN", "costSec": 8}],
            },
            {
                "id": "gf300-test",
                "name": "GF300 test",
                "verdict": "detected",
                "leadTimeSec": 188,
                "requiredLeadSec": 45,
                "detectedAtSec": 1,
                "acquisitionDistanceKm": 9.7,
                "blockReason": None,
                "detectedCount": 3,
                "decoyCostSec": 11,
                "decoyBreakdown": [
                    {"role": "QUEEN", "costSec": 8},
                    {"role": "PAWN", "costSec": 3},
                ],
            },
        ],
    }


def test_golden_roi_jamais_accroche():
    far_radar = [{
        "id": "far", "name": "Radar lointain",
        "latitude": 44.8, "longitude": 6.0,
        "rangeKm": 50.0, "ceilingM": 25000.0,
        "rotating": True, "rotationRpm": 10.0,
        "minRcsM2": 1.0, "antennaHeightM": 5.0,
        "detectionThresholdSec": 60.0,
    }]
    result = compute_detection(43.0, 6.0, far_radar, THREATS, FLIGHT)
    assert result == {
        "verdict": "missed",
        "leadTimeSec": None,
        "acquisitionDistanceKm": None,
        "detectedCount": 0,
        "totalThreats": 3,
        "firstPossibleDetectionSec": None,
        "decoyCostSec": None,
        "decoyBreakdown": [],
        "cause": "The King was never locked: below the radar horizon (Earth curvature).",
        "perRadar": [
            {
                "id": "far",
                "name": "Radar lointain",
                "verdict": "missed",
                "leadTimeSec": None,
                "requiredLeadSec": 60,
                "detectedAtSec": None,
                "acquisitionDistanceKm": None,
                "blockReason": "below the radar horizon (Earth curvature)",
                "detectedCount": 0,
                "decoyCostSec": 0,
                "decoyBreakdown": [],
            },
        ],
    }


# --------------------------------------------------------------------------
# Briques physiques isolées
# --------------------------------------------------------------------------

def test_rotation_nord_vers_est():
    # L'exemple du docstring de _rotate_track : le nord tourné de +90° donne l'est.
    x, y = _rotate_track(0.0, 1.0, 90.0)
    assert x == pytest.approx(1.0)
    assert y == pytest.approx(0.0, abs=1e-12)


def test_ser_aspect_nez_flanc_et_vitesse_nulle():
    # Nez pointé vers le radar (vitesse colinéaire à la ligne de visée) : SER mini.
    assert _aspect_rcs(1, 0, 0, 1, 0, 0) == pytest.approx(RCS_NOSE_M2)
    # Flanc exposé (vitesse perpendiculaire) : SER maxi.
    assert _aspect_rcs(0, 1, 0, 1, 0, 0) == pytest.approx(RCS_SIDE_M2)
    # Vitesse indéterminée : convention conservatrice = flanc.
    assert _aspect_rcs(0, 0, 0, 1, 0, 0) == pytest.approx(RCS_SIDE_M2)


def _radar(**over):
    base = {
        "rangeKm": 100.0, "ceilingM": 25000.0, "rotating": False,
        "rotationRpm": 10.0, "minRcsM2": 1.2, "antennaHeightM": 5.0,
    }
    base.update(over)
    return base


def test_horizon_bloque_une_cible_basse():
    # Cible à 100 m d'altitude à 60 km : horizon = 4.12·(√5+√100) km ≈ 50.4 km < 60.
    track = [{"t": 0.0, "x": 0.0, "y": 60000.0, "z": 100.0}]
    t, _, reason = _first_detection(_radar(), 0.0, 0.0, track, 0.0)
    assert t is None
    assert reason == "below the radar horizon (Earth curvature)"


def test_portee_effective_en_racine_quatrieme():
    # σ flanc (1.2) avec sensibilité minRcs = 1.2×16 : R_eff = 100·(1/16)^¼ = 50 km.
    track = [{"t": 0.0, "x": 0.0, "y": 60000.0, "z": 5000.0}]
    t, _, reason = _first_detection(_radar(minRcsM2=1.2 * 16.0), 0.0, 0.0, track, 0.0)
    assert t is None
    assert reason == "out of effective range for its radar cross-section"
    # Même géométrie, sensibilité alignée sur la SER : détection immédiate.
    t2, dist_km, reason2 = _first_detection(_radar(), 0.0, 0.0, track, 0.0)
    assert reason2 is None
    assert t2 == pytest.approx(0.0)
    assert dist_km == pytest.approx(math.hypot(60000.0, 5000.0 - 5.0) / 1000.0)


def test_plafond_bloque_une_cible_trop_haute():
    track = [{"t": 0.0, "x": 0.0, "y": 60000.0, "z": 20000.0}]
    t, _, reason = _first_detection(_radar(ceilingM=15000.0), 0.0, 0.0, track, 0.0)
    assert t is None
    assert reason == "above the radar altitude ceiling"


def test_cone_de_silence_au_zenith():
    # Cible quasi à la verticale du radar (élévation ≈ 89.7° > 70°).
    track = [{"t": 0.0, "x": 0.0, "y": 50.0, "z": 10000.0}]
    t, _, reason = _first_detection(_radar(), 0.0, 0.0, track, 0.0)
    assert t is None
    assert reason == "inside the overhead cone of silence"


def test_gf300_voit_au_zenith():
    # Même cible au zénith, mais le radar voit jusqu'à 90° : plus de zone aveugle.
    track = [{"t": 0.0, "x": 0.0, "y": 50.0, "z": 10000.0}]
    t, _, reason = _first_detection(_radar(maxElevationDeg=90.0), 0.0, 0.0, track, 0.0)
    assert reason is None
    assert t == pytest.approx(0.0)


def test_attente_du_faisceau_rotatif():
    # 10 tr/min = 60°/s. À t=0 le faisceau pointe l'azimut 0 (nord) ; cible plein
    # est (azimut 90°) → attente analytique de 90/60 = 1.5 s avant l'accroche.
    track = [{"t": 0.0, "x": 60000.0, "y": 0.0, "z": 5000.0}]
    t, _, reason = _first_detection(
        _radar(rotating=True, rotationRpm=10.0), 0.0, 0.0, track, 0.0
    )
    assert reason is None
    assert t == pytest.approx(1.5)


# --------------------------------------------------------------------------
# Cloche du Pion (équivalence exigée avec decoyTrajectory.ts)
# --------------------------------------------------------------------------

def test_pion_echelle_et_geometrie():
    king_range = 30000.0
    track = build_pawn_track(azimuth_deg=90.0, inclination_deg=45.0, king_range_m=king_range)
    expected_range = king_range * PAWN_RANGE_FACTOR
    expected_apogee = expected_range * PAWN_APOGEE_RATIO * math.sin(math.radians(45.0))

    # Cap plein est : tout le déplacement sur x, rien sur y.
    assert track[-1]["y"] == pytest.approx(0.0, abs=1e-6)
    assert track[-1]["x"] == pytest.approx(expected_range, rel=0.01)
    # Apogée au sommet de la cloche (4H·f·(1−f) culmine à H en f=0.5).
    apogee = max(p["z"] for p in track)
    assert apogee == pytest.approx(expected_apogee, rel=0.01)
    # Durée calée sur la chute libre depuis l'apogée.
    expected_duration = 2.0 * math.sqrt(2.0 * expected_apogee / GRAVITY_MS2)
    assert track[-1]["t"] == pytest.approx(expected_duration, abs=0.25)
    # Départ et fin au sol.
    assert track[0]["z"] == 0.0
    assert track[-1]["z"] == pytest.approx(0.0, abs=expected_apogee * 0.02)


def test_pion_portee_plancher_500m():
    track = build_pawn_track(azimuth_deg=0.0, inclination_deg=45.0, king_range_m=100.0)
    assert track[-1]["y"] == pytest.approx(500.0, rel=0.01)


def test_pion_valeurs_d_or_pour_equivalence_front():
    """Valeurs d'or partagées : le test vitest côté front devra produire EXACTEMENT
    ces échantillons depuis decoyTrajectory.ts (mêmes entrées, indices 0/10/50).
    C'est le verrou anti-divergence exigé par la docstring de pawn_track.py."""
    track = build_pawn_track(azimuth_deg=30.0, inclination_deg=60.0, king_range_m=20000.0)
    golden = {
        0: (0.0, 0.0, 0.0, 0.0),
        10: (2.0, 332.33149075, 575.61502694, 747.86670258),
        50: (10.0, 1661.65745375, 2878.07513468, 3346.93351290),
    }
    for index, (t, x, y, z) in golden.items():
        p = track[index]
        assert p["t"] == pytest.approx(t, abs=1e-9)
        assert p["x"] == pytest.approx(x, abs=1e-6)
        assert p["y"] == pytest.approx(y, abs=1e-6)
        assert p["z"] == pytest.approx(z, abs=1e-6)
