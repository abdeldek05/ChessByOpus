import { useState } from 'react'
import { createMesange } from '@/lib/createMesange'
import type { RadarConfig, RadarTemplate } from '@/types/radar.types'
import type { MesangeLaunchConfig, RadarPosition } from '@/types/mission.types'

const MAX_MESANGE = 5

function toConfig(template: RadarTemplate): RadarConfig {
  return { ...template, templateId: template.id }
}

interface UseMissionConfigResult {
  radarConfig: RadarConfig | null
  selectRadar: (template: RadarTemplate) => void
  updateRadarConfig: (patch: Partial<RadarConfig>) => void
  mesangeConfigs: MesangeLaunchConfig[]
  addMesange: () => void
  removeMesange: (id: string) => void
  updateMesangeConfig: (id: string, patch: Partial<MesangeLaunchConfig>) => void
  canAddMesange: boolean
  radarPosition: RadarPosition | null
  setRadarPosition: (position: RadarPosition) => void
}

export function useMissionConfig(): UseMissionConfigResult {
  const [radarConfig, setRadarConfig] = useState<RadarConfig | null>(null)
  const [mesangeConfigs, setMesangeConfigs] = useState<MesangeLaunchConfig[]>(() => [createMesange(0)])
  const [radarPosition, setRadarPosition] = useState<RadarPosition | null>(null)

  const selectRadar = (template: RadarTemplate) => {
    setRadarConfig(toConfig(template))
  }

  const updateRadarConfig = (patch: Partial<RadarConfig>) => {
    setRadarConfig((current) => (current ? { ...current, ...patch } : current))
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
    radarConfig,
    selectRadar,
    updateRadarConfig,
    mesangeConfigs,
    addMesange,
    removeMesange,
    updateMesangeConfig,
    canAddMesange: mesangeConfigs.length < MAX_MESANGE,
    radarPosition,
    setRadarPosition,
  }
}
