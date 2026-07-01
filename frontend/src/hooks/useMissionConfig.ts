import { useState } from 'react'
import { radarTemplates } from '@/data/radarTemplates'
import { resizeMesangeConfigs } from '@/lib/resizeMesangeConfigs'
import type { RadarConfig, RadarTemplate } from '@/types/radar.types'
import type { MesangeLaunchConfig, RadarPosition } from '@/types/mission.types'

const MIN_MESANGE_COUNT = 1
const MAX_MESANGE_COUNT = 5

function toConfig(template: RadarTemplate): RadarConfig {
  return { ...template, templateId: template.id }
}

interface UseMissionConfigResult {
  radarConfig: RadarConfig | null
  selectRadar: (template: RadarTemplate) => void
  updateRadarConfig: (patch: Partial<RadarConfig>) => void
  mesangeConfigs: MesangeLaunchConfig[]
  setMesangeCount: (count: number) => void
  updateMesangeConfig: (id: string, patch: Partial<MesangeLaunchConfig>) => void
  radarPosition: RadarPosition | null
  setRadarPosition: (position: RadarPosition) => void
}

export function useMissionConfig(): UseMissionConfigResult {
  const [radarConfig, setRadarConfig] = useState<RadarConfig | null>(null)
  const [mesangeConfigs, setMesangeConfigs] = useState<MesangeLaunchConfig[]>(() =>
    resizeMesangeConfigs([], 1),
  )
  const [radarPosition, setRadarPosition] = useState<RadarPosition | null>(null)

  const selectRadar = (template: RadarTemplate) => {
    setRadarConfig(toConfig(template))
  }

  const updateRadarConfig = (patch: Partial<RadarConfig>) => {
    setRadarConfig((current) => (current ? { ...current, ...patch } : current))
  }

  const setMesangeCount = (count: number) => {
    const clamped = Math.min(MAX_MESANGE_COUNT, Math.max(MIN_MESANGE_COUNT, count))
    setMesangeConfigs((current) => resizeMesangeConfigs(current, clamped))
  }

  const updateMesangeConfig = (id: string, patch: Partial<MesangeLaunchConfig>) => {
    setMesangeConfigs((current) =>
      current.map((config) => (config.id === id ? { ...config, ...patch } : config)),
    )
  }

  return {
    radarConfig,
    selectRadar,
    updateRadarConfig,
    mesangeConfigs,
    setMesangeCount,
    updateMesangeConfig,
    radarPosition,
    setRadarPosition,
  }
}
