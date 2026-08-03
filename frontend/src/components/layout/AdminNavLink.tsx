import { useAuthStore } from '@/stores/authStore'
import { isAdmin } from '@/lib/authAccess'
import { ProtectedNavLink } from './ProtectedNavLink'

const ADMIN_ITEM = { label: 'Admin', href: '/admin' } as const

/**
 * Onglet Admin, visible du seul opérateur. Un invité ne le voit pas : lui
 * montrer une porte qui se referme au clic ferait passer une limite d'accès
 * assumée pour une panne.
 */
export function AdminNavLink() {
  const user = useAuthStore((state) => state.user)

  if (!isAdmin(user)) return null

  return <ProtectedNavLink item={ADMIN_ITEM} />
}
