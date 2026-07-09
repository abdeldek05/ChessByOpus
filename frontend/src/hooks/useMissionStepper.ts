import { useState } from 'react'

export type MissionStepId = 'radar' | 'settings' | 'position' | 'trajectories' | 'launch'

export interface MissionStep {
  id: MissionStepId
  label: string
}

export const MISSION_STEPS: MissionStep[] = [
  { id: 'radar', label: 'Radar' },
  { id: 'settings', label: 'Réglages' },
  { id: 'position', label: 'Position radar' },
  { id: 'trajectories', label: 'Menaces' },
  { id: 'launch', label: 'Lancement' },
]

interface UseMissionStepperResult {
  steps: MissionStep[]
  index: number
  current: MissionStepId
  isFirst: boolean
  isLast: boolean
  goNext: () => void
  goPrev: () => void
  goTo: (index: number) => void
}

export function useMissionStepper(): UseMissionStepperResult {
  const [index, setIndex] = useState(0)

  const goTo = (target: number) => {
    setIndex(Math.min(MISSION_STEPS.length - 1, Math.max(0, target)))
  }

  return {
    steps: MISSION_STEPS,
    index,
    current: MISSION_STEPS[index].id,
    isFirst: index === 0,
    isLast: index === MISSION_STEPS.length - 1,
    goNext: () => goTo(index + 1),
    goPrev: () => goTo(index - 1),
    goTo,
  }
}
