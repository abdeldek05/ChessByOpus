"""Hachage et vérification du mot de passe (bcrypt).

bcrypt et pas SHA-256 : une fonction de hachage rapide est un défaut ici. bcrypt
est lent PAR CONCEPTION (facteur de coût), ce qui rend le brute-force hors ligne
coûteux si le hash fuite un jour.
"""

import bcrypt

# Coût 12 : ~250 ms par vérification sur une machine courante. Assez lent pour
# gêner sérieusement une attaque par dictionnaire, assez rapide pour un login.
BCRYPT_COST = 12

# Hash factice, utilisé quand l'identifiant fourni est inconnu. On vérifie le
# mot de passe CONTRE lui plutôt que de répondre tout de suite : sans ça, une
# réponse instantanée sur un mauvais identifiant (vs ~250 ms sur un bon)
# révélerait par simple chronométrage quels identifiants existent.
DUMMY_HASH = "$2b$12$7j4MblFp3PpvLiTxWYsXauu4paZte1/wIWNgBgHZ38JPbzxzmdMt."


def hash_password(plain_password: str) -> str:
    """Renvoie le hash bcrypt d'un mot de passe (à stocker dans `.env`)."""
    salt = bcrypt.gensalt(rounds=BCRYPT_COST)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Compare un mot de passe à son hash, en temps constant (via bcrypt).

    Un hash mal formé renvoie False au lieu de lever : une valeur invalide dans
    `.env` doit produire « identifiants invalides », pas une 500 qui expose la
    configuration du serveur dans la réponse.
    """
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False
