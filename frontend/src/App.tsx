import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { NotFound } from '@/pages/NotFound'

// Routes lourdes (Three.js / MapLibre) chargées à la demande : la page d'accueil
// ne paie pas le poids du moteur 3D et de la carte tant qu'on n'y va pas.
const Simulation = lazy(() => import('@/pages/Simulation').then((m) => ({ default: m.Simulation })))
const Mission = lazy(() => import('@/pages/Mission').then((m) => ({ default: m.Mission })))
const Historique = lazy(() => import('@/pages/Historique').then((m) => ({ default: m.Historique })))
const Lancement = lazy(() => import('@/pages/Lancement').then((m) => ({ default: m.Lancement })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))

export default function App() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-bg" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/lancement" element={<Lancement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
