import { useEffect, useState } from 'react'
import type { ScenarioRecord } from '@/types/scenario.types'

type ScenariosStatus = 'loading' | 'ready' | 'error'

interface UseScenariosResult {
  scenarios: ScenarioRecord[]
  status: ScenariosStatus
}

/** Charge l'historique des scénarios enregistrés (GET /api/scenarios). */
export function useScenarios(): UseScenariosResult {
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([])
  const [status, setStatus] = useState<ScenariosStatus>('loading')

  useEffect(() => {
    fetch('/api/scenarios')
      .then((response) => {
        if (!response.ok) throw new Error('Échec du chargement')
        return response.json()
      })
      .then((data: ScenarioRecord[]) => {
        setScenarios(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return { scenarios, status }
}
