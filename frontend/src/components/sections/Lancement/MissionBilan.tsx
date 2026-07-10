import { BilanRow } from './BilanRow'
import type { MissionResult, MissionVerdict } from '@/types/missionResult.types'
import type { MesangeRole } from '@/types/mission.types'

interface MissionBilanProps {
  result: MissionResult | null
  siteName: string
  radarName: string
  /** Seuil de préavis de détection requis (s), fixé par le client au scénario. */
  requiredLeadSec: number
  /** Relance le scénario avec la MÊME configuration (réarme la séquence). */
  onReplay: () => void
}

const ROLE_LABEL: Record<MesangeRole, string> = { KING: 'King', QUEEN: 'Queen', PAWN: 'Pawns' }

const VERDICT_DISPLAY: Record<MissionVerdict, { title: string; tint: string }> = {
  detected: { title: 'KING DETECTED IN TIME ✓', tint: 'text-success' },
  late: { title: 'DETECTED TOO LATE ✗', tint: 'text-danger' },
  missed: { title: 'KING NOT DETECTED ✗', tint: 'text-danger' },
  unknown: { title: 'PENDING', tint: 'text-ink-dim' },
}

// Valeur nullable → texte affiché (« — » tant que le moteur radar ne l'a pas produite).
const sec = (v: number | null) => (v === null ? '—' : `${Math.round(v)} s`)
const km = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)} km`)
const tPlus = (v: number | null) => (v === null ? '—' : `T+ ${Math.round(v)} s`)

const CLIP = 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'

/**
 * Bilan de mission post-simulation — le livrable exploitable. Deux choses qui
 * comptent : le VERDICT (préavis obtenu vs seuil requis → réussi/raté + marge)
 * et le DIAGNOSTIC (coût des leurres, cause). Tant que le moteur radar n'existe
 * pas, `result` est null et tout s'affiche « — » avec la mention correspondante.
 */
export function MissionBilan({ result, siteName, radarName, requiredLeadSec, onReplay }: MissionBilanProps) {
  const verdict = result?.verdict ?? 'unknown'
  const display = VERDICT_DISPLAY[verdict]

  const lead = result?.leadTimeSec ?? null
  const margin = lead !== null ? lead - requiredLeadSec : null
  const marginText =
    margin === null ? null : `Margin ${margin >= 0 ? '+' : ''}${Math.round(margin)} s`
  const marginTint = margin === null ? 'text-white/50' : margin >= 0 ? 'text-success' : 'text-danger'

  return (
    <aside className="pointer-events-none absolute top-0 left-0 flex h-full w-[400px] max-w-[42vw] flex-col gap-4 bg-gradient-to-r from-black/80 via-black/55 to-transparent px-7 py-6 font-mono">
      {/* En-tête */}
      <div className="border-b border-white/10 pb-3">
        <p className="text-[10px] tracking-[0.24em] text-white/40 uppercase">Mission report</p>
        <p className="mt-1 text-sm text-white/80">
          {siteName} · {radarName}
        </p>
      </div>

      {/* Verdict */}
      <div className="border border-white/12 bg-black/40 px-5 py-4" style={{ clipPath: CLIP }}>
        <p className={`text-2xl leading-tight font-bold ${display.tint}`}>{display.title}</p>
        {verdict === 'unknown' ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
            Results produced by the radar engine (coming soon).
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-white/60">
            Lead time <span className="text-ink">{sec(lead)}</span> · Threshold{' '}
            <span className="text-ink">{sec(requiredLeadSec)}</span> ·{' '}
            <span className={marginTint}>{marginText ?? '—'}</span>
          </p>
        )}
      </div>

      {/* Détection */}
      <section>
        <h2 className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-white/85 uppercase">Detection</h2>
        <BilanRow label="Lead time obtained" value={sec(lead)} tint="accent" />
        <BilanRow label="Required threshold" value={sec(requiredLeadSec)} />
        <BilanRow label="Acquisition distance" value={km(result?.acquisitionDistanceKm ?? null)} />
        <BilanRow
          label="Threats detected"
          value={result?.detectedCount === undefined || result?.detectedCount === null ? '—' : `${result.detectedCount} / ${result.totalThreats}`}
        />
      </section>

      {/* Diagnostic */}
      <section>
        <h2 className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-white/85 uppercase">Diagnostics</h2>
        <BilanRow label="Detection possible from" value={tPlus(result?.firstPossibleDetectionSec ?? null)} />
        <BilanRow label="Decoy cost" value={sec(result?.decoyCostSec ?? null)} tint="warn" />
        {(result?.decoyBreakdown ?? []).map((d) => (
          <BilanRow key={d.role} label={ROLE_LABEL[d.role]} value={sec(d.costSec)} indent />
        ))}
        <div className="mt-2 border-t border-white/8 pt-2">
          <p className="text-[10px] tracking-[0.1em] text-white/40 uppercase">Cause</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/70">
            {result?.cause ?? '—'}
          </p>
        </div>
      </section>

      {/* Relance avec la MÊME configuration (site, radars, menaces inchangés). */}
      <button
        type="button"
        onClick={onReplay}
        className="pointer-events-auto mt-auto flex items-center justify-center gap-2 border border-accent-bright/40 bg-accent-bright/10 py-3 text-[11px] font-bold tracking-[0.24em] text-accent-bright uppercase transition-colors hover:bg-accent-bright/20"
        style={{ clipPath: CLIP }}
      >
        ⟳ Relaunch — same scenario
      </button>
    </aside>
  )
}
