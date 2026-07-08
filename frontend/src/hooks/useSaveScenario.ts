import { useState } from 'react'
import { saveScenario } from '@/lib/api'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseSaveScenarioResult {
  status: SaveStatus
  /** Id du scénario enregistré (null tant qu'il ne l'est pas). */
  scenarioId: number | null
  save: (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[], detectionThresholdSec: number) => void
}

/**
 * Enregistre le scénario (radar + Mesange engagées + seuil de préavis) auprès
 * du back. On conserve l'id retourné pour que le lancement puisse exiger un
 * scénario enregistré.
 */
export function useSaveScenario(missionId: number): UseSaveScenarioResult {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [scenarioId, setScenarioId] = useState<number | null>(null)

  const save = (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[], detectionThresholdSec: number) => {
    setStatus('saving')
    saveScenario(missionId, radarConfig, mesangeConfigs, detectionThresholdSec)
      .then((scenario) => {
        setScenarioId(scenario.id)
        setStatus('saved')
      })
      .catch(() => setStatus('error'))
  }

  return { status, scenarioId, save }
}
