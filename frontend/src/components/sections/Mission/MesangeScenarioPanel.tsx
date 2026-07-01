import { MesangeCountSelector } from './MesangeCountSelector'
import { MesangeLaunchConfigCard } from './MesangeLaunchConfigCard'
import type { MesangeLaunchConfig } from '@/types/mission.types'

interface MesangeScenarioPanelProps {
  configs: MesangeLaunchConfig[]
  onCountChange: (count: number) => void
  onConfigChange: (id: string, patch: Partial<MesangeLaunchConfig>) => void
}

export function MesangeScenarioPanel({ configs, onCountChange, onConfigChange }: MesangeScenarioPanelProps) {
  return (
    <div className="space-y-3">
      <MesangeCountSelector count={configs.length} onChange={onCountChange} />

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {configs.map((config, index) => (
          <MesangeLaunchConfigCard
            key={config.id}
            index={index}
            config={config}
            onChange={(patch) => onConfigChange(config.id, patch)}
          />
        ))}
      </div>
    </div>
  )
}
