interface LoginFieldProps {
  id: string
  label: string
  type: 'text' | 'password'
  value: string
  autoComplete: string
  autoFocus?: boolean
  disabled?: boolean
  onChange: (value: string) => void
}

/**
 * Champ de saisie du HUD : pas de boîte à quatre bords, juste une ligne de base
 * qui s'allume en laiton au focus — même langage que le traçage de contour de
 * l'InteractiveCta, et cohérent avec la DA « instrument » du reste de l'app.
 */
export function LoginField({
  id,
  label,
  type,
  value,
  autoComplete,
  autoFocus = false,
  disabled = false,
  onChange,
}: LoginFieldProps) {
  return (
    <div className="group relative">
      <label htmlFor={id} className="type-label-tight block text-ink-faint">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        required
        spellCheck={false}
        className="mt-2 w-full bg-transparent pb-2 font-mono text-body text-ink caret-accent-bright outline-none placeholder:text-ink-faint disabled:text-ink-dim"
      />

      {/* Ligne de base en deux couches : la piste sombre reste visible au repos,
          le trait laiton se déploie depuis la gauche quand le champ est actif. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent-bright transition-transform duration-300 ease-out group-focus-within:scale-x-100"
      />
    </div>
  )
}
