"""Limitation des tentatives de connexion, en mémoire.

Sans ce garde-fou, un mot de passe faible tombe en quelques minutes : rien
n'empêche de tenter des milliers de combinaisons à la seconde. Ici, après 5
échecs, l'IP est bloquée 15 minutes — un dictionnaire devient hors de portée.

En mémoire, donc remis à zéro au redémarrage du serveur : suffisant pour un
service à un seul processus (ce déploiement). Avec plusieurs workers uvicorn, il
faudrait un compteur partagé (Redis) — chaque worker a sinon son propre quota.
"""

from collections import defaultdict
from time import monotonic

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60

# IP → horodatages (monotone) des échecs récents.
_failures: dict[str, list[float]] = defaultdict(list)


def _recent_failures(client_ip: str, now: float) -> list[float]:
    """Échecs encore dans la fenêtre, en purgeant les plus anciens au passage."""
    kept = [stamp for stamp in _failures[client_ip] if now - stamp < WINDOW_SECONDS]
    _failures[client_ip] = kept
    return kept


def seconds_until_unblocked(client_ip: str) -> int:
    """Secondes d'attente restantes, ou 0 si l'IP peut tenter sa chance."""
    now = monotonic()
    recent = _recent_failures(client_ip, now)
    if len(recent) < MAX_ATTEMPTS:
        return 0
    # Le blocage se lève quand le plus ancien échec sort de la fenêtre.
    return max(1, int(WINDOW_SECONDS - (now - min(recent))))


def register_failure(client_ip: str) -> None:
    """Enregistre une tentative ratée."""
    now = monotonic()
    _recent_failures(client_ip, now).append(now)


def reset(client_ip: str) -> None:
    """Efface le compteur après une connexion réussie."""
    _failures.pop(client_ip, None)
