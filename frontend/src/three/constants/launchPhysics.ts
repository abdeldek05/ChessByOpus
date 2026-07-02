// Physique du PLACEHOLDER de lancement. Unités de scène (200 m / unité, cf.
// computeRadarSceneOffset) : calées pour une portée max ~10 km, juste pour
// visualiser. La vraie trajectoire 3-DOF viendra de RocketPy.
//
// Portée à 45° = v²/g = 600/12 = 50 unités ≈ 10 km.
// Apogée max (90°) = v²/2g = 25 unités ≈ 5 km.
// g volontairement bas → vol plus lent et lisible (~4 s à 75°).
export const LAUNCH_SPEED = 24.5
export const LAUNCH_GRAVITY = 12
// Pause au sol avant de rejouer la boucle de lancement.
export const LAUNCH_REST_SECONDS = 1.2
// Portée max en unités de scène — sert à cadrer toute la trajectoire.
export const LAUNCH_MAX_REACH = 55
