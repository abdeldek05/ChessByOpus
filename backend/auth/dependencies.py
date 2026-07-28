"""Dépendance FastAPI qui exige une session valide.

Branchée sur les routes métier via `dependencies=[Depends(require_user)]`, elle
rend le contournement du login impossible : sans cookie valide, un appel direct
à /simulate (curl, script) reçoit 401 et n'exécute rien.
"""

from fastapi import HTTPException, Request, status

from .config import SESSION_COOKIE_NAME
from .store import is_session_active
from .tokens import decode_access_token


def require_user(request: Request) -> str:
    """Renvoie l'identifiant de l'utilisateur connecté, ou lève 401."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    decoded = decode_access_token(token) if token else None

    if decoded is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
        )

    username, jti = decoded

    # Session révoquée depuis l'onglet Admin : le jeton est encore valablement
    # signé, mais il ne doit plus ouvrir aucune porte.
    if jti and not is_session_active(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session révoquée",
        )

    return username
