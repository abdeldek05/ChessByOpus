import { useNavigate } from 'react-router-dom'
import { useMissionConfig } from '@/hooks/useMissionConfig'
import { useSaveScenario } from '@/hooks/useSaveScenario'
import { RadarSelector } from './RadarSelector'
import { RadarConfigPanel } from './RadarConfigPanel'
import { MesangeScenarioPanel } from './MesangeScenarioPanel'
import { RadarPreviewPanel } from './RadarPreviewPanel'
import { MissionPlacementMap } from './MissionPlacementMap'
import type { LaunchSite } from '@/types/simulation.types'

interface MissionHudProps {
  site: LaunchSite
  missionId: number
}

const SAVE_BUTTON_LABEL = {
  idle: 'Enregistrer le scénario →',
  saving: 'Enregistrement…',
  saved: 'Scénario enregistré ✓',
  error: 'Échec — réessayer',
} as const

export function MissionHud({ site, missionId }: MissionHudProps) {
  const {
    radarConfig,
    selectRadar,
    updateRadarConfig,
    mesangeConfigs,
    setMesangeCount,
    updateMesangeConfig,
    radarPosition,
    setRadarPosition,
  } = useMissionConfig()
  const { status, save } = useSaveScenario(missionId)
  const navigate = useNavigate()

  const canLaunch = Boolean(radarConfig && radarPosition)

  const launch = () => {
    if (!radarConfig || !radarPosition) return
    navigate('/lancement', { state: { site, radarConfig, radarPosition, mesangeConfigs } })
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-4 p-4 md:absolute md:inset-6 md:min-h-0 md:flex-row md:gap-6 md:p-0">
      <div className="hud-panel w-full shrink-0 space-y-5 p-5 md:w-80">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">Base de lancement</p>
          <h2 className="mt-1 font-mono text-lg font-bold text-ink">{site.name}</h2>
        </div>

        <div className="hud-divider" />

        <RadarSelector selectedTemplateId={radarConfig?.templateId ?? null} onSelect={selectRadar} />

        {radarConfig && (
          <>
            <div className="hud-divider" />
            <RadarConfigPanel config={radarConfig} onChange={updateRadarConfig} />
          </>
        )}

        <div className="hud-divider" />

        <MesangeScenarioPanel
          configs={mesangeConfigs}
          onCountChange={setMesangeCount}
          onConfigChange={updateMesangeConfig}
        />

        <div className="hud-divider" />

        <button
          type="button"
          onClick={() => radarConfig && save(radarConfig, mesangeConfigs)}
          disabled={!radarConfig || status === 'saving' || status === 'saved'}
          className="w-full border border-accent px-4 py-2 text-xs tracking-[0.15em] text-accent uppercase transition-colors duration-300 ease-out hover:bg-accent hover:text-bg disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-accent"
        >
          {SAVE_BUTTON_LABEL[status]}
        </button>

        <button
          type="button"
          onClick={launch}
          disabled={!canLaunch}
          className="w-full border border-accent bg-accent px-4 py-2 text-xs tracking-[0.15em] text-bg uppercase transition-opacity duration-300 ease-out hover:opacity-80 disabled:cursor-default disabled:opacity-30"
        >
          Lancer →
        </button>
      </div>

      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="h-[40vh] w-full shrink-0 md:h-auto md:flex-1">
          <RadarPreviewPanel config={radarConfig} />
        </div>

        <div className="h-[40vh] w-full shrink-0 md:h-auto md:flex-1">
          <MissionPlacementMap site={site} radarPosition={radarPosition} onPlaceRadar={setRadarPosition} />
        </div>
      </div>
    </div>
  )
}
