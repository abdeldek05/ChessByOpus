"""Identification de l'appelant : adresse IP et navigateur.

Extrait de `routes.py` car le journal d'audit, l'enregistrement de session ET la
limitation de débit ont tous besoin des mêmes valeurs.
"""

from fastapi import Request


def client_ip(request: Request) -> str:
    """IP de l'appelant, en tenant compte du proxy Nginx placé devant.

    Nginx doit poser `X-Forwarded-For` ; sans lui toutes les requêtes semblent
    venir de 127.0.0.1 et le quota deviendrait global au lieu d'être par client.
    On ne garde que la PREMIÈRE adresse : les suivantes peuvent être ajoutées
    par le client lui-même et servir à esquiver le compteur.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def client_user_agent(request: Request) -> str:
    """Chaîne User-Agent brute. Interprétée à l'affichage, pas ici."""
    return request.headers.get("user-agent", "")
