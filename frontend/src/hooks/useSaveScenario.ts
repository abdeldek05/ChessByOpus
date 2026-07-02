import { useState } from 'react'
import type { RadarConfig } from '@/types/radar.types'
import type { MesangeLaunchConfig } from '@/types/mission.types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseSaveScenarioResult {
  status: SaveStatus
  save: (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[]) => void
}

/** Enregistre le scénario (radar + Mesange engagées) auprès du backend (POST /api/missions/{id}/scenario). */
export function useSaveScenario(missionId: number): UseSaveScenarioResult {
  const [status, setStatus] = useState<SaveStatus>('idle')

  const save = (radarConfig: RadarConfig, mesangeConfigs: MesangeLaunchConfig[]) => {
    setStatus('saving')

    fetch(`/api/missions/${missionId}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        radarTemplateId: radarConfig.templateId,
        radarRangeKm: radarConfig.rangeKm,
        radarCeilingM: radarConfig.ceilingM,
        radarRotating: radarConfig.rotating,
        radarMinRcsM2: radarConfig.minDetectableRcsM2,
        mesangeConfigs,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Échec de l\'enregistrement')
        setStatus('saved')
      })
      .catch(() => setStatus('error'))
  }

  return { status, save }
}
