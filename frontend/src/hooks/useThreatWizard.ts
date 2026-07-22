import { useState } from 'react'
import type { MesangeLaunchConfig } from '@/types/mission.types'

export type ThreatWizardPhase = 'count' | 'config'

interface UseThreatWizardParams {
  mesangeConfigs: MesangeLaunchConfig[]
  onAddMesange: () => void
  onRemoveMesange: (id: string) => void
}

interface UseThreatWizardResult {
  /** 'count' = écran "combien de Mesanges ?" ; 'config' = panneau focus sur UNE Mesange. */
  phase: ThreatWizardPhase
  /** Mesange actuellement éditée dans le panneau focus (toujours valide, jamais undefined). */
  current: MesangeLaunchConfig
  /** Position 1-based de `current` dans la flotte, pour l'étiquette "Mesange 0X". */
  currentIndex: number
  /** Passe à l'écran "combien ?" (bouton "Deploy N Mesanges" → entre en config). */
  setCount: (count: number) => void
  /** Depuis la config, revient ajuster le nombre. */
  backToCount: () => void
  /** Sélectionne directement une Mesange (onglet de flotte cliqué ou cône
   *  attrapé sur la carte — voir StepThreats : la carte, les onglets et le
   *  wizard partagent la même sélection). */
  selectMesange: (id: string) => void
}

/**
 * Pilote l'assistant séquentiel de composition de la flotte : d'abord choisir
 * COMBIEN de Mesanges (crée/retire dans le store pour matcher), puis les
 * configurer UNE À LA FOIS (rôle/azimut/élévation/délai) — un seul panneau
 * affiché à chaque instant, jamais la liste entière empilée (voir le retour
 * client : "over communication", "ça ne rentre pas"). La carte, elle, reste
 * en permanence multi-cônes — tous les cônes restent saisissables/tournables
 * indépendamment de la mésange affichée dans le panneau (voir StepThreats).
 */
export function useThreatWizard({
  mesangeConfigs,
  onAddMesange,
  onRemoveMesange,
}: UseThreatWizardParams): UseThreatWizardResult {
  const [phase, setPhase] = useState<ThreatWizardPhase>('count')
  const [selectedId, setSelectedId] = useState(mesangeConfigs[0].id)
  const currentIndex = Math.max(
    0,
    mesangeConfigs.findIndex((m) => m.id === selectedId),
  )
  // La Mesange sélectionnée peut avoir été retirée entre-temps — retombe sur
  // la première de la flotte plutôt que de planter le rendu.
  const current = mesangeConfigs[currentIndex] ?? mesangeConfigs[0]

  const setCount = (count: number) => {
    const diff = count - mesangeConfigs.length
    if (diff > 0) {
      for (let i = 0; i < diff; i++) onAddMesange()
    } else if (diff < 0) {
      // Retire depuis la FIN (les dernières ajoutées) — jamais le Roi par
      // défaut en position 0, qui reste la référence de la flotte.
      const toRemove = mesangeConfigs.slice(count).map((m) => m.id)
      toRemove.forEach(onRemoveMesange)
    }
    setSelectedId(mesangeConfigs[0].id)
    setPhase('config')
  }

  const backToCount = () => setPhase('count')

  return {
    phase,
    current,
    currentIndex: currentIndex + 1,
    setCount,
    backToCount,
    selectMesange: setSelectedId,
  }
}
