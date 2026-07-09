import { useState } from 'react'
import { HudRange } from './HudRange'
import { HudToggle } from './HudToggle'
import type { RadarConfig } from '@/types/radar.types'

interface RadarSettingsProps {
  config: RadarConfig
  onChange: (patch: Partial<RadarConfig>) => void
}

/**
 * Réglages du radar sélectionné : portée, plafond, rotatif, paramètre avancé
 * (SER), et seuil de préavis de détection — tous propres à CE radar.
 */
export function RadarSettings({ config, onChange }: RadarSettingsProps) {
  const [showRcs, setShowRcs] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-6 rounded-3xl bg-surface p-6">
        <p className="text-sm font-medium text-ink-dim">Réglages — {config.name}</p>

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

      {/* Critère de réussite du client : préavis de détection minimum exigé. */}
      <div className="space-y-3 rounded-3xl bg-surface p-6">
        <HudRange
          label="Seuil de préavis (détection)"
          value={config.detectionThresholdSec}
          min={5}
          max={120}
          step={1}
          unit="s"
          onChange={(v) => onChange({ detectionThresholdSec: v })}
        />
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Préavis minimum exigé entre l'accroche de la menace par ce radar et l'impact. En dessous, la
          détection est jugée trop tardive.
        </p>
      </div>
    </div>
  )
}
