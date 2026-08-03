"""Annuaire des comptes reconnus, construit depuis `backend/.env`.

Deux comptes au plus : l'opérateur (rôle `admin`) et un invité (rôle `guest`,
simulation seule). Les identifiants restent hors du code, comme pour
l'opérateur — un compte invité codé en dur serait un mot de passe publié dans
le dépôt.

Le rôle n'est PAS porté par le jeton de session : il est relu ici à chaque
requête. Retirer le compte invité de `.env` ferme donc ses accès tout de suite,
sans attendre l'expiration des jetons déjà émis.
"""

from dataclasses import dataclass

from .config import get_auth_settings
from .roles import ROLE_ADMIN, ROLE_GUEST


@dataclass(frozen=True)
class Account:
    """Un compte : qui il est, ce qu'il a le droit de faire, comment le vérifier."""

    username: str
    role: str
    password_hash: str


def list_accounts() -> tuple[Account, ...]:
    """Comptes configurés, l'opérateur d'abord.

    L'invité n'existe que si SES DEUX champs sont renseignés : un identifiant
    sans hash ouvrirait un compte que personne ne peut prouver posséder.
    """
    settings = get_auth_settings()

    accounts = [
        Account(
            username=settings.auth_username,
            role=ROLE_ADMIN,
            password_hash=settings.auth_password_hash,
        )
    ]

    guest_is_declared = bool(settings.guest_username and settings.guest_password_hash)
    # Même identifiant pour les deux comptes : l'invité est ignoré. Le garder
    # ferait dépendre les droits obtenus de l'ordre de cette liste, ce qui est
    # exactement le genre de détail qu'on ne veut pas voir décider d'un accès.
    if guest_is_declared and settings.guest_username != settings.auth_username:
        accounts.append(
            Account(
                username=settings.guest_username,
                role=ROLE_GUEST,
                password_hash=settings.guest_password_hash,
            )
        )

    return tuple(accounts)


def find_account(username: str) -> Account | None:
    """Le compte portant cet identifiant, ou None s'il n'existe pas."""
    for account in list_accounts():
        if account.username == username:
            return account
    return None
