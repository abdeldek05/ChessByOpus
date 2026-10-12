"""Dépendances FastAPI qui exigent une session valide (`require_user`), et le
rôle d'opérateur pour les routes réservées (`require_operator`).

Branchées sur les routes métier via `dependencies=[Depends(require_user)]`, elles
rendent le contournement du login impossible : sans cookie valide, un appel
direct à /simulate (curl, script) reçoit 401 et n'exécute rien.
"""

from fastapi import HTTPException, Request, status

from .accounts import ROLE_OPERATOR, role_for
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


def require_operator(request: Request) -> str:
    """Comme `require_user`, mais ferme la porte à l'espace invité.

    403 et non 401 : la session EST valide, il ne manque pas une connexion mais
    un droit. Un 401 renverrait l'invité vers le formulaire de login, où aucune
    saisie ne pourrait jamais lui ouvrir cette porte.

    Le rôle est relu à chaque requête plutôt que transporté dans le jeton :
    fermer l'espace invité prend effet tout de suite, sans attendre l'expiration
    des jetons déjà émis.
    """
    username = require_user(request)

    if role_for(username) != ROLE_OPERATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Espace réservé à l'opérateur",
        )

    return username
