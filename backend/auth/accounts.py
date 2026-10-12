"""Catalogue des comptes ouverts et de leurs rôles.

Deux espaces, deux rôles :

* `operator` — le compte de travail (identifiants dans `backend/.env`). Accès
  complet, onglet Admin inclus.
* `guest` — l'espace invité, pour une démonstration. Même parcours de mission
  (carte, radars, menaces, tir), mais l'onglet Admin — journal des connexions,
  sessions actives, révocation — lui est fermé.

Séparé de `routes.py` : les routes savent répondre en HTTP, ce module sait QUI
existe et avec quel droit. Ouvrir ou fermer un compte ne touche donc à aucune
route, et la règle d'accès ne se retrouve pas recopiée à plusieurs endroits.
"""

from dataclasses import dataclass

from .config import get_auth_settings
from .hashing import DUMMY_HASH, verify_password

ROLE_OPERATOR = "operator"
ROLE_GUEST = "guest"


@dataclass(frozen=True)
class Account:
    """Un compte : son identifiant, le hash de son mot de passe, son rôle."""

    username: str
    password_hash: str
    role: str


def list_accounts() -> list[Account]:
    """Les comptes actuellement ouverts."""
    settings = get_auth_settings()
    accounts = [
        Account(
            username=settings.auth_username,
            password_hash=settings.auth_password_hash,
            role=ROLE_OPERATOR,
        )
    ]

    # `GUEST_USERNAME` vide dans `.env` = interrupteur : l'espace invité
    # disparaît sans toucher au code. Un identifiant invité identique à celui de
    # l'opérateur est ignoré de même — sinon le compte de démonstration
    # masquerait le compte de travail, et son mot de passe public deviendrait
    # celui de l'opérateur.
    guest_username = settings.guest_username.strip()
    if guest_username and guest_username != settings.auth_username:
        accounts.append(
            Account(
                username=guest_username,
                password_hash=settings.guest_password_hash,
                role=ROLE_GUEST,
            )
        )

    return accounts


def find_account(username: str) -> Account | None:
    """Le compte portant cet identifiant, sinon None."""
    return next((account for account in list_accounts() if account.username == username), None)


def role_for(username: str) -> str:
    """Rôle porté par cet identifiant. Inconnu → `guest`, par moindre privilège.

    Cas réel : `AUTH_USERNAME` modifié dans `.env` alors que d'anciens jetons
    circulent encore. Ils restent des sessions valides (signature et `exp` font
    foi), mais ne doivent pas hériter des droits d'opérateur par défaut.
    """
    account = find_account(username)
    return account.role if account else ROLE_GUEST


def authenticate(username: str, password: str) -> Account | None:
    """Le compte correspondant à ces identifiants, sinon None.

    On vérifie TOUJOURS un hash, même sur identifiant inconnu (voir DUMMY_HASH) :
    sans ça, une réponse instantanée sur un identifiant qui n'existe pas — contre
    ~250 ms sur un identifiant valide — révélerait par simple chronométrage
    lesquels existent.
    """
    account = find_account(username)

    if account is None:
        verify_password(password, DUMMY_HASH)  # résultat ignoré, temps consommé
        return None

    return account if verify_password(password, account.password_hash) else None
