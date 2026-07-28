import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Déconnexion. Ne s'affiche que pour une session ouverte — un bouton
 * « Sign out » visible alors qu'on n'est pas connecté serait un faux repère.
 */
export function SignOutButton() {
  const navigate = useNavigate()
  const status = useAuthStore((state) => state.status)
  const signOut = useAuthStore((state) => state.signOut)

  if (status !== 'authenticated') return null

  const handleClick = () => {
    void signOut().then(() => navigate('/', { replace: true }))
  }

  // `ml-auto` est porté par le bouton lui-même : hors session il ne rend rien,
  // donc aucun conteneur vide ne vient étirer le bandeau du Header.
  return (
    <button
      type="button"
      onClick={handleClick}
      className="type-label-tight ml-auto text-ink-faint transition-colors duration-300 ease-out hover:text-accent-bright"
    >
      Sign out
    </button>
  )
}
