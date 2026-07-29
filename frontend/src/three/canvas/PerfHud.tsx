import { Perf } from 'r3f-perf'
import { PERF_HUD_ENABLED } from '@/three/constants/perfHud'

/**
 * Panneau de mesure des performances de rendu (draw calls, triangles, temps GPU
 * par frame), monté à l'intérieur du `<Canvas>`. Piloté par `PERF_HUD_ENABLED`
 * — éteint par défaut, voir ce constant pour la lecture des chiffres.
 *
 * Le composant est rendu conditionnellement ici plutôt que côté appelant pour
 * que la scène n'ait pas à connaître le flag : elle monte `<PerfHud />` sans
 * condition, et le flag décide seul.
 */
export function PerfHud() {
  if (!PERF_HUD_ENABLED) return null

  // `deepAnalyze` interroge le graphe de scène en plus des compteurs du
  // renderer : c'est précisément ce qu'on veut savoir (quel poste pèse), et le
  // surcoût est sans importance puisque le panneau ne tourne qu'en diagnostic.
  return <Perf position="top-left" deepAnalyze matrixUpdate />
}
