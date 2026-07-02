interface HudToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Interrupteur stylé (piste + pastille qui glisse), plus vivant qu'une case à cocher. */
export function HudToggle({ label, checked, onChange }: HudToggleProps) {
  return (
    <div className="flex items-center justify-between font-mono">
      <span className="text-[11px] tracking-[0.15em] text-ink-dim uppercase">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent/30' : 'bg-surface'
        }`}
      >
        <span
          className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all duration-200 ${
            checked ? 'left-6 bg-accent' : 'left-1 bg-ink-faint'
          }`}
        />
      </button>
    </div>
  )
}
