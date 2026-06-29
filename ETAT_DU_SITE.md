# CHESSbyOpus — État actuel du site

Document de référence décrivant **ce qui existe actuellement** sur le frontend
(et non l'historique des ajustements). À jour pour la reprise du projet.

---

## 1. Vue d'ensemble

Site vitrine pour **CHESS**, la plateforme de simulation et de scénarisation de
menaces aériennes d'**Opus Aerospace**, articulée autour de la fusée **Mésange**
(vecteur d'essai, Mach 2+).

Le site fait aujourd'hui **2 pages** routées :

| Route | Page | Contenu |
|---|---|---|
| `/` | Accueil | Header + Hero (titre, accroche, CTA + Mésange en 3D) |
| `/contact` | Contact | Header + section contact (e-mail, copie, retour accueil) |

> La page **Simulation** (`/simulation`) est référencée dans la nav et le CTA
> mais **n'existe pas encore** (route à créer).

---

## 2. Stack technique

- **React 19** + **TypeScript** (`.tsx`)
- **Vite 8** (dev/build), alias `@/` → `src/`
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, tokens dans `@theme`)
- **React Three Fiber** + **Drei** + **Three.js** (rendu 3D de la Mésange)
- **react-router-dom** (routing SPA)
- **lucide-react** (icônes)
- Polices auto-hébergées (`@fontsource`) : **Saira** (texte) + **Chakra Petch** (mono/titres)

---

## 3. Direction artistique

- Fond sombre anthracite neutre, esthétique technique/aérospatiale sobre.
- Accent **laiton** (`#94866e`), calé sur le matériau or réel de la fusée.
- Texte à contraste doux (jamais de blanc pur).
- Statuts : vert (ok), orange (warning), rouge (alert).
- **Tous les tokens couleur/police sont dans `src/styles/index.css`** (`@theme`).
  Aucune couleur ni dimension en dur dans les composants.

---

## 4. Arborescence des fichiers

```
src/
├── App.tsx                      # Définition des routes (/ et /contact)
├── main.tsx                     # Bootstrap React + BrowserRouter
├── styles/
│   ├── index.css                # Tokens @theme (couleurs, polices) + base
│   └── animations.css           # @keyframes custom (vide pour l'instant)
├── pages/
│   ├── Home.tsx                 # Header + Hero
│   └── Contact.tsx              # Header + ContactSection
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Barre fixe : logo + nav
│   │   ├── LogoMark.tsx         # Logo Opus (image détourée)
│   │   ├── NavLink.tsx          # Lien de nav (état actif = souligné)
│   │   └── navLinks.ts          # Données des liens de nav
│   ├── sections/
│   │   ├── Hero/Hero.tsx        # Accroche + CTA + cadre 3D Mésange
│   │   └── Contact/
│   │       ├── ContactSection.tsx   # E-mail + bouton copie + retour
│   │       └── contactInfo.ts        # CONTACT_EMAIL
│   └── ui/
│       ├── InteractiveCta.tsx   # Bouton "tracé de contour" + magnétique
│       ├── CopyEmailButton.tsx  # Bouton copier l'e-mail (feedback coche)
│       └── IconButton.tsx       # Bouton icône générique
├── hooks/
│   ├── useMagneticHover.ts      # Effet "bouton qui suit le curseur"
│   └── useCopyToClipboard.ts    # Copie presse-papiers + état "copié"
├── lib/
│   └── createCarbonFiberTexture.ts  # Texture carbone procédurale (canvas)
├── three/
│   ├── canvas/
│   │   ├── MesangeCanvas.tsx    # <Canvas> R3F (tone mapping, dpr, shadows)
│   │   ├── StudioLighting.tsx   # Lumières 3 points + environnement softbox
│   │   └── CameraRig.tsx        # Branche le hook de cadrage caméra
│   ├── models/
│   │   └── MesangeModel.tsx     # Rendu du modèle (rotation + tilt curseur)
│   ├── hooks/
│   │   ├── useMesangeScene.ts        # Chargement + orientation + recentrage
│   │   ├── useMesangeMaterialQuality.ts  # PBR : reflets, anisotropie, carbone
│   │   ├── useAutoRotate.ts          # Rotation continue sur Y
│   │   ├── usePointerTilt.ts         # Inclinaison douce vers le curseur
│   │   └── useFitCameraToObject.ts   # Cadrage caméra stable (sphère englobante)
│   └── constants/
│       ├── modelPaths.ts             # Chemin du .glb
│       ├── materialOverrides.ts      # Corrections métallicité/rugosité par matériau
│       └── carbonMaterialNames.ts    # Matériaux à habiller en carbone
├── types/
│   └── nav.types.ts             # Type NavLinkItem
└── assets/
    └── opus-mark.png            # Logo Opus détouré (fond transparent)

public/
└── models/
    └── mesange_hq.glb           # Modèle 3D haute qualité de la Mésange
```

---

## 5. Détail des fonctionnalités

### Header (`components/layout/`)
- Barre **fixe** en haut, fond transparent.
- Logo Opus Aerospace (détouré) + wordmark « CHESSbyOpus ».
- Nav : Accueil / Simulation / Contact — navigation SPA (`react-router`), le
  lien actif est souligné selon la route courante.

### Page Accueil — Hero (`components/sections/Hero/`)
- Mise en page 2 colonnes : texte à gauche (label, titre, accroche, CTA), cadre
  3D de la Mésange à droite.
- **CTA « Lancer »** (`InteractiveCta`) : contour qui se trace en laiton au
  survol (façon verrouillage de cible), flèche qui glisse, effet magnétique
  (le bouton suit légèrement le curseur).

### Mésange en 3D (`three/`)
Séparée en 4 couches (scène / modèle / logique / données) selon les règles projet :
- **Chargement & orientation** : le modèle est automatiquement mis debout, son
  sens (nez en haut) est détecté par comparaison des rayons, et il est recentré.
- **Rendu studio** : éclairage 3 points (clé chaude, contre-jour froid,
  remplissage doré) + environnement de softboxes qui crée des reflets
  spéculaires roulant sur le chrome et l'or. Auto-ombrage doux.
- **Matériaux PBR** : correction des métallicité/rugosité manquantes du bake
  Blender, anisotropie pour un carbone net, et une **texture carbone
  procédurale** appliquée sur les panneaux gris.
- **Interactions** : rotation automatique continue + inclinaison douce vers le
  curseur (lissée, anti-à-coups).
- **Caméra** : cadrage stable mesuré une seule fois (sphère englobante), sans
  « respiration » quand la fusée tourne ; se réajuste au redimensionnement.

### Page Contact (`components/sections/Contact/`)
- Titre, accroche, **e-mail `contact@opus-aerospace.com`** cliquable (`mailto:`).
- **Bouton copier** (`CopyEmailButton`) : copie l'adresse, l'icône passe en
  coche pendant ~1,8 s, effet magnétique.
- Mention « Réponse sous 48h ouvrées » + bouton retour à l'accueil.

---

## 6. Lancer le projet

```bash
cd frontend
npm install
npm run dev        # serveur de dev Vite
npm run build      # build de production (tsc + vite)
```

---

## 7. Reste à faire (pistes connues)

- **Page Simulation** (`/simulation`) : référencée partout mais pas encore créée.
- Qualité du `.glb` au zoom : dépend de la résolution des textures bakées dans
  Blender (les matériaux unis chrome/or n'ont pas de texture propre).
- Responsive mobile à vérifier/affiner sur les deux pages.
```

