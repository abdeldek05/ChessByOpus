import type { DetectionStatus } from '@/hooks/useDetectionStatus'

interface DetectionStatusHudProps {
  status: DetectionStatus | null
  /** Nombre de radars posés — un seul radar : on omet "— radar N" (inutile
   *  à préciser quand il n'y a pas de choix). */
  radarCount: number
}

/** Message par cause de perte (voir CoverageReason) — la raison EXACTE en
 *  clair, pour que l'utilisateur comprenne le décrochage au lieu de deviner. */
const REASON_LABEL: Record<string, string> = {
  'cone-of-silence': 'Cone of silence — too high, too close',
  'below-horizon-mask': 'Below the radar horizon',
  'above-ceiling': 'Above radar ceiling',
  'out-of-range': 'Out of range',
}

/**
 * Bandeau HUD live (esprit CorridorLegend/hud-holo) : nomme en direct POURQUOI
 * le Roi est vu ou perdu — « TRACKED — RADAR 1 » en vert d'accroche, ou
 * « LOST — CONE OF SILENCE » en alerte. Alimenté par useDetectionStatus (une
 * boucle rAF dédiée, pas de re-render à 60fps). Rendu pur, aucun état propre.
 */
export function DetectionStatusHud({ status, radarCount }: DetectionStatusHudProps) {
  if (!status) return null

  const radarSuffix = radarCount > 1 ? ` — RADAR ${status.radarIndex + 1}` : ''

  return (
    <div className="hud-holo pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${status.visible ? 'bg-accent-bright animate-pulse' : 'bg-alert'}`} />
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase">
          <span className={status.visible ? 'text-accent-bright' : 'text-alert'}>
            {status.visible ? 'TRACKED' : 'LOST'}
          </span>
          {status.visible ? (
            <span className="text-ink-dim">{radarSuffix}</span>
          ) : (
            <span className="text-ink-dim"> — {REASON_LABEL[status.reason]}</span>
          )}
        </p>
      </div>
    </div>
  )
}
