import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { setUnauthorizedHandler } from '@/lib/api'

/**
 * Amorce la session au démarrage de l'app : demande au serveur qui est connecté
 * (le cookie `HttpOnly` étant illisible en JS, c'est la seule façon de savoir),
 * et branche la réaction au 401 pour que l'expiration d'une session en cours de
 * route renvoie vers /login au lieu de laisser une UI qui échoue en silence.
 *
 * À appeler UNE SEULE FOIS, au niveau de `App`.
 */
export function useAuthBootstrap(): void {
  useEffect(() => {
    const { restore, clear } = useAuthStore.getState()
    setUnauthorizedHandler(clear)
    void restore()
  }, [])
}
