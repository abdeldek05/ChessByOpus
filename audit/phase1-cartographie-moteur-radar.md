# CHESS — Audit du moteur radar Python
## Phase 1 — Cartographie du code existant

Date : 12 octobre 2026
Périmètre : `backend\` du dépôt ChessByOpus (branche `main`, commit `9d40ff6`)
Contrainte respectée : aucun fichier de code modifié, aucune dépendance installée.

---

## 1. Fichiers participant au moteur radar

| Fichier | Rôle | Contenu clé |
|---|---|---|
| `backend\radar.py` | **Cœur du moteur de détection** (412 lignes) | `compute_detection`, `_first_detection`, `_aspect_rcs`, `_enu_offset`, `_rotate_track`, `_build_per_radar`, `_empty_result` |
| `backend\pawn_track.py` | Trajectoire analytique du Pion (leurre), importé par radar.py | `build_pawn_track`, `_clamp_inclination` |
| `backend\simulate.py` | Fournit la trajectoire d'entrée (vol RocketPy de la Mesange) | `simulate`, `estimate_max_range`, `estimate_max_range_quick`, `build_motor`, `build_rocket`, `_apply_real_weather`, `_zero_wind`, `_fix_gfs_pressure_density_bug` |
| `backend\main.py` | Point d'entrée API, schémas de validation, branchement simulation→radar | `run_simulation` (POST `/simulate`), `RadarSpecPayload`, `ThreatPayload`, `SimulatePayload` |

Modules indirects : `backend\admin\runtime_metrics.py` (chronométrage de `/simulate` uniquement, aucune logique radar) et les données `backend\data\` (`thrust_curve.csv`, `CD_Power_On_us.csv`, `CD_Power_Off_us.csv`) consommées par `simulate.py`.

**Hors périmètre** (vérifié par recherche des termes radar/detection/target/sensor/track/RCS/SER/Doppler/SNR/signal) : `auth\*`, `admin\*` (le mot « radar » n'y apparaît que dans des statistiques d'usage, ex. `queries_activity.py:79` `radar_template_usage`), `hash_password.py`.

Chaîne d'imports (vérifiée par grep) : `main.py:20-21` importe `simulate` et `radar` ; `radar.py:34` importe `pawn_track`. Aucun autre module n'importe ces fichiers.

## 2. Points d'entrée, « classes » radar, cibles, fonctions de détection

- **Point d'entrée unique** : `POST /simulate` → `run_simulation` (`main.py:235-271`). Si `payload.radars` est non vide : `simulate()` (vol du Roi) puis `compute_detection()` (`main.py:259-266`). Point d'entrée CLI secondaire pour la seule simulation de vol : `python simulate.py` (`simulate.py:434`).
- **Aucune classe radar** : le moteur est purement fonctionnel. Un « radar » est un `dict` validé par `RadarSpecPayload` (`main.py:178-195`) ; une « cible » est un `ThreatPayload` (`main.py:198-207` — rôle KING/QUEEN/PAWN, azimut, délai, inclinaison) plus une trajectoire = liste de `{t, x, y, z}` en ENU mètres.
- **Fonctions de détection** : `_first_detection` (`radar.py:89-165`) — un radar × une trajectoire → premier instant d'accroche ou raison du blocage ; `compute_detection` (`radar.py:241-393`) — orchestrateur : matrice menaces × radars, coût des leurres, verdict réseau + bilan par radar via `_build_per_radar` (`radar.py:168-238`).

## 3. Paramètres radar, valeurs par défaut, lieux de chargement

**Par radar** — défauts déclarés DEUX fois : dans Pydantic (`main.py:185-195`) et re-défauts via `.get()` dans `_first_detection` (`radar.py:102-107`) :

| Paramètre | Défaut Pydantic | Défaut/garde radar.py | Usage |
|---|---|---|---|
| `rangeKm` | requis | — | portée spécifiée (radar.py:102) |
| `ceilingM` | requis | — | plafond (radar.py:103, 143) |
| `antennaHeightM` | 4.0 | `.get(…, 4.0)` | horizon + origine ligne de visée (radar.py:104, 116, 128) |
| `minRcsM2` | 1.0 | `.get(…, 1.0)`, plancher 0.01 | sensibilité SER (radar.py:105, 136) |
| `rotating` | True | `.get(…, True)` | balayage (radar.py:106, 156) |
| `rotationRpm` | 40.0 | `.get(…, 40.0)`, plancher 1.0 | vitesse faisceau (radar.py:107, 157) |
| `detectionThresholdSec` | 30.0 | `.get(…, 30.0)` | seuil de préavis (radar.py:211, 341) |
| `latitude`/`longitude` | requis | — | position ENU (radar.py:272-275) |
| `id`/`name` | None | fallback `radar-N` | identité du bilan (radar.py:222-223) |

**Constantes module** (`radar.py:36-58`) : `EARTH_R` 6 371 000 m ; SER d'aspect `RCS_NOSE_M2` 0.08 m² / `RCS_SIDE_M2` 1.2 m² ; `RCS_ROLE_MULTIPLIER` {QUEEN: 6.0} ; `CONE_OF_SILENCE_ELEV_DEG` 70° ; `HORIZON_FACTOR` 4.12 ; `CONFUSION_COST_SEC` {QUEEN: 8 s, PAWN: 3 s} ; `CLASSIFICATION_WINDOW_SEC` 10 s.

Dans `pawn_track.py:23-26` : `SAMPLE_DT` 0.2 s, `GRAVITY_MS2` 9.81, `PAWN_RANGE_FACTOR` 1.3, `PAWN_APOGEE_RATIO` 1/3 (annoncées synchronisées avec le frontend `decoyTrajectory.ts`).

## 4. Flux d'exécution (de l'initialisation au verdict)

```
POST /simulate (main.py:235, session requise)
 │
 ├─ simulate() [simulate.py:220] ── RocketPy ──────────────────────────┐
 │   Environment(lat,lng,elev) → météo GFS (timeout 8 s, correctif     │
 │   bug pression ×100, repli atmosphère standard) → _zero_wind()      │
 │   → SolidMotor + Rocket (données prédesign Mesange V2)              │
 │   → Flight(rail 8 m, inclination, heading)                          │
 │   → échantillonnage 0.2 s : trajectory=[{t,x,y,z,v,azimuthDeg,      │
 │     elevationDeg}], apogeeM, rangeM, flightTimeSec, weather         │
 │                                                                     ▼
 └─ compute_detection(site, radars, threats, flight) [radar.py:241]
     ├─ _enu_offset : chaque radar → (est, nord) m vs site (radar.py:272)
     ├─ Pour CHAQUE menace, construction de SA trajectoire (radar.py:293-306) :
     │    PAWN  → build_pawn_track (cloche parabolique, portée = 1.3×Roi)
     │    KING  → trajectoire RocketPy telle quelle
     │    QUEEN → trajectoire du Roi tournée de Δazimut (_rotate_track)
     ├─ Matrice menaces × radars : _first_detection (radar.py:317-321)
     │    pour chaque échantillon {t,x,y,z} (vitesse par différence finie) :
     │    1. horizon 4.12(√h_ant+√h_cible) → 2. portée effective
     │    R_eff = min(R, R·(σ/σ_min)^¼) avec σ = SER d'aspect × multiplicateur
     │    de rôle → 3. plafond → 4. cône de silence 70° → 5. attente du
     │    passage du faisceau (rpm×6 °/s) → t_detection, distance
     │    (sinon : raison dominante = condition bloquante au plus près)
     ├─ Coût des leurres détectés ≤ t_Roi + 10 s (Dame 8 s, Pion 3 s)
     ├─ Verdict RÉSEAU : lead = impact_Roi − (t_Roi + coûts) vs max(seuils)
     │    → detected / late / missed (+ cause en clair)
     └─ _build_per_radar : verdict individuel par radar (coûts propres)
     → réponse JSON {status, flight, detection{verdict, leadTimeSec,
       perRadar[], decoyBreakdown[], cause…}}
```

## 5. Dépendances

- **Moteur physique** : RocketPy (`Environment`, `SolidMotor`, `Rocket`, `Flight`, `mathutils.Function`) — uniquement dans `simulate.py`. Version 1.12.1 implicite (un bug connu y est contourné, `simulate.py:47-55`).
- **Données de trajectoire** : la sortie de `simulate()` est le SEUL pont vers le radar (`flight["trajectory"]`, `flightTimeSec`, `rangeM`). Le radar ne rappelle jamais RocketPy ; le Pion est purement analytique.
- **Bibliothèques scientifiques** : `radar.py` et `pawn_track.py` n'utilisent QUE `math` (pas de numpy/scipy) — boucles Python pures sur les échantillons.
- **Réseau** : prévision GFS/NOAA (facultative, timeout 8 s, repli silencieux sur atmosphère standard).
- **Couplage hors Python** : contrat de synchronisation documenté avec le frontend (`decoyTrajectory.ts`, `flightPlayback.ts`) pour les constantes du Pion — toute divergence recrée le bug historique décrit dans `pawn_track.py:3-10`.

## 6. Paramètres déclarés mais apparemment inutilisés

- **`temperature_c` (valeur)** — `simulate.py:226`. La docstring (l. 231-232) annonce « une atmosphère standard **décalée sur cette température** », mais le code (l. 241-242) ne teste que `is not None` et applique l'atmosphère standard *sans jamais utiliser la valeur*. Vérifié par recherche exhaustive : les seules occurrences sont la déclaration, le test de nullité et le passage depuis l'API/CLI. C'est un drapeau, pas une température.
- **`launchSiteId`** — `main.py:88`. Déclaré dans `MesangeLaunchConfigPayload`, sérialisé dans la table `scenarios`, jamais relu nulle part dans le backend (une seule occurrence au grep). Corollaire : `ThreatPayload` n'a **aucune position de lancement** — toutes les menaces partent de l'origine du site (le Pion démarre à (0,0), `pawn_track.py:59` ; la Dame est une rotation autour de l'origine). Le multi-pas-de-tir n'est pas câblé côté moteur radar.
- **La table `scenarios` vis-à-vis du radar** — `main.py:52-67`. Elle persiste une config *mono-radar* (`radar_template_id`, `radar_range_km`…) mais `compute_detection` ne lit JAMAIS la base : les radars viennent exclusivement du payload de `/simulate`. Schéma hérité (pré-multi-radar) ; vérifié : aucun chemin de code ne relie `scenarios` à `compute_detection`.
- **Champs `v`, `azimuthDeg`, `elevationDeg` des échantillons** (`simulate.py:283-289`) : ignorés par le radar, qui **recalcule** la vitesse par différence finie entre échantillons (`radar.py:121-124`). Utilisés par la télémétrie front — pas morts, mais redondants pour le radar.

## 7. Questions non résolues

1. Le « décalage de température » de `temperature_c` est-il une fonctionnalité abandonnée ou un oubli d'implémentation ?
2. Toutes les menaces partent du même point : est-ce voulu dans l'état actuel de la refonte multi-pas-de-tir ?
3. `rotating=False` donne une accroche instantanée dès que la géométrie le permet (`radar.py:162`) — quel type de radar cela modélise-t-il (antenne à balayage électronique ?) ?
4. Le modèle est **déterministe et binaire** : aucune équation radar en puissance (Pt, G, pertes, bruit), pas de SNR, pas de Pd/Pfa. `R_eff = R_spec·(σ/σ_min)^¼` est un substitut simplifié de l'équation radar (le ^¼ en est la signature). À confirmer comme choix assumé de prototype.
5. La valeur `HORIZON_FACTOR = 4.12` (réfraction 4/3) et le cône de silence à 70° sont des constantes génériques — sources à documenter.

## Fichiers à examiner en priorité (phase 2 — audit mathématique et physique)

1. **`radar.py`** : `_first_detection` (géométrie, horizon, R_eff, balayage — le cœur mathématique) puis `compute_detection` (horloge mission, coûts des leurres).
2. **`pawn_track.py`** : cohérence de la cloche parabolique (durée « fake » vs cinématique réelle — la vitesse horizontale du Pion dépend de `flight_time_sec`, ce qui impacte la SER d'aspect dérivée par différences finies).
3. **`simulate.py`** : repère ENU, échantillonnage 0.2 s et arrondis à 0.1 m (effet sur les vitesses par différence finie côté radar).
4. **`main.py`** : contrat d'entrée (unités implicites : km pour la portée, m pour le plafond, degrés partout).
