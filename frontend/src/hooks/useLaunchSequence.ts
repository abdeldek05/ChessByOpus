import { useCallback, useEffect, useRef, useState } from 'react'
import { BALLISTIC_FLIGHT_DURATION_SEC, BALLISTIC_DEBRIS_LINGER_SEC } from '@/lib/ballisticTrajectory'
import { computeDetection } from '@/lib/computeDetection'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult } from '@/types/missionResult.types'

export type LaunchPhase = 'armed' | 'countdown' | 'igniting' | 'running' | 'done' | 'error'

interface UseLaunchSequenceParams {
  site: LaunchSite
  radars: { config: RadarConfig; position: RadarPosition | null }[]
  mesangeConfigs: MesangeLaunchConfig[]
}

interface UseLaunchSequenceResult {
  phase: LaunchPhase
  countdown: number
  message: string
  /** Bilan de mission une fois la simulation terminée ; null sinon/en attente. */
  result: MissionResult | null
  launch: () => void
  /** Réarme le scénario pour le relancer. */
  replay: () => void
}

const COUNTDOWN_START = 3

/**
 * Séquence de lancement (coquille prête pour le back). Décompte → allumage →
 * appel de la simulation (modèle radar à venir) → résultat. Il n'y a plus de
 * vol simulé côté front : la vraie trajectoire (RocketPy) et la détection
 * (modèle radar JS) viendront du back, et alimenteront le bilan. `replay`
 * réarme tout.
 */
export function useLaunchSequence({ site, radars, mesangeConfigs }: UseLaunchSequenceParams): UseLaunchSequenceResult {
  const [phase, setPhase] = useState<LaunchPhase>('armed')
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<MissionResult | null>(null)

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const igniteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    if (igniteTimer.current) clearTimeout(igniteTimer.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const runSimulation = useCallback(() => {
    setPhase('running')
    setMessage('Simulation in progress…')
    // Verdict calculé CÔTÉ FRONT (modèle de détection autonome, pas de backend) :
    // détecté / trop tard / manqué selon portée, plafond et seuil des radars.
    // On laisse l'animation de vol + impact + débris se jouer avant d'afficher.
    const animMs = (BALLISTIC_FLIGHT_DURATION_SEC + BALLISTIC_DEBRIS_LINGER_SEC) * 1000
    igniteTimer.current = setTimeout(() => {
      const mission = computeDetection(site, radars, mesangeConfigs)
      setResult(mission)
      setPhase('done')
      setMessage('Results available')
    }, animMs)
  }, [site, radars, mesangeConfigs])

  const launch = useCallback(() => {
    if (phase !== 'armed') return
    setPhase('countdown')
    let value = COUNTDOWN_START
    setCountdown(value)
    countdownTimer.current = setInterval(() => {
      value -= 1
      setCountdown(value)
      if (value <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current)
        setPhase('igniting')
        igniteTimer.current = setTimeout(runSimulation, 800)
      }
    }, 1000)
  }, [phase, runSimulation])

  const replay = useCallback(() => {
    clearTimers()
    setCountdown(COUNTDOWN_START)
    setMessage('')
    setResult(null)
    setPhase('armed')
  }, [clearTimers])

  return { phase, countdown, message, result, launch, replay }
}
