import type { RadarTemplate } from '@/types/radar.types'

/**
 * Valeurs indicatives (non vérifiées officiellement), pré-remplies dans le
 * formulaire mais entièrement modifiables par le client avant le tir.
 */
export const radarTemplates: RadarTemplate[] = [
  {
    id: 'grf',
    name: 'Giraffe 1X',
    manufacturer: 'Saab',
    rangeKm: 75,
    ceilingM: 20000,
    rotating: true,
    minDetectableRcsM2: 1,
    modelPath: '/models/grf.glb',
    tintColor: '#5c6650',
  },
  {
    id: 'gm60',
    name: 'GM 60',
    manufacturer: 'Thales',
    rangeKm: 60,
    ceilingM: 20000,
    rotating: true,
    minDetectableRcsM2: 1,
    modelPath: '/models/GM60.glb',
  },
]
