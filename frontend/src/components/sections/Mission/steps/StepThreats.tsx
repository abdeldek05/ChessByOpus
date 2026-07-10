import { MissionThreatMap } from '../MissionThreatMap'
import { HudRange } from '../HudRange'
import { InclinationControl } from '../InclinationControl'
import type { LaunchSite } from '@/types/simulation.types'
import type { MesangeLaunchConfig, PlacedRadar } from '@/types/mission.types'

interface StepThreatsProps {
  site: LaunchSite
  radars: PlacedRadar[]
  /** La menace principale (Roi) — une seule pour l'instant. */
  king: MesangeLaunchConfig
  onSetAzimut: (deg: number) => void
  onChange: (patch: Partial<MesangeLaunchConfig>) => void
}

/**
 * Étape Menaces (Roi seul pour l'instant). Le pas de tir est fixe (= le site) ;
 * on oriente le tir en cliquant sur la carte — un cône fin suit l'azimut.
 * L'inclinaison (curseur) allonge/raccourcit le cône ; le délai T+ est réglable.
 * La Dame et les Pions viendront ensuite.
 */
export function StepThreats({ site, radars, king, onSetAzimut, onChange }: StepThreatsProps) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 lg:flex-row">
      <div className="min-h-[52vh] flex-1 overflow-hidden rounded-3xl bg-surface shadow-xl shadow-black/30">
        <MissionThreatMap
          site={site}
          radars={radars}
          azimuthDeg={king.azimuthDeg}
          inclinationDeg={king.inclinationDeg}
          onSetAzimut={onSetAzimut}
        />
      </div>

      <div className="w-full shrink-0 space-y-4 lg:w-72">
        <div className="rounded-3xl bg-surface p-6">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.22em] text-danger uppercase">King</p>
          <p className="mb-5 text-sm text-ink-dim">Main threat</p>

          <div className="space-y-6">
            <HudRange
              label="Azimuth"
              value={king.azimuthDeg}
              min={0}
              max={360}
              unit="°"
              onChange={(v) => onSetAzimut(v)}
            />
            <InclinationControl
              value={king.inclinationDeg}
              onChange={(v) => onChange({ inclinationDeg: v })}
            />
            <HudRange
              label="Firing delay"
              value={king.launchDelaySec}
              min={0}
              max={120}
              unit="s"
              onChange={(v) => onChange({ launchDelaySec: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
