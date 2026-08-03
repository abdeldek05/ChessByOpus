import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { Login } from '@/pages/Login'
import { NotFound } from '@/pages/NotFound'
import { ProtectedOutlet } from '@/components/routing/ProtectedOutlet'
import { AdminOutlet } from '@/components/routing/AdminOutlet'
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap'
// (sonde de dev LaunchProbe retirée — diagnostic terminé)

// Routes lourdes (Three.js / MapLibre) chargées à la demande : la page d'accueil
// ne paie pas le poids du moteur 3D et de la carte tant qu'on n'y va pas.
const Simulation = lazy(() => import('@/pages/Simulation').then((m) => ({ default: m.Simulation })))
const Mission = lazy(() => import('@/pages/Mission').then((m) => ({ default: m.Mission })))
const Historique = lazy(() => import('@/pages/Historique').then((m) => ({ default: m.Historique })))
const Lancement = lazy(() => import('@/pages/Lancement').then((m) => ({ default: m.Lancement })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })))

export default function App() {
  // Restaure la session (cookie `HttpOnly` → /auth/me) et branche la réaction
  // au 401. Une seule fois, à la racine de l'app.
  useAuthBootstrap()

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-bg" />}>
      <Routes>
        {/* Publiques : vitrine + terminal d'accès. */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        {/* Réservées à un opérateur authentifié. Le back applique la même règle
            de son côté (401 sans session) : cette garde soigne l'expérience,
            elle n'est pas ce qui protège les données. */}
        <Route element={<ProtectedOutlet />}>
          {/* Réservé au rôle opérateur : un compte invité connecté est
              renvoyé vers la simulation (le back répond 403 sur /admin/*). */}
          <Route element={<AdminOutlet />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="/simulation" element={<Simulation />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/lancement" element={<Lancement />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
