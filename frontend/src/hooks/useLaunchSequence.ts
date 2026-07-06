import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { launchSimulation } from '@/lib/api'
import { computeBallisticProfile, sampleBallistic } from '@/lib/ballistics'
import { TIME_SCALE, METERS_PER_UNIT } from '@/three/constants/trajectory'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { SceneOffset } from '@/lib/computeRadarSceneOffset'

export type LaunchPhase = 'armed' | 'countdown' | 'igniting' | 'flight' | 'running' | 'done' | 'error'

interface UseLaunchSequenceParams {
  scenarioId: number
  radarPosition: RadarPosition
  radarOffset: SceneOffset
  radarRangeKm: number
  /** Menace principale suivie (azimut, inclinaison). */
  primary: MesangeLaunchConfig
}

export interface ThreatStats {
  /** Chrono mission simulé (s). */
  elapsedSec: number
  /** Altitude de la menace (km). */
  altitudeKm: number
  /** Distance oblique menace → zone défendue/radar (km). */
  distanceKm: number
  /** Vitesse de la menace (m/s). */
  speedMs: number
  /** Menace actuellement dans la portée radar. */
  detected: boolean
  /** Distance à la première acquisition (km), null tant que non détectée. */
  detectionRangeKm: number | null
  /** Préavis : temps entre acquisition et impact (s), null tant que non détectée. */
  leadTimeSec: number | null
}

const EMPTY_STATS: ThreatStats = {
  elapsedSec: 0,
  altitudeKm: 0,
  distanceKm: 0,
  speedMs: 0,
  detected: false,
  detectionRangeKm: null,
  leadTimeSec: null,
}

interface UseLaunchSequenceResult {
  phase: LaunchPhase
  countdown: number
  message: string
  /** Début de vol (performance.now) ; null au sol. Lu par la fusée + la caméra. */
  startRef: React.RefObject<number | null>
  stats: ThreatStats
  launch: () => void
  /** Réarme le scénario pour le rejouer depuis le début. */
  replay: () => void
}

const COUNTDOWN_START = 3
const HUD_TICK_MS = 200

/**
 * Séquence de lancement à horloge unique. Décompte → allumage → vol de la
 * menace, suivie par la caméra. Un tick léger (5 Hz) recalcule les infos utiles
 * au scénario côté défense : position/vitesse de la menace, et surtout la
 * DÉTECTION radar (acquise ou non, distance d'acquisition, PRÉAVIS avant impact
 * — la vraie métrique d'un test de défense). `replay` réarme tout.
 */
export function useLaunchSequence({
  scenarioId,
  radarPosition,
  radarOffset,
  radarRangeKm,
  primary,
}: UseLaunchSequenceParams): UseLaunchSequenceResult {
  const [phase, setPhase] = useState<LaunchPhase>('armed')
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [message, setMessage] = useState('Ordre de tir requis')
  const [stats, setStats] = useState<ThreatStats>(EMPTY_STATS)

  const startRef = useRef<number | null>(null)
  const detectionSecRef = useRef<number | null>(null)
  const detectionRangeRef = useRef<number | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const hudTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const igniteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(
    () => ({ azimuthDeg: primary.azimuthDeg, inclinationDeg: primary.inclinationDeg }),
    [primary.azimuthDeg, primary.inclinationDeg],
  )
  const profile = useMemo(() => computeBallisticProfile(params), [params])

  const clearTimers = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    if (hudTimer.current) clearInterval(hudTimer.current)
    if (igniteTimer.current) clearTimeout(igniteTimer.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const runSimulation = useCallback(() => {
    setPhase('running')
    setMessage('Consolidation détection…')
    launchSimulation({ scenarioId, radarPosition })
      .then((result) => {
        if (result.status === 'failed') {
          setPhase('error')
          setMessage(result.error ?? 'Échec de la mission')
        } else {
          setPhase('done')
          setMessage(
            result.status === 'ready' ? 'Mission résolue' : 'Séquence jouée · simulation à venir',
          )
        }
      })
      .catch(() => {
        setPhase('error')
        setMessage('Serveur de simulation injoignable')
      })
  }, [scenarioId, radarPosition])

  const startFlight = useCallback(() => {
    setPhase('flight')
    setMessage('Poursuite de la menace')
    startRef.current = performance.now()

    hudTimer.current = setInterval(() => {
      const start = startRef.current
      if (start === null) return
      const t = ((performance.now() - start) / 1000) * TIME_SCALE

      if (t > profile.flightTimeSec) {
        if (hudTimer.current) clearInterval(hudTimer.current)
        runSimulation()
        return
      }

      const s = sampleBallistic(t, params)
      const dx = s.x - radarOffset.x
      const dz = s.z - radarOffset.z
      const distanceKm = (Math.hypot(dx, s.y, dz) * METERS_PER_UNIT) / 1000
      const detected = distanceKm <= radarRangeKm

      if (detected && detectionSecRef.current === null) {
        detectionSecRef.current = t
        detectionRangeRef.current = distanceKm
      }

      const detectionSec = detectionSecRef.current
      setStats({
        elapsedSec: t,
        altitudeKm: s.altitudeM / 1000,
        distanceKm,
        speedMs: s.speedMs,
        detected,
        detectionRangeKm: detectionRangeRef.current,
        leadTimeSec: detectionSec === null ? null : profile.flightTimeSec - detectionSec,
      })
    }, HUD_TICK_MS)
  }, [params, profile.flightTimeSec, radarOffset, radarRangeKm, runSimulation])

  const launch = useCallback(() => {
    if (phase !== 'armed') return
    setPhase('countdown')
    let value = COUNTDOWN_START
    setCountdown(value)
    setMessage('Séquence de tir engagée')
    countdownTimer.current = setInterval(() => {
      value -= 1
      setCountdown(value)
      if (value <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current)
        setPhase('igniting')
        setMessage('Allumage moteur')
        igniteTimer.current = setTimeout(startFlight, 800)
      }
    }, 1000)
  }, [phase, startFlight])

  const replay = useCallback(() => {
    clearTimers()
    startRef.current = null
    detectionSecRef.current = null
    detectionRangeRef.current = null
    setCountdown(COUNTDOWN_START)
    setStats(EMPTY_STATS)
    setMessage('Ordre de tir requis')
    setPhase('armed')
  }, [clearTimers])

  return { phase, countdown, message, startRef, stats, launch, replay }
}
