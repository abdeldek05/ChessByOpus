# CLAUDE.md — Règles globales du projet

Tu repars de zéro sur ce projet. Ces règles s'appliquent **à tout le code que tu
écris, dès le premier fichier**, sans exception et sans "je corrigerai plus tard".
Si une règle ci-dessous n'est pas respectée, le code n'est pas terminé.

Stack : React 19 + TypeScript (`.tsx`), Vite, Tailwind CSS v4, Three.js via
`@react-three/fiber` + `@react-three/drei`.

---

## Règle n°0 — La règle qui prime sur toutes les autres

**Un fichier = une seule responsabilité.**

Jamais de `App.tsx`, `main.tsx` ou composant "page" qui contient en même temps :
plusieurs composants, des constantes de données, de la logique d'animation/3D,
et du style. Si tu sens que tu es en train d'écrire un fichier de 300-1000 lignes
qui fait "un peu de tout", **arrête-toi avant d'écrire**, découpe d'abord, code après.

---

## 1. Structure de dossiers (à respecter dès le premier commit)

```
src/
├── pages/                    # Points d'entrée de route, si routing
├── components/
│   ├── layout/                # Header, Footer, Nav
│   ├── sections/               # Blocs de page (Hero, About...)
│   │   ├── Hero/
│   │       ├── Hero.tsx             # Orchestration uniquement
│   │       ├── Typewriter.tsx       # Sous-composant, fichier séparé
│   │       ├── CountUp.tsx          # Sous-composant, fichier séparé
│   ├── ui/                     # Composants génériques réutilisables (Button, Badge)
├── three/                      # TOUT ce qui touche Three.js / R3F
│   ├── canvas/                  # Le <Canvas>, lumières, caméra — rien d'autre
│   ├── models/                  # Rendu des modèles 3D (JSX uniquement)
│   ├── hooks/                   # useFrame / useAnimations / chargement
│   ├── constants/                # Anchors, chemins de modèles, config statique
├── hooks/                       # Hooks React réutilisables hors Three.js
├── lib/                         # Fonctions pures, helpers
├── types/                       # Types/interfaces partagés (*.types.ts)
├── styles/
│   ├── index.css                  # imports fonts + tailwind + @theme (tokens)
│   ├── animations.css             # @keyframes custom uniquement
├── assets/
├── App.tsx                      # Compose les sections, AUCUNE logique métier
├── main.tsx                      # Bootstrap React, rien d'autre
```

Avant de créer un fichier, demande-toi où il va selon cette arborescence. Pas de
dossier "fourre-tout" (`misc/`, `helpers2/`, etc.).

---

## 2. Composants React / TSX

- **Un composant exporté par fichier.** Si tu écris plusieurs `function X() {}` avec
  du JSX dans le même fichier "pour aller plus vite", chacun part dans son propre
  fichier, même s'il fait 10 lignes.
- **Taille max ~150-200 lignes par composant.** Au-delà, tu fais sûrement plusieurs
  choses : extrait un sous-composant, un hook, ou une fonction utilitaire.
- **Props toujours typées** via une interface nommée `<NomComposant>Props`, jamais
  de props inline complexes, jamais de `any`.
- **Logique lourde interdite dans le JSX.** Un `useEffect`/`useState`/calcul de plus
  de 5-6 lignes part dans un hook custom (`src/hooks/use<Nom>.ts`).
- Un composant "section" (Hero, Header) **orchestre** des sous-composants, il
  n'implémente pas lui-même la mécanique bas-niveau (timers, animations, calculs).

```tsx
// ✅ Exemple de structure attendue pour Hero
// components/sections/Hero/Hero.tsx
import { Typewriter } from './Typewriter'
import { CountUp } from './CountUp'

export function Hero() {
  return (
    <section>
      <Typewriter text="..." />
      <CountUp target={500} suffix="+" />
    </section>
  )
}
```

---

## 3. Styles — interdictions strictes

- ❌ **Jamais de `style={{ ... }}` inline** dans le JSX pour des couleurs, tailles,
  espacements. Tout passe par des classes Tailwind et les tokens définis dans
  `@theme` (`src/styles/index.css`).
- ❌ **Jamais de balise `<style>`** dans un composant ou dans `index.html`.
- ❌ **Jamais de couleur/dimension en dur** (`#0a0a0b`, `12px`) dans un composant.
  Si le token n'existe pas encore dans `@theme`, on l'ajoute là, on ne le code pas
  en dur ailleurs.
- ✅ Seule exception : une valeur **calculée dynamiquement à l'exécution** (ex:
  position pilotée par un calcul Three.js synchronisé avec du DOM). Même dans ce
  cas, isoler la valeur dans une variable nommée, jamais un objet de style complexe.
- Les `@keyframes` custom qui ne rentrent pas dans Tailwind vont dans
  `src/styles/animations.css`, importé une seule fois.

---

## 4. Three.js / React Three Fiber — séparation en 4 couches

Ne jamais mélanger dans un seul composant : chargement, calculs géométriques,
logique d'animation et rendu JSX.

| Couche | Dossier | Contenu |
|---|---|---|
| Scène | `three/canvas/` | `<Canvas>`, lumières, caméra, contrôles |
| Modèle | `three/models/` | Rendu JSX du modèle (`<primitive>`, `<mesh>`) uniquement |
| Logique | `three/hooks/` | `useFrame`, `useAnimations`, chargement (`useGLTF`, `useLoader`), calculs mémoïsés |
| Données | `three/constants/` | Noms d'anchors, chemins `/models/*.glb`, config statique |

```tsx
// ✅ three/models/MesangeModel.tsx — rendu uniquement
import { useGLTF } from '@react-three/drei'
import { useMesangeAnimations } from '../hooks/useMesangeAnimations'

export function MesangeModel() {
  const { scene } = useGLTF('/models/mesange_explode.glb')
  useMesangeAnimations(scene)
  return <primitive object={scene} />
}
```

- Tout calcul géométrique (`computeBoundingBox`, `geometry.translate`...) est
  mémoïsé (`useMemo`) et vit dans un hook, pas dans le composant de rendu.
- Les composants `three/` ne connaissent rien du layout de page (Hero, Header) :
  ils reçoivent des props, point.

---

## 5. Hooks et logique réutilisable

- Préfixe `use`, fichier `src/hooks/use<Nom>.ts` (ou `three/hooks/` si lié à la 3D).
- Un hook = un fichier = un usage clair. Pas de hook fourre-tout.
- Retour explicite sous forme d'objet nommé dès que plus de 2 valeurs sont retournées :
  `return { displayed, isDone }` plutôt qu'un tableau.
- Une fonction pure (sans state/effect) n'est pas un hook : `src/lib/`, sans préfixe `use`.

---

## 6. Conventions de nommage

| Type | Convention | Exemple |
|---|---|---|
| Composant | `PascalCase.tsx` | `Hero.tsx` |
| Hook | `useCamelCase.ts` | `useTypewriter.ts` |
| Fonction utilitaire | `camelCase.ts` | `formatScore.ts` |
| Constantes | `camelCase.ts` dans `constants/` | `mesangeAnchors.ts` |
| Types | `camelCase.types.ts` | `hero.types.ts` |
| Styles | `kebab-case.css` | `animations.css` |

- Nom du fichier = nom du composant/hook exporté, toujours.
- Imports relatifs courts seulement entre fichiers proches ; au-delà, utiliser un
  alias `@/` (configuré dans `vite.config.ts` / `tsconfig.json`) plutôt que des
  `../../../../`.

---

## Checklist avant de considérer un fichier terminé

- [ ] Un seul composant exporté dans ce fichier
- [ ] Moins de ~150-200 lignes
- [ ] Props typées via interface nommée, aucun `any`
- [ ] Zéro `style={{ }}` (sauf valeur calculée justifiée), zéro balise `<style>`
- [ ] Zéro couleur/dimension en dur, tout passe par un token Tailwind
- [ ] Logique de plus de 5-6 lignes extraite en hook
- [ ] Code Three.js réparti dans `canvas/` / `models/` / `hooks/` / `constants/`, jamais mélangé
- [ ] Le fichier est rangé dans le bon dossier selon la structure définie en section 1
