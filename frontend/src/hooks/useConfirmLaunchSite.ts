import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LaunchSite } from '@/types/simulation.types'

type ConfirmStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseConfirmLaunchSiteResult {
  status: ConfirmStatus
  confirm: (site: LaunchSite) => void
}

/**
 * Enregistre la base de lancement confirmée auprès du backend (POST /api/missions),
 * puis redirige vers le HUD de configuration de mission.
 */
export function useConfirmLaunchSite(): UseConfirmLaunchSiteResult {
  const [status, setStatus] = useState<ConfirmStatus>('idle')
  const navigate = useNavigate()

  const confirm = (site: LaunchSite) => {
    setStatus('saving')

    fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: site.id,
        siteName: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Échec de l\'enregistrement')
        return response.json()
      })
      .then((mission: { id: number }) => {
        setStatus('saved')
        navigate('/mission', { state: { site, missionId: mission.id } })
      })
      .catch(() => setStatus('error'))
  }

  return { status, confirm }
}
