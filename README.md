# CHESS — byOpus Aerospace

Plateforme de simulation de défense anti-aérienne. Un opérateur radar place son
dispositif de détection, subit une salve de menaces tirées selon une doctrine
inspirée des échecs, puis analyse ce que son radar a réellement vu.

Le vecteur d'essai est la **Mesange**, fusée-sonde d'Opus Aerospace : la
trajectoire n'est pas scriptée, elle est intégrée par **RocketPy** à partir des
données réelles de prédesign (courbe de poussée, coefficients de traînée,
masses et inerties).

---

## La doctrine CHESS

Chaque menace d'une salve joue un rôle, et son rôle détermine sa signature radar :

| Rôle | Fonction | Comportement |
| --- | --- | --- |
| **Roi** | La menace réelle | Trajectoire RocketPy complète, celle qu'il faut détecter |
| **Dame** | Leurre premium | Rejoue le vol du Roi, tourné — signature plus grosse qu'un Pion |
| **Pion** | Saturation | Physique propre (burn court), en nombre, pour noyer la piste |

Le joueur est le **défenseur** : il ne choisit pas la salve, il configure son
radar et découvre ensuite s'il a su distinguer le Roi du bruit.

---

## Le modèle de détection

La détection n'est pas un test de distance. Pour chaque échantillon de chaque
trajectoire, le serveur vérifie les conditions physiques réelles
(voir [`backend/radar.py`](backend/radar.py)) :

- **Horizon radar** avec courbure terrestre et réfraction standard 4/3 —
  sous l'horizon, la cible est invisible quelle que soit la portée.
- **Équation radar** : la portée effective dépend de la SER de la cible face à
  la sensibilité réglée, en racine quatrième.
- **SER d'aspect** : la Mesange vue de nez renvoie ~0,08 m², de flanc ~1,2 m² —
  interpolée selon l'angle entre vitesse et ligne de visée.
- **Plafond d'altitude**, rotation d'antenne et vitesse de balayage.

C'est ce qui rend les angles morts possibles : une menace peut traverser la
couverture nominale sans jamais être vue.

---

## Stack

**Frontend** — React 19 + TypeScript, Vite, Tailwind CSS v4 (tokens dans
`@theme`), Three.js via `@react-three/fiber` / `@react-three/drei` pour les
scènes 3D, MapLibre GL pour les cartes tactiques, Zustand pour l'état.

**Backend** — FastAPI, RocketPy pour l'intégration de vol, SQLite pour les
missions, authentification par cookie `HttpOnly` (JWT HS256, mot de passe bcrypt).

**Typographie** — Space Grotesk (UI), JetBrains Mono (chiffres et données,
strictement), Jost light (accents fins).

---

## Lancer le projet

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

L'authentification refuse de démarrer sans configuration — c'est volontaire, un
fallback silencieux donnerait un site qui *paraît* protégé. Copier
[`backend/.env.example`](backend/.env.example) en `backend/.env` et le remplir :

```bash
python hash_password.py                                    # AUTH_PASSWORD_HASH
python -c "import secrets; print(secrets.token_hex(32))"   # JWT_SECRET
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # démarre Vite + l'API sur :8000 en parallèle
```

Autres commandes :

```bash
npm run dev:front   # Vite seul
npm run build       # tsc -b && vite build
npm run lint        # oxlint
```

> Un « échec, réessayer » dans l'interface signifie presque toujours que l'API
> sur le port 8000 n'est pas lancée.

---

## Parcours applicatif

Les routes de travail sont protégées : sans session, le back répond 401 et le
front redirige vers `/login`.

| Route | Rôle |
| --- | --- |
| `/` · `/contact` | Vitrine publique |
| `/login` | Terminal d'accès opérateur |
| `/mission` | Configuration : région, radars, menaces de la salve |
| `/lancement` | Vol 3D temps réel + carte tactique + coupe de couverture |
| `/analytics` | Analyse après vol : lobes de couverture, fenêtres de visibilité |
| `/simulation` | Portée maximale et enveloppe de tir |
| `/historique` | Missions passées |
| `/admin` | Console opérateur (activité, sessions, métriques) |

Les routes lourdes (Three.js, MapLibre) sont chargées en `lazy` : la page
d'accueil ne paie pas le poids du moteur 3D.

---

## Organisation du code

Les règles d'architecture sont dans [`CLAUDE.md`](CLAUDE.md) et s'appliquent à
tout ajout. L'essentiel :

**Un fichier = une responsabilité.** Un composant exporté par fichier, props
typées via interface nommée, aucun `any`.

**Le code Three.js est séparé en quatre couches.** Les mélanger est la
principale source de régressions ici :

```
three/canvas/      <Canvas>, lumières, caméras, contrôles
three/models/      rendu JSX du modèle uniquement
three/hooks/       useFrame, chargement, calculs mémoïsés
three/constants/   chemins .glb, config statique
```

**Styles** — tout passe par les tokens Tailwind de `src/styles/index.css`. Les
seules valeurs littérales admises sont celles calculées à l'exécution (position
de HUD suivant une trajectoire) et les uniforms de shaders Three.js.

```
frontend/src/
├── pages/        une page par route
├── components/   layout/, sections/<Page>/, ui/, routing/
├── hooks/        logique React réutilisable
├── lib/          fonctions pures (sans state ni effet)
├── three/        scènes 3D, en quatre couches
├── stores/       état global Zustand
└── styles/       tokens @theme + keyframes

backend/
├── main.py       routes API, persistance des missions
├── simulate.py   vol RocketPy
├── radar.py      modèle physique de détection
├── auth/         session, hachage, limitation de débit
├── admin/        requêtes de la console opérateur
└── data/         courbe de poussée et coefficients de traînée
```
