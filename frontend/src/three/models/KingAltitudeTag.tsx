import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { FlightAltitudeCallout } from '@/components/sections/Lancement/FlightAltitudeCallout'
import { KING_TAG_REFRESH_HZ } from '@/three/constants/kingAltitudeTag'

export interface KingAltitudeTagProps {
  /** Progression du vol (0→1), écrite chaque frame par le moteur de rejeu.
   *  -1 = aucun vol : rien n'est affiché. */
  progressRef: React.RefObject<number>
  /** Altitudes réelles (m) échantillonnées le long de la trajectoire — indexées
   *  par la progression. Source de vérité : la trajectoire RocketPy elle-même. */
  altitudesM: number[]
}

/**
 * ALTITUDE LIVE ancrée à la menace en vol : même dispositif que la fiche du
 * missile sur la rampe (voir RocketInfoHologram) — texte à taille écran
 * CONSTANTE (`transform={false}`) relié à la fusée par un trait fin
 * (`.hud-callout`), donc lisible à n'importe quelle distance ou zoom.
 *
 * C'est LE repère qui rend l'altitude de la scène lisible : la scène 3D est
 * géométriquement exacte mais n'offre aucune référence de hauteur, et la fusée y
 * est volontairement grossie (voir FLYING_ROCKET_SCALE), donc elle ne peut pas en
 * servir. Un chiffre relié à la menace le dit directement.
 *
 * Monté DANS le groupe de la fusée (voir FlyingMesange) : la position à l'écran
 * suit donc la fusée gratuitement, sans projection manuelle.
 *
 * Le texte est écrit directement dans le DOM à cadence réduite (aucun state
 * React, aucun re-render) — même doctrine que useDetectionStatus : un chiffre
 * n'a pas besoin de 60 rafraîchissements par seconde.
 */
export function KingAltitudeTag({ progressRef, altitudesM }: KingAltitudeTagProps) {
  const valueRef = useRef<HTMLParagraphElement | null>(null)
  const lastTextRef = useRef('')
  const lastUpdateMsRef = useRef(0)

  useFrame(() => {
    const value = valueRef.current
    if (!value || altitudesM.length === 0) return

    const nowMs = performance.now()
    if (nowMs - lastUpdateMsRef.current < 1000 / KING_TAG_REFRESH_HZ) return
    lastUpdateMsRef.current = nowMs

    const progress = progressRef.current
    const text =
      progress < 0
        ? ''
        : `${formatAltitudeKm(altitudesM[indexForProgress(progress, altitudesM.length)])} km`

    // N'écrit dans le DOM que si la valeur AFFICHÉE change (le formatage à une
    // décimale rend la plupart des frames identiques).
    if (text !== lastTextRef.current) {
      lastTextRef.current = text
      value.textContent = text
    }
  })

  return (
    <Html position={[0, 0, 0]} transform={false} zIndexRange={[10, 0]}>
      {/* Callout à DROITE de la fusée (le panneau du pas de tir est à gauche) :
          les deux ne se disputent jamais la même place à l'écran. */}
      <div className="hud-callout hud-callout--left pointer-events-none translate-x-[110px] -translate-y-1/2">
        <FlightAltitudeCallout valueRef={valueRef} />
      </div>
    </Html>
  )
}

/** Index de trajectoire correspondant à la progression (borné). */
function indexForProgress(progress: number, length: number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(progress * (length - 1))))
}

/** Altitude en km : une décimale sous 10 km (le décollage est lisible), entier
 *  au-dessus (à 20 km, la décimale est du bruit). */
function formatAltitudeKm(altitudeM: number): string {
  const km = altitudeM / 1000
  return km < 10 ? km.toFixed(1) : Math.round(km).toString()
}
