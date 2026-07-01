import { useState } from 'react'
import type { RadarConfig } from '@/types/radar.types'

interface RadarConfigPanelProps {
  config: RadarConfig
  onChange: (patch: Partial<RadarConfig>) => void
}

export function RadarConfigPanel({ config, onChange }: RadarConfigPanelProps) {
  const [showRcs, setShowRcs] = useState(false)

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="radar-range" className="text-ink-dim">Portée (km)</label>
        <input
          id="radar-range"
          type="number"
          min={0}
          value={config.rangeKm}
          onChange={(event) => onChange({ rangeKm: Number(event.target.value) })}
          className="hud-input w-20 px-1 py-1 text-right"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="radar-ceiling" className="text-ink-dim">Plafond (m)</label>
        <input
          id="radar-ceiling"
          type="number"
          min={0}
          value={config.ceilingM}
          onChange={(event) => onChange({ ceilingM: Number(event.target.value) })}
          className="hud-input w-20 px-1 py-1 text-right"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="radar-rotating" className="text-ink-dim">Rotatif</label>
        <input
          id="radar-rotating"
          type="checkbox"
          checked={config.rotating}
          onChange={(event) => onChange({ rotating: event.target.checked })}
          className="size-4 accent-accent"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowRcs((current) => !current)}
        className="text-[11px] tracking-[0.15em] text-ink-faint uppercase underline-offset-2 hover:text-accent hover:underline"
      >
        {showRcs ? 'Masquer' : 'Afficher'} le paramètre avancé
      </button>

      {showRcs && (
        <div className="space-y-3 pt-1">
          <div className="hud-divider" />
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="radar-rcs" className="text-ink-dim">SER min. détectable (m²)</label>
            <input
              id="radar-rcs"
              type="number"
              min={0}
              step={0.1}
              value={config.minDetectableRcsM2}
              onChange={(event) => onChange({ minDetectableRcsM2: Number(event.target.value) })}
              className="hud-input w-20 px-1 py-1 text-right"
            />
          </div>
        </div>
      )}
    </div>
  )
}
