import { BilanRow } from '../Lancement/BilanRow'
import type { MissionResult } from '@/types/missionResult.types'

interface AnalyticsVerdictProps {
  result: MissionResult | null
  /** Seuil de préavis exigé par le scénario (s). */
  requiredLeadSec: number
}

/** Verdict réseau → libellé et teinte. */
const VERDICT = {
  detected: { label: 'Detected in time', tone: 'text-accent-bright' },
  late: { label: 'Detected too late', tone: 'text-warning' },
  missed: { label: 'Never detected', tone: 'text-alert' },
  unknown: { label: 'No data', tone: 'text-ink-dim' },
} as const

/**
 * Verdict de RÉSEAU du scénario : le Roi a-t-il été accroché à temps par au moins
 * un radar ? C'est la conclusion de la mission, celle qui répond « la défense
 * a-t-elle tenu ». Le détail par radar (voir RadarResultCard) explique ensuite
 * lequel a fait le travail.
 */
export function AnalyticsVerdict({ result, requiredLeadSec }: AnalyticsVerdictProps) {
  const verdict = VERDICT[result?.verdict ?? 'unknown']

  return (
    <article className="hud-plate clip-corner-14 p-4">
      <p className="type-eyebrow text-ink-dim">
        Network verdict
      </p>
      <p className={`mt-1 mb-3 text-lg tracking-wide ${verdict.tone}`}>{verdict.label}</p>

      <BilanRow
        label="Lead time"
        value={result?.leadTimeSec != null ? `${result.leadTimeSec} s` : '—'}
        tint={result?.verdict === 'detected' ? 'accent' : 'warn'}
      />
      <BilanRow label="Required" value={`${requiredLeadSec} s`} />
      <BilanRow
        label="Threats detected"
        value={result ? `${result.detectedCount ?? 0} / ${result.totalThreats}` : '—'}
      />
      <BilanRow
        label="Acquisition"
        value={result?.acquisitionDistanceKm != null ? `${result.acquisitionDistanceKm} km` : '—'}
      />

      {result?.cause && (
        <p className="mt-3 border-t border-accent-bright/10 pt-3 text-label leading-relaxed text-ink-dim">
          {result.cause}
        </p>
      )}
    </article>
  )
}
