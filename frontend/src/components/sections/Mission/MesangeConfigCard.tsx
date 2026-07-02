import { NumberStepper } from './NumberStepper'
import { RoleSelector } from './RoleSelector'
import { AzimuthDial } from './AzimuthDial'
import { InclinationPad } from './InclinationPad'
import type { MesangeLaunchConfig } from '@/types/mission.types'

interface MesangeConfigCardProps {
  index: number
  config: MesangeLaunchConfig
  canRemove: boolean
  onChange: (patch: Partial<MesangeLaunchConfig>) => void
  onRemove: () => void
}

export function MesangeConfigCard({ index, config, canRemove, onChange, onRemove }: MesangeConfigCardProps) {
  return (
    <div className="animate-card-in space-y-5 rounded-3xl bg-surface/90 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-ink">
          Mesange {String(index + 1).padStart(2, '0')}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full px-3 py-1 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-2 hover:text-alert"
          >
            Supprimer
          </button>
        )}
      </div>

      <RoleSelector value={config.role} onChange={(role) => onChange({ role })} />

      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4 rounded-2xl bg-bg/40 py-4">
        <AzimuthDial value={config.azimuthDeg} onChange={(v) => onChange({ azimuthDeg: v })} />
        <InclinationPad value={config.inclinationDeg} onChange={(v) => onChange({ inclinationDeg: v })} />
      </div>

      <NumberStepper
        label="Délai de tir"
        value={config.launchDelaySec}
        min={0}
        max={120}
        step={5}
        unit="s"
        onChange={(v) => onChange({ launchDelaySec: v })}
      />
    </div>
  )
}
