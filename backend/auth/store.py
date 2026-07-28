"""Persistance des connexions et des sessions (tables `login_events`, `sessions`).

Séparé de `routes.py` : les routes décident quoi journaliser, ce module sait
seulement l'écrire et le relire. L'onglet Admin lit ces mêmes tables.
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "missions.db"

# Motifs d'échec, pour distinguer une faute de frappe d'une attaque.
FAILURE_UNKNOWN_USER = "unknown_user"
FAILURE_BAD_PASSWORD = "bad_password"
FAILURE_RATE_LIMITED = "rate_limited"


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS login_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            ip TEXT NOT NULL,
            user_agent TEXT NOT NULL DEFAULT '',
            success INTEGER NOT NULL,
            failure_reason TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    # Sessions ouvertes : une ligne par jeton émis, fermée au logout ou à
    # l'expiration. `jti` est l'identifiant unique porté par le JWT — c'est lui
    # qui permet de révoquer UNE session sans invalider le secret global.
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            jti TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            ip TEXT NOT NULL,
            user_agent TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            revoked_at TEXT
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_login_events_at ON login_events(created_at DESC)")
    return connection


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def record_login_attempt(
    *,
    username: str,
    ip: str,
    user_agent: str,
    success: bool,
    failure_reason: str | None = None,
) -> None:
    """Journalise une tentative de connexion, réussie ou non.

    Le mot de passe essayé n'est JAMAIS enregistré : un journal d'audit qui
    contient des mots de passe (souvent des variantes du vrai, ou celui d'un
    autre service) devient lui-même le pire des secrets à protéger.
    """
    connection = _connect()
    connection.execute(
        """
        INSERT INTO login_events (username, ip, user_agent, success, failure_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (username[:120], ip, user_agent[:400], int(success), failure_reason, _now_iso()),
    )
    connection.commit()
    connection.close()


def open_session(
    *, jti: str, username: str, ip: str, user_agent: str, expires_at: datetime
) -> None:
    """Enregistre une session ouverte."""
    connection = _connect()
    connection.execute(
        """
        INSERT OR REPLACE INTO sessions (jti, username, ip, user_agent, created_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL)
        """,
        (jti, username, ip, user_agent[:400], _now_iso(), expires_at.isoformat()),
    )
    connection.commit()
    connection.close()


def close_session(jti: str) -> None:
    """Marque une session comme terminée (logout ou révocation)."""
    connection = _connect()
    connection.execute(
        "UPDATE sessions SET revoked_at = ? WHERE jti = ? AND revoked_at IS NULL",
        (_now_iso(), jti),
    )
    connection.commit()
    connection.close()


def is_session_active(jti: str) -> bool:
    """Une session révoquée doit être refusée même si son JWT est encore valide.

    C'est ce qui rend la révocation réelle : sans cette vérification, un jeton
    signé resterait accepté jusqu'à sa date d'expiration, et le bouton
    « Révoquer » de l'onglet Admin ne serait qu'un affichage.
    """
    connection = _connect()
    row = connection.execute(
        "SELECT revoked_at FROM sessions WHERE jti = ?", (jti,)
    ).fetchone()
    connection.close()

    # Jeton inconnu (émis avant la mise en place du suivi, ou base réinitialisée) :
    # accepté, sa signature et son `exp` restent les garde-fous.
    if row is None:
        return True
    return row[0] is None
