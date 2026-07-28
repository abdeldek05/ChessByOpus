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

/**
 * Bilan INDIVIDUEL d'un radar : ce que CE radar aurait vu, seul. Le verdict de
 * `MissionResult` reste celui du RÉSEAU (le Roi est-il accroché à temps par au
 * moins un radar) ; ceci répond à l'autre question du défenseur — lequel de mes
 * radars a fait le travail, et lequel est aveugle, et pourquoi.
 */
export interface RadarResult {
  /** Id du `PlacedRadar` correspondant (renvoyé tel quel par le backend). */
  id: string
  name: string
  /** Verdict de CE radar pris isolément (mêmes valeurs que le verdict réseau). */
  verdict: Exclude<MissionVerdict, 'unknown'>
  /** Préavis que CE radar aurait donné (s) — `null` s'il n'a jamais accroché. */
  leadTimeSec: number | null
  /** Seuil de préavis réglé sur CE radar (s) : chacun a le sien. */
  requiredLeadSec: number
  /** Instant d'accroche du Roi par CE radar (T+ s). */
  detectedAtSec: number | null
  acquisitionDistanceKm: number | null
  /** Pourquoi CE radar n'a jamais vu le Roi (horizon, portée, plafond, cône) —
   *  `null` dès lors qu'il a accroché. */
  blockReason: string | null
  /** Nombre de menaces que CE radar voit (toutes confondues). */
  detectedCount: number
  /** Coût de classification PROPRE : seuls les leurres que CE radar détecte le
   *  distraient. Un radar aveugle aux Pions n'est pas pénalisé par eux — c'est ce
   *  qui rend visible lequel des radars est vulnérable à la saturation. */
  decoyCostSec: number
  decoyBreakdown: DecoyCost[]
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
  /** Bilan de CHAQUE radar posé (voir RadarResult). Vide si aucun radar. */
  perRadar: RadarResult[]
}
