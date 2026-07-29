import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateFlight, type FlightData } from '@/lib/api'
import { buildSimulatePayload } from '@/lib/buildSimulatePayload'
import { buildSimulationCacheKey } from '@/lib/simulationCacheKey'
import { useSimulationCacheStore } from '@/stores/simulationCacheStore'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'
import type { LaunchSite } from '@/types/simulation.types'
import type { MissionResult } from '@/types/missionResult.types'

export type LaunchPhase = 'armed' | 'countdown' | 'running' | 'done' | 'error'

interface UseLaunchSequenceParams {
  site: LaunchSite
  /** `id` inclus : il part au backend et revient dans le bilan par radar, ce qui
   *  évite de rattacher un résultat à son radar par son rang (voir RadarResult). */
  radars: { id: string; config: RadarConfig; position: RadarPosition | null }[]
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
  // Simulation VERROUILLÉE du tir en cours : un REPLAY doit rejouer exactement
  // le même vol, or le cache de prefetch sert la même clé en DEUX VAGUES
  // (atmosphère standard d'abord, météo GFS réelle ensuite, qui remplace
  // l'entrée). Sans ce verrou, relancer après l'arrivée de la vague GFS rejouait
  // une AUTRE trajectoire : sur un tir de référence, 45.8 km en standard contre
  // 43.8 km en GFS, soit ~2 km d'écart pour un scénario identique. On mémorise
  // donc la réponse effectivement jouée et on la réutilise au replay.
  const lockedSim = useRef<Awaited<ReturnType<typeof simulateFlight>> | null>(null)
  // Clé de scénario du verrou : le relâche si les réglages changent (voir launch).
  const lockedKey = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const launch = useCallback(() => {
    if (phase !== 'armed' || !king) return
    setPhase('countdown')
    setMessage('Simulation in progress…')

    // 1) Réutilise le résultat PRÉCALCULÉ (voir simulationCacheStore) si
    //    l'utilisateur a déjà quitté l'étape Threats avec ces mêmes réglages
    //    — le calcul RocketPy + météo GFS (~7 s) a alors déjà eu lieu pendant
    //    qu'il configurait la suite du scénario. Sinon (prefetch absent,
    //    payload changé depuis), on relance l'appel comme avant : le décompte
    //    de 3 s reste affiché dans tous les cas (effet dramatique voulu),
    //    seul le risque d'ATTENTE au-delà du décompte disparaît.
    //    Un REPLAY réutilise la simulation déjà jouée (lockedSim) sans repasser
    //    par le cache : c'est ce qui garantit une trajectoire IDENTIQUE d'un
    //    replay à l'autre, même si la vague GFS est arrivée entre-temps.
    const payload = buildSimulatePayload({ site, radars, mesangeConfigs, king, temperatureC })
    // Le verrou ne vaut que pour le scénario qui l'a produit : si les réglages
    // ont changé depuis (autre radar, autre azimut…), la clé diffère et on
    // recalcule au lieu de rejouer un vol qui ne correspond plus à l'écran.
    const key = payload ? buildSimulationCacheKey(payload) : null
    if (lockedSim.current && lockedKey.current !== key) lockedSim.current = null
    lockedKey.current = key

    const cached = payload ? useSimulationCacheStore.getState().get(payload) : null
    const source = lockedSim.current
      ? Promise.resolve(lockedSim.current)
      : (cached ?? (payload ? simulateFlight(payload) : Promise.reject()))
    const simPromise = source.catch(() => ({
      status: 'failed' as const,
      error: 'Backend unreachable',
    }))

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
      // Verrouille CETTE réponse : tous les replays suivants la rejoueront à
      // l'identique (voir lockedSim), au lieu de re-consulter un cache dont
      // l'entrée peut avoir changé de vague entre-temps.
      lockedSim.current = sim
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
    // `result`/`flight`/`weather` sont CONSERVÉS : ils décrivent le tir précédent
    // et restent le dernier bilan connu jusqu'à ce que le nouveau vol produise
    // le sien (voir reportImpact). Les remettre à null ici faisait disparaître
    // les résultats dès le clic sur Relaunch, alors que le nouveau tir n'a pas
    // encore de bilan à afficher — l'opérateur perdait la lecture de sa passe.
    // Le rendu de la scène ne s'appuie pas sur eux pour savoir s'il doit animer
    // (c'est `phase` qui le dit), donc les garder n'anime rien par erreur.
    setPhase('armed')
  }, [clearTimers])

  return { phase, countdown, message, result, flight, weather, launch, replay, reportImpact }
}
