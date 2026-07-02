import { Navigate, useLocation } from 'react-router-dom'
import { MissionConsole } from '@/components/sections/Mission/MissionConsole'
import type { LaunchSite } from '@/types/simulation.types'

interface MissionLocationState {
  site: LaunchSite
  missionId: number
}

export function Mission() {
  const location = useLocation()
  const state = location.state as MissionLocationState | null

  if (!state?.site) return <Navigate to="/simulation" replace />

  return <MissionConsole site={state.site} missionId={state.missionId} />
}
