import { BilanRow } from '../Lancement/BilanRow'
import type { RadarResult } from '@/types/missionResult.types'

interface RadarResultCardProps {
  radar: RadarResult
  /** Nombre total de menaces du scénario — dénominateur de « menaces vues ». */
  totalThreats: number
}

/** Verdict → libellé et teinte. Le vocabulaire est celui du bilan de mission. */
const VERDICT_LABEL: Record<RadarResult['verdict'], string> = {
  detected: 'Detected in time',
  late: 'Detected too late',
  missed: 'Never locked',
}

/**
 * Fiche de débrief d'UN radar : ce que CE radar aurait vu, seul. Le verdict de
 * mission reste celui du réseau (le Roi accroché à temps par au moins un radar) ;
 * cette fiche répond à l'autre question du défenseur — lequel de mes radars a
 * fait le travail, lequel est aveugle, et pourquoi.
 *
 * Chaque radar a son propre seuil de préavis et son propre coût de leurres (seuls
 * ceux qu'il détecte le distraient), donc les deux fiches d'un scénario ne sont
 * pas comparables ligne à ligne : chacune se lit contre SON seuil.
 */
export function RadarResultCard({ radar, totalThreats }: RadarResultCardProps) {
  const missed = radar.verdict === 'missed'
  const tint = radar.verdict === 'detected' ? 'accent' : radar.verdict === 'late' ? 'warn' : 'crit'

  return (
    <article className="hud-plate clip-corner-14 p-4">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-fine text-sm font-light tracking-label text-ink uppercase">{radar.name}</h3>
        <span
          className={`type-label-tight font-mono ${
            radar.verdict === 'detected'
              ? 'text-accent-bright'
              : radar.verdict === 'late'
                ? 'text-warning'
                : 'text-alert'
          }`}
        >
          {VERDICT_LABEL[radar.verdict]}
        </span>
      </header>

      {missed ? (
        // Radar aveugle : la RAISON physique est la seule information utile ici
        // (horizon terrestre, portée effective, plafond, cône de silence).
        <p className="text-label leading-relaxed text-ink-dim">
          {radar.blockReason ?? 'Never within radar coverage'}.
        </p>
      ) : (
        <>
          <BilanRow label="Lead time" value={`${radar.leadTimeSec} s`} tint={tint} />
          <BilanRow label="Required" value={`${radar.requiredLeadSec} s`} />
          <BilanRow label="Lock at" value={`T+ ${radar.detectedAtSec} s`} />
          <BilanRow label="Acquisition" value={`${radar.acquisitionDistanceKm} km`} />
        </>
      )}

      <div className="mt-3 border-t border-accent-bright/10 pt-3">
        <BilanRow label="Threats seen" value={`${radar.detectedCount} / ${totalThreats}`} />
        <BilanRow
          label="Decoy cost"
          value={`${radar.decoyCostSec} s`}
          tint={radar.decoyCostSec > 0 ? 'warn' : 'default'}
        />
        {radar.decoyBreakdown.map((cost) => (
          <BilanRow key={cost.role} label={cost.role} value={`${cost.costSec} s`} indent />
        ))}
      </div>
    </article>
  )
}
