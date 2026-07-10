import { useScenarios } from '@/hooks/useScenarios'
import { ScenarioRow } from './ScenarioRow'

export function ScenarioList() {
  const { scenarios, status } = useScenarios()

  if (status === 'loading') {
    return <p className="font-mono text-xs text-ink-faint uppercase tracking-[0.15em]">Loading…</p>
  }

  if (status === 'error') {
    return <p className="font-mono text-xs text-alert uppercase tracking-[0.15em]">Loading failed</p>
  }

  if (scenarios.length === 0) {
    return <p className="font-mono text-xs text-ink-faint uppercase tracking-[0.15em]">No saved scenario</p>
  }

  return (
    <div className="divide-y divide-border">
      {scenarios.map((scenario) => (
        <ScenarioRow key={scenario.id} scenario={scenario} />
      ))}
    </div>
  )
}
