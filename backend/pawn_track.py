"""Trajectoire d'un PION (leurre de saturation, doctrine CHESS) côté serveur.

PORT EXACT de frontend/src/lib/decoyTrajectory.ts `buildPawnTrajectory`. Les
deux implémentations DOIVENT rester identiques : c'est la condition pour que le
radar détecte le Pion sur la trajectoire RÉELLEMENT affichée à l'écran. Toute
modification de la formule ou des constantes ci-dessous doit être répercutée
dans l'autre fichier, sinon le bilan de mission redevient incohérent avec le
visuel 3D (bug historique : le backend détectait le Pion sur le vol du Roi
tourné, donc 204 s de vol et 36 km d'apogée là où l'écran en montrait 145 s et
12 km — un radar qui voyait le Roi voyait donc fatalement tous les Pions).

Le Pion n'a AUCUNE physique : c'est une cloche parabolique analytique
z(s) = 4·H·(s/R)·(1−s/R) dans l'axe de l'azimut réglé. Il ne dépend du vol réel
du Roi que par sa PORTÉE (facteur d'échelle), ce qui permet de le dériver ici
sans appel RocketPy supplémentaire.
"""

from __future__ import annotations

import math

# Constantes synchronisées avec decoyTrajectory.ts / flightPlayback.ts.
SAMPLE_DT = 0.2  # ↔ decoyTrajectory.ts SAMPLE_DT (et simulate.py)
GRAVITY_MS2 = 9.81  # ↔ three/constants/flightPlayback.ts GRAVITY_MS2
PAWN_RANGE_FACTOR = 1.3  # portée du Pion = 1.3 × celle du Roi
PAWN_APOGEE_RATIO = 1.0 / 3.0  # apogée ≈ portée / 3


def _clamp_inclination(deg: float) -> float:
    """↔ decoyTrajectory.ts clampInclination."""
    return min(89.0, max(5.0, deg))


def build_pawn_track(azimuth_deg: float, inclination_deg: float, king_range_m: float) -> list[dict]:
    """Cloche parabolique du Pion en ENU mètres, échantillonnée à SAMPLE_DT.

    Renvoie une liste de {t, x, y, z} — le format attendu par
    radar._first_detection (qui dérive la vitesse par différence d'échantillons,
    donc vx/vy/vz n'ont pas à être fournis).
    """
    azimuth_rad = math.radians(azimuth_deg)
    dir_x = math.sin(azimuth_rad)  # est
    dir_y = math.cos(azimuth_rad)  # nord

    range_m = max(500.0, king_range_m * PAWN_RANGE_FACTOR)
    inclination_factor = math.sin(math.radians(_clamp_inclination(inclination_deg)))
    apogee_m = range_m * PAWN_APOGEE_RATIO * inclination_factor

    # Durée FAKE calée sur une chute libre depuis l'apogée (parabole symétrique).
    half_time_sec = math.sqrt((2.0 * apogee_m) / GRAVITY_MS2)
    flight_time_sec = max(1.0, half_time_sec * 2.0)

    track: list[dict] = []
    t = 0.0
    while t <= flight_time_sec:
        frac = t / flight_time_sec  # ∈ [0,1]
        s = range_m * frac  # distance parcourue au sol
        z = max(0.0, 4.0 * apogee_m * frac * (1.0 - frac))
        track.append({"t": t, "x": dir_x * s, "y": dir_y * s, "z": z})
        t += SAMPLE_DT

    return track
