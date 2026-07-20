export interface RadarTemplate {
  id: string
  name: string
  manufacturer: string
  rangeKm: number
  ceilingM: number
  rotating: boolean
  /** Vitesse de balayage (tours/min) — l'accroche attend le passage du faisceau. */
  rotationRpm: number
  minDetectableRcsM2: number
  /** Hauteur d'antenne (m) — détermine l'horizon radar (courbure terrestre). */
  antennaHeightM: number
  /** Élévation maximale du faisceau (deg) — au-dessus, cône de silence.
   *  Optionnel : défaut COVERAGE_ELEVATION_MAX_DEG (constants/coverage). */
  elevationMaxDeg?: number
  modelPath: string
  tintColor?: string
}

export interface RadarConfig extends RadarTemplate {
  templateId: string
  /** Seuil de préavis de détection exigé (s), propre à ce radar. */
  detectionThresholdSec: number
}
