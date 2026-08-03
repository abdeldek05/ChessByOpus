# Comptes et rôles

Le site connaît deux comptes au plus, tous deux définis dans `backend/.env` —
jamais dans le code, jamais en base.

| Compte    | Rôle    | Accès                                                                 |
| --------- | ------- | --------------------------------------------------------------------- |
| Opérateur | `admin` | Toute la chaîne de simulation **et** l'onglet Admin                    |
| Invité    | `guest` | La chaîne de simulation seule : `/simulation`, `/mission`, `/lancement`, `/analytics`, `/historique` |

L'invité est facultatif : `.env` sans `GUEST_USERNAME` ni `GUEST_PASSWORD_HASH`
donne un site à un seul compte, exactement comme avant. Les deux lignes vont
ensemble ; une seule des deux laisse le compte désactivé.

## Ajouter (ou changer) l'invité

Générer le hash du mot de passe, la saisie est masquée et le mot de passe en
clair ne quitte pas le processus :

```bash
cd backend
python hash_password.py
```

Coller ensuite dans `backend/.env`, puis redémarrer le service
(`systemctl restart chess-backend`) — les réglages sont mémoïsés par processus :

```
GUEST_USERNAME=kab
GUEST_PASSWORD_HASH=$2b$12$…
```

Retirer ces deux lignes suffit à fermer le compte : le rôle est relu dans la
configuration à chaque requête, donc les sessions invité déjà ouvertes tombent
au prochain appel au lieu de survivre jusqu'à l'expiration de leur jeton (huit
heures).

L'identifiant invité doit différer de `AUTH_USERNAME`. S'ils sont identiques,
l'invité est ignoré au lieu de laisser l'ordre de lecture décider des droits
obtenus.

## Où la règle est appliquée

Côté serveur, `require_admin` (`backend/auth/dependencies.py`) garde le routeur
`/admin/*` en entier : un invité authentifié y reçoit 403, en direct comme en
curl. C'est là que l'accès est réellement protégé.

Côté client, l'onglet Admin est masqué (`AdminNavLink`) et la route `/admin`
renvoie vers `/simulation` (`RequireAdmin`). Ces deux gardes soignent
l'expérience — un onglet qui se refermerait au clic ferait passer une limite
assumée pour une panne — mais elles ne protègent aucune donnée.

Le mot de passe n'est jamais stocké en clair, et le journal des connexions
n'enregistre que l'identifiant essayé, le résultat, l'IP et l'agent.
