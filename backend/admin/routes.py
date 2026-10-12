"""Routes de l'onglet Admin. Toutes exigent une session d'OPÉRATEUR.

L'espace invité, lui, reçoit 403 : ce tableau de bord expose les connexions, les
adresses IP et les sessions ouvertes — de la supervision, pas de la démonstration.

Une seule route écrit : la révocation de session. Le reste est en lecture seule.
"""

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth.client_info import client_ip
from auth.config import SESSION_COOKIE_NAME
from auth.dependencies import require_operator
from auth.store import close_session
from auth.tokens import decode_access_token

from . import queries_activity as activity
from . import queries_security as security
from . import runtime_metrics

DB_PATH = Path(__file__).resolve().parent.parent / "missions.db"

# `require_operator` sur le routeur entier : impossible d'ajouter plus bas une
# route qui oublierait la garde.
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_operator)])


@router.get("/overview")
def read_overview(request: Request) -> dict[str, Any]:
    """Tout le tableau de bord en UN appel.

    Un seul aller-retour plutôt que cinq : la page s'affiche d'un coup, sans
    cascade de spinners ni états partiellement remplis.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    decoded = decode_access_token(token) if token else None
    current_jti = decoded[1] if decoded else ""

    database_bytes = DB_PATH.stat().st_size if DB_PATH.exists() else 0

    return {
        "security": {
            "loginEvents": security.list_login_events(),
            "recentFailures": security.count_recent_failures(),
            "activeSessions": security.list_active_sessions(),
            # Permet au front de marquer « cette session — la vôtre » et
            # d'empêcher l'admin de se déconnecter lui-même par mégarde.
            "currentJti": current_jti,
            "callerIp": client_ip(request),
        },
        "activity": {
            "totals": activity.count_totals(),
            "topSites": activity.top_launch_sites(),
            "timeline": activity.scenarios_timeline(),
            "radarUsage": activity.radar_template_usage(),
            **activity.role_distribution(),
        },
        "system": {
            **runtime_metrics.snapshot(),
            "databaseBytes": database_bytes,
        },
    }


@router.post("/sessions/{jti}/revoke")
def revoke_session(jti: str, request: Request) -> dict[str, bool]:
    """Ferme une session à distance. Le jeton correspondant cesse d'être accepté."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    decoded = decode_access_token(token) if token else None

    # Se révoquer soi-même déconnecterait sans prévenir, en pleine consultation.
    # Le bouton « Sign out » existe pour ça et exprime clairement l'intention.
    if decoded and decoded[1] == jti:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisez « Sign out » pour fermer votre propre session.",
        )

    close_session(jti)
    return {"ok": True}
