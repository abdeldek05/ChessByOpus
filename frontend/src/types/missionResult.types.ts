import type { MesangeRole } from '@/types/mission.types'

// Contrat du BILAN de mission produit par le moteur radar (à venir). Le front
// n'affiche que ça ; tant que le moteur n'existe pas, les champs sont null et le
// bilan montre « en attente ». C'est la structure de la valeur : le verdict
// (préavis vs seuil) et le diagnostic (coût des leurres).

// Verdict de DÉTECTION (CHESS teste la détection, pas l'interception) :
//   detected = Roi accroché à temps (préavis >= seuil)
//   late     = Roi accroché mais trop tard (préavis < seuil)
//   missed   = Roi jamais accroché
//   unknown  = pas de données (moteur radar absent)
export type MissionVerdict = 'detected' | 'late' | 'missed' | 'unknown'

export interface DecoyCost {
  /** Rôle responsable de la distraction (Dame = leurre, Pions = saturation). */
  role: MesangeRole
  /** Secondes de préavis perdues à cause de ce rôle. */
  costSec: number
}

export interface MissionResult {
  /** Verdict de détection du Roi. */
  verdict: MissionVerdict
  /** Préavis obtenu : temps entre l'accroche réelle du Roi et l'impact (s). */
  leadTimeSec: number | null
  /** Distance à laquelle le radar a accroché le Roi (km). */
  acquisitionDistanceKm: number | null
  /** Menaces détectées / total. */
  detectedCount: number | null
  totalThreats: number
  /** Instant où la détection était physiquement possible (T+ s). */
  firstPossibleDetectionSec: number | null
  /** Coût total des leurres : préavis perdu à cause de la ruse (s). */
  decoyCostSec: number | null
  /** Détail du coût par rôle (Dame, Pions). */
  decoyBreakdown: DecoyCost[]
  /** Cause principale de l'échec, en clair. */
  cause: string | null
}
