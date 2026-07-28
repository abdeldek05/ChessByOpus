import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface RequireAuthProps {
  children: ReactNode
}

/**
 * Garde de route : ne rend ses enfants que pour une session ouverte.
 *
 * Tant que le statut est `unknown` (réponse de /auth/me en attente), on ne rend
 * NI le contenu NI une redirection — sinon un simple F5 sur /lancement
 * renverrait vers le login avant même de savoir si la session est valide.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'unknown') {
    return <div className="h-screen w-screen bg-bg" />
  }

  if (status === 'anonymous') {
    // `from` permet à useLoginForm de revenir ici après connexion.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
