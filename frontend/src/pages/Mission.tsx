import { Navigate, useLocation } from 'react-router-dom'
import { MissionHud } from '@/components/sections/Mission/MissionHud'
import type { LaunchSite } from '@/types/simulation.types'

interface MissionLocationState {
  site: LaunchSite
  missionId: number
}

export function Mission() {
  const location = useLocation()
  const state = location.state as MissionLocationState | null

  if (!state?.site) return <Navigate to="/simulation" replace />

  return (
    <div className="relative min-h-screen w-screen overflow-y-auto bg-bg md:h-screen md:overflow-hidden">
      <MissionHud site={state.site} missionId={state.missionId} />
    </div>
  )
}
