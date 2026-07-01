export interface RadarTemplate {
  id: string
  name: string
  manufacturer: string
  rangeKm: number
  ceilingM: number
  rotating: boolean
  minDetectableRcsM2: number
  modelPath: string
  tintColor?: string
}

export interface RadarConfig extends RadarTemplate {
  templateId: string
}
