import { useLocation } from 'react-router-dom'
import { NavLink } from './NavLink'
import { useAuthStore } from '@/stores/authStore'
import type { NavLinkItem } from '@/types/nav.types'

interface ProtectedNavLinkProps {
  item: NavLinkItem
}

/**
 * Onglet de navigation visible SEULEMENT une fois connecté. Sans ça, un onglet
 * qui mène systématiquement au login serait un faux repère dans le menu — même
 * si le clic est bien bloqué côté route et côté API.
 */
export function ProtectedNavLink({ item }: ProtectedNavLinkProps) {
  const { pathname } = useLocation()
  const status = useAuthStore((state) => state.status)

  if (status !== 'authenticated') return null

  return <NavLink item={item} active={pathname === item.href} />
}
