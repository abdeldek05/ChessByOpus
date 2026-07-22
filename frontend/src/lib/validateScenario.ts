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

// Le radar doit être ni collé au pas de tir, ni assez loin pour qu'AUCUN
// chevauchement ne soit possible entre son cercle de couverture et le cercle
// de portée max de la Mesange (voir la règle 2 plus bas — même logique que
// useMissionPlacementMap).
export const RADAR_MIN_DISTANCE_KM = 0.5

export interface ScenarioInput {
  site: LaunchSite | null
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]
  /** Distance max théorique de la Mesange (km, constante fixe — voir constants/rocket). */
  rocketMaxRangeKm: number
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
  const { site, radars, mesangeConfigs, rocketMaxRangeKm } = input

  // 1. Chaque radar configuré doit être positionné sur la carte (pas juste un
  //    parmi d'autres : si on en ajoute un 2e, il doit être posé aussi).
  radars.forEach((radar, index) => {
    if (!radar.position) {
      const label = radars.length > 1 ? `Radar ${index + 1} : ` : ''
      violations.push({ code: 'radar-unplaced', message: `${label}not placed on the map.` })
    }
  })

  // 2. Le cercle de COUVERTURE du radar doit chevaucher le cercle de portée
  //    max de la Mesange (pas besoin de le contenir entièrement, juste que les
  //    deux cercles se croisent quelque part) — sinon ce radar ne pourra
  //    JAMAIS rien détecter, quel que soit l'azimut/élévation choisis.
  //    (Référence : le site pour l'instant ; passera aux pas de tir posés.)
  if (site) {
    radars.forEach((radar, index) => {
      if (!radar.position) return
      const distanceKm = computeDistanceKm(site, radar.position)
      const maxKm = rocketMaxRangeKm + radar.config.rangeKm
      const label = radars.length > 1 ? `Radar ${index + 1} : ` : ''
      if (distanceKm < RADAR_MIN_DISTANCE_KM) {
        violations.push({ code: 'radar-too-close', message: `${label}too close to the launch pad.` })
      } else if (distanceKm > maxKm) {
        violations.push({
          code: 'radar-out-of-range',
          message: `${label}can never overlap the rocket's reach (${distanceKm.toFixed(2).replace('.', ',')} km > ${maxKm.toFixed(0)} km).`,
        })
      }
    })
  }

  // 3. Exactement une menace principale (KING) : ni zéro (pas de vraie
  //    menace à faire passer), ni plusieurs (radar.py n'en retient qu'un
  //    seul comme référence — voir compute_detection, "roi = premier KING").
  const kingCount = mesangeConfigs.filter((m) => m.role === 'KING').length
  if (kingCount === 0) {
    violations.push({
      code: 'no-king',
      message: 'The scenario must include at least one KING Mesange (primary threat).',
    })
  } else if (kingCount > 1) {
    violations.push({
      code: 'multiple-kings',
      message: 'There can be only one King — switch the others back to Queen or Pawn.',
    })
  }

  // 4. Angles / délais dans les bornes (le pas de tir est fixe = le site).
  mesangeConfigs.forEach((m, index) => {
    const label = `Mesange #${index + 1}`
    if (m.azimuthDeg < AZIMUTH_MIN || m.azimuthDeg > AZIMUTH_MAX) {
      violations.push({ code: 'azimuth-invalid', message: `${label}: azimuth out of bounds (0–360°).` })
    }
    if (m.inclinationDeg < INCLINATION_MIN || m.inclinationDeg > INCLINATION_MAX) {
      violations.push({
        code: 'inclination-invalid',
        message: `${label}: elevation out of bounds (${INCLINATION_MIN}–${INCLINATION_MAX}°).`,
      })
    }
    if (m.launchDelaySec < LAUNCH_DELAY_MIN || m.launchDelaySec > LAUNCH_DELAY_MAX) {
      violations.push({ code: 'delay-invalid', message: `${label}: firing delay out of bounds.` })
    }
  })

  return { valid: violations.length === 0, violations }
}
