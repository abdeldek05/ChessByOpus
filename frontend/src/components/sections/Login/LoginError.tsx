interface LoginErrorProps {
  message: string
}

/**
 * Refus d'accès. Barre d'alerte à liseré gauche plutôt qu'un encadré complet :
 * le message se lit comme une ligne de journal d'incident du HUD, pas comme une
 * boîte de dialogue générique.
 */
export function LoginError({ message }: LoginErrorProps) {
  return (
    <p
      role="alert"
      aria-live="assertive"
      className="type-label-tight border-l-2 border-alert bg-alert/8 py-2 pr-3 pl-3 text-alert"
    >
      {message}
    </p>
  )
}
