"""Réglages d'authentification, lus depuis l'environnement (backend/.env).

Aucune valeur par défaut pour les trois champs sensibles : si `.env` est absent
ou incomplet, l'application REFUSE de démarrer. C'est volontaire — un fallback
silencieux (identifiant « admin », secret « changeme ») donnerait un site qui
tourne en paraissant protégé alors qu'il ne l'est pas.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

# Durée de validité d'une session. Assez longue pour ne pas couper une séance
# de travail (une simulation + un vol prennent du temps), assez courte pour
# qu'un cookie volé n'ait pas une valeur indéfinie.
ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60

# Nom du cookie de session. Préfixe explicite : on le retrouve du premier coup
# dans l'inspecteur du navigateur, au milieu des cookies de MapLibre & co.
SESSION_COOKIE_NAME = "chess_session"


class AuthSettings(BaseSettings):
    """Identifiants et secret de signature. Tous requis, tous hors du code."""

    model_config = SettingsConfigDict(env_file=ENV_PATH, extra="ignore")

    auth_username: str = Field(min_length=1)

    # Hash bcrypt (`$2b$...`), jamais le mot de passe en clair. Généré par
    # `python hash_password.py`.
    auth_password_hash: str = Field(min_length=20)

    # Clé de signature HS256. 32 octets aléatoires minimum (64 caractères hex) :
    # en dessous, la signature devient attaquable hors ligne.
    jwt_secret: str = Field(min_length=32)

    # `Secure` sur le cookie : impose HTTPS. Faux en dev (localhost est en
    # HTTP simple), VRAI en production — sinon le cookie de session circule en
    # clair sur le réseau et l'authentification ne protège plus rien.
    cookie_secure: bool = False


@lru_cache
def get_auth_settings() -> AuthSettings:
    """Réglages mémoïsés : le `.env` n'est lu qu'une fois par processus."""
    return AuthSettings()
