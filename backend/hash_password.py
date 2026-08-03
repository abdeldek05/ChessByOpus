"""Génère le hash bcrypt à coller dans `backend/.env`.

    python hash_password.py

La saisie est masquée (getpass) et le mot de passe en clair ne quitte jamais ce
processus : ni fichier, ni historique de shell, ni log. Seul le hash s'affiche.
"""

from getpass import getpass

from auth.hashing import hash_password


def main() -> None:
    password = getpass("Mot de passe : ")
    if not password:
        print("Abandon : mot de passe vide.")
        return

    if password != getpass("Confirmer     : "):
        print("Abandon : les deux saisies diffèrent.")
        return

    # Le même hash sert aux deux comptes : on affiche les deux lignes possibles
    # plutôt que de demander « admin ou invité ? » avant même de savoir si les
    # deux saisies concordent.
    digest = hash_password(password)
    print("\nÀ coller dans backend/.env, selon le compte :\n")
    print(f"AUTH_PASSWORD_HASH={digest}    # opérateur (accès complet)")
    print(f"GUEST_PASSWORD_HASH={digest}   # invité (simulation seule)")


if __name__ == "__main__":
    main()
