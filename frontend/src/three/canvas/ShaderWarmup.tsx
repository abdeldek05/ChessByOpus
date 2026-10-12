import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ExhaustPlume } from '@/three/models/ExhaustPlume'
import { MesangeDebris } from '@/three/models/MesangeDebris'
import { ImpactBurst } from '@/three/models/ImpactBurst'

/**
 * Préchauffe les shaders des effets de vol pendant l'écran de chargement.
 *
 * Sans lui, le panache (ExhaustPlume) n'était monté qu'à l'allumage et les
 * débris/flash (MesangeDebris, ImpactBurst) qu'à l'impact : la PREMIÈRE
 * apparition d'un matériau force la compilation synchrone de son shader par
 * le driver — un freeze de plusieurs dizaines de ms pile au décollage et pile
 * à l'explosion, les deux moments les plus regardés du vol. Combiné au rejeu
 * par le temps, ce freeze devenait une téléportation de la fusée (l'autre
 * moitié du correctif est l'horloge lissée, voir useSmoothedFrameDelta).
 *
 * Monte donc les trois effets UNE FOIS, invisibles (compile() de three
 * collecte les matériaux via `traverse`, pas `traverseVisible` — vérifié dans
 * la source : l'invisibilité n'empêche pas la compilation), lance
 * compileAsync (compilation parallèle KHR, sans bloquer la frame), puis se
 * démonte : aucun coût résiduel. Les mêmes programmes étant mis en cache par
 * three, les montages réels (Roi, puis chaque leurre retardé) sont gratuits.
 */
export function ShaderWarmup() {
  const groupRef = useRef<THREE.Group>(null)
  const { gl, camera, scene } = useThree()
  const [done, setDone] = useState(false)
  // Refs factices : ces effets s'animent depuis des refs externes (poussée,
  // temps écoulé). Des valeurs neutres suffisent — rien n'est affiché.
  const thrustingRef = useRef(true)
  const elapsedRef = useRef(0)

  useEffect(() => {
    const group = groupRef.current
    if (!group || done) return
    let cancelled = false
    const finish = () => {
      if (!cancelled) setDone(true)
    }
    if (typeof gl.compileAsync === 'function') {
      gl.compileAsync(group, camera, scene).then(finish, finish)
    } else {
      // Version de three sans compileAsync : compilation synchrone, toujours
      // pendant l'écran de chargement — jamais en vol.
      try {
        gl.compile(group, camera, scene)
      } finally {
        finish()
      }
    }
    return () => {
      cancelled = true
    }
  }, [gl, camera, scene, done])

  if (done) return null
  return (
    <group ref={groupRef} visible={false}>
      <ExhaustPlume thrustingRef={thrustingRef} />
      <MesangeDebris elapsedRef={elapsedRef} />
      <ImpactBurst elapsedRef={elapsedRef} />
    </group>
  )
}
