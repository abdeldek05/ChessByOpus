// Paramètres de la trajectoire balistique PLACEHOLDER (en attendant le vrai
// profil RocketPy du back). Physique réelle : mouvement d'un projectile sous
// gravité — l'arc dépend de l'inclinaison et de la vitesse de sortie, pas d'une
// parabole factice. Le vrai back remplacera `sampleBallistic` sans toucher au
// reste (mêmes signatures scène).

// Échelle de la scène : 1 unité = 200 m (cf. computeRadarSceneOffset).
export const METERS_PER_UNIT = 200

// Gravité réelle.
export const GRAVITY_MS2 = 9.81

// Vitesse de sortie (fin de poussée) indicative de la Mesange : ~Mach 2,6.
// À 45° elle porte à ~80 km ; l'inclinaison choisie module portée et apogée.
export const BURNOUT_SPEED_MS = 900

// Compression temporelle : le vol réel dure > 2 min, injouable à regarder. On
// lit N secondes simulées par seconde réelle — l'arc et le profil de vitesse
// (ralenti à l'apogée) restent physiquement corrects, juste accélérés.
export const TIME_SCALE = 16
