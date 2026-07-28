import { useCallback, useEffect, useState } from 'react'
import { fetchAdminOverview, revokeSession } from '@/lib/api'
import type { AdminOverview } from '@/types/admin.types'

interface AdminOverviewState {
  data: AdminOverview | null
  error: string | null
  isLoading: boolean
  reload: () => void
  revoke: (jti: string) => void
}

/**
 * Charge le tableau de bord Admin et gère la révocation de session.
 *
 * Pas de rafraîchissement automatique : un journal d'audit qui se recharge tout
 * seul déplace les lignes sous le curseur au moment où on les lit. Le bouton
 * « Refresh » rend la mise à jour explicite.
 */
export function useAdminOverview(): AdminOverviewState {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(() => {
    setIsLoading(true)
    fetchAdminOverview()
      .then((overview) => {
        setData(overview)
        setError(null)
      })
      .catch(() => setError('Tableau de bord indisponible'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(load, [load])

  const revoke = useCallback(
    (jti: string) => {
      // On recharge après coup plutôt que de retirer la ligne localement : le
      // serveur reste la source de vérité sur ce qui est réellement révoqué.
      revokeSession(jti)
        .then(load)
        .catch(() => setError('Révocation impossible'))
    },
    [load],
  )

  return { data, error, isLoading, reload: load, revoke }
}
