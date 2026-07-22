import { MissionThreatMap } from '../MissionThreatMap'
import { ThreatCountStep } from '../ThreatCountStep'
import { ThreatConfigBar } from '../ThreatConfigBar'
import { useThreatWizard } from '@/hooks/useThreatWizard'
import { MAX_MESANGE_COUNT } from '@/stores/scenarioStore'
import type { LaunchSite } from '@/types/simulation.types'
import type { MesangeLaunchConfig, PlacedRadar } from '@/types/mission.types'

interface StepThreatsProps {
  site: LaunchSite
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  onAddMesange: () => void
  onRemoveMesange: (id: string) => void
  onUpdateMesange: (id: string, patch: Partial<MesangeLaunchConfig>) => void
}

/**
 * Étape Menaces : la carte EST l'écran (plein espace, pas de colonne
 * latérale qui lui dispute la place ni ne déborde) — tous les cônes de la
 * flotte y sont saisissables/tournables en permanence (voir
 * MissionThreatMap), l'azimut ne se règle QUE là. Un assistant séquentiel
 * évite d'afficher toute la flotte d'un coup ("over communication" — retour
 * client) : d'abord choisir COMBIEN de Mesanges (1 Roi obligatoire +
 * Dames/Pions en option, max 5, superposé sur la carte), puis les configurer
 * UNE À LA FOIS (rôle, élévation, délai de tir) dans un bandeau ancré en bas.
 * Attraper un cône sur la carte sélectionne aussi sa Mesange dans le bandeau
 * — carte et assistant restent synchronisés dans les deux sens.
 */
export function StepThreats({
  site,
  radars,
  mesangeConfigs,
  onAddMesange,
  onRemoveMesange,
  onUpdateMesange,
}: StepThreatsProps) {
  const wizard = useThreatWizard({ mesangeConfigs, onAddMesange, onRemoveMesange })

  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-surface shadow-xl shadow-black/30">
      <MissionThreatMap
        site={site}
        radars={radars}
        mesangeConfigs={mesangeConfigs}
        selectedId={wizard.current.id}
        selectedAzimuthDeg={wizard.current.azimuthDeg}
        onSetAzimut={(id, deg) => onUpdateMesange(id, { azimuthDeg: deg })}
        onSelect={wizard.selectMesange}
      />

      {wizard.phase === 'count' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <ThreatCountStep current={mesangeConfigs.length} onChoose={wizard.setCount} />
          </div>
        </div>
      ) : (
        <ThreatConfigBar
          configs={mesangeConfigs}
          selected={wizard.current}
          selectedIndex={wizard.currentIndex}
          canAdd={mesangeConfigs.length < MAX_MESANGE_COUNT}
          canRemove={mesangeConfigs.length > 1}
          kingTakenElsewhere={mesangeConfigs.some((m) => m.role === 'KING' && m.id !== wizard.current.id)}
          onSelect={wizard.selectMesange}
          onAdd={onAddMesange}
          onChange={(patch) => onUpdateMesange(wizard.current.id, patch)}
          onBackToCount={wizard.backToCount}
          onRemove={() => onRemoveMesange(wizard.current.id)}
        />
      )}
    </div>
  )
}
