# Refonte du flux de placement — multi-radar, multi-pas-de-tir, cône d'azimut

> Document de conception. Décidé le 8 juillet 2026 avec Abdel. **En cours d'implémentation.**
> Voir aussi : [`../NOTE_VALEUR_AJOUTEE.txt`](../NOTE_VALEUR_AJOUTEE.txt) (valeur métier : préavis, cône, archi).

## 1. Pourquoi ce changement

Le modèle initial reposait sur **1 site fixe = origine** + **1 seul radar** placé relativement à ce site.
Le client veut en réalité :
- placer **1 ou 2 radars** où il veut sur la carte ;
- **pas de pas de tir fixe** : il pose lui-même le(s) point(s) de lancement ;
- **découvrir l'azimut en le fixant sur la carte** via un **cône** montrant où la Mesange peut retomber.

## 2. Le nouveau flux (ordre confirmé)

```
Région (page /simulation, gardée)
  → RADARS      : poser 1 ou 2 radars sur la carte (chacun sa config + position)
  → MENACES     : poser 1+ pas de tir ; pour chacun, fixer l'AZIMUT au doigt sur
                  la carte → un CÔNE montre la zone d'impact estimée ;
                  l'inclinaison reste un curseur (pour l'instant)
  → LANCEMENT
```

Radars **avant** menaces : on met en place la défense, puis on conçoit l'attaque
en visant les cônes vers les zones à défendre.

## 3. Le cône (cœur de l'expérience)

Depuis chaque pas de tir, on dessine un secteur qui s'ouvre dans la direction de
l'azimut (± dispersion) jusqu'à la **portée estimée** pour l'inclinaison.

- `src/lib/estimateBallisticRange.ts` — portée estimée (km) = `v0²·sin(2θ)/g`.
- `src/lib/geoImpactCone.ts` — `buildImpactCone(lng, lat, azimut, inclinaison)`
  → polygone GeoJSON du cône + arc d'impact. **Déjà codé.**

C'est une **estimation d'aide au placement** ; le calcul exact viendra du back
(RocketPy pour la trajectoire, modèle radar JS pour la détection).

## 4. Modèle de données cible

```ts
interface PlacedRadar {
  id: string
  config: RadarConfig            // template + réglages (portée, plafond…)
  position: RadarPosition | null // placé sur la carte
}

interface MesangeLaunchConfig {
  id: string
  role: MesangeRole              // KING / QUEEN / PAWN
  azimuthDeg: number             // fixé via le cône sur la carte
  inclinationDeg: number         // curseur
  launchDelaySec: number         // T+
  launchPoint: RadarPosition | null // son pas de tir sur la carte
}
```

État `useMissionConfig` : `radars: PlacedRadar[]` (1-2) + `mesangeConfigs[]`
(avec `launchPoint`) + `detectionThresholdSec`.

## 5. Détection réseau (au final, côté modèle radar)

Avec 2 radars : le Roi est-il vu par **au moins un** radar à temps ?
Le **préavis = la 1ʳᵉ accroche** parmi les radars. Le bilan pourra indiquer
quel radar a détecté en premier.

## 6. Ordre de construction

1. **Modèle de données** : types (`PlacedRadar`, `launchPoint`) + `useMissionConfig`.
2. **Étape Radars** : sélection/config de 1-2 radars.
3. **Placement radars** : poser 1-2 radars sur la carte.
4. **Étape Menaces** : poser pas de tir + azimut au doigt via cône.
5. **Scène 3D** : rampes multiples + 1-2 radars, échelle/origine adaptatives.
6. **Back + garde-fous + bilan** multi-radar.
