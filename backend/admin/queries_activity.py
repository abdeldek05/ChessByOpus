"""Lectures du volet activité : ce que disent `missions` et `scenarios`.

Ces tables sont déjà remplies par l'usage normal de l'app (285 missions, 185
scénarios au moment de l'écriture) mais n'étaient exposées nulle part.
"""

import json
import sqlite3
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent / "missions.db"

TOP_SITES = 6
TIMELINE_DAYS = 14


def _connect() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def count_totals() -> dict[str, int]:
    connection = _connect()
    missions = connection.execute("SELECT COUNT(*) FROM missions").fetchone()[0]
    scenarios = connection.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
    connection.close()
    return {"missions": int(missions), "scenarios": int(scenarios)}


def top_launch_sites() -> list[dict[str, Any]]:
    """Sites de lancement les plus utilisés."""
    connection = _connect()
    rows = connection.execute(
        """
        SELECT site_name, COUNT(*) AS total
        FROM missions
        GROUP BY site_name
        ORDER BY total DESC
        LIMIT ?
        """,
        (TOP_SITES,),
    ).fetchall()
    connection.close()
    return [{"name": row[0], "count": int(row[1])} for row in rows]


def scenarios_timeline() -> list[dict[str, Any]]:
    """Scénarios créés par jour sur la période, jours vides inclus.

    Les jours à zéro sont renvoyés explicitement : sans eux, une courbe
    d'activité relierait deux jours actifs séparés par une semaine creuse et
    donnerait l'illusion d'une activité continue.
    """
    connection = _connect()
    since_date = (datetime.now(timezone.utc) - timedelta(days=TIMELINE_DAYS - 1)).date()
    rows = connection.execute(
        """
        SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS total
        FROM scenarios
        WHERE substr(created_at, 1, 10) >= ?
        GROUP BY day
        """,
        (since_date.isoformat(),),
    ).fetchall()
    connection.close()

    counts = {row[0]: int(row[1]) for row in rows}
    return [
        {
            "day": (since_date + timedelta(days=offset)).isoformat(),
            "count": counts.get((since_date + timedelta(days=offset)).isoformat(), 0),
        }
        for offset in range(TIMELINE_DAYS)
    ]


def radar_template_usage() -> list[dict[str, Any]]:
    """Modèles de radar les plus employés dans les scénarios."""
    connection = _connect()
    rows = connection.execute(
        """
        SELECT radar_template_id, COUNT(*) AS total
        FROM scenarios
        GROUP BY radar_template_id
        ORDER BY total DESC
        """
    ).fetchall()
    connection.close()
    return [{"templateId": row[0], "count": int(row[1])} for row in rows]


def role_distribution() -> dict[str, Any]:
    """Répartition des rôles CHESS (Roi/Dame/Pion) sur tous les scénarios.

    `mesange_configs` est stocké en JSON : on le relit ici plutôt qu'en SQL.
    Une ligne illisible (schéma plus ancien) est ignorée sans faire échouer la
    page entière — un tableau de bord ne doit pas tomber sur une donnée d'archive.
    """
    connection = _connect()
    rows = connection.execute("SELECT mesange_configs FROM scenarios").fetchall()
    connection.close()

    roles: Counter[str] = Counter()
    fleet_sizes: list[int] = []
    for (raw,) in rows:
        try:
            configs = json.loads(raw)
        except (TypeError, ValueError):
            continue
        if not isinstance(configs, list):
            continue
        fleet_sizes.append(len(configs))
        for config in configs:
            if isinstance(config, dict):
                roles[str(config.get("role", "PAWN"))] += 1

    average_fleet = round(sum(fleet_sizes) / len(fleet_sizes), 1) if fleet_sizes else 0.0
    return {
        "roles": [{"role": role, "count": count} for role, count in roles.most_common()],
        "averageFleetSize": average_fleet,
    }
