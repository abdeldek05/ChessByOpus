import { Navigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LoginSection } from '@/components/sections/Login/LoginSection'
import { useAuthStore } from '@/stores/authStore'

export function Login() {
  const status = useAuthStore((state) => state.status)

  // Déjà connecté : on ne redemande pas de se connecter. Cas courant — cliquer
  // « Launch » alors que la session est encore ouverte doit mener droit à la
  // simulation, pas à un formulaire inutile.
  if (status === 'authenticated') {
    return <Navigate to="/simulation" replace />
  }

  return (
    <>
      <Header />
      <LoginSection />
    </>
  )
}
