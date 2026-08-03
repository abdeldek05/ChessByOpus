import { Outlet } from 'react-router-dom'
import { RequireAdmin } from './RequireAdmin'

/**
 * Route parente réservée à l'opérateur. Même raison d'être que
 * `ProtectedOutlet` : une page d'administration ajoutée dessous est gardée
 * d'office, là où un enrobage à la main s'oublie.
 */
export function AdminOutlet() {
  return (
    <RequireAdmin>
      <Outlet />
    </RequireAdmin>
  )
}
