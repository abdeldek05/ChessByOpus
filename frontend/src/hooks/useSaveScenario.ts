import { useState } from 'react'
import { saveScenario } from '@/lib/api'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseSaveScenarioResult {
  status: SaveStatus
  /** Id du scénario enregistré (null tant qu'il ne l'est pas). */
  scenarioId: number | null
  save: (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[]) => void
}

/**
 * Enregistre le scénario (radar + Mesange engagées) auprès du back. Le back
 * calcule la trajectoire à ce moment ; on conserve l'id retourné pour que le
 * lancement puisse exiger un scénario enregistré.
 */
export function useSaveScenario(missionId: number): UseSaveScenarioResult {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [scenarioId, setScenarioId] = useState<number | null>(null)

  const save = (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[]) => {
    setStatus('saving')
    saveScenario(missionId, radarConfig, mesangeConfigs)
      .then((scenario) => {
        setScenarioId(scenario.id)
        setStatus('saved')
      })
      .catch(() => setStatus('error'))
  }

  return { status, scenarioId, save }
}
