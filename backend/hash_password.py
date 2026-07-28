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

    print("\nÀ coller dans backend/.env :\n")
    print(f"AUTH_PASSWORD_HASH={hash_password(password)}")


if __name__ == "__main__":
    main()
