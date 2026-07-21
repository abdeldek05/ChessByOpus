import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlightData } from '@/lib/api'
import { sampleSceneGround } from '@/lib/sampleSceneGround'
import { toScene, realTimeFromAnim } from '@/lib/trajectoryPlayback'
import { PAD_TOP_Y } from '@/three/constants/launchComplex'
import { LAUNCH_CENTER } from '@/three/constants/sceneLayout'
import {
  TIME_SCALE,
  LIFTOFF_REAL_SEC,
  BURN_TIME_SEC,
  FLYING_ROCKET_SCALE,
  SCALE_TRANSITION_SEC,
  GRAVITY_MS2,
  FALL_DRAG_COEFF,
} from '@/three/constants/flightPlayback'

export type PlaybackPhase = 'flying' | 'broken'

// Rigidité du lissage d'orientation du nez (slerp) : haut = suit vite la
// tangente, bas = plus amorti. Indépendant du framerate via 1-exp(-k·dt).
const HEADING_STIFFNESS = 7

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
  onFrame,
  onImpact,
}: UseTrajectoryPlaybackParams): UseTrajectoryPlaybackResult {
  const groupRef = useRef<THREE.Group>(null)
  const animElapsed = useRef(0)
  const brokenElapsed = useRef(0)
  const thrusting = useRef(true)
  const [phase, setPhase] = useState<PlaybackPhase>('flying')
  // Chute PGRV (dès l'apogée) : vitesse courante (unités scène/s RÉEL, pas
  // accéléré) une fois qu'on a quitté la spline RocketPy pour l'intégration
  // physique maison. `null` = encore sur la spline (montée).
  const fallVelocity = useRef<THREE.Vector3 | null>(null)

  // Rejeu d'un scénario (replay) : `flight` reçoit une NOUVELLE trajectoire à
  // chaque lancement, mais ce hook reste monté en permanence (le composant
  // parent retourne juste `null` sans démonter) — sans ce reset, `phase` et
  // les compteurs restent bloqués sur l'état du vol PRÉCÉDENT (ex. 'broken'
  // + débris déjà explosés), et le nouveau vol démarre déjà cassé.
  useEffect(() => {
    animElapsed.current = 0
    brokenElapsed.current = 0
    thrusting.current = true
    fallVelocity.current = null
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

  // Pré-calcule la spline (échelle réelle unique), les temps et l'impact au sol.
  const { curve, times, duration, impact } = useMemo(() => {
    if (!flight || flight.trajectory.length < 2) {
      return { curve: null, times: [] as number[], duration: 0, impact: origin.clone() }
    }
    const positions = flight.trajectory.map((p) => toScene(p, origin, metersPerSceneUnit))
    const times = flight.trajectory.map((p) => p.t)

    // Spline centripète : passe par tous les points sans oscillation parasite.
    const curve = new THREE.CatmullRomCurve3(positions, false, 'centripetal')

    // Impact posé AU RAS du sol (relief OU dalle béton) : le dernier point de
    // trajectoire est ramené à la hauteur du sol.
    const last = positions[positions.length - 1]
    const impact = last.clone()
    const groundWorldY = sampleSceneGround(impact.x + LAUNCH_CENTER[0], impact.z + LAUNCH_CENTER[2]) - PAD_TOP_Y
    impact.y = origin.y + groundWorldY / metersPerSceneUnit

    return { curve, times, duration: flight.flightTimeSec, impact }
  }, [flight, origin, metersPerSceneUnit])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !active || !curve || times.length < 2 || !flight) return

    if (phase === 'flying') {
      const dt = Math.min(delta, 0.05) // borne : pas de saut si lag
      animElapsed.current += dt
      // Temps de vol réel correspondant (accéléré, décollage ralenti).
      const rawT = realTimeFromAnim(animElapsed.current)
      const apogeeT = flight.apogeeTimeSec

      if (rawT < apogeeT) {
        // --- MONTÉE : suit fidèlement la spline RocketPy (vraie physique
        //     aéro jusqu'à l'apogée). ---
        const t = rawT

        // Paramètre spline u ∈ [0,1] : segment encadrant t + fraction locale.
        let i = 1
        while (i < times.length && times[i] < t) i++
        const a = times[i - 1]
        const b = times[Math.min(i, times.length - 1)]
        const span = b - a || 1
        const f = Math.min(1, Math.max(0, (t - a) / span))
        const u = (i - 1 + f) / (times.length - 1)

        curve.getPoint(u, scratch.pos)
        curve.getTangent(u, scratch.tangent)
        if (scratch.tangent.lengthSq() > 1e-6) {
          scratch.desiredQuat.setFromUnitVectors(scratch.up, scratch.tangent.normalize())
          group.quaternion.slerp(scratch.desiredQuat, 1 - Math.exp(-HEADING_STIFFNESS * dt))
        }
        // POSITION : sans cette ligne, le groupe restait figé à l'origine
        // pendant TOUTE la montée (seul le clamp au sol plus bas le
        // positionnait, mais il ne se déclenche qu'en fin de vol) — la fusée
        // semblait invisible/immobile jusqu'à l'apogée, où la branche chute
        // prenait enfin le relais et la positionnait pour la première fois.
        group.position.copy(scratch.pos)

        thrusting.current = t <= BURN_TIME_SEC
        onFrame?.(scratch.pos, t / duration)
      } else {
        // --- CHUTE PGRV : dès l'apogée, on quitte la spline RocketPy (chute
        //     balistique réelle trop rapide/complexe à dupliquer fidèlement)
        //     pour une intégration physique simple, garantissant un impact
        //     exact sur le relief 3D affiché. ---
        if (!fallVelocity.current) {
          // Initialisation UNIQUE, au moment du switch : vitesse de départ =
          // dérivée numérique de la spline PILE à l'apogée (position à u et
          // u+ε), pour un raccord CONTINU (pas de saut de vitesse visible).
          // À l'apogée, la composante verticale réelle est quasi nulle et
          // l'essentiel de la vitesse est horizontale (dérive latérale) —
          // c'est cette vitesse-là qu'on prolonge en chute libre.
          const apogeeU = Math.min(1, apogeeT / duration)
          const eps = 0.002
          const uA = Math.max(0, apogeeU - eps)
          const uB = Math.min(1, apogeeU + eps)
          const pA = new THREE.Vector3()
          const pB = new THREE.Vector3()
          curve.getPoint(uA, pA)
          curve.getPoint(uB, pB)
          const spanSec = Math.max(1e-3, (uB - uA) * duration)
          fallVelocity.current = pB.sub(pA).divideScalar(spanSec)
          curve.getPoint(apogeeU, scratch.pos)
        }

        const v = fallVelocity.current
        // Temps réel écoulé cette frame, à la MÊME accélération temporelle
        // que le reste du vol (cohérence visuelle avec TIME_SCALE).
        const dtReal = dt * TIME_SCALE

        // Gravité réelle (m/s²), convertie en unités scène/s² : accélère la
        // chute exactement comme la vraie pesanteur.
        const gScene = GRAVITY_MS2 / metersPerSceneUnit
        v.y -= gScene * dtReal

        // Traînée quadratique approximée (freine dans le sens opposé à la
        // vitesse, proportionnelle à v²) : évite une vitesse infinie, donne
        // un ordre de grandeur crédible sans reproduire la vraie courbe Cd(Mach).
        const speed = v.length()
        if (speed > 1e-4) {
          const dragMag = FALL_DRAG_COEFF * speed * speed * dtReal
          scratch.tangent.copy(v).normalize().multiplyScalar(-Math.min(dragMag, speed))
          v.add(scratch.tangent)
        }

        scratch.pos.addScaledVector(v, dtReal)
        group.position.copy(scratch.pos)

        // Orientation : suit la direction de la vitesse (nez vers le bas en
        // chute), même lissage que la phase montée.
        if (v.lengthSq() > 1e-6) {
          scratch.desiredQuat.setFromUnitVectors(scratch.up, scratch.tangent.copy(v).normalize())
          group.quaternion.slerp(scratch.desiredQuat, 1 - Math.exp(-HEADING_STIFFNESS * dt))
        }

        thrusting.current = false
        onFrame?.(scratch.pos, Math.min(1, rawT / duration))
      }

      // CLAMP AU RELIEF + FIN DE VOL : le relief 3D fBm affiché n'a aucun
      // rapport avec le sol plat que RocketPy connaît — dès que la fusée
      // (montée OU chute) atteint le relief réel sous elle, l'impact se
      // déclenche PILE là où elle est affichée (pas de saut visuel).
      const groundWorldY =
        sampleSceneGround(scratch.pos.x + LAUNCH_CENTER[0], scratch.pos.z + LAUNCH_CENTER[2]) - PAD_TOP_Y
      const groundLocalY = origin.y + groundWorldY / metersPerSceneUnit
      if (rawT > LIFTOFF_REAL_SEC && scratch.pos.y <= groundLocalY) {
        scratch.pos.y = groundLocalY
        group.position.copy(scratch.pos)
        impact.copy(scratch.pos)
        setPhase('broken')
        onImpact?.()
        return
      }

      // ÉCHELLE PROGRESSIVE : part de 1 (taille du modèle statique sur la
      // rampe) et grossit doucement vers FLYING_ROCKET_SCALE sur
      // SCALE_TRANSITION_SEC — sans ça, le grossissement instantané dès la
      // phase 'flying' donnait l'impression que la fusée « apparaissait »
      // d'un coup plus grosse au lieu de décoller naturellement.
      const scaleProgress = Math.min(1, rawT / SCALE_TRANSITION_SEC)
      group.scale.setScalar(THREE.MathUtils.lerp(1, FLYING_ROCKET_SCALE, scaleProgress))
    } else {
      brokenElapsed.current += delta
    }
  })

  return { groupRef, phase, thrusting, brokenElapsed, impact }
}
