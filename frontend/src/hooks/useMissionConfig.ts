import { useState } from 'react'
import { createMesange } from '@/lib/createMesange'
import { radarTemplates } from '@/data/radarTemplates'
import type { RadarConfig, RadarTemplate } from '@/types/radar.types'
import type { MesangeLaunchConfig, RadarPosition, PlacedRadar } from '@/types/mission.types'

const MAX_MESANGE = 5
const MAX_RADARS = 2

// Seuil de préavis de DÉTECTION par défaut (s) : le préavis minimum que le
// client exige entre l'accroche de la menace par le radar et l'impact. C'est
// SON critère de réussite (pas de l'interception — CHESS teste la détection).
export const DEFAULT_DETECTION_THRESHOLD_SEC = 30

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `radar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function toConfig(template: RadarTemplate): RadarConfig {
  return { ...template, templateId: template.id, detectionThresholdSec: DEFAULT_DETECTION_THRESHOLD_SEC }
}

function createRadar(template: RadarTemplate = radarTemplates[0]): PlacedRadar {
  return { id: makeId(), config: toConfig(template), position: null }
}

interface UseMissionConfigResult {
  /** 1 à 2 radars, chacun sa config + sa position sur la carte. */
  radars: PlacedRadar[]
  addRadar: () => void
  removeRadar: (id: string) => void
  selectRadarTemplate: (id: string, template: RadarTemplate) => void
  updateRadarConfig: (id: string, patch: Partial<RadarConfig>) => void
  placeRadar: (id: string, position: RadarPosition) => void
  canAddRadar: boolean

  mesangeConfigs: MesangeLaunchConfig[]
  addMesange: () => void
  removeMesange: (id: string) => void
  updateMesangeConfig: (id: string, patch: Partial<MesangeLaunchConfig>) => void
  canAddMesange: boolean
}

/**
 * État de composition d'un scénario : 1-2 radars placés + les Mesange (chacune
 * son pas de tir + azimut/inclinaison/T+) + le seuil de préavis. Voir la refonte
 * du flux dans docs/redesign-placement.md.
 */
export function useMissionConfig(): UseMissionConfigResult {
  const [radars, setRadars] = useState<PlacedRadar[]>(() => [createRadar()])
  const [mesangeConfigs, setMesangeConfigs] = useState<MesangeLaunchConfig[]>(() => [createMesange(0)])

  const addRadar = () => {
    setRadars((current) => (current.length >= MAX_RADARS ? current : [...current, createRadar()]))
  }

  const removeRadar = (id: string) => {
    setRadars((current) => (current.length <= 1 ? current : current.filter((r) => r.id !== id)))
  }

  const selectRadarTemplate = (id: string, template: RadarTemplate) => {
    setRadars((current) =>
      current.map((r) => (r.id === id ? { ...r, config: toConfig(template) } : r)),
    )
  }

  const updateRadarConfig = (id: string, patch: Partial<RadarConfig>) => {
    setRadars((current) =>
      current.map((r) => (r.id === id ? { ...r, config: { ...r.config, ...patch } } : r)),
    )
  }

  const placeRadar = (id: string, position: RadarPosition) => {
    setRadars((current) => current.map((r) => (r.id === id ? { ...r, position } : r)))
  }

  const addMesange = () => {
    setMesangeConfigs((current) =>
      current.length >= MAX_MESANGE ? current : [...current, createMesange(current.length)],
    )
  }

  const removeMesange = (id: string) => {
    setMesangeConfigs((current) => (current.length <= 1 ? current : current.filter((m) => m.id !== id)))
  }

  const updateMesangeConfig = (id: string, patch: Partial<MesangeLaunchConfig>) => {
    setMesangeConfigs((current) => current.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  return {
    radars,
    addRadar,
    removeRadar,
    selectRadarTemplate,
    updateRadarConfig,
    placeRadar,
    canAddRadar: radars.length < MAX_RADARS,
    mesangeConfigs,
    addMesange,
    removeMesange,
    updateMesangeConfig,
    canAddMesange: mesangeConfigs.length < MAX_MESANGE,
  }
}
