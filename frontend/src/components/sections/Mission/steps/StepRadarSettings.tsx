import { useState } from 'react'
import { RadarSettings } from '../RadarSettings'
import type { RadarConfig } from '@/types/radar.types'
import type { PlacedRadar } from '@/types/mission.types'

interface StepRadarSettingsProps {
  radars: PlacedRadar[]
  onUpdateConfig: (id: string, patch: Partial<RadarConfig>) => void
}

/**
 * Étape 2 : régler chaque radar (portée, plafond, rotatif, SER, seuil de
 * préavis — tous propres au radar). Des onglets basculent d'un radar à l'autre ;
 * pas de 3D ici, on se concentre sur les curseurs.
 */
export function StepRadarSettings({ radars, onUpdateConfig }: StepRadarSettingsProps) {
  const [activeId, setActiveId] = useState(radars[0]?.id ?? '')
  const active = radars.find((r) => r.id === activeId) ?? radars[0]
  const multiple = radars.length > 1

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.24em] text-accent uppercase">Step 2</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Configure each radar</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">
          Range, ceiling, scan mode and lead-time threshold — specific to each radar. You will
          position them on the map in the next step.
        </p>
      </div>

      {multiple && (
        <div className="flex flex-wrap items-center gap-2">
          {radars.map((radar, index) => (
            <button
              key={radar.id}
              type="button"
              onClick={() => setActiveId(radar.id)}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                radar.id === active?.id ? 'bg-accent text-bg' : 'bg-surface text-ink-dim hover:bg-surface-2'
              }`}
            >
              Radar {index + 1} — {radar.config.name}
            </button>
          ))}
        </div>
      )}

      {active && (
        <RadarSettings
          config={active.config}
          onChange={(patch) => onUpdateConfig(active.id, patch)}
        />
      )}
    </div>
  )
}
