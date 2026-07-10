import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateFlight, type FlightData } from '@/lib/api'
import { computeDetection } from '@/lib/computeDetection'
import { TIME_SCALE, LIFTOFF_REAL_SEC, LIFTOFF_TIME_SCALE } from '@/three/constants/flightPlayback'

/** Durée d'animation (s) pour un vol de `flightSec` réel : décollage ralenti + reste accéléré. */
function playbackDurationSec(flightSec: number): number {
  const liftoffAnim = LIFTOFF_REAL_SEC / LIFTOFF_TIME_SCALE
  const rest = Math.max(0, flightSec - LIFTOFF_REAL_SEC) / TIME_SCALE
  return liftoffAnim + rest
}
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult } from '@/types/missionResult.types'

export type LaunchPhase = 'armed' | 'countdown' | 'running' | 'done' | 'error'

interface UseLaunchSequenceParams {
  site: LaunchSite
  radars: { config: RadarConfig; position: RadarPosition | null }[]
  mesangeConfigs: MesangeLaunchConfig[]
  /** Menace principale (Roi) : azimut + élévation envoyés à RocketPy. */
  king: MesangeLaunchConfig | undefined
  /** Température du site (météo) → densité de l'air côté simu. */
  temperatureC?: number
}

interface UseLaunchSequenceResult {
  phase: LaunchPhase
  countdown: number
  message: string
  /** Bilan de mission une fois la simulation terminée ; null sinon. */
  result: MissionResult | null
  /** Vraie trajectoire RocketPy à animer (null tant que non calculée). */
  flight: FlightData | null
  launch: () => void
  /** Réarme le scénario pour le relancer. */
  replay: () => void
}

const COUNTDOWN_START = 3

/**
 * Séquence de lancement branchée sur la VRAIE simulation RocketPy. Au clic :
 * décompte de 3 s pendant lequel le backend calcule le vol (POST /simulate) —
 * le calcul est souvent prêt avant la fin du décompte, donc sans attente
 * ressentie. La trajectoire reçue alimente l'animation (phase 'running') ; à la
 * fin, la détection radar est calculée sur cette vraie trajectoire → bilan. En
 * cas d'échec backend, phase 'error' avec message clair (pas de faux résultat).
 */
export function useLaunchSequence({
  site,
  radars,
  mesangeConfigs,
  king,
  temperatureC,
}: UseLaunchSequenceParams): UseLaunchSequenceResult {
  const [phase, setPhase] = useState<LaunchPhase>('armed')
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<MissionResult | null>(null)
  const [flight, setFlight] = useState<FlightData | null>(null)

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const launch = useCallback(() => {
    if (phase !== 'armed' || !king) return
    setPhase('countdown')
    setMessage('Simulation in progress…')

    // 1) Lance RocketPy EN FOND, dès le clic (calcul masqué par le décompte).
    const simPromise = simulateFlight({
      latitude: site.latitude,
      longitude: site.longitude,
      elevationDeg: king.inclinationDeg,
      azimuthDeg: king.azimuthDeg,
      siteElevationM: site.elevation,
      temperatureC,
    }).catch(() => ({ status: 'failed' as const, error: 'Backend unreachable' }))

    // 2) Décompte visuel en parallèle.
    let value = COUNTDOWN_START
    setCountdown(value)
    countdownTimer.current = setInterval(() => {
      value -= 1
      setCountdown(value)
      if (value <= 0 && countdownTimer.current) {
        clearInterval(countdownTimer.current)
      }
    }, 1000)

    // 3) Décompte fini ET simu prête → on anime la vraie trajectoire.
    const countdownDone = new Promise<void>((r) => setTimeout(r, COUNTDOWN_START * 1000))
    Promise.all([simPromise, countdownDone]).then(([sim]) => {
      if (sim.status === 'failed' || !sim.flight) {
        setPhase('error')
        setMessage(sim.error ?? 'Simulation unavailable')
        return
      }
      const flightData = sim.flight
      setFlight(flightData)
      setPhase('running')
      setMessage('')

      // 4) Anim de la trajectoire (temps réel joué en accéléré, décollage
      //    ralenti — pas les ~160 s réelles) puis détection + bilan.
      const playbackMs = playbackDurationSec(flightData.flightTimeSec) * 1000
      setTimeout(() => {
        const mission = computeDetection(site, radars, mesangeConfigs, flightData)
        setResult(mission)
        setPhase('done')
      }, playbackMs)
    })
  }, [phase, king, site, radars, mesangeConfigs, temperatureC])

  const replay = useCallback(() => {
    clearTimers()
    setCountdown(COUNTDOWN_START)
    setMessage('')
    setResult(null)
    setFlight(null)
    setPhase('armed')
  }, [clearTimers])

  return { phase, countdown, message, result, flight, launch, replay }
}
