import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { isAdmin } from '@/lib/authAccess'

interface RequireAdminProps {
  children: ReactNode
}

/**
 * Garde de route : ne rend ses enfants que pour un compte opérateur.
 *
 * Placée SOUS `RequireAuth` : le cas « pas connecté » est déjà traité là-bas,
 * il ne reste ici que « connecté, mais invité ». Celui-là est renvoyé vers la
 * simulation, pas vers /login : lui présenter un formulaire alors que sa
 * session est valide donnerait à croire qu'il s'est déconnecté.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)

  // Réponse de /auth/me encore en vol : ni contenu, ni redirection.
  if (status === 'unknown') {
    return <div className="h-screen w-screen bg-bg" />
  }

  if (!isAdmin(user)) {
    return <Navigate to="/simulation" replace />
  }

  return <>{children}</>
}
