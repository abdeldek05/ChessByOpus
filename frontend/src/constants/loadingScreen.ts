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
