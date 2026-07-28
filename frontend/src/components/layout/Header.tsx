import { Link, useLocation } from 'react-router-dom'
import { LogoMark } from './LogoMark'
import { NavLink } from './NavLink'
import { navLinks } from './navLinks'
import { ProtectedNavLink } from './ProtectedNavLink'
import { SignOutButton } from './SignOutButton'

const SIMULATION_ITEM = { label: 'Simulation', href: '/simulation' } as const
const ADMIN_ITEM = { label: 'Admin', href: '/admin' } as const

export function Header() {
  const { pathname } = useLocation()

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-6 pt-8">
      <div className="mx-auto flex max-w-6xl items-center gap-12">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="font-mono text-sm text-ink">
            CHESS<span className="text-ink-dim">byOpus</span>
          </span>
        </Link>

        <nav className="flex items-center gap-7">
          {navLinks.map((item) => (
            <NavLink key={item.href} item={item} active={item.href === pathname} />
          ))}
          {/* Onglets réservés à une session ouverte — masqués sinon, pour ne
              pas laisser croire à un accès libre (voir ProtectedNavLink). */}
          <ProtectedNavLink item={SIMULATION_ITEM} />
          <ProtectedNavLink item={ADMIN_ITEM} />
        </nav>

        <SignOutButton />
      </div>
    </header>
  )
}
