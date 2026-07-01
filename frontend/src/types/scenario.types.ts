export interface ScenarioMesangeConfig {
  id: string
  azimuthDeg: number
  inclinationDeg: number
}

export interface ScenarioRecord {
  id: number
  missionId: number
  radarTemplateId: string
  radarRangeKm: number
  radarCeilingM: number
  radarRotating: boolean
  radarMinRcsM2: number
  mesangeConfigs: ScenarioMesangeConfig[]
  createdAt: string
  siteName: string
  latitude: number
  longitude: number
}
