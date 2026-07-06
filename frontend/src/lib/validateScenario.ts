import { computeDistanceKm } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { RadarConfig } from '@/types/radar.types'
import type { RadarPosition, MesangeLaunchConfig } from '@/types/mission.types'

// Bornes physiques d'une configuration Mesange (miroir du back : angles utiles).
export const AZIMUTH_MIN = 0
export const AZIMUTH_MAX = 360
export const INCLINATION_MIN = 45
export const INCLINATION_MAX = 90
export const LAUNCH_DELAY_MIN = 0
export const LAUNCH_DELAY_MAX = 600

// Le radar doit être ni collé au pas de tir, ni au-delà d'un multiple de sa
// portée (sinon il ne pourrait jamais rien détecter — scénario incohérent).
export const RADAR_MIN_DISTANCE_KM = 0.5
export const RADAR_MAX_DISTANCE_FACTOR = 1.15

export interface ScenarioInput {
  site: LaunchSite | null
  radarConfig: RadarConfig | null
  radarPosition: RadarPosition | null
  mesangeConfigs: MesangeLaunchConfig[]
}

export interface ScenarioViolation {
  /** Clé stable pour styler/router le message côté UI. */
  code: string
  /** Message lisible affiché à l'utilisateur. */
  message: string
}

export interface ScenarioValidation {
  valid: boolean
  violations: ScenarioViolation[]
}

/**
 * Vérifie qu'un scénario respecte toutes les obligations avant lancement.
 * Fonction pure : renvoie la liste des violations (vide = scénario lançable).
 * Utilisée à la fois pour bloquer le bouton et afficher les raisons.
 */
export function validateScenario(input: ScenarioInput): ScenarioValidation {
  const violations: ScenarioViolation[] = []
  const { site, radarConfig, radarPosition, mesangeConfigs } = input

  // 1. Radar sélectionné + positionné.
  if (!radarConfig) {
    violations.push({ code: 'radar-missing', message: 'Aucun radar sélectionné.' })
  }
  if (!radarPosition) {
    violations.push({ code: 'radar-unplaced', message: 'Le radar n’est pas positionné sur la carte.' })
  }

  // 2. Distance radar cohérente avec sa portée.
  if (site && radarConfig && radarPosition) {
    const distanceKm = computeDistanceKm(site, radarPosition)
    const maxKm = radarConfig.rangeKm * RADAR_MAX_DISTANCE_FACTOR
    if (distanceKm < RADAR_MIN_DISTANCE_KM) {
      violations.push({
        code: 'radar-too-close',
        message: 'Le radar est trop proche du pas de tir.',
      })
    } else if (distanceKm > maxKm) {
      violations.push({
        code: 'radar-out-of-range',
        message: `Le radar est hors de portée (${distanceKm.toFixed(0)} km > ${maxKm.toFixed(0)} km).`,
      })
    }
  }

  // 3. Au moins une menace principale (KING).
  const hasKing = mesangeConfigs.some((m) => m.role === 'KING')
  if (!hasKing) {
    violations.push({
      code: 'no-king',
      message: 'Le scénario doit comporter au moins une Mesange KING (menace principale).',
    })
  }

  // 4. Angles / délais dans les bornes pour chaque Mesange.
  mesangeConfigs.forEach((m, index) => {
    const label = `Mesange #${index + 1}`
    if (m.azimuthDeg < AZIMUTH_MIN || m.azimuthDeg > AZIMUTH_MAX) {
      violations.push({ code: 'azimuth-invalid', message: `${label} : azimut hors bornes (0–360°).` })
    }
    if (m.inclinationDeg < INCLINATION_MIN || m.inclinationDeg > INCLINATION_MAX) {
      violations.push({
        code: 'inclination-invalid',
        message: `${label} : inclinaison hors bornes (45–90°).`,
      })
    }
    if (m.launchDelaySec < LAUNCH_DELAY_MIN || m.launchDelaySec > LAUNCH_DELAY_MAX) {
      violations.push({ code: 'delay-invalid', message: `${label} : délai de tir hors bornes.` })
    }
  })

  return { valid: violations.length === 0, violations }
}
