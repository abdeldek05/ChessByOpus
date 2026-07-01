import type { MesangeLaunchConfig } from '@/types/mission.types'

interface MesangeLaunchConfigCardProps {
  index: number
  config: MesangeLaunchConfig
  onChange: (patch: Partial<MesangeLaunchConfig>) => void
}

export function MesangeLaunchConfigCard({ index, config, onChange }: MesangeLaunchConfigCardProps) {
  return (
    <div className="space-y-2 border-l-2 border-border py-1.5 pl-4 font-mono text-xs">
      <p className="text-ink-dim">Mésange {index + 1}</p>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor={`${config.id}-azimuth`} className="text-ink-dim">Azimut (°)</label>
        <input
          id={`${config.id}-azimuth`}
          type="number"
          min={0}
          max={360}
          value={config.azimuthDeg}
          onChange={(event) => onChange({ azimuthDeg: Number(event.target.value) })}
          className="hud-input w-20 px-1 py-1 text-right"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor={`${config.id}-inclination`} className="text-ink-dim">Inclinaison (°)</label>
        <input
          id={`${config.id}-inclination`}
          type="number"
          min={0}
          max={90}
          value={config.inclinationDeg}
          onChange={(event) => onChange({ inclinationDeg: Number(event.target.value) })}
          className="hud-input w-20 px-1 py-1 text-right"
        />
      </div>
    </div>
  )
}
