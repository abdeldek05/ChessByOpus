"""Simulation de vol de la Mesange V2 avec RocketPy.

Construit le moteur, la fusée et l'environnement à partir des données réelles du
dossier de prédesign (thrust_curve.csv, CD_Power_*_us.csv, masses/inerties du
notebook), lance le vol selon l'azimut et l'élévation choisis par le client, et
renvoie la trajectoire échantillonnée + les métriques clés sous forme de dict
JSON-sérialisable.

Testable en ligne de commande :
    python simulate.py --lat 44.36 --lng -1.26 --elevation 80 --azimuth 30
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

from rocketpy import Environment, SolidMotor, Rocket, Flight
from rocketpy.mathutils import Function

# --- Données Mesange V2 (dossier predesign) -----------------------------------
PREDESIGN = Path(__file__).parent.parent / "rocketpy_predisgn"
THRUST_CURVE = str(PREDESIGN / "thrust_curve.csv")
CD_POWER_ON = str(PREDESIGN / "CD_Power_On_us.csv")
CD_POWER_OFF = str(PREDESIGN / "CD_Power_Off_us.csv")

# Masses (kg) et géométrie, valeurs calculées du notebook.
DRY_MASS = 66.38  # masse à vide (structure + moteur vide + charge utile)
PROPELLANT_MASS = 58.53  # ergols consommés pendant le burn
BURN_TIME = 35.7  # s
RADIUS = 0.115  # rayon fusée (Ø 230 mm)
# Inertie (kg·m²) du notebook : ~126 sur les axes latéraux, ~0.7 en roulis.
INERTIA = (126.1, 126.1, 0.7)
NOZZLE_RADIUS = 0.041  # sortie tuyère (D_e 82 mm)

# Échantillonnage de sortie : un point toutes les 0,2 s (JSON léger et fluide).
SAMPLE_DT = 0.2

# GFS (NOAA) ne couvre qu'une fenêtre glissante d'environ 10 jours autour
# de "maintenant" : au-delà, RocketPy ne trouve pas de prévision pour la date.
GFS_FORECAST_WINDOW_DAYS = 10

# Bug connu de RocketPy 1.12.1 (rocketpy/environment/tools.py,
# get_pressure_levels_from_file) : le fichier GFS déclare son axe de niveaux de
# pression en Pa, mais RocketPy lui applique quand même la conversion ×100
# (mbar→Pa) — la pression et la densité de l'air chargées sont alors ~100×
# trop élevées (ex. densité au sol ~116 kg/m³ au lieu de ~1,2 kg/m³ réaliste).
# Cette densité aberrante démultiplie la traînée/portance des ailerons : la
# fusée "couche" presque instantanément sous le moindre vent au lieu de monter
# en cloche (constaté : apogée 22 km sans vent → ~600 m avec ce bug actif).
GFS_PRESSURE_DENSITY_BUG_FACTOR = 100.0


def _fix_gfs_pressure_density_bug(env: Environment) -> None:
    """Reconstruit les tables pression/densité divisées par le facteur de bug
    ci-dessus. `speed_of_sound` (dérivée de la température, pas de la
    pression) reste correcte et n'a pas besoin d'être touchée."""
    pressure_source = env.pressure.source.copy()
    pressure_source[:, 1] /= GFS_PRESSURE_DENSITY_BUG_FACTOR
    env.pressure = Function(
        pressure_source,
        inputs="Height Above Sea Level (m)",
        outputs="Pressure (Pa)",
        interpolation="linear",
        extrapolation="natural",
    )

    density_source = env.density.source.copy()
    density_source[:, 1] /= GFS_PRESSURE_DENSITY_BUG_FACTOR
    env.density = Function(
        density_source,
        inputs="Height Above Sea Level (m)",
        outputs="Density (kg/m3)",
        interpolation="linear",
        extrapolation="natural",
    )


def _apply_real_weather(env: Environment, launch_datetime: datetime | None) -> bool:
    """Tente de charger la météo réelle du site (vent par altitude, température,
    pression) via la prévision GFS (NOAA, gratuit, sans clé API) à la date de
    tir demandée. Renvoie True si la vraie météo a pu être chargée.

    Sans accès réseau, ou en dehors de la fenêtre de prévision GFS, on ne lève
    pas d'erreur : l'appelant retombe sur une atmosphère standard sans vent
    plutôt que de bloquer toute la simulation pour une histoire de météo.

    RocketPy recale `env.elevation` sur l'altitude de la maille GFS la plus
    proche (résolution grossière) au moment du chargement — donc DIFFÉRENTE de
    l'altitude réelle du site passée à la construction de l'Environment. On la
    restaure explicitement après coup : sinon `simulate()` soustrait la
    mauvaise référence d'altitude et décale toute la trajectoire (le sol
    apparaît sous ou au-dessus de zéro selon l'écart entre les deux valeurs).
    """
    launch_datetime = launch_datetime or datetime.now(timezone.utc)
    site_elevation_m = env.elevation
    try:
        env.set_date(
            (launch_datetime.year, launch_datetime.month, launch_datetime.day, launch_datetime.hour),
            timezone="UTC",
        )
        env.set_atmospheric_model(type="Forecast", file="GFS")
        env.set_elevation(site_elevation_m)
        # Pression au niveau de la mer plausible : 80-110 kPa. Au-delà, c'est
        # le bug RocketPy ci-dessus (facteur ~100) — on corrige ; sinon (si un
        # jour RocketPy le corrige en amont) on laisse les valeurs telles quelles.
        if env.pressure(site_elevation_m) > 200_000:
            _fix_gfs_pressure_density_bug(env)
        return True
    except Exception:  # noqa: BLE001 — GFS indisponible : repli silencieux
        return False


def _zero_wind(env: Environment) -> None:
    """Annule le VENT tout en gardant l'atmosphère réelle GFS (densité,
    température, pression — qui déterminent la portée). RocketPy fait DÉRIVER
    la fusée avec le vent, si bien que la trajectoire réelle s'écarte du cap
    (`heading`) demandé : l'azimut choisi par l'utilisateur au scénario ne
    correspondait alors plus à la direction réellement prise dans la scène 3D
    / sur la carte tactique. Sans vent, la fusée suit EXACTEMENT l'azimut
    réglé. `Flight` lit `wind_velocity_x/y(z)` ; on les force à zéro, et on
    aligne les grandeurs dérivées (vitesse/cap au sol) pour le rapport météo."""
    zero = Function(0)
    env.wind_velocity_x = zero
    env.wind_velocity_y = zero
    env.wind_speed = zero
    env.wind_heading = zero
    env.wind_direction = zero


def build_motor() -> SolidMotor:
    """Moteur à poussée constante (~3500 N) depuis la thrust curve mesurée."""
    return SolidMotor(
        thrust_source=THRUST_CURVE,
        dry_mass=0.0,  # la masse moteur vide est incluse dans la masse sèche fusée
        dry_inertia=(0, 0, 0),
        nozzle_radius=NOZZLE_RADIUS,
        grain_number=1,
        grain_density=1400,  # ~densité ergols liquides (approx pour un grain équiv.)
        grain_outer_radius=RADIUS * 0.9,
        grain_initial_inner_radius=RADIUS * 0.3,
        grain_initial_height=1.0,
        grain_separation=0,
        grains_center_of_mass_position=0,
        center_of_dry_mass_position=0,
        nozzle_position=0,
        burn_time=BURN_TIME,
        throat_radius=0.024,
        coordinate_system_orientation="nozzle_to_combustion_chamber",
    )


def build_rocket(motor: SolidMotor) -> Rocket:
    """Fusée Mesange : masses/inertie réelles + aérodynamique (nez, ailerons)."""
    rocket = Rocket(
        radius=RADIUS,
        mass=DRY_MASS,
        inertia=INERTIA,
        power_off_drag=CD_POWER_OFF,
        power_on_drag=CD_POWER_ON,
        center_of_mass_without_motor=0,
        coordinate_system_orientation="tail_to_nose",
    )
    rocket.add_motor(motor, position=-1.6)
    # Nez ogival à l'avant + ailerons + jupe de queue (boat-tail), dimensions du
    # notebook de prédesign (rocketpy_predisgn/Mesange_V2_predim_separated_tanks
    # .ipynb) : root/tip chord et envergure exacts, et le boat-tail — ABSENT ici
    # avant ce correctif — qui déplace le centre de poussée vers l'arrière et
    # relève la marge statique réelle (~2,5 cal dans le notebook, contre ~1,2 cal
    # mesurée sans lui). Sans cette marge, la fusée "weathercocke" excessivement
    # sous vent réel : elle couche vers l'horizontale en quelques secondes au
    # lieu de monter en cloche, et son vol s'effondre (constaté : apogée 22 km
    # sans vent → ~600 m avec le vent réel du site, avant ce correctif).
    rocket.add_nose(length=1.15, kind="ogive", position=3.0)
    rocket.add_tail(top_radius=RADIUS, bottom_radius=0.1045, length=0.15, position=-1.6)
    rocket.add_trapezoidal_fins(
        n=4,
        root_chord=0.364,
        tip_chord=0.19,
        span=0.2286,
        position=-1.45,
        sweep_length=0.24,
    )
    return rocket


def simulate(
    latitude: float,
    longitude: float,
    elevation_deg: float,
    azimuth_deg: float,
    site_elevation_m: float = 0.0,
    temperature_c: float | None = None,
    launch_datetime: datetime | None = None,
) -> dict:
    """Lance le vol et renvoie trajectoire échantillonnée + métriques (dict JSON).

    Météo du site : si `temperature_c` est fourni explicitement, l'utilisateur
    force une atmosphère standard décalée sur cette température (pas de vent).
    Sinon, on tente de charger la VRAIE météo du lieu (vent par altitude,
    température, pression) via la prévision GFS à `launch_datetime` (défaut :
    maintenant) ; si GFS est indisponible (réseau, date hors fenêtre ~10 j),
    repli silencieux sur une atmosphère standard sans vent.
    """
    env = Environment(latitude=latitude, longitude=longitude, elevation=site_elevation_m)

    used_real_weather = False
    if temperature_c is not None:
        env.set_atmospheric_model(type="standard_atmosphere")
    else:
        used_real_weather = _apply_real_weather(env, launch_datetime)
        if not used_real_weather:
            env.set_atmospheric_model(type="standard_atmosphere")

    # Vent réel du site CAPTURÉ avant annulation : reste affiché dans le bilan
    # (info météo crédible) même si la physique du vol l'ignore désormais.
    real_wind_speed = round(float(env.wind_speed(site_elevation_m)), 1)
    real_wind_heading = round(float(env.wind_heading(site_elevation_m)), 1)

    # VENT ANNULÉ pour le tir réel : la fusée suit exactement l'azimut réglé
    # (le vent la faisait dériver → décalage entre l'azimut de config et la
    # direction prise dans la scène). L'atmosphère GFS (densité/température/
    # pression, qui pilotent la portée) est conservée.
    _zero_wind(env)

    motor = build_motor()
    rocket = build_rocket(motor)

    flight = Flight(
        rocket=rocket,
        environment=env,
        rail_length=8,
        inclination=elevation_deg,  # RocketPy : 90 = vertical
        heading=azimuth_deg,  # cap (azimut)
        terminate_on_apogee=False,
    )

    # Échantillonne x/y/z/vitesse/altitude de t=0 à l'atterrissage, tous les 0,2 s.
    t_end = flight.t_final
    samples = []
    t = 0.0
    while t <= t_end:
        vx, vy = float(flight.vx(t)), float(flight.vy(t))
        samples.append(
            {
                "t": round(t, 2),
                "x": round(float(flight.x(t)), 1),  # est (m)
                "y": round(float(flight.y(t)), 1),  # nord (m)
                "z": round(float(flight.z(t)) - site_elevation_m, 1),  # altitude sol (m)
                "v": round(float(flight.speed(t)), 1),  # vitesse (m/s)
                # Cap instantané du vecteur vitesse (deg, 0=nord, 90=est) : pour
                # le graphique de télémétrie (analyse xyz/azimut/élévation).
                "azimuthDeg": round(math.degrees(math.atan2(vx, vy)) % 360.0, 1),
                # Élévation instantanée du vecteur vitesse (deg, 90=vertical) —
                # déjà calculée par RocketPy (path_angle), pas de recalcul.
                "elevationDeg": round(float(flight.path_angle(t)), 1),
            }
        )
        t += SAMPLE_DT

    return {
        "trajectory": samples,
        "apogeeM": round(float(flight.apogee) - site_elevation_m, 1),
        "apogeeTimeSec": round(float(flight.apogee_time), 1),
        "rangeM": round(
            float((flight.x(t_end) ** 2 + flight.y(t_end) ** 2) ** 0.5), 1
        ),
        "maxSpeedMs": round(float(flight.max_speed), 1),
        "flightTimeSec": round(float(t_end), 1),
        "weather": {
            "source": "gfs" if used_real_weather else "standard_atmosphere",
            # Vent RÉEL affiché pour info ; il n'agit plus sur la trajectoire
            # (annulé pour garder l'azimut exact — voir _zero_wind).
            "groundWindSpeedMs": real_wind_speed,
            "groundWindHeadingDeg": real_wind_heading,
            "groundTemperatureC": round(float(env.temperature(site_elevation_m)) - 273.15, 1),
        },
    }


def estimate_max_range(
    latitude: float,
    longitude: float,
    site_elevation_m: float = 0.0,
    launch_datetime: datetime | None = None,
    elevations_deg: list[float] | None = None,
    azimuth_step_deg: float = 15.0,
) -> dict:
    """Balaie les azimuts (pas de `azimuth_step_deg`) pour une liste d'élévations
    de tir, sous la VRAIE météo du site (vent GFS), et renvoie la portée au sol
    obtenue pour chaque couple (élévation, azimut) ainsi que le maximum global.

    Sert à répondre à « jusqu'où la fusée peut-elle aller selon l'azimut du vent
    et l'élévation ? » : avec un vent de secteur fixe, tirer plein vent arrière
    (azimut = azimut du vent) allonge la portée, tirer plein vent de face la
    réduit — ce balayage donne le tableau complet plutôt qu'un seul point.

    Ne renvoie PAS la trajectoire complète (juste range/apogée) : un vol complet
    RocketPy coûte plusieurs secondes, et ce balayage en enchaîne des dizaines.
    """
    elevations = elevations_deg or [90.0, 80.0, 70.0, 60.0, 45.0]
    azimuths = list(range(0, 360, max(1, int(azimuth_step_deg))))

    env = Environment(latitude=latitude, longitude=longitude, elevation=site_elevation_m)
    used_real_weather = _apply_real_weather(env, launch_datetime)
    if not used_real_weather:
        env.set_atmospheric_model(type="standard_atmosphere")

    motor = build_motor()
    rocket = build_rocket(motor)

    runs = []
    for elevation_deg in elevations:
        for azimuth_deg in azimuths:
            flight = Flight(
                rocket=rocket,
                environment=env,
                rail_length=8,
                inclination=elevation_deg,
                heading=azimuth_deg,
                terminate_on_apogee=False,
            )
            t_end = flight.t_final
            range_m = float((flight.x(t_end) ** 2 + flight.y(t_end) ** 2) ** 0.5)
            runs.append(
                {
                    "elevationDeg": elevation_deg,
                    "azimuthDeg": azimuth_deg,
                    "rangeM": round(range_m, 1),
                    "apogeeM": round(float(flight.apogee) - site_elevation_m, 1),
                }
            )

    best = max(runs, key=lambda run: run["rangeM"])
    return {
        "weather": {
            "source": "gfs" if used_real_weather else "standard_atmosphere",
            "groundWindSpeedMs": round(float(env.wind_speed(site_elevation_m)), 1),
            "groundWindHeadingDeg": round(float(env.wind_heading(site_elevation_m)), 1),
        },
        "runs": runs,
        "maxRange": best,
    }


# Élévations resserrées autour de la plage qui maximise la portée pour cette
# fusée (vérifié empiriquement : le maximum tombe vers 80-88°, la traînée
# fait que "plus incliné que 45°" reste optimal contrairement à un tir sans
# frottement). Un seul azimut par élévation (l'azimut change peu la distance
# MAX théorique comparé à l'élévation ; le vent en change surtout la direction
# dominante) : ~6 vols, quelques secondes — assez rapide pour un affichage
# pendant le placement du radar.
QUICK_MAX_RANGE_ELEVATIONS_DEG = [90.0, 88.0, 85.0, 82.0, 78.0, 70.0]


def estimate_max_range_quick(
    latitude: float,
    longitude: float,
    site_elevation_m: float = 0.0,
    launch_datetime: datetime | None = None,
) -> dict:
    """Majorant rapide de la distance max atteignable, toutes directions de tir
    confondues, sous la météo réelle du site. Contrairement à `estimate_max_range`
    (balayage complet azimut × élévation, plusieurs dizaines de vols), ne teste
    qu'une poignée d'élévations à un seul azimut chacune — pensé pour rester
    utilisable en interactif (carte de placement du radar), pas pour l'analyse
    fine par azimut du vent.
    """
    env = Environment(latitude=latitude, longitude=longitude, elevation=site_elevation_m)
    used_real_weather = _apply_real_weather(env, launch_datetime)
    if not used_real_weather:
        env.set_atmospheric_model(type="standard_atmosphere")

    motor = build_motor()
    rocket = build_rocket(motor)

    best_range_m = 0.0
    for elevation_deg in QUICK_MAX_RANGE_ELEVATIONS_DEG:
        flight = Flight(
            rocket=rocket,
            environment=env,
            rail_length=8,
            inclination=elevation_deg,
            heading=0.0,
            terminate_on_apogee=False,
        )
        t_end = flight.t_final
        range_m = float((flight.x(t_end) ** 2 + flight.y(t_end) ** 2) ** 0.5)
        best_range_m = max(best_range_m, range_m)

    return {
        "maxRangeM": round(best_range_m, 1),
        "weather": {
            "source": "gfs" if used_real_weather else "standard_atmosphere",
            "groundWindSpeedMs": round(float(env.wind_speed(site_elevation_m)), 1),
            "groundWindHeadingDeg": round(float(env.wind_heading(site_elevation_m)), 1),
        },
    }


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Simulate a Mesange flight")
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lng", type=float, required=True)
    parser.add_argument("--elevation", type=float, default=80, help="firing angle deg")
    parser.add_argument("--azimuth", type=float, default=0, help="heading deg")
    parser.add_argument("--site-elev", type=float, default=0)
    parser.add_argument("--temp", type=float, default=None)
    args = parser.parse_args()

    result = simulate(
        latitude=args.lat,
        longitude=args.lng,
        elevation_deg=args.elevation,
        azimuth_deg=args.azimuth,
        site_elevation_m=args.site_elev,
        temperature_c=args.temp,
    )
    # Résumé lisible + JSON complet.
    print(
        f"apogee={result['apogeeM']} m  range={result['rangeM']} m  "
        f"maxV={result['maxSpeedMs']} m/s  flight={result['flightTimeSec']} s  "
        f"points={len(result['trajectory'])}"
    )
    Path("last_simulation.json").write_text(json.dumps(result), encoding="utf-8")
    print("Full JSON written to last_simulation.json")


if __name__ == "__main__":
    _cli()
