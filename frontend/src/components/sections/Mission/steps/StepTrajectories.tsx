import { useState } from 'react'
import { MesangeConfigCard } from '../MesangeConfigCard'
import { MesangeGuide } from '../MesangeGuide'
import { RoleRocketIcon } from '../RoleRocketIcon'
import type { MesangeLaunchConfig } from '@/types/mission.types'

const GUIDE_KEY = 'chess:mesange-guide-seen'

interface StepTrajectoriesProps {
  configs: MesangeLaunchConfig[]
  canAdd: boolean
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, patch: Partial<MesangeLaunchConfig>) => void
}

export function StepTrajectories({ configs, canAdd, onAdd, onRemove, onChange }: StepTrajectoriesProps) {
  const [showGuide, setShowGuide] = useState(() => localStorage.getItem(GUIDE_KEY) !== '1')
  const kingCount = configs.filter((m) => m.role === 'KING').length

  const closeGuide = () => {
    localStorage.setItem(GUIDE_KEY, '1')
    setShowGuide(false)
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-5">
      {showGuide && <MesangeGuide onClose={closeGuide} />}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-dim">
          {configs.length} Mesange{configs.length > 1 ? 's' : ''} in the scenario
        </p>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="text-xs font-medium text-ink-faint transition-colors hover:text-accent-bright"
        >
          Review the guide
        </button>
      </div>

      {kingCount > 1 && (
        <div className="rounded-2xl bg-alert/15 px-4 py-3 text-sm text-alert">
          There can be only one King — switch the others back to Queen or Pawn.
        </div>
      )}

      <div className="space-y-4">
        {configs.map((config, index) => (
          <MesangeConfigCard
            key={config.id}
            index={index}
            config={config}
            canRemove={configs.length > 1}
            onChange={(patch) => onChange(config.id, patch)}
            onRemove={() => onRemove(config.id)}
          />
        ))}
      </div>

      <button
        type="button"
        data-guide="add"
        onClick={onAdd}
        disabled={!canAdd}
        className="group flex flex-col items-center gap-2 rounded-3xl bg-surface/90 py-6 backdrop-blur-sm transition-colors duration-200 hover:bg-surface-2 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface/90"
      >
        <RoleRocketIcon
          role="PAWN"
          className="h-8 text-accent-bright transition-transform duration-300 ease-out group-hover:-translate-y-1.5"
        />
        <span className="text-sm font-semibold text-accent-bright">
          {canAdd ? 'Deploy a Mesange' : 'Maximum reached (5)'}
        </span>
      </button>
    </div>
  )
}
