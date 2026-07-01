import { ScenarioList } from '@/components/sections/Historique/ScenarioList'

export function Historique() {
  return (
    <div className="min-h-screen w-screen bg-bg px-6 py-12 md:px-16">
      <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">Historique</p>
      <h1 className="mt-1 font-mono text-2xl font-bold text-ink">Scénarios enregistrés</h1>

      <div className="mt-8">
        <ScenarioList />
      </div>
    </div>
  )
}
