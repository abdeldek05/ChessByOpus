import type {
  TelemetryModel,
  TelemetryContext,
  TelemetrySection,
  AlertLevel,
} from '@/components/sections/Lancement/telemetry.types'

const PHASE_LABEL: Record<TelemetryContext['phase'], string> = {
  armed: 'EN ATTENTE',
  countdown: 'DÉCOMPTE',
  igniting: 'ALLUMAGE',
  flight: 'MENACE EN VOL',
  running: 'ANALYSE',
  done: 'MISSION CLOSE',
  error: 'ANOMALIE',
}

function formatElapsed(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `T+ ${mm}:${ss}`
}

/**
 * Modèle du HUD orienté SCÉNARIO DE DÉFENSE, réduit à l'essentiel : l'état live
 * de la menace, un statut de détection unique (détectée ou pas — pas de choix à
 * comparer), et la distance réelle fusée↔radar. Le PRÉAVIS (temps entre
 * acquisition et impact) reste la métrique clé. Fonction pure.
 */
export function buildTelemetry(ctx: TelemetryContext): TelemetryModel {
  const { phase, radarName, elapsedSec, altitudeKm, radarDistanceKm, speedMs, detected, detectionRangeKm, leadTimeSec } = ctx

  const engaged = phase === 'flight' || phase === 'running' || phase === 'done'
  const radarOnline = phase !== 'error'

  const sections: TelemetrySection[] = [
    {
      title: 'MENACE',
      rows: [
        { kind: 'stat', label: 'Altitude', value: engaged ? `${altitudeKm.toFixed(1)} km` : '—', alert: 'ok' },
        { kind: 'stat', label: 'Vitesse', value: engaged ? `${Math.round(speedMs)} m/s` : '—', alert: 'ok' },
      ],
    },
    {
      title: 'DÉTECTION',
      rows: [
        {
          kind: 'badge',
          label: 'Statut',
          value: detected ? 'DÉTECTÉE' : engaged ? 'NON DÉTECTÉE' : 'EN ATTENTE',
          alert: !engaged ? 'ok' : detected ? 'ok' : 'warn',
        },
        {
          kind: 'stat',
          label: 'Distance d’acquisition',
          value: detectionRangeKm !== null ? `${detectionRangeKm.toFixed(1)} km` : '—',
          alert: 'ok',
        },
        {
          kind: 'stat',
          label: 'Préavis avant impact',
          value: leadTimeSec !== null ? `${Math.round(leadTimeSec)} s` : '—',
          alert: leadTimeSec !== null && leadTimeSec < 20 ? 'crit' : 'ok',
        },
      ],
    },
    {
      title: 'RADAR',
      rows: [
        {
          kind: 'stat',
          label: `Distance fusée ↔ ${radarName}`,
          value: engaged ? `${radarDistanceKm.toFixed(1)} km` : '—',
          alert: 'ok',
        },
        {
          kind: 'stat',
          label: 'Chrono mission',
          value: engaged ? formatElapsed(elapsedSec) : 'T+ 00:00',
          alert: 'ok',
        },
      ],
    },
  ]

  const anomalies = sections
    .flatMap((section) => section.rows)
    .filter((row): row is Extract<typeof row, { alert: AlertLevel }> => 'alert' in row)
    .filter((row) => row.alert !== 'ok').length

  return {
    header: {
      anomalies,
      systemHealthy: radarOnline,
      phaseLabel: PHASE_LABEL[phase],
    },
    sections,
  }
}
