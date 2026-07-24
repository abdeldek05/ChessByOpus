import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlightData } from '@/lib/api'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { toScene, realTimeFromAnim } from '@/lib/trajectoryPlayback'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import {
  LIFTOFF_REAL_SEC,
  BURN_TIME_SEC,
  FLYING_ROCKET_SCALE,
  SCALE_TRANSITION_SEC,
} from '@/three/constants/flightPlayback'

export type PlaybackPhase = 'flying' | 'broken'

// Rigidité du lissage d'orientation du nez (slerp) : haut = suit vite la
// tangente, bas = plus amorti. Indépendant du framerate via 1-exp(-k·dt).
const HEADING_STIFFNESS = 7

/** Interpolation Catmull-Rom d'un point de trajectoire À UN TEMPS DONNÉ.
 *
 *  Le cœur du réalisme gravitationnel : on interpole entre les points RocketPy
 *  par le TEMPS de vol (leur horodatage réel `times[]`), PAS par un paramètre
 *  d'arc de spline. Les points RocketPy encodent déjà la gravité (resserrés à
 *  l'apogée où la fusée ralentit, espacés près du sol où elle accélère) — en
 *  respectant leur timing, on reproduit EXACTEMENT cette cadence. L'ancienne
 *  version convertissait t en `u = index/(N-1)` puis appelait `curve.getPoint(u)`,
 *  mais la spline centripetal répartit `u` par LONGUEUR D'ARC, pas par index :
 *  décalage temps/position → la fusée « volait » à cadence quasi constante au
 *  lieu de subir la gravité, avec des à-coups. Catmull-Rom sur les 4 points
 *  encadrants (p0..p3) garde le lissage sans jamais osciller.
 *
 *  Écrit la position dans `out`. Fonction pure, zéro allocation (temporaires
 *  fournis par l'appelant). */
function samplePositionAtTime(
  positions: THREE.Vector3[],
  times: number[],
  t: number,
  out: THREE.Vector3,
): void {
  const n = positions.length
  // Segment [i-1, i] encadrant t (recherche linéaire, trajectoires courtes).
  let i = 1
  while (i < n && times[i] < t) i++
  const i1 = Math.min(i, n - 1)
  const i0 = i1 - 1
  const a = times[i0]
  const b = times[i1]
  const span = b - a || 1
  const f = Math.min(1, Math.max(0, (t - a) / span))

  // 4 points pour Catmull-Rom (bornés aux extrémités).
  const p0 = positions[Math.max(0, i0 - 1)]
  const p1 = positions[i0]
  const p2 = positions[i1]
  const p3 = positions[Math.min(n - 1, i1 + 1)]

  // Catmull-Rom uniforme composante par composante (f ∈ [0,1] dans [p1,p2]).
  const f2 = f * f
  const f3 = f2 * f
  out.set(
    catmullRom(p0.x, p1.x, p2.x, p3.x, f, f2, f3),
    catmullRom(p0.y, p1.y, p2.y, p3.y, f, f2, f3),
    catmullRom(p0.z, p1.z, p2.z, p3.z, f, f2, f3),
  )
}

/** Un axe de Catmull-Rom uniforme (f, f², f³ pré-calculés pour les 3 axes). */
function catmullRom(v0: number, v1: number, v2: number, v3: number, f: number, f2: number, f3: number): number {
  return (
    0.5 *
    (2 * v1 + (-v0 + v2) * f + (2 * v0 - 5 * v1 + 4 * v2 - v3) * f2 + (-v0 + 3 * v1 - 3 * v2 + v3) * f3)
  )
}

interface UseTrajectoryPlaybackParams {
  flight: FlightData | null
  active: boolean
  /** Origine scène (sommet de rampe) où démarre la trajectoire. */
  origin: THREE.Vector3
  /** Direction unitaire du nez au décollage (axe de la rampe inclinée/orientée) —
   *  le groupe de vol démarre exactement dans cette orientation, pas verticale
   *  par défaut, pour ne pas « sauter » par rapport à la pose statique. */
  initialDirection: THREE.Vector3
  /** Mètres réels → unités scène (map fixe, voir computeSceneScale). */
  metersPerSceneUnit: number
  /** @deprecated SANS EFFET depuis la refonte gravitationnelle : TOUTE mésange
   *  (Roi comme leurres) suit désormais sa trajectoire complète interpolée PAR
   *  LE TEMPS, de bout en bout (voir samplePositionAtTime). L'ancienne bascule
   *  PGRV maison à l'apogée — que ce flag activait/désactivait — a été
   *  supprimée : elle remplaçait la vraie chute RocketPy (déjà dans les données)
   *  par une approximation, ce qui faisait « voler » la fusée au lieu de la
   *  faire tomber. Paramètre conservé pour ne pas casser les appels existants. */
  useRealDescent?: boolean
  /** Durée de poussée (s) pilotant le panache (`thrusting`) — celle du Roi
   *  (BURN_TIME_SEC, 35.7s) par défaut (Roi ET Dame, qui rejoue son vol) ; à
   *  passer explicitement pour un PION, dont le burn est bien plus court
   *  (voir PAWN_BURN_TIME_SEC dans decoyTrajectory.ts) — sinon le panache
   *  resterait visuellement allumé bien après la fin réelle de sa poussée. */
  burnTimeSec?: number
  /** Multiplicateur appliqué à FLYING_ROCKET_SCALE — la Dame (leurre premium,
   *  doctrine CHESS) affiche une "grosse signature" plus proche du Roi que
   *  les Pions. Défaut 1 (échelle standard). */
  scaleMultiplier?: number
  /** Délai de mise à feu (s RÉELLES de scénario, PAS de temps d'animation
   *  accéléré) avant que cette mésange décolle réellement — même unité que
   *  `launchDelaySec` calculé côté backend (radar.py : `t_mission = p.t +
   *  delay_sec`), pour que le rendu visuel reste synchronisé avec la logique
   *  de détection qui tourne derrière. Défaut 0 (décolle avec le Roi). Tant
   *  que ce délai n'est pas écoulé, la mésange reste posée sur sa rampe,
   *  visuellement immobile — comme si elle attendait son tour. */
  launchDelaySec?: number
  /** Remontée de la position monde à chaque frame (caméra de suivi). */
  onFrame?: (position: THREE.Vector3, progress: number) => void
  /** Impact réel (fin de la chute physique sur le relief 3D) : signale la fin
   *  DU VOL RENDU — voir le commentaire sur `setPhase('broken')` plus bas. */
  onImpact?: () => void
}

interface UseTrajectoryPlaybackResult {
  groupRef: React.RefObject<THREE.Group | null>
  phase: PlaybackPhase
  /** Moteur en poussée (flammes) : vrai pendant le burn (temps de vol réel). */
  thrusting: React.RefObject<boolean>
  brokenElapsed: React.RefObject<number>
  /** Point d'impact posé AU RAS du relief (coords locales au groupe du pad). */
  impact: THREE.Vector3
  /** Vrai dès que ce vol a démarré une fois, indépendamment de `active` par la
   *  suite (voir le loquet `started` plus haut) — à utiliser pour la garde de
   *  rendu du composant appelant, PAS `active` directement (sinon la Mesange
   *  disparaît dès que `active` global repasse à `false`, ex. Roi atterri). */
  hasStarted: boolean
}

/**
 * Rejoue la VRAIE trajectoire RocketPy sur une SPLINE Catmull-Rom : position et
 * tangente parfaitement continues (fini les cassures entre échantillons), nez
 * lissé par slerp amorti, et AUCUNE allocation par frame (temporaires réutilisés
 * → pas de micro-saccades GC). Le temps réel est joué en accéléré (gravité
 * préservée), l'impact est posé au ras du relief. Bascule en 'broken' à la fin.
 */
export function useTrajectoryPlayback({
  flight,
  active,
  origin,
  initialDirection,
  metersPerSceneUnit,
  useRealDescent = false,
  burnTimeSec = BURN_TIME_SEC,
  scaleMultiplier = 1,
  launchDelaySec = 0,
  onFrame,
  onImpact,
}: UseTrajectoryPlaybackParams): UseTrajectoryPlaybackResult {
  const groupRef = useRef<THREE.Group>(null)
  const animElapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const thrusting = useRef(true)
  // Compteur de délai AVANT décollage (s réelles écoulées, PAS de temps
  // d'animation accéléré) : tant qu'il n'a pas atteint `launchDelaySec`,
  // `animElapsed` ne s'incrémente pas — la mésange reste posée, immobile.
  // Séparé d'`animElapsed` plutôt que d'inverser realTimeFromAnim (non
  // linéaire par morceaux, une inversion serait fragile) : plus simple et
  // robuste de compter le délai indépendamment, en temps réel non transformé.
  const delayElapsed = useRef(0)
  const [phase, setPhase] = useState<PlaybackPhase>('flying')
  // Loquet UNE FOIS DÉCLENCHÉ, reste vrai indépendamment de `active` par la
  // suite : `active` est partagé par TOUTE la flotte (voir LaunchSceneCanvas,
  // `flying` global) et repasse à `false` dès que le ROI atterrit — sans ce
  // loquet, un leurre encore en l'air (ou déjà posé) à ce moment-là disparaît
  // brutalement en même temps que le Roi au lieu de vivre sa propre durée de
  // vol. Se réarme au prochain vol via le même effet de reset (`flight` change).
  const started = useRef(false)
  if (active) started.current = true

  // Rejeu d'un scénario (replay) : `flight` reçoit une NOUVELLE trajectoire à
  // chaque lancement, mais ce hook reste monté en permanence (le composant
  // parent retourne juste `null` sans démonter) — sans ce reset, `phase` et
  // les compteurs restent bloqués sur l'état du vol PRÉCÉDENT (ex. 'broken'
  // + débris déjà explosés), et le nouveau vol démarre déjà cassé.
  useEffect(() => {
    animElapsed.current = 0
    brokenElapsed.current = 0
    delayElapsed.current = 0
    thrusting.current = true
    prevPos.current = null
    started.current = false
    setPhase('flying')
    // Orientation ET échelle INITIALES = pile la pose statique sur la rampe
    // (direction du fût, échelle 1) — sans ça la fusée « pop » d'un coup à la
    // verticale et à FLYING_ROCKET_SCALE dès la première frame de vol.
    const group = groupRef.current
    if (group) {
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), initialDirection)
      group.scale.setScalar(1)
    }
  }, [flight, initialDirection])

  // Temporaires réutilisés chaque frame (zéro allocation en régime permanent).
  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      desiredQuat: new THREE.Quaternion(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  )

  // Position à la frame PRÉCÉDENTE (unités scène) : sert à détecter le
  // franchissement du sol par SEGMENT plutôt que par position instantanée —
  // voir le clamp d'impact plus bas. `null` = pas encore de frame précédente
  // (première frame du vol, ou vient de rejouer).
  const prevPos = useRef<THREE.Vector3 | null>(null)

  // Pré-calcule les positions scène, les temps et l'impact au sol.
  const { positions, times, duration, impact } = useMemo(() => {
    if (!flight || flight.trajectory.length < 2) {
      return { positions: [] as THREE.Vector3[], times: [] as number[], duration: 0, impact: origin.clone() }
    }
    const positions = flight.trajectory.map((p) => toScene(p, origin, metersPerSceneUnit))
    const times = flight.trajectory.map((p) => p.t)

    // Impact posé AU RAS du sol (relief OU dalle béton) : le dernier point de
    // trajectoire est ramené à la hauteur du sol. `sampleSceneGround` renvoie
    // une hauteur en UNITÉS SCÈNE MONDE (même système que `origin`, qui est
    // local au groupe pad décalé de PAD_TOP_Y) — PAS des mètres réels, donc
    // AUCUNE division par `metersPerSceneUnit` ici (bug précédent : cette
    // division écrasait le relief d'un facteur ~10, variable selon la portée
    // du vol donc selon l'azimut/l'élévation — la fusée « cassait en l'air »
    // ou « traversait » le relief selon le scénario testé).
    const last = positions[positions.length - 1]
    const impact = last.clone()
    const groundWorldY = sampleSceneGround(impact.x + LAUNCH_CENTER[0], impact.z + LAUNCH_CENTER[2]) - PAD_TOP_Y
    impact.y = origin.y + groundWorldY

    return { positions, times, duration: flight.flightTimeSec, impact }
  }, [flight, origin, metersPerSceneUnit])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !started.current || positions.length < 2 || times.length < 2 || !flight) return

    if (phase === 'flying') {
      const dt = Math.min(delta, 0.05) // borne : pas de saut si lag

      // Délai de mise à feu (voir launchDelaySec) : tant qu'il n'est pas
      // écoulé, la mésange reste posée sur sa rampe — ni thrusting, ni
      // onFrame, ni avance de l'animation. Compté en secondes RÉELLES (pas
      // accélérées), cohérent avec le délai calculé côté backend (radar.py).
      if (delayElapsed.current < launchDelaySec) {
        delayElapsed.current += dt
        return
      }

      animElapsed.current += dt
      // Temps de vol réel correspondant (accéléré, décollage ralenti).
      const rawT = realTimeFromAnim(animElapsed.current)
      const t = Math.min(rawT, duration)

      // POSITION interpolée PAR LE TEMPS sur la vraie trajectoire (montée ET
      // descente, de bout en bout — voir samplePositionAtTime). Plus de bascule
      // PGRV à l'apogée : la trajectoire RocketPy contient déjà la vraie chute
      // (gravité + traînée jusqu'à l'atterrissage, backend simulate.py) — la
      // dupliquer par une intégration maison ne faisait que remplacer la vraie
      // physique par une approximation, d'où l'impression que la fusée
      // « volait ». `useRealDescent` n'a plus lieu d'être : tout le monde suit
      // sa trajectoire complète (paramètre conservé pour rétrocompat d'API).
      void useRealDescent
      samplePositionAtTime(positions, times, t, scratch.pos)

      // Tangente par différence temporelle avant/arrière (direction du vol
      // réel à cet instant) : oriente le nez. Prise sur un petit Δt pour
      // suivre la courbure sans bruit.
      const tAhead = Math.min(duration, t + 0.05)
      samplePositionAtTime(positions, times, tAhead, scratch.tangent)
      scratch.tangent.sub(scratch.pos)
      if (scratch.tangent.lengthSq() > 1e-9) {
        scratch.desiredQuat.setFromUnitVectors(scratch.up, scratch.tangent.normalize())
        group.quaternion.slerp(scratch.desiredQuat, 1 - Math.exp(-HEADING_STIFFNESS * dt))
      }
      group.position.copy(scratch.pos)

      thrusting.current = t <= burnTimeSec
      onFrame?.(scratch.pos, t / duration)

      // IMPACT PAR FRANCHISSEMENT DE SEGMENT : le relief 3D fBm est bosselé et
      // n'a aucun rapport avec le sol plat que RocketPy connaît — à grande
      // vitesse de chute, `pos` peut SAUTER par-dessus le sol d'une frame à
      // l'autre (la comparaison instantanée `pos.y <= groundLocalY` ne se
      // déclenche alors jamais → traverse). On teste donc le SEGMENT entre la
      // position précédente et la position courante contre le sol échantillonné
      // à SES DEUX BOUTS, et on interpole le point exact de franchissement
      // plutôt que de clamper sur `pos` telle quelle.
      //
      // PAS de division par `metersPerSceneUnit` ici : `sampleSceneGround`
      // renvoie une hauteur en UNITÉS SCÈNE MONDE, le même système que `origin`
      // (local au groupe pad, décalé de PAD_TOP_Y) — diviser en plus par
      // `metersPerSceneUnit` écrasait le relief perçu d'un facteur qui varie
      // avec la portée du vol (donc avec l'azimut/l'élévation choisis), ce qui
      // faisait dépendre le symptôme (casse en l'air / traverse) du scénario.
      const groundAt = (x: number, z: number) =>
        origin.y + sampleSceneGround(x + LAUNCH_CENTER[0], z + LAUNCH_CENTER[2]) - PAD_TOP_Y

      const prev = prevPos.current
      const groundLocalYAtPos = groundAt(scratch.pos.x, scratch.pos.z)

      if (rawT > LIFTOFF_REAL_SEC && prev) {
        const groundLocalYAtPrev = groundAt(prev.x, prev.z)
        const prevAboveGround = prev.y - groundLocalYAtPrev
        const currAboveGround = scratch.pos.y - groundLocalYAtPos

        if (prevAboveGround > 0 && currAboveGround <= 0) {
          // Franchissement détecté sur ce pas : interpolation linéaire du point
          // exact où la trajectoire croise le relief (au lieu de la position de
          // fin de frame, potentiellement déjà bien sous le sol à grande vitesse).
          const span = prevAboveGround - currAboveGround || 1
          const f = Math.min(1, Math.max(0, prevAboveGround / span))
          scratch.pos.lerpVectors(prev, scratch.pos, f)
          scratch.pos.y = groundAt(scratch.pos.x, scratch.pos.z)
          group.position.copy(scratch.pos)
          impact.copy(scratch.pos)
          setPhase('broken')
          onImpact?.()
          return
        }
        if (currAboveGround <= 0) {
          // Déjà sous le sol dès le premier test possible après le décollage
          // (rare, ex. reprise après un lag important) : clamp direct plutôt
          // que d'attendre un franchissement qui n'arrivera pas.
          scratch.pos.y = groundLocalYAtPos
          group.position.copy(scratch.pos)
          impact.copy(scratch.pos)
          setPhase('broken')
          onImpact?.()
          return
        }
      }

      // FILET DE SÉCURITÉ FIN DE TRAJECTOIRE : la trajectoire RocketPy atterrit
      // sur un sol PLAT à z=0, mais le relief 3D à ce point peut être en
      // CONTREBAS (vallée) — le franchissement de segment ne se déclenche alors
      // jamais et la fusée se figerait en l'air au dernier point, SANS fin de
      // scénario (onImpact jamais appelé). Dès qu'on a consommé toute la
      // trajectoire (rawT >= duration), on force donc l'atterrissage au ras du
      // relief sous le dernier point.
      if (rawT >= duration) {
        scratch.pos.y = groundLocalYAtPos
        group.position.copy(scratch.pos)
        impact.copy(scratch.pos)
        setPhase('broken')
        onImpact?.()
        return
      }

      prevPos.current = (prevPos.current ?? new THREE.Vector3()).copy(scratch.pos)

      // ÉCHELLE PROGRESSIVE : part de 1 (taille du modèle statique sur la
      // rampe) et grossit doucement vers FLYING_ROCKET_SCALE sur
      // SCALE_TRANSITION_SEC — sans ça, le grossissement instantané dès la
      // phase 'flying' donnait l'impression que la fusée « apparaissait »
      // d'un coup plus grosse au lieu de décoller naturellement.
      const scaleProgress = Math.min(1, rawT / SCALE_TRANSITION_SEC)
      group.scale.setScalar(THREE.MathUtils.lerp(1, FLYING_ROCKET_SCALE * scaleMultiplier, scaleProgress))
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed, impact, hasStarted: started.current }
}
