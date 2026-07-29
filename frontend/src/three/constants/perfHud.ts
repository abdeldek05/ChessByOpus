// Instrumentation de performance de la scène 3D — OUTIL DE DIAGNOSTIC, pas un
// réglage de rendu. Sert à répondre par la MESURE (draw calls, triangles, temps
// GPU) plutôt que par déduction quand le FPS chute, notamment pendant le vol où
// le post-traitement est déjà allégé à SMAA seul et où le coût restant vient
// donc de la géométrie ou des shaders.

/** Affiche le panneau de perf par-dessus la scène de lancement.
 *
 *  À laisser sur `false` : le panneau lui-même consomme du temps GPU/CPU (il
 *  interroge le renderer à chaque frame), donc mesurer avec lui allumé fausse
 *  légèrement ce qu'on mesure. On l'allume le temps d'un diagnostic, on lit les
 *  chiffres, on le rééteint.
 *
 *  Lecture des chiffres :
 *  - `calls`     : draw calls. Chaque InstancedMesh = 1, quel que soit le
 *                  nombre d'instances. Au-delà de ~200 le CPU devient le
 *                  goulot d'étranglement avant le GPU.
 *  - `triangles` : géométrie soumise. Le décor semé (arbres/rochers) en est
 *                  l'essentiel — c'est le poste qui avait grillé le driver AMD.
 *  - `GPU`       : millisecondes réellement passées sur le GPU par frame.
 *                  16.6 ms = 60 FPS, 33.3 ms = 30 FPS. LE chiffre à regarder :
 *                  s'il est bas alors que le FPS l'est aussi, le problème est
 *                  côté CPU (JS par frame), pas côté rendu.
 */
export const PERF_HUD_ENABLED = false
