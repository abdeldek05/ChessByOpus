import { Outlet } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'

/**
 * Route parente qui protège tout ce qu'elle contient.
 *
 * Préféré à un `<RequireAuth>` répété sur chaque route : une page ajoutée sous
 * ce parent est protégée d'office, alors qu'un enrobage à la main s'oublie —
 * et un oubli, ici, c'est une page ouverte.
 */
export function ProtectedOutlet() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}
