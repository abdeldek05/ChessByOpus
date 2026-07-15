import { useMemo } from 'react'
import type { FlightData } from '@/lib/api'

export interface TelemetrySeries {
  /** Points (t, valeur) déjà triés par temps croissant. */
  points: { t: number; value: number }[]
  min: number
  max: number
}

export interface FlightTelemetrySeries {
  durationSec: number
  altitudeM: TelemetrySeries
  speedMs: TelemetrySeries
  eastM: TelemetrySeries
  northM: TelemetrySeries
  azimuthDeg: TelemetrySeries
  elevationDeg: TelemetrySeries
}

function buildSeries(points: { t: number; value: number }[]): TelemetrySeries {
  const values = points.map((p) => p.value)
  return { points, min: Math.min(...values), max: Math.max(...values) }
}

/**
 * Dérive les séries temporelles (altitude, vitesse, position, cap/élévation)
 * de la trajectoire RocketPy reçue, prêtes à tracer telles quelles (échelle
 * min/max déjà calculée par série — un graphique par grandeur, jamais deux
 * échelles sur un même axe).
 */
export function useFlightTelemetrySeries(flight: FlightData | null): FlightTelemetrySeries | null {
  return useMemo(() => {
    if (!flight || flight.trajectory.length < 2) return null
    const traj = flight.trajectory
    return {
      durationSec: flight.flightTimeSec,
      altitudeM: buildSeries(traj.map((p) => ({ t: p.t, value: p.z }))),
      speedMs: buildSeries(traj.map((p) => ({ t: p.t, value: p.v }))),
      eastM: buildSeries(traj.map((p) => ({ t: p.t, value: p.x }))),
      northM: buildSeries(traj.map((p) => ({ t: p.t, value: p.y }))),
      azimuthDeg: buildSeries(traj.map((p) => ({ t: p.t, value: p.azimuthDeg }))),
      elevationDeg: buildSeries(traj.map((p) => ({ t: p.t, value: p.elevationDeg }))),
    }
  }, [flight])
}
