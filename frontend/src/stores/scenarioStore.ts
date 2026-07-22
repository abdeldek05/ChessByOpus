import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export interface ScenarioState {
  /** 1 à 2 radars, chacun sa config + sa position sur la carte. */
  radars: PlacedRadar[]
  mesangeConfigs: MesangeLaunchConfig[]

  addRadar: () => void
  removeRadar: (id: string) => void
  selectRadarTemplate: (id: string, template: RadarTemplate) => void
  updateRadarConfig: (id: string, patch: Partial<RadarConfig>) => void
  placeRadar: (id: string, position: RadarPosition) => void

  addMesange: () => void
  removeMesange: (id: string) => void
  updateMesangeConfig: (id: string, patch: Partial<MesangeLaunchConfig>) => void

  /** Remet le scénario à zéro (1 radar, 1 Mesange) — nouveau scénario. */
  reset: () => void
}

/**
 * Store central du scénario en cours de composition : radars placés (1-2) +
 * Mesange configurées (1-5, rôles KING/QUEEN/PAWN). Persisté en sessionStorage
 * (survit à un F5/navigation, effacé à la fermeture de l'onglet) — remplace
 * l'ancien state local de MissionConsole, propagé jusque-là par router state
 * (fragile : perdu au F5, gardes-fous <Navigate> partout).
 */
export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set) => ({
      radars: [createRadar()],
      mesangeConfigs: [createMesange(0)],

      addRadar: () =>
        set((state) => ({
          radars: state.radars.length >= MAX_RADARS ? state.radars : [...state.radars, createRadar()],
        })),

      removeRadar: (id) =>
        set((state) => ({
          radars: state.radars.length <= 1 ? state.radars : state.radars.filter((r) => r.id !== id),
        })),

      selectRadarTemplate: (id, template) =>
        set((state) => ({
          radars: state.radars.map((r) => (r.id === id ? { ...r, config: toConfig(template) } : r)),
        })),

      updateRadarConfig: (id, patch) =>
        set((state) => ({
          radars: state.radars.map((r) => (r.id === id ? { ...r, config: { ...r.config, ...patch } } : r)),
        })),

      placeRadar: (id, position) =>
        set((state) => ({
          radars: state.radars.map((r) => (r.id === id ? { ...r, position } : r)),
        })),

      addMesange: () =>
        set((state) => ({
          mesangeConfigs:
            state.mesangeConfigs.length >= MAX_MESANGE
              ? state.mesangeConfigs
              : [...state.mesangeConfigs, createMesange(state.mesangeConfigs.length)],
        })),

      removeMesange: (id) =>
        set((state) => ({
          mesangeConfigs:
            state.mesangeConfigs.length <= 1
              ? state.mesangeConfigs
              : state.mesangeConfigs.filter((m) => m.id !== id),
        })),

      updateMesangeConfig: (id, patch) =>
        set((state) => ({
          mesangeConfigs: state.mesangeConfigs.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      reset: () => set({ radars: [createRadar()], mesangeConfigs: [createMesange(0)] }),
    }),
    {
      name: 'chess-scenario-store',
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key)
          return value ? JSON.parse(value) : null
        },
        setItem: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    },
  ),
)

export const MAX_MESANGE_COUNT = MAX_MESANGE
export const MAX_RADAR_COUNT = MAX_RADARS
