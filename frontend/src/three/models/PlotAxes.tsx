import { Line, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { PLOT_CYAN, PLOT_HALF_W, PLOT_HEIGHT } from '@/three/constants/trajectoryPlot'

interface PlotAxesProps {
  /** Graduations de distance sol (km) et leur échelle m → unités. */
  distTicks: number[]
  scaleH: number
  /** Graduations d'altitude (km) et leur échelle m → unités. */
  altTicks: number[]
  scaleV: number
}

const AXIS_COLOR = new THREE.Color(...PLOT_CYAN)
const LABEL_COLOR = '#cfe6f0'
const LABEL_STROKE = '#03070d'
/** Longueur du trait de graduation (unités scène). */
const TICK_LEN = PLOT_HALF_W * 0.012

/**
 * AXES GRADUÉS ET NOMMÉS du profil de couverture. Sans eux, le graphe affichait
 * des nombres nus (« 10 », « 20 ») sans dire ce qu'ils mesurent : on ne pouvait
 * pas savoir qu'on lit une distance au sol contre une altitude, ni dans quelle
 * unité.
 *
 * Chaque graduation reçoit un TRAIT (pas seulement un nombre flottant), et chaque
 * axe porte son titre + son unité. Les lignes de rappel horizontales prolongent
 * les graduations d'altitude dans la profondeur du repère, pour lire l'altitude
 * d'un point de la courbe sans avoir à viser l'axe à l'œil.
 */
export function PlotAxes({ distTicks, scaleH, altTicks, scaleV }: PlotAxesProps) {
  return (
    <>
      {/* --- Axe ALTITUDE (vertical, au pas de tir) --- */}
      {altTicks.map((km) => {
        const y = km * 1000 * scaleV
        return (
          <group key={`alt${km}`}>
            <Line
              points={[
                [-TICK_LEN, y, 0],
                [0, y, 0],
              ]}
              color={AXIS_COLOR}
              lineWidth={0.7}
              transparent
              opacity={0.5}
              toneMapped={false}
            />
            {/* Rappel horizontal : prolonge la graduation dans la profondeur pour
                situer l'altitude d'un point de la courbe sans viser l'axe. */}
            {km > 0 && (
              <Line
                points={[
                  [0, y, 0],
                  [PLOT_HALF_W * 2, y, 0],
                ]}
                color={AXIS_COLOR}
                lineWidth={0.4}
                dashed
                dashScale={22}
                transparent
                opacity={0.1}
                toneMapped={false}
              />
            )}
            <Billboard position={[-TICK_LEN * 2, y, 0]}>
              <Text
                fontSize={0.62}
                color={LABEL_COLOR}
                anchorX="right"
                outlineWidth={0.02}
                outlineColor={LABEL_STROKE}
              >
                {String(km)}
              </Text>
            </Billboard>
          </group>
        )
      })}

      {/* Titre de l'axe altitude, le long de sa course. */}
      <Billboard position={[-TICK_LEN * 2, PLOT_HEIGHT * 0.72, 0]}>
        <Text
          fontSize={0.75}
          color={LABEL_COLOR}
          anchorX="right"
          outlineWidth={0.025}
          outlineColor={LABEL_STROKE}
        >
          ALTITUDE (km)
        </Text>
      </Billboard>

      {/* --- Axe DISTANCE SOL (horizontal, +X) --- */}
      {distTicks.map((km) => {
        const x = km * 1000 * scaleH
        return (
          <group key={`dist${km}`}>
            <Line
              points={[
                [x, 0, 0],
                [x, -TICK_LEN, 0],
              ]}
              color={AXIS_COLOR}
              lineWidth={0.7}
              transparent
              opacity={0.5}
              toneMapped={false}
            />
            <Billboard position={[x, -TICK_LEN * 2.4, 0]}>
              <Text
                fontSize={0.62}
                color={LABEL_COLOR}
                anchorY="top"
                outlineWidth={0.02}
                outlineColor={LABEL_STROKE}
              >
                {String(km)}
              </Text>
            </Billboard>
          </group>
        )
      })}

      <Billboard position={[PLOT_HALF_W * 0.55, -TICK_LEN * 6, 0]}>
        <Text
          fontSize={0.75}
          color={LABEL_COLOR}
          anchorY="top"
          outlineWidth={0.025}
          outlineColor={LABEL_STROKE}
        >
          GROUND RANGE (km)
        </Text>
      </Billboard>
    </>
  )
}
