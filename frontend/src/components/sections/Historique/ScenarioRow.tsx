import { getRadarName } from '@/lib/getRadarName'
import { formatScenarioDate } from '@/lib/formatScenarioDate'
import type { ScenarioRecord } from '@/types/scenario.types'

interface ScenarioRowProps {
  scenario: ScenarioRecord
}

export function ScenarioRow({ scenario }: ScenarioRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 py-3 font-mono text-xs">
      <div>
        <p className="text-sm text-ink">{scenario.siteName}</p>
        <p className="text-ink-faint">{formatScenarioDate(scenario.createdAt)}</p>
      </div>

      <p className="text-ink-dim">{getRadarName(scenario.radarTemplateId)}</p>

      <p className="text-ink-dim">{scenario.radarRangeKm} km</p>

      <p className="text-accent">{scenario.mesangeConfigs.length} Mésange</p>
    </div>
  )
}
