import type { MesangeLaunchConfig } from '@/types/mission.types'

const BASE_INCLINATION_DEG = 75
const AZIMUTH_STEP_DEG = 30
const INCLINATION_STEP_DEG = 5
const MIN_INCLINATION_DEG = 45

/**
 * Chaque nouvelle Mésange part d'une trajectoire différente de la précédente
 * (azimut/inclinaison décalés), pour tester le radar sous plusieurs angles
 * dès l'ajout — tout en restant librement modifiable ensuite.
 */
function defaultConfigForIndex(index: number): MesangeLaunchConfig {
  return {
    id: `mesange-${index + 1}`,
    azimuthDeg: (index * AZIMUTH_STEP_DEG) % 360,
    inclinationDeg: Math.max(MIN_INCLINATION_DEG, BASE_INCLINATION_DEG - index * INCLINATION_STEP_DEG),
  }
}

export function resizeMesangeConfigs(
  current: MesangeLaunchConfig[],
  count: number,
): MesangeLaunchConfig[] {
  if (count <= current.length) return current.slice(0, count)

  const additions = Array.from({ length: count - current.length }, (_, position) =>
    defaultConfigForIndex(current.length + position),
  )

  return [...current, ...additions]
}
