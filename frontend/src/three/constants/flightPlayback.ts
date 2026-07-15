// Paramètres du rejeu visuel de la trajectoire RocketPy. La physique (détection)
// garde les mètres et secondes réels ; la scène partage désormais la MÊME
// échelle réelle (METERS_PER_SCENE_UNIT, voir sceneLayout.ts) — plus de
// normalisation par vol ici, seul le TEMPS reste accéléré pour le confort.

/**
 * Le vrai vol dure 100-200 s : trop long. On le rejoue en ACCÉLÉRÉ mais en
 * gardant le TEMPS RÉEL de RocketPy (donc la gravité : montée qui décélère,
 * chute qui accélère). `TIME_SCALE` = nombre de secondes de vol réel jouées par
 * seconde d'animation. 10 → un vol de 160 s dure 16 s à l'écran.
 */
export const TIME_SCALE = 5

/**
 * Ralenti du DÉCOLLAGE : les premières secondes de vol réel sont jouées plus
 * lentement (on voit bien la fusée quitter la rampe) puis on rejoint `TIME_SCALE`.
 * `LIFTOFF_REAL_SEC` = fenêtre de vol réel concernée ; `LIFTOFF_TIME_SCALE` = son
 * facteur d'accélération (plus petit = plus lent).
 */
export const LIFTOFF_REAL_SEC = 4
export const LIFTOFF_TIME_SCALE = 2.5

/**
 * Agrandissement de la fusée en vol : à l'échelle normalisée elle deviendrait un
 * point. On la grossit pour rester bien visible sans casser l'échelle au sol.
 */
export const FLYING_ROCKET_SCALE = 3.2

/** Fin de poussée (s, temps de vol réel) : durée de burn de la Mesange V2. */
export const BURN_TIME_SEC = 35.7
