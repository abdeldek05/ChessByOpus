import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMission } from '@/lib/api'
import type { LaunchSite } from '@/types/simulation.types'

type ConfirmStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseConfirmLaunchSiteResult {
  status: ConfirmStatus
  confirm: (site: LaunchSite) => void
}

/**
 * Enregistre la base de lancement confirmée auprès du back (POST /api/missions),
 * puis redirige vers le HUD de configuration de mission.
 */
export function useConfirmLaunchSite(): UseConfirmLaunchSiteResult {
  const [status, setStatus] = useState<ConfirmStatus>('idle')
  const navigate = useNavigate()

  const confirm = (site: LaunchSite) => {
    setStatus('saving')
    createMission(site)
      .then((mission) => {
        setStatus('saved')
        navigate('/mission', { state: { site, missionId: mission.id } })
      })
      .catch(() => setStatus('error'))
  }

  return { status, confirm }
}
