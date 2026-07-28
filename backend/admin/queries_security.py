"""Lectures du volet sécurité : journal des connexions et sessions actives."""

import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent / "missions.db"

# Plafond de lignes renvoyées au front. Sans limite, le journal grossit
# indéfiniment et finirait par envoyer des mégaoctets dans le navigateur.
MAX_EVENTS = 200


def _connect() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def _table_exists(connection: sqlite3.Connection, name: str) -> bool:
    """Une base d'avant l'auth n'a pas encore ces tables (aucun login effectué)."""
    row = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?", (name,)
    ).fetchone()
    return row is not None


def list_login_events(limit: int = MAX_EVENTS) -> list[dict[str, Any]]:
    """Journal des tentatives de connexion, les plus récentes d'abord."""
    connection = _connect()
    if not _table_exists(connection, "login_events"):
        connection.close()
        return []

    rows = connection.execute(
        """
        SELECT id, username, ip, user_agent, success, failure_reason, created_at
        FROM login_events
        ORDER BY id DESC
        LIMIT ?
        """,
        (min(limit, MAX_EVENTS),),
    ).fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "username": row[1],
            "ip": row[2],
            "userAgent": row[3],
            "success": bool(row[4]),
            "failureReason": row[5],
            "createdAt": row[6],
        }
        for row in rows
    ]


def count_recent_failures(hours: int = 24) -> int:
    """Échecs sur la période — l'indicateur qui doit sauter aux yeux."""
    connection = _connect()
    if not _table_exists(connection, "login_events"):
        connection.close()
        return 0

    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    row = connection.execute(
        "SELECT COUNT(*) FROM login_events WHERE success = 0 AND created_at >= ?",
        (since,),
    ).fetchone()
    connection.close()
    return int(row[0])


def list_active_sessions() -> list[dict[str, Any]]:
    """Sessions ni révoquées ni expirées, la plus récente d'abord."""
    connection = _connect()
    if not _table_exists(connection, "sessions"):
        connection.close()
        return []

    now = datetime.now(timezone.utc).isoformat()
    rows = connection.execute(
        """
        SELECT jti, username, ip, user_agent, created_at, expires_at
        FROM sessions
        WHERE revoked_at IS NULL AND expires_at > ?
        ORDER BY created_at DESC
        """,
        (now,),
    ).fetchall()
    connection.close()

    return [
        {
            "jti": row[0],
            "username": row[1],
            "ip": row[2],
            "userAgent": row[3],
            "createdAt": row[4],
            "expiresAt": row[5],
        }
        for row in rows
    ]
