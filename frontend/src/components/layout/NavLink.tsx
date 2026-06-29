import { Link } from 'react-router-dom'
import type { NavLinkItem } from '@/types/nav.types'

interface NavLinkProps {
  item: NavLinkItem
  active?: boolean
}

export function NavLink({ item, active = false }: NavLinkProps) {
  return (
    <Link
      to={item.href}
      className={
        active
          ? 'text-sm text-ink underline underline-offset-4'
          : 'text-sm text-ink-dim transition-colors hover:text-ink'
      }
    >
      {item.label}
    </Link>
  )
}
