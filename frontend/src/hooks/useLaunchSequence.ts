import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateFlight, type FlightData, type RadarSpec, type ThreatSpec } from '@/lib/api'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult } from '@/types/missionResult.types'

/** Caractéristiques COMPLÈTES des radars posés → payload du moteur de détection. */
function buildRadarSpecs(
  radars: { config: RadarConfig; position: RadarPosition | null }[],
): RadarSpec[] {
  return radars
    .filter((r) => r.position !== null)
    .map((r) => ({
      latitude: r.position!.latitude,
      longitude: r.position!.longitude,
      rangeKm: r.config.rangeKm,
      ceilingM: r.config.ceilingM,
      rotating: r.config.rotating,
      rotationRpm: r.config.rotationRpm ?? 40,
      minRcsM2: r.config.minDetectableRcsM2,
      antennaHeightM: r.config.antennaHeightM ?? 4,
      detectionThresholdSec: r.config.detectionThresholdSec ?? 30,
    }))
}

/** Menaces du scénario (Roi + leurres) → payload du moteur de détection. */
function buildThreatSpecs(mesangeConfigs: MesangeLaunchConfig[]): ThreatSpec[] {
  return mesangeConfigs.map((m) => ({
    role: m.role,
    azimuthDeg: m.azimuthDeg,
    launchDelaySec: m.launchDelaySec,
  }))
}

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
  /** Météo réelle (GFS) du site utilisée pour ce vol ; null tant que non calculée. */
  weather: FlightData['weather'] | null
  launch: () => void
  /** Réarme le scénario pour le relancer. */
  replay: () => void
  /** Signale l'impact RÉEL de la fusée (fin de la chute sur le relief 3D) :
   *  fait basculer 'running' → 'done'. Appelé depuis la scène (voir
   *  useTrajectoryPlayback/onImpact), jamais deviné par un minuteur — la durée
   *  RocketPy est calculée sur un sol plat virtuel, alors que l'impact réel
   *  dépend du relief 3D (bosses/creux) sous le point de chute, qui peut
   *  largement diverger : un minuteur fixe coupait le rendu de la fusée
   *  (`active=false`) avant ou après la fin réelle de sa chute affichée. */
  reportImpact: () => void
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
  const [weather, setWeather] = useState<FlightData['weather'] | null>(null)

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  // Bilan radar en attente de l'impact RÉEL (voir reportImpact) : calculé dès
  // que la simu répond, mais affiché seulement quand la fusée touche
  // effectivement le relief 3D — jamais avant, jamais après.
  const pendingDetection = useRef<MissionResult | null>(null)

  const clearTimers = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const launch = useCallback(() => {
    if (phase !== 'armed' || !king) return
    setPhase('countdown')
    setMessage('Simulation in progress…')

    // 1) Lance RocketPy + moteur radar EN FOND, dès le clic (masqué par le
    //    décompte) : trajectoire réelle ET détection physique en un appel.
    const simPromise = simulateFlight({
      latitude: site.latitude,
      longitude: site.longitude,
      elevationDeg: king.inclinationDeg,
      azimuthDeg: king.azimuthDeg,
      siteElevationM: site.elevation,
      temperatureC,
      radars: buildRadarSpecs(radars),
      threats: buildThreatSpecs(mesangeConfigs),
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
      setWeather(flightData.weather)
      setPhase('running')
      setMessage('')

      // 4) Anim de la trajectoire (temps réel joué en accéléré, décollage
      //    ralenti) ; le bilan vient du MOTEUR RADAR backend (modèle physique).
      // La transition 'running' → 'done' est déclenchée par reportImpact(),
      // appelé depuis la scène au moment de l'impact RÉEL sur le relief 3D —
      // pas par une durée devinée à l'avance (voir reportImpact).
      pendingDetection.current = sim.detection ?? null
    })
  }, [phase, king, site, radars, mesangeConfigs, temperatureC])

  const reportImpact = useCallback(() => {
    setResult(pendingDetection.current)
    setPhase('done')
  }, [])

  const replay = useCallback(() => {
    clearTimers()
    pendingDetection.current = null
    setCountdown(COUNTDOWN_START)
    setMessage('')
    setResult(null)
    setFlight(null)
    setWeather(null)
    setPhase('armed')
  }, [clearTimers])

  return { phase, countdown, message, result, flight, weather, launch, replay, reportImpact }
}
