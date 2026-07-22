import { RoleRocketIcon } from './RoleRocketIcon'
import { getMesangeRoleTextClass } from '@/lib/getMesangeRoleColorClass'
import type { MesangeLaunchConfig } from '@/types/mission.types'

interface FleetTabsProps {
  configs: MesangeLaunchConfig[]
  selectedId: string
  canAdd: boolean
  onSelect: (id: string) => void
  onAdd: () => void
}

/** Rail d'onglets de la flotte (même esprit que MissionStepRail, le stepper
 *  de mission en haut d'écran) : une pastille par Mesange — fusée coiffée de
 *  son rôle, numéro d'ordre — l'active en surbrillance. Clic = y sauter
 *  directement, sans parcours linéaire imposé. */
export function FleetTabs({ configs, selectedId, canAdd, onSelect, onAdd }: FleetTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-6 pt-4">
      {configs.map((config, index) => {
        const active = config.id === selectedId
        const colorClass = getMesangeRoleTextClass(config.role)
        return (
          <button
            key={config.id}
            type="button"
            onClick={() => onSelect(config.id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-full py-2 pr-4 pl-2 transition-colors duration-200 ${
              active ? 'bg-surface-2' : 'hover:bg-surface-2/50'
            }`}
          >
            <span
              className={`flex size-9 items-center justify-center rounded-full bg-bg ${active ? colorClass : 'text-ink-faint'}`}
            >
              <RoleRocketIcon role={config.role} className="h-5" />
            </span>
            <span className={`text-xs font-semibold ${active ? 'text-ink' : 'text-ink-faint'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        title={canAdd ? 'Deploy a Mesange' : 'Maximum reached (5)'}
        className="flex shrink-0 size-11 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-2/50 hover:text-accent-bright disabled:pointer-events-none disabled:opacity-30"
      >
        <span className="text-xl leading-none">＋</span>
      </button>
    </div>
  )
}
