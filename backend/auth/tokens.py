"""Jeton de session signé (JWT HS256).

Le jeton porte l'identifiant, les dates et un `jti` (identifiant unique de
session) — aucune donnée sensible. Un JWT est SIGNÉ, pas chiffré : son contenu
est lisible par le client, seule sa falsification est empêchée.
"""

import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import ACCESS_TOKEN_TTL_SECONDS, get_auth_settings

JWT_ALGORITHM = "HS256"


class SessionToken:
    """Jeton émis + ce qu'il faut pour l'enregistrer en base."""

    def __init__(self, token: str, jti: str, expires_at: datetime) -> None:
        self.token = token
        self.jti = jti
        self.expires_at = expires_at


def create_access_token(username: str) -> SessionToken:
    """Signe un jeton de session pour cet utilisateur.

    Le `jti` aléatoire identifie CETTE session : c'est lui qui permet de la
    révoquer individuellement, sans changer le secret global (ce qui
    déconnecterait tout le monde).
    """
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=ACCESS_TOKEN_TTL_SECONDS)
    jti = secrets.token_urlsafe(16)

    token = jwt.encode(
        {"sub": username, "jti": jti, "iat": issued_at, "exp": expires_at},
        get_auth_settings().jwt_secret,
        algorithm=JWT_ALGORITHM,
    )
    return SessionToken(token=token, jti=jti, expires_at=expires_at)


def decode_access_token(token: str) -> tuple[str, str] | None:
    """Renvoie `(username, jti)` pour un jeton valide, sinon None.

    Signature invalide, jeton expiré ou forme inattendue : tout se traite en
    None. L'appelant n'a qu'une question à poser (« qui est-ce ? ») et une seule
    réponse d'échec à gérer, donc aucun cas d'erreur ne peut être oublié.
    """
    secret = get_auth_settings().jwt_secret
    try:
        # `algorithms` est explicite : sans cette liste, un jeton forgé avec
        # `alg: none` pourrait être accepté comme valide.
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None

    username = payload.get("sub")
    jti = payload.get("jti")
    if not isinstance(username, str) or not username:
        return None
    # `jti` absent : jeton émis avant la mise en place du suivi de sessions.
    return username, jti if isinstance(jti, str) else ""
