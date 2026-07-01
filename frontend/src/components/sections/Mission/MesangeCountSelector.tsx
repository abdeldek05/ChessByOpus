interface MesangeCountSelectorProps {
  count: number
  onChange: (count: number) => void
}

export function MesangeCountSelector({ count, onChange }: MesangeCountSelectorProps) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">Mésange engagées</p>
      <div className="mt-2 flex items-center gap-4 font-mono">
        <button
          type="button"
          onClick={() => onChange(count - 1)}
          className="text-lg text-ink-faint transition-colors duration-150 hover:text-accent"
        >
          −
        </button>
        <span className="w-6 text-center text-lg text-accent">{count}</span>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          className="text-lg text-ink-faint transition-colors duration-150 hover:text-accent"
        >
          +
        </button>
      </div>
    </div>
  )
}
