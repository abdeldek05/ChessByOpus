import { Link } from 'react-router-dom'

/**
 * Retour à l'accueil. Lien discret et non un CTA encadré : sur un écran
 * d'accès, la seule action mise en avant doit être « Authenticate » — deux
 * boutons de même poids brouilleraient la hiérarchie.
 */
export function BackHomeLink() {
  return (
    <Link
      to="/"
      className="group type-label-tight inline-flex items-center gap-2 text-ink-faint transition-colors duration-300 ease-out hover:text-accent-bright"
    >
      <span
        aria-hidden
        className="inline-block transition-transform duration-300 ease-out group-hover:-translate-x-1"
      >
        ←
      </span>
      Back to home
    </Link>
  )
}
