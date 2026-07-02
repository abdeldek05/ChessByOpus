interface HudRangeProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (value: number) => void
}

/** Curseur stylé (label + valeur mise en avant + piste laiton fluide). */
export function HudRange({ label, value, min, max, step = 1, unit, onChange }: HudRangeProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-dim">{label}</span>
        <span className="text-sm font-semibold text-accent-bright">
          {value} <span className="font-normal text-ink-faint">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-brass"
      />
    </div>
  )
}
