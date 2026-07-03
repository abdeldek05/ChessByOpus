import { useEffect, useState } from 'react'

interface DialValueInputProps {
  value: number
  min: number
  max: number
  unit: string
  label: string
  onChange: (value: number) => void
}

/**
 * Valeur d'un cadran, éditable au clavier. On garde une saisie locale libre
 * pendant la frappe et on ne borne/valide qu'à la sortie (blur/Entrée), sinon
 * un champ contrôlé clampé casse la saisie des valeurs intermédiaires.
 */
export function DialValueInput({ value, min, max, unit, label, onChange }: DialValueInputProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number(draft)
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    onChange(Math.min(max, Math.max(min, Math.round(parsed))))
  }

  return (
    <p className="flex items-baseline gap-1 text-sm font-semibold text-accent-bright">
      <input
        type="number"
        value={draft}
        min={min}
        max={max}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        aria-label={label}
        className="w-12 bg-transparent text-right tabular-nums outline-none [appearance:textfield] focus:text-ink [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="font-semibold">{unit}</span>
      <span className="ml-1 font-normal text-ink-faint">{label}</span>
    </p>
  )
}
