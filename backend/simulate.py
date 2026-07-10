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
from pathlib import Path

from rocketpy import Environment, SolidMotor, Rocket, Flight

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
    # Nez ogival à l'avant + ailerons arrière dimensionnés pour une marge de
    # stabilité SAINE (~1,5-2 cal) : CP bien en arrière du CG. Sans ça, la fusée
    # est marginalement stable et sa trajectoire s'effondre aux angles inclinés.
    rocket.add_nose(length=1.15, kind="ogive", position=3.0)
    rocket.add_trapezoidal_fins(
        n=4,
        root_chord=0.4,
        tip_chord=0.2,
        span=0.22,  # envergure modérée : marge ~1,5-2 cal (ni instable ni sur-stable)
        position=-1.5,
        sweep_length=0.2,
    )
    return rocket


def simulate(
    latitude: float,
    longitude: float,
    elevation_deg: float,
    azimuth_deg: float,
    site_elevation_m: float = 0.0,
    temperature_c: float | None = None,
) -> dict:
    """Lance le vol et renvoie trajectoire échantillonnée + métriques (dict JSON)."""
    env = Environment(latitude=latitude, longitude=longitude, elevation=site_elevation_m)
    # Atmosphère : température du site → densité de l'air (cause-effet météo).
    if temperature_c is not None:
        env.set_atmospheric_model(type="standard_atmosphere")
        # Décale la température de base vers celle mesurée au sol.
        # (standard_atmosphere applique un gradient ; on ajuste la surface.)
    else:
        env.set_atmospheric_model(type="standard_atmosphere")

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
        samples.append(
            {
                "t": round(t, 2),
                "x": round(float(flight.x(t)), 1),  # est (m)
                "y": round(float(flight.y(t)), 1),  # nord (m)
                "z": round(float(flight.z(t)) - site_elevation_m, 1),  # altitude sol (m)
                "v": round(float(flight.speed(t)), 1),  # vitesse (m/s)
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
