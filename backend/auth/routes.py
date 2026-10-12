"""Routes d'authentification : /auth/login, /auth/logout, /auth/me.

Le jeton part dans un cookie `HttpOnly` et n'est JAMAIS renvoyé dans le corps de
la réponse : du JavaScript ne peut donc pas le lire, et une faille XSS sur le
front ne suffit plus à voler la session (contrairement à un token rangé dans
`localStorage`).

Chaque tentative — réussie ou non — est journalisée dans `login_events` pour
alimenter l'onglet Admin.

Deux espaces peuvent se connecter ici (opérateur, invité) : c'est
`auth/accounts.py` qui sait lesquels existent, ces routes n'en connaissent que
le résultat.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from . import accounts, rate_limit, store
from .client_info import client_ip, client_user_agent
from .config import ACCESS_TOKEN_TTL_SECONDS, SESSION_COOKIE_NAME, get_auth_settings
from .dependencies import require_user
from .tokens import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Message unique pour « identifiant inconnu » ET « mot de passe faux ». Deux
# messages distincts diraient à un attaquant lequel des deux il a déjà trouvé.
# (Le journal d'audit, lui, garde la distinction : elle est utile à l'admin.)
INVALID_CREDENTIALS = "Identifiants invalides"


class LoginPayload(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginPayload, request: Request, response: Response) -> dict[str, str]:
    settings = get_auth_settings()
    ip = client_ip(request)
    user_agent = client_user_agent(request)

    blocked_for = rate_limit.seconds_until_unblocked(ip)
    if blocked_for:
        store.record_login_attempt(
            username=payload.username,
            ip=ip,
            user_agent=user_agent,
            success=False,
            failure_reason=store.FAILURE_RATE_LIMITED,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives. Réessayez dans {blocked_for // 60 + 1} min.",
            headers={"Retry-After": str(blocked_for)},
        )

    # Opérateur ou invité : `authenticate` connaît les comptes ouverts et
    # consomme le même temps sur identifiant inconnu (voir DUMMY_HASH).
    account = accounts.authenticate(payload.username, payload.password)

    if account is None:
        rate_limit.register_failure(ip)
        store.record_login_attempt(
            username=payload.username,
            ip=ip,
            user_agent=user_agent,
            success=False,
            failure_reason=(
                store.FAILURE_BAD_PASSWORD
                if accounts.find_account(payload.username)
                else store.FAILURE_UNKNOWN_USER
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        )

    rate_limit.reset(ip)

    session = create_access_token(account.username)
    store.open_session(
        jti=session.jti,
        username=account.username,
        ip=ip,
        user_agent=user_agent,
        expires_at=session.expires_at,
    )
    store.record_login_attempt(
        username=account.username, ip=ip, user_agent=user_agent, success=True
    )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session.token,
        max_age=ACCESS_TOKEN_TTL_SECONDS,
        httponly=True,  # invisible pour document.cookie → immunisé au vol par XSS
        samesite="strict",  # jamais envoyé depuis un autre site → pas de CSRF
        secure=settings.cookie_secure,  # HTTPS only en production
        path="/",
    )

    # Le rôle est renvoyé pour que le front sache quel espace afficher (l'onglet
    # Admin n'existe pas pour un invité). Ce n'est qu'un confort d'interface : la
    # règle est appliquée côté serveur par `require_operator`.
    return {"username": account.username, "role": account.role}


@router.post("/logout")
def logout(request: Request, response: Response) -> dict[str, bool]:
    """Efface le cookie de session et ferme la session en base.

    Aucune authentification exigée : se déconnecter avec un jeton déjà expiré
    doit fonctionner, pas renvoyer 401.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    decoded = decode_access_token(token) if token else None
    if decoded and decoded[1]:
        store.close_session(decoded[1])

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/", samesite="strict")
    return {"ok": True}


@router.get("/me")
def read_current_user(username: str = Depends(require_user)) -> dict[str, str]:
    """Qui est connecté, et dans quel espace — le front s'en sert pour restaurer
    la session au F5, onglets réservés compris."""
    return {"username": username, "role": accounts.role_for(username)}
