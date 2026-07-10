interface NumberStepperProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (value: number) => void
}

/** Contrôle numérique pas-à-pas : − / + ou saisie directe, valeur bornée. */
export function NumberStepper({ label, value, min, max, step = 1, unit, onChange }: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const set = (n: number) => onChange(clamp(Number.isNaN(n) ? min : n))

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink-dim">{label}</span>

      <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => set(value - step)}
          aria-label={`Decrease ${label}`}
          className="flex size-8 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-accent hover:text-bg"
        >
          −
        </button>

        <div className="flex w-20 items-baseline justify-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(event) => set(Number(event.target.value))}
            className="w-12 bg-transparent text-right text-sm font-semibold text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-ink-faint">{unit}</span>
        </div>

        <button
          type="button"
          onClick={() => set(value + step)}
          aria-label={`Increase ${label}`}
          className="flex size-8 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-accent hover:text-bg"
        >
          +
        </button>
      </div>
    </div>
  )
}
