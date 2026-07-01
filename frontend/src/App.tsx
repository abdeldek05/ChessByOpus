import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { NotFound } from '@/pages/NotFound'
import { Simulation } from '@/pages/Simulation'
import { Mission } from '@/pages/Mission'
import { Historique } from '@/pages/Historique'
import { Lancement } from '@/pages/Lancement'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/simulation" element={<Simulation />} />
      <Route path="/mission" element={<Mission />} />
      <Route path="/historique" element={<Historique />} />
      <Route path="/lancement" element={<Lancement />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
