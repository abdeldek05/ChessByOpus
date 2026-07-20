// Enveloppe de couverture radar — VISUALISATION uniquement (coupe Thales,
// replay, HUD live). On trace l'enveloppe INSTRUMENTÉE (portée, plafond,
// élévations — suggestion Thales) par pure géométrie ; le VERDICT de détection
// (préavis vs seuil, RCS, rotation d'antenne) reste celui du moteur backend.

/** Élévation minimale du faisceau (deg) — en dessous : masque d'horizon. */
export const COVERAGE_ELEVATION_MIN_DEG = 0.5

/** Élévation maximale par défaut (deg) quand la fiche radar ne la donne pas —
 *  valeur typique d'un radar de veille ; au-dessus : cône de silence. */
export const COVERAGE_ELEVATION_MAX_DEG = 30

/** Pas d'échantillonnage angulaire de l'arc du lobe (deg) — assez fin pour un
 *  tracé lisse, assez grossier pour un polygone léger. */
export const COVERAGE_LOBE_ARC_STEP_DEG = 2

/** Couleurs des radars sur la coupe/l'analytics (1er radar, 2e radar). */
export const CUT_RADAR_COLORS = ['#4cc9f0', '#f0a44c'] as const

/** Couleur de la trajectoire (hors segments de visibilité). */
export const CUT_TRAJECTORY_COLOR = '#8b8fa3'

/** Épaisseurs de trait : trajectoire de base / segment en visibilité. */
export const CUT_TRAJECTORY_WIDTH = 1.5
export const CUT_VISIBILITY_WIDTH = 3.5
