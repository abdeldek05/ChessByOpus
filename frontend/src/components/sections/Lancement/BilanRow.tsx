interface BilanRowProps {
  label: string
  value: string
  /** Teinte de la valeur selon l'importance/alerte. */
  tint?: 'default' | 'accent' | 'warn' | 'crit'
  /** Ligne secondaire indentée (détail d'un coût). */
  indent?: boolean
}

const TINT = {
  default: 'text-ink',
  accent: 'text-accent-bright',
  warn: 'text-warning',
  crit: 'text-danger',
} as const

/**
 * Ligne du bilan : intitulé à gauche, valeur à droite. Sert aux blocs
 * DÉTECTION et DIAGNOSTIC. Purement présentatif.
 */
export function BilanRow({ label, value, tint = 'default', indent = false }: BilanRowProps) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-[11px] tracking-[0.08em] ${indent ? 'text-white/35' : 'text-white/50'} uppercase`}>
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${TINT[tint]}`}>{value}</span>
    </div>
  )
}
