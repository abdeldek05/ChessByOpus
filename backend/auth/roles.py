"""Rôles et permissions.

Un rôle ne donne rien par lui-même : il est traduit ici en un ensemble fermé de
permissions. Les routes interrogent la PERMISSION, jamais le rôle — ajouter un
rôle demain (observateur, instructeur…) ne demandera donc de retoucher aucune
route, seulement ce tableau.

Un rôle inconnu (valeur inattendue en base ou dans `.env`) ne reçoit AUCUNE
permission : en cas de doute, la réponse est « non ».
"""

# Opérateur complet : simulation + console d'administration.
ROLE_ADMIN = "admin"

# Invité : la chaîne de simulation, et rien d'autre.
ROLE_GUEST = "guest"

# Choisir un site, configurer une mission, lancer un tir, lire le bilan.
PERMISSION_SIMULATION = "simulation"

# Onglet Admin : journal des connexions, sessions ouvertes, santé du service.
PERMISSION_ADMIN = "admin"

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    ROLE_ADMIN: frozenset({PERMISSION_SIMULATION, PERMISSION_ADMIN}),
    ROLE_GUEST: frozenset({PERMISSION_SIMULATION}),
}


def has_permission(role: str, permission: str) -> bool:
    """Ce rôle porte-t-il cette permission ?"""
    return permission in ROLE_PERMISSIONS.get(role, frozenset())
