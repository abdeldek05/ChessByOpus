interface LoginSubmitButtonProps {
  isSubmitting: boolean
}

/**
 * Bouton de connexion. Reprend le traçage de contour de l'InteractiveCta (les
 * quatre côtés se dessinent en séquence, façon verrouillage de cible) pour que
 * l'entrée dans l'app se sente comme la suite du bouton « Launch » de l'accueil.
 */
export function LoginSubmitButton({ isSubmitting }: LoginSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="group relative inline-flex w-full items-center justify-center gap-2 border border-border px-6 py-3.5 type-label text-ink transition-colors duration-300 ease-out hover:text-accent-bright disabled:cursor-wait disabled:text-ink-dim"
    >
      <span className="pointer-events-none absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <span className="pointer-events-none absolute top-0 right-0 h-full w-px origin-top scale-y-0 bg-accent transition-transform duration-300 delay-150 ease-out group-hover:scale-y-100" />
      <span className="pointer-events-none absolute right-0 bottom-0 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-300 delay-300 ease-out group-hover:scale-x-100" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-full w-px origin-bottom scale-y-0 bg-accent transition-transform delay-[450ms] duration-300 ease-out group-hover:scale-y-100" />

      <span className="relative">{isSubmitting ? 'Authenticating…' : 'Authenticate'}</span>
      <span
        aria-hidden
        className="relative inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5"
      >
        →
      </span>
    </button>
  )
}
