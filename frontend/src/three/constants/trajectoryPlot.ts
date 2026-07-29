// Graphe 3D de la coupe de couverture radar (panneau PROFIL) — DA « Command &
// Control tactique » (voir skill threejs-dataviz-design). Couleur = SIGNAL, pas
// déco (doctrine MIL-STD) : cyan = donnée/trace neutre, ROUGE = détection/alarme
// UNIQUEMENT, ambre = valeurs à surveiller. Couleurs en HDR (composantes > 1.0)
// pour que SEULS ces traits captent le Bloom (luminanceThreshold ~0.9).

/** Ancien demi-côté (conservé comme unité de RÉFÉRENCE pour les tailles de
 *  marqueurs/labels/caméra, exprimées en fraction de PLOT_SIZE). */
export const PLOT_SIZE = 10

/** Repère RECTANGULAIRE (pas cubique) et TRÈS GRAND : le graphe doit occuper un
 *  MAXIMUM d'espace (demande Abdel « prend de l'espace à mort »). Une trajectoire
 *  va bien plus LOIN (distance sol ~44 km) qu'elle ne MONTE (apogée ~22 km) —
 *  rectangle large et moins haut. Comme caméra/grille/fog/marqueurs sont tous
 *  exprimés en fraction de ces valeurs, tout s'agrandit ensemble. Épaisseurs de
 *  traits en PX écran (voir plus bas) → restent lisibles quelle que soit l'échelle. */
export const PLOT_HALF_W = 60
export const PLOT_HEIGHT = 40

/** Épaisseur (px écran) des courbes AU REPOS. Volontairement TRÈS FINES : un
 *  instrument se lit avec des traits nets et légers, pas des gros tubes. Le glow
 *  (Bloom) leur donne déjà de la présence — inutile de les épaissir. AFFINÉES
 *  (1.4/2.2 → 0.9/1.3) : les traits portaient l'emphase en permanence, donc plus
 *  rien ne ressortait. L'emphase est désormais un ÉTAT (voir *_ACTIVE_WIDTH),
 *  déclenché au clic sur une courbe. */
export const PLOT_TRACE_WIDTH = 0.9
export const PLOT_SEEN_WIDTH = 1.3

/** Épaisseur (px écran) d'une courbe SÉLECTIONNÉE (clic). L'écart avec la
 *  largeur au repos doit être franc — c'est le signal qui dit « celle-ci » dans
 *  un faisceau de courbes fines. */
export const PLOT_TRACE_ACTIVE_WIDTH = 2.6
export const PLOT_SEEN_ACTIVE_WIDTH = 3.2

/** Opacité d'une courbe NON sélectionnée quand une autre l'est : le reste du
 *  graphe s'estompe sans disparaître (on garde le contexte de lecture). */
export const PLOT_DIMMED_OPACITY = 0.22

/** Épaisseur (px écran) des traces de LEURRE au repos et sélectionnée. */
export const PLOT_DECOY_WIDTH = 0.7
export const PLOT_DECOY_ACTIVE_WIDTH = 2.2

/** Tolérance de visée au clic sur une courbe (PIXELS écran) : `LineSegments2`
 *  possède son propre raycast, réglé par `raycaster.params.Line2.threshold`,
 *  dont le défaut est 0 — il faudrait viser le trait au pixel exact, or il ne
 *  fait que 0.9 px. Cette marge rend les courbes cliquables sans les épaissir. */
export const PLOT_PICK_THRESHOLD_PX = 8

// --- Palette HDR (>1) — glow via Bloom. Format [r,g,b] pour meshBasicMaterial. ---
// Intensités RABAISSÉES (cyan 4.6 → 2.2, rouge 4.6 → 2.4, ambre 4.4 → 2.3) : au
//-delà de ~2.5 le Bloom (seuil 0.9) empâte les traits en halos qui se recouvrent
// et le graphe devient un néon illisible — « le glow doit servir la lecture, pas
// primer sur la substance » (voir skill threejs-dataviz-design). On reste >1 pour
// garder un glow franc sur les seuls traits de donnée, sans noyer les labels.
/** Cyan froid : trace/trajectoire NEUTRE (non encore détectée), axes, radar. */
export const PLOT_CYAN: [number, number, number] = [0.08, 1.7, 2.2]
/** Rouge ALARME : portions de trajectoire VUES par un radar (détection). */
export const PLOT_RED: [number, number, number] = [2.4, 0.25, 0.32]
/** Ambre : valeurs à surveiller, marqueur d'apogée, échos (fatigue moins l'œil). */
export const PLOT_AMBER: [number, number, number] = [2.3, 1.15, 0.28]

/** Teintes HDR par RADAR (cycle) : avec deux radars ou plus, un dôme et un cône
 *  tous cyan ne disent pas À QUI ils appartiennent. Chaque radar reçoit donc sa
 *  propre teinte froide, reprise par son dôme, son cône d'azimut, son marqueur au
 *  sol et sa pastille de légende. Le ROUGE reste hors de ce cycle : il est réservé
 *  à la détection (doctrine MIL-STD), jamais à l'identité d'un équipement. */
export const PLOT_RADAR_COLORS: [number, number, number][] = [
  [0.08, 1.7, 2.2], // cyan
  [0.5, 1.1, 2.3], // bleu azur
  [0.15, 2.0, 1.3], // turquoise
  [1.0, 1.5, 2.4], // bleu pâle
]

/** Rayon des marqueurs sphériques, en fraction de MARK (voir TrajectoryPlotScene).
 *  RÉDUITS : les billes d'acquisition/apogée (1.5-1.6 × MARK) mangeaient la courbe
 *  qu'elles étaient censées annoter. Un instrument pointe, il n'empâte pas. */
export const PLOT_DOT_ACQ = 0.7
export const PLOT_DOT_LOSS = 0.55
export const PLOT_DOT_APOGEE = 0.65
export const PLOT_DOT_SITE = 0.6
export const PLOT_DOT_HEAD = 0.8

/** Intervalle (s de vol) entre deux marques temporelles posées sur la trajectoire.
 *  Le graphe est un profil distance × altitude : sans repères de temps, on ne voit
 *  pas que la fusée ralentit en montant puis accélère en chute — l'espacement des
 *  marques le rend lisible d'un coup d'œil. */
export const PLOT_TIME_TICK_SEC = 20

/** Gris bleuté SDR (pas de glow) des traces de LEURRE : contexte, jamais
 *  prioritaire sur la menace réelle. Volontairement sous 1.0 sur tous les canaux
 *  — le Bloom ne doit pas l'attraper, sinon un essaim de pions brillerait autant
 *  que le Roi. */
export const PLOT_DECOY_COLOR = '#5a6b7a'

// --- Couleurs CSS (grille, fog, sol) — teintées, jamais noir/blanc purs. ---
/** Fond de la scène = anthracite bleu nuit (JAMAIS #000). */
export const PLOT_BG = '#070b12'
/** Fog de profondeur (depth cueing) : même teinte que le fond → fondu invisible. */
export const PLOT_FOG = '#070b12'
/** Grille mission-control : cellules sombres discrètes, sections en accent cyan. */
export const PLOT_GRID_CELL = '#132434'
export const PLOT_GRID_SECTION = '#2f6f86'

/** Position initiale de la caméra (unités scène) : vue 3/4 en surplomb, reculée
 *  et décalée pour cadrer le RECTANGLE (large) — la scène « respire ». */
export const PLOT_CAMERA_POSITION: [number, number, number] = [PLOT_HALF_W * 1.5, PLOT_HEIGHT * 1.9, PLOT_HALF_W * 1.9]
/** Cible du regard : mi-hauteur du repère (la scène monte de 0 à PLOT_HEIGHT). */
export const PLOT_CAMERA_TARGET: [number, number, number] = [0, PLOT_HEIGHT * 0.4, 0]
/** Distances min/max de zoom orbite (unités scène). */
export const PLOT_CAMERA_MIN = PLOT_HALF_W * 0.9
export const PLOT_CAMERA_MAX = PLOT_HALF_W * 4

/** Densité du fog exponentiel (relative à l'étendue du repère). */
export const PLOT_FOG_DENSITY = 0.5 / (PLOT_HALF_W * 4)
