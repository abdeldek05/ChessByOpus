import { useNavigate } from 'react-router-dom'
import { useMissionConfig } from '@/hooks/useMissionConfig'
import { useMissionStepper } from '@/hooks/useMissionStepper'
import { useSaveScenario } from '@/hooks/useSaveScenario'
import { validateScenario } from '@/lib/validateScenario'
import { MissionStepRail } from './MissionStepRail'
import { StepRadar } from './steps/StepRadar'
import { StepRadarConfig } from './steps/StepRadarConfig'
import { StepPosition } from './steps/StepPosition'
import { StepTrajectories } from './steps/StepTrajectories'
import { StepLaunch } from './steps/StepLaunch'
import { MissionSceneBackground } from './MissionSceneBackground'
import type { LaunchSite } from '@/types/simulation.types'

interface MissionConsoleProps {
  site: LaunchSite
  missionId: number
}

export function MissionConsole({ site, missionId }: MissionConsoleProps) {
  const config = useMissionConfig()
  const stepper = useMissionStepper()
  const { status, scenarioId, save } = useSaveScenario(missionId)
  const navigate = useNavigate()

  const validation = validateScenario({
    site,
    radarConfig: config.radarConfig,
    radarPosition: config.radarPosition,
    mesangeConfigs: config.mesangeConfigs,
  })

  const canProceed =
    (stepper.current === 'radar' && !!config.radarConfig) ||
    (stepper.current === 'position' && !!config.radarPosition) ||
    stepper.current === 'config' ||
    stepper.current === 'trajectories'

  // Lancement autorisé uniquement si le scénario est valide ET enregistré (le
  // back calcule la trajectoire à l'enregistrement, prête au lancement).
  const canLaunch = validation.valid && status === 'saved' && scenarioId !== null

  const launch = () => {
    if (!canLaunch || !config.radarConfig || !config.radarPosition) return
    navigate('/lancement', {
      state: {
        site,
        scenarioId,
        radarConfig: config.radarConfig,
        radarPosition: config.radarPosition,
        mesangeConfigs: config.mesangeConfigs,
      },
    })
  }

  return (
    <div className="theme-dark relative flex h-screen w-screen flex-col overflow-hidden font-display text-ink">
      <MissionSceneBackground />

      <header className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.28em] text-accent uppercase">
            Exercice de détection
          </p>
          <h1 className="mt-1 text-xl font-semibold text-ink">{site.name}</h1>
        </div>
        <MissionStepRail steps={stepper.steps} index={stepper.index} onStepClick={stepper.goTo} />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 md:px-10">
        {stepper.current === 'radar' && (
          <StepRadar radarConfig={config.radarConfig} onSelect={config.selectRadar} />
        )}
        {stepper.current === 'config' && config.radarConfig && (
          <StepRadarConfig config={config.radarConfig} onChange={config.updateRadarConfig} />
        )}
        {stepper.current === 'position' && (
          <StepPosition
            site={site}
            radarPosition={config.radarPosition}
            rangeKm={config.radarConfig?.rangeKm ?? 60}
            onPlaceRadar={config.setRadarPosition}
          />
        )}
        {stepper.current === 'trajectories' && (
          <StepTrajectories
            configs={config.mesangeConfigs}
            canAdd={config.canAddMesange}
            onAdd={config.addMesange}
            onRemove={config.removeMesange}
            onChange={config.updateMesangeConfig}
          />
        )}
        {stepper.current === 'launch' && config.radarConfig && config.radarPosition && (
          <StepLaunch
            site={site}
            radarConfig={config.radarConfig}
            radarPosition={config.radarPosition}
            mesangeConfigs={config.mesangeConfigs}
            saveStatus={status}
            violations={validation.violations}
            canLaunch={canLaunch}
            onSave={() => config.radarConfig && save(config.radarConfig, config.mesangeConfigs)}
            onLaunch={launch}
          />
        )}
      </main>

      {!stepper.isLast && (
        <footer className="flex items-center justify-between px-6 py-6 md:px-10">
          <button
            type="button"
            onClick={stepper.goPrev}
            disabled={stepper.isFirst}
            className="group flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium tracking-wide text-ink-dim transition-colors hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-0"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Précédent
          </button>
          <button
            type="button"
            onClick={stepper.goNext}
            disabled={!canProceed}
            className="group flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-xs font-semibold tracking-wide text-bg shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-bright hover:shadow-xl active:translate-y-0 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none"
          >
            Continuer
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </footer>
      )}
    </div>
  )
}
