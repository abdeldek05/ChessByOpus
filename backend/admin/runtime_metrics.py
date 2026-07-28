"""Mesures d'exécution du backend : uptime et temps de réponse de /simulate.

En mémoire, donc remis à zéro au redémarrage — c'est le comportement voulu :
« uptime » et « durée moyenne depuis le démarrage » n'ont de sens que pour le
processus en cours. L'historique durable, lui, vit dans SQLite.
"""

from collections import deque
from datetime import datetime, timezone
from time import monotonic

# Fenêtre glissante : la moyenne suit les conditions RÉCENTES. Une moyenne depuis
# le démarrage resterait plombée des heures par un premier appel météo à froid
# (~40 s), alors que l'intérêt est de voir si /simulate répond bien maintenant.
_WINDOW = 50

_started_monotonic = monotonic()
_started_at = datetime.now(timezone.utc)

_simulate_durations: deque[float] = deque(maxlen=_WINDOW)
_last_success_at: str | None = None
_last_failure_at: str | None = None
_last_failure_error: str | None = None
_simulate_total = 0
_simulate_failures = 0


def record_simulate(duration_seconds: float, *, success: bool, error: str | None = None) -> None:
    """Enregistre l'issue d'un appel à /simulate."""
    global _last_success_at, _last_failure_at, _last_failure_error
    global _simulate_total, _simulate_failures

    _simulate_total += 1
    _simulate_durations.append(duration_seconds)
    now = datetime.now(timezone.utc).isoformat()

    if success:
        _last_success_at = now
    else:
        _simulate_failures += 1
        _last_failure_at = now
        # Message tronqué : une trace RocketPy complète n'a rien à faire dans un
        # tableau de bord (et pourrait exposer des chemins du serveur).
        _last_failure_error = (error or "")[:200]


def snapshot() -> dict[str, object]:
    """État courant du processus, prêt à être renvoyé au front."""
    uptime = monotonic() - _started_monotonic
    average = (
        round(sum(_simulate_durations) / len(_simulate_durations), 2)
        if _simulate_durations
        else None
    )
    return {
        "startedAt": _started_at.isoformat(),
        "uptimeSeconds": int(uptime),
        "simulateCount": _simulate_total,
        "simulateFailures": _simulate_failures,
        "simulateAverageSeconds": average,
        "lastSuccessAt": _last_success_at,
        "lastFailureAt": _last_failure_at,
        "lastFailureError": _last_failure_error,
    }
