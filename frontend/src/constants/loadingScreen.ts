// Écran de chargement stylisé affiché à l'arrivée sur /lancement, le temps que
// la scène 3D monte (GLB radars/mésange, HDRI, terrain) — purement cosmétique,
// ne reflète PAS le vrai avancement du chargement (voir useSceneLoadingOverlay).

/** Durée MINIMALE (s) de l'overlay, même si la scène est prête plus tôt : sans
 *  ce plancher, un montage rapide ferait flasher l'animation en une fraction
 *  de seconde au lieu de se jouer proprement. */
export const LOADING_MIN_DURATION_SEC = 4.5

/** Messages qui défilent pendant le chargement (registre technique, pas de
 *  ponctuation finale — le "…" fait déjà office de suspension). */
export const LOADING_MESSAGES = [
  'Loading environment…',
  'Fetching weather data…',
  'Computing trajectory model…',
  'Calibrating radar coverage…',
] as const

/** Durée (s) d'affichage de chaque message avant de passer au suivant. */
export const LOADING_MESSAGE_INTERVAL_SEC = 1.2

// --- Overlay de CALCUL de tir (après le décompte 3-2-1, le temps que RocketPy
// réponde) — voir useLaunchComputingOverlay. Distinct du chargement de scène :
// piloté par la vraie fin du backend, pas par une durée fixe.

/** Messages du calcul de tir (défilent pendant l'attente RocketPy). */
export const COMPUTING_MESSAGES = [
  'Igniting engines…',
  'Computing trajectory…',
  'Resolving atmosphere…',
  'Finalizing flight path…',
] as const

/** Progression max (0→1) tant que le backend n'a PAS répondu : la barre monte
 *  vers ce plafond puis y reste, pour ne jamais afficher un « 100% » figé alors
 *  que le calcul continue. Elle bondit à 1 seulement à la vraie fin. */
export const COMPUTING_PROGRESS_CEILING = 0.9

/** Constante de temps (s) de l'approche asymptotique vers le plafond : plus
 *  grand = montée plus lente/douce. */
export const COMPUTING_PROGRESS_TAU = 3
