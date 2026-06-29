import { Link, useLocation } from 'react-router-dom'
import { LogoMark } from './LogoMark'
import { NavLink } from './NavLink'
import { navLinks } from './navLinks'

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
        </nav>
      </div>
    </header>
  )
}
