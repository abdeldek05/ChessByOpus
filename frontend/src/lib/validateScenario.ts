import { computeDistanceKm } from '@/lib/computeDistanceKm'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar, MesangeLaunchConfig } from '@/types/mission.types'

// Bornes physiques d'une configuration Mesange (miroir du back : angles utiles).
export const AZIMUTH_MIN = 0
export const AZIMUTH_MAX = 360
// Élévation de la rampe : 90° = vertical, 70° = inclinaison maximale autorisée.
export const INCLINATION_MIN = 70
export const INCLINATION_MAX = 90
export const LAUNCH_DELAY_MIN = 0
export const LAUNCH_DELAY_MAX = 600

// Le radar doit être ni collé au pas de tir, ni au-delà de sa portée EXACTE
// (limite stricte, sans marge de tolérance : au-delà, il ne couvre plus le
// pas de tir — scénario incohérent).
export const RADAR_MIN_DISTANCE_KM = 0.5

export interface ScenarioInput {
  site: LaunchSite | null
  radars: PlacedRadar[]
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
  const { site, radars, mesangeConfigs } = input

  // 1. Chaque radar configuré doit être positionné sur la carte (pas juste un
  //    parmi d'autres : si on en ajoute un 2e, il doit être posé aussi).
  radars.forEach((radar, index) => {
    if (!radar.position) {
      const label = radars.length > 1 ? `Radar ${index + 1} : ` : ''
      violations.push({ code: 'radar-unplaced', message: `${label}non positionné sur la carte.` })
    }
  })

  // 2. Chaque radar placé doit être à une distance cohérente d'un pas de tir.
  //    (Référence : le site pour l'instant ; passera aux pas de tir posés.)
  if (site) {
    radars.forEach((radar, index) => {
      if (!radar.position) return
      const distanceKm = computeDistanceKm(site, radar.position)
      const maxKm = radar.config.rangeKm
      const label = radars.length > 1 ? `Radar ${index + 1} : ` : ''
      if (distanceKm < RADAR_MIN_DISTANCE_KM) {
        violations.push({ code: 'radar-too-close', message: `${label}trop proche du pas de tir.` })
      } else if (distanceKm > maxKm) {
        violations.push({
          code: 'radar-out-of-range',
          message: `${label}hors de portée (${distanceKm.toFixed(2).replace('.', ',')} km > ${maxKm} km).`,
        })
      }
    })
  }

  // 3. Au moins une menace principale (KING).
  const hasKing = mesangeConfigs.some((m) => m.role === 'KING')
  if (!hasKing) {
    violations.push({
      code: 'no-king',
      message: 'Le scénario doit comporter au moins une Mesange KING (menace principale).',
    })
  }

  // 4. Angles / délais dans les bornes (le pas de tir est fixe = le site).
  mesangeConfigs.forEach((m, index) => {
    const label = `Mesange #${index + 1}`
    if (m.azimuthDeg < AZIMUTH_MIN || m.azimuthDeg > AZIMUTH_MAX) {
      violations.push({ code: 'azimuth-invalid', message: `${label} : azimut hors bornes (0–360°).` })
    }
    if (m.inclinationDeg < INCLINATION_MIN || m.inclinationDeg > INCLINATION_MAX) {
      violations.push({
        code: 'inclination-invalid',
        message: `${label} : élévation hors bornes (${INCLINATION_MIN}–${INCLINATION_MAX}°).`,
      })
    }
    if (m.launchDelaySec < LAUNCH_DELAY_MIN || m.launchDelaySec > LAUNCH_DELAY_MAX) {
      violations.push({ code: 'delay-invalid', message: `${label} : délai de tir hors bornes.` })
    }
  })

  return { valid: violations.length === 0, violations }
}
