// Altitude live ancrée à la menace en vol (voir KingAltitudeTag) — le repère qui
// rend l'altitude de la scène 3D lisible. La scène est géométriquement exacte,
// mais elle n'offre AUCUNE référence de hauteur, et la fusée y est volontairement
// grossie (voir FLYING_ROCKET_SCALE) : l'œil n'a donc rien à quoi comparer une
// altitude. Un chiffre relié à la menace le dit directement.
//
// Le décalage du panneau à l'écran n'est PAS ici : il vient de `.hud-callout`
// (index.css), comme pour la fiche du missile sur la rampe — un seul endroit
// définit la longueur du trait de liaison et la position du panneau.

/** Cadence de rafraîchissement du texte (Hz). Un chiffre n'a pas besoin de 60
 *  mises à jour par seconde — même doctrine que useDetectionStatus. Assez vif
 *  pour que la montée se lise comme continue, assez lent pour ne pas faire
 *  clignoter les décimales. */
export const KING_TAG_REFRESH_HZ = 10
