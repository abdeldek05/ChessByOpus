import { MESANGE_ROLES } from '@/data/mesangeRoles'
import { RoleRocketIcon } from './RoleRocketIcon'
import type { MesangeRole } from '@/types/mission.types'

interface RoleSelectorProps {
  value: MesangeRole
  onChange: (role: MesangeRole) => void
}

/** Contrôle segmenté Roi / Dame / Pion, chaque rôle en fusée coiffée. */
export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div data-guide="role" className="flex gap-1.5 rounded-2xl bg-surface-2 p-1.5">
      {MESANGE_ROLES.map((role) => {
        const active = role.id === value
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            title={role.hint}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-all duration-200 ${
              active ? 'bg-accent text-bg' : 'text-ink-dim hover:bg-bg/40 hover:text-ink'
            }`}
          >
            <RoleRocketIcon role={role.id} className={`h-7 ${active ? '' : 'text-accent/80'}`} />
            <span className="text-xs font-semibold">{role.label}</span>
          </button>
        )
      })}
    </div>
  )
}
