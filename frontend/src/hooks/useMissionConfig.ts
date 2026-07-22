import {
  useScenarioStore,
  MAX_MESANGE_COUNT,
  MAX_RADAR_COUNT,
  DEFAULT_DETECTION_THRESHOLD_SEC,
} from '@/stores/scenarioStore'

export { DEFAULT_DETECTION_THRESHOLD_SEC }

interface UseMissionConfigResult {
  /** 1 à 2 radars, chacun sa config + sa position sur la carte. */
  radars: ReturnType<typeof useScenarioStore.getState>['radars']
  addRadar: () => void
  removeRadar: (id: string) => void
  selectRadarTemplate: ReturnType<typeof useScenarioStore.getState>['selectRadarTemplate']
  updateRadarConfig: ReturnType<typeof useScenarioStore.getState>['updateRadarConfig']
  placeRadar: ReturnType<typeof useScenarioStore.getState>['placeRadar']
  canAddRadar: boolean

  mesangeConfigs: ReturnType<typeof useScenarioStore.getState>['mesangeConfigs']
  addMesange: () => void
  removeMesange: (id: string) => void
  updateMesangeConfig: ReturnType<typeof useScenarioStore.getState>['updateMesangeConfig']
  canAddMesange: boolean
}

/**
 * Façade de lecture/écriture du scénario en cours : délègue entièrement au
 * store central (voir stores/scenarioStore.ts, persisté en sessionStorage).
 * Conservé pour ne pas changer l'API consommée par MissionConsole — la
 * composition du scénario passe maintenant par le store, plus par un useState
 * local propagé ensuite via router state.
 */
export function useMissionConfig(): UseMissionConfigResult {
  const radars = useScenarioStore((s) => s.radars)
  const mesangeConfigs = useScenarioStore((s) => s.mesangeConfigs)
  const addRadar = useScenarioStore((s) => s.addRadar)
  const removeRadar = useScenarioStore((s) => s.removeRadar)
  const selectRadarTemplate = useScenarioStore((s) => s.selectRadarTemplate)
  const updateRadarConfig = useScenarioStore((s) => s.updateRadarConfig)
  const placeRadar = useScenarioStore((s) => s.placeRadar)
  const addMesange = useScenarioStore((s) => s.addMesange)
  const removeMesange = useScenarioStore((s) => s.removeMesange)
  const updateMesangeConfig = useScenarioStore((s) => s.updateMesangeConfig)

  return {
    radars,
    addRadar,
    removeRadar,
    selectRadarTemplate,
    updateRadarConfig,
    placeRadar,
    canAddRadar: radars.length < MAX_RADAR_COUNT,
    mesangeConfigs,
    addMesange,
    removeMesange,
    updateMesangeConfig,
    canAddMesange: mesangeConfigs.length < MAX_MESANGE_COUNT,
  }
}
