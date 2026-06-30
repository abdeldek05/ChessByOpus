import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { NotFound } from '@/pages/NotFound'
import { Simulation } from '@/pages/Simulation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/simulation" element={<Simulation />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
