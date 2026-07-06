import type { LaunchPhase } from '@/hooks/useLaunchSequence'

// Modèle de données du HUD (style « status board »), vue DÉFENSE : détection
// radar et état mission — aucune télémétrie interne de l'engin (le client n'en
// a pas besoin). Découplé du rendu, pilotable par la phase et les stats.

export type AlertLevel = 'ok' | 'warn' | 'crit'

export interface TelemetryBadgeRow {
  kind: 'badge'
  label: string
  /** Statut unique affiché (ex. « DÉTECTÉE »), pas un choix à deux options. */
  value: string
  alert: AlertLevel
}

export interface TelemetryStatRow {
  kind: 'stat'
  label: string
  /** Grande valeur mise en avant (ex. « 12,4 km »). */
  value: string
  alert: AlertLevel
}

export type TelemetryRow = TelemetryBadgeRow | TelemetryStatRow

export interface TelemetrySection {
  title: string
  rows: TelemetryRow[]
}

export interface TelemetryHeader {
  anomalies: number
  systemHealthy: boolean
  phaseLabel: string
}

export interface TelemetryModel {
  header: TelemetryHeader
  sections: TelemetrySection[]
}

export interface TelemetryContext {
  phase: LaunchPhase
  radarName: string
  /** État live de la menace + détection radar (issus de la séquence). */
  elapsedSec: number
  altitudeKm: number
  /** Distance en temps réel entre la fusée et le radar (km). */
  radarDistanceKm: number
  speedMs: number
  detected: boolean
  detectionRangeKm: number | null
  leadTimeSec: number | null
}
