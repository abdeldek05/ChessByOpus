import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CoverageCutChart } from '@/components/sections/Analytics/CoverageCutChart'
import type { AnalyticsPageState } from '@/types/analytics.types'

/**
 * Page ANALYTICS post-simulation : la coupe Thales (distance au sol × altitude
 * dans l'axe de tir, couverture radar et fenêtres de visibilité) — les
 * résultats complets et la maquette 3D replay viendront s'ajouter ici.
 * Accessible uniquement via le bouton post-simulation (state routeur requis).
 */
export function Analytics() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as AnalyticsPageState | null

  // Garde-fou : sans vol enregistré, retour à la mission.
  if (!state?.flight || !state.site || !state.radars?.length) {
    return <Navigate to="/mission" replace />
  }

  const primary = state.mesangeConfigs.find((m) => m.role === 'KING') ?? state.mesangeConfigs[0]

  return (
    <div className="min-h-screen w-full bg-bg px-8 py-6 font-mono text-ink">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-ink-dim uppercase">Analytics · {state.site.name}</p>
          <h1 className="mt-1 text-xl font-bold tracking-[0.12em] uppercase">Débrief de simulation</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border border-accent-bright/40 bg-accent-bright/10 px-4 py-2 text-[10px] font-bold tracking-[0.24em] text-accent-bright uppercase transition-colors hover:bg-accent-bright/20"
        >
          ← Retour scène
        </button>
      </header>

      <section>
        <h2 className="mb-2 text-[11px] tracking-[0.24em] text-ink-dim uppercase">
          Coupe de couverture verticale — axe de tir {primary?.azimuthDeg ?? 0}°
        </h2>
        <div className="border border-ink-dim/20 bg-black/20 p-4">
          <CoverageCutChart
            flight={state.flight}
            site={state.site}
            radars={state.radars}
            azimuthDeg={primary?.azimuthDeg ?? 0}
          />
        </div>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-ink-dim">
          Trajectoire projetée dans le plan vertical de l'axe de tir. Par radar : lobe de couverture
          instrumentée (portée, plafond, élévations min/max), segments de trajectoire en visibilité
          surlignés, marqueurs ▲ première / ▼ dernière visibilité avec temps de vol.
        </p>
      </section>
    </div>
  )
}
