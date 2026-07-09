import { useNavigate } from 'react-router-dom'
import { useMissionConfig } from '@/hooks/useMissionConfig'
import { useMissionStepper } from '@/hooks/useMissionStepper'
import { useSaveScenario } from '@/hooks/useSaveScenario'
import { validateScenario } from '@/lib/validateScenario'
import { MissionStepRail } from './MissionStepRail'
import { StepRadar } from './steps/StepRadar'
import { StepRadarSettings } from './steps/StepRadarSettings'
import { StepPosition } from './steps/StepPosition'
import { StepThreats } from './steps/StepThreats'
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

  // Radar principal (radars[0], toujours présent) : sert de pont pour le
  // placement/save/lancement tant que le multi-radar complet n'est pas branché.
  const primaryRadar = config.radars[0]
  // Menace principale (Roi si présent, sinon la première Mesange).
  const king = config.mesangeConfigs.find((m) => m.role === 'KING') ?? config.mesangeConfigs[0]

  const validation = validateScenario({
    site,
    radars: config.radars,
    mesangeConfigs: config.mesangeConfigs,
  })

  const allRadarsPlaced = config.radars.every((radar) => radar.position !== null)

  const canProceed =
    stepper.current === 'radar' ||
    stepper.current === 'settings' ||
    (stepper.current === 'position' && allRadarsPlaced) ||
    stepper.current === 'trajectories'

  // Lancement autorisé uniquement si le scénario est valide ET enregistré (le
  // back calcule la trajectoire à l'enregistrement, prête au lancement).
  const canLaunch = validation.valid && status === 'saved' && scenarioId !== null

  const launch = () => {
    if (!canLaunch || !primaryRadar.position) return
    navigate('/lancement', {
      state: {
        site,
        scenarioId,
        radarConfig: primaryRadar.config,
        radarPosition: primaryRadar.position,
        mesangeConfigs: config.mesangeConfigs,
        detectionThresholdSec: primaryRadar.config.detectionThresholdSec,
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
          <StepRadar
            radars={config.radars}
            canAddRadar={config.canAddRadar}
            onAddRadar={config.addRadar}
            onRemoveRadar={config.removeRadar}
            onSelectTemplate={config.selectRadarTemplate}
          />
        )}
        {stepper.current === 'settings' && (
          <StepRadarSettings radars={config.radars} onUpdateConfig={config.updateRadarConfig} />
        )}
        {stepper.current === 'position' && (
          <StepPosition site={site} radars={config.radars} onPlaceRadar={config.placeRadar} />
        )}
        {stepper.current === 'trajectories' && (
          <StepThreats
            site={site}
            radars={config.radars}
            king={king}
            onSetAzimut={(deg) => config.updateMesangeConfig(king.id, { azimuthDeg: deg })}
            onChange={(patch) => config.updateMesangeConfig(king.id, patch)}
          />
        )}
        {stepper.current === 'launch' && (
          <StepLaunch
            site={site}
            radars={config.radars}
            mesangeConfigs={config.mesangeConfigs}
            saveStatus={status}
            violations={validation.violations}
            canLaunch={canLaunch}
            onSave={() => save(primaryRadar.config, config.mesangeConfigs, primaryRadar.config.detectionThresholdSec)}
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
