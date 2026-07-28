import type { NavLinkItem } from '@/types/nav.types'

// « Simulation » n'est PAS ici : elle exige une session (voir SimulationNavLink),
// contrairement à ces deux pages publiques. La lister ici la rendrait visible
// même déconnecté — trompeur, même si le clic renvoie bien vers /login.
export const navLinks: NavLinkItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Contact', href: '/contact' },
]
