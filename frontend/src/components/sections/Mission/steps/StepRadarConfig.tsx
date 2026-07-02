import { useState } from 'react'
import { HudRange } from '../HudRange'
import { HudToggle } from '../HudToggle'
import { RadarPreviewPanel } from '../RadarPreviewPanel'
import type { RadarConfig } from '@/types/radar.types'

interface StepRadarConfigProps {
  config: RadarConfig
  onChange: (patch: Partial<RadarConfig>) => void
}

export function StepRadarConfig({ config, onChange }: StepRadarConfigProps) {
  const [showRcs, setShowRcs] = useState(false)

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 lg:w-80">
        <p className="mb-4 text-sm font-medium text-ink-dim">Caractéristiques — {config.name}</p>

        <div className="space-y-6 rounded-3xl bg-surface p-6">
          <HudRange label="Portée" value={config.rangeKm} min={5} max={150} unit="km" onChange={(v) => onChange({ rangeKm: v })} />
          <HudRange label="Plafond" value={config.ceilingM} min={1000} max={40000} step={500} unit="m" onChange={(v) => onChange({ ceilingM: v })} />
          <HudToggle label="Rotatif" checked={config.rotating} onChange={(v) => onChange({ rotating: v })} />

          {showRcs && (
            <HudRange
              label="SER min. détectable"
              value={config.minDetectableRcsM2}
              min={0.1}
              max={10}
              step={0.1}
              unit="m²"
              onChange={(v) => onChange({ minDetectableRcsM2: v })}
            />
          )}

          <button
            type="button"
            onClick={() => setShowRcs((current) => !current)}
            className="text-[10px] font-medium tracking-[0.18em] text-ink-faint uppercase transition-colors hover:text-accent-bright"
          >
            {showRcs ? '— Masquer le paramètre avancé' : '+ Paramètre avancé'}
          </button>
        </div>
      </div>

      <div className="min-h-[42vh] flex-1 overflow-hidden rounded-3xl bg-surface/40">
        <RadarPreviewPanel config={config} />
      </div>
    </div>
  )
}
