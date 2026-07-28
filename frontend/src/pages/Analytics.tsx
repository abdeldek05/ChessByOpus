import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CoverageCutChart } from '@/components/sections/Analytics/CoverageCutChart'
import { AnalyticsCoverage3D } from '@/components/sections/Analytics/AnalyticsCoverage3D'
import { AnalyticsTelemetry } from '@/components/sections/Analytics/AnalyticsTelemetry'
import { AnalyticsPanel } from '@/components/sections/Analytics/AnalyticsPanel'
import { AnalyticsVerdict } from '@/components/sections/Analytics/AnalyticsVerdict'
import { RadarResultCard } from '@/components/sections/Analytics/RadarResultCard'
import { useAnalyticsData } from '@/hooks/useAnalyticsData'
import type { AnalyticsPageState } from '@/types/analytics.types'

/**
 * Page ANALYTICS post-simulation. Garde de route seule : sans vol enregistré, on
 * repart sur la mission (rien n'est persisté, un F5 perd le state).
 */
export function Analytics() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as AnalyticsPageState | null

  if (!state?.flight || !state.site || !state.radars?.length) {
    return <Navigate to="/mission" replace />
  }

  return <AnalyticsContent state={state} onBack={() => navigate(-1)} />
}

interface AnalyticsContentProps {
  state: AnalyticsPageState
  onBack: () => void
}

/**
 * Le DÉBRIEF, en trois colonnes : télémétrie du vol à gauche, couverture radar au
 * centre (volume 3D interactif au-dessus de la coupe verticale 2D), et le bilan à
 * droite — verdict de réseau, puis une fiche PAR RADAR au lieu d'un seul agrégat.
 *
 * Séparé de la garde de route ci-dessus parce que les hooks de données ne peuvent
 * pas être appelés avant un `return <Navigate>` (règle des Hooks).
 */
function AnalyticsContent({ state, onBack }: AnalyticsContentProps) {
  const { primary, cut, decoyTracks, kingDelaySec } = useAnalyticsData(state)
  const perRadar = state.result?.perRadar ?? []
  const azimuthDeg = primary?.azimuthDeg ?? 0

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg px-6 py-4 font-mono text-ink">
      <header className="mb-4 flex shrink-0 items-baseline justify-between gap-4">
        <div>
          <p className="type-eyebrow text-accent-bright">
            Analytics · {state.site.name}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-hud uppercase">Simulation debrief</h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="type-eyebrow clip-corner-14 border border-accent-bright/40 px-4 py-2 font-mono text-accent-bright transition-colors hover:bg-accent-bright/20"
        >
          ← Back to scene
        </button>
      </header>

      {/* La couverture radar est le cœur du débrief : elle prend la moitié de la
          largeur, encadrée par la télémétrie et le bilan. */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <AnalyticsPanel title="Flight telemetry" className="col-span-3" bodyClassName="min-h-0 flex-1 overflow-y-auto p-3">
          <AnalyticsTelemetry flight={state.flight} />
        </AnalyticsPanel>

        <div className="col-span-6 grid min-h-0 grid-rows-2 gap-4">
          <AnalyticsPanel title="Radar coverage — 3D" bodyClassName="min-h-0 flex-1 overflow-hidden">
            <AnalyticsCoverage3D
              flight={state.flight}
              cut={cut}
              decoyTracks={decoyTracks}
              kingDelaySec={kingDelaySec}
              site={state.site}
              radars={state.radars}
            />
          </AnalyticsPanel>

          <AnalyticsPanel title={`Vertical cut — firing axis ${Math.round(azimuthDeg)}°`}>
            <CoverageCutChart
              flight={state.flight}
              site={state.site}
              radars={state.radars}
              azimuthDeg={azimuthDeg}
            />
          </AnalyticsPanel>
        </div>

        <div className="col-span-3 flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          <AnalyticsVerdict result={state.result} requiredLeadSec={state.detectionThresholdSec} />
          {perRadar.length > 0 ? (
            perRadar.map((radar) => (
              <RadarResultCard
                key={radar.id}
                radar={radar}
                totalThreats={state.result?.totalThreats ?? state.mesangeConfigs.length}
              />
            ))
          ) : (
            <p className="text-label leading-relaxed text-ink-dim">
              No per-radar detail in this result — replay the scenario to produce one.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
