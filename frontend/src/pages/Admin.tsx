import { Header } from '@/components/layout/Header'
import { AdminSection } from '@/components/sections/Admin/AdminSection'

export function Admin() {
  return (
    // `.theme-console` : registre volontairement distinct du reste du site
    // (laiton mission/fusée) — un poste de supervision, pas un HUD tactique.
    <div className="theme-console">
      <Header />
      <AdminSection />
    </div>
  )
}
