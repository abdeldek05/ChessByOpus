"""Dépendances FastAPI qui exigent une session valide, et le bon rôle.

Branchées sur les routes métier via `dependencies=[Depends(require_user)]`,
elles rendent le contournement du login impossible : sans cookie valide, un
appel direct à /simulate (curl, script) reçoit 401 et n'exécute rien.

`require_admin` ajoute la seconde question — « ce compte a-t-il le droit ? » —
sans laquelle un invité authentifié atteindrait /admin en tapant l'URL.
"""

from fastapi import Depends, HTTPException, Request, status

from .accounts import Account, find_account
from .config import SESSION_COOKIE_NAME
from .roles import PERMISSION_ADMIN, has_permission
from .store import is_session_active
from .tokens import decode_access_token


def require_account(request: Request) -> Account:
    """Renvoie le compte connecté (identité + rôle), ou lève 401."""
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

    # Le rôle est relu dans `.env` à chaque requête plutôt que lu dans le jeton :
    # un compte supprimé de la configuration perd ses accès immédiatement, sans
    # attendre l'expiration des jetons déjà émis.
    account = find_account(username)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte inconnu",
        )

    return account


def require_user(account: Account = Depends(require_account)) -> str:
    """Renvoie l'identifiant de l'utilisateur connecté, ou lève 401."""
    return account.username


def require_admin(account: Account = Depends(require_account)) -> Account:
    """Exige la permission d'administration. 403 (pas 401) pour un invité.

    La distinction compte : 401 signifie « connectez-vous » et renverrait un
    invité vers le formulaire de login alors que sa session est parfaitement
    valide. 403 dit la vérité — connecté, mais pas autorisé.
    """
    if not has_permission(account.role, PERMISSION_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé à l'opérateur",
        )
    return account
