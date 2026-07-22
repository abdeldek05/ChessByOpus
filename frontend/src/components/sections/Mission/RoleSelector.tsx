import { MESANGE_ROLES } from '@/data/mesangeRoles'
import { RoleRocketIcon } from './RoleRocketIcon'
import { getMesangeRoleTextClass } from '@/lib/getMesangeRoleColorClass'
import type { MesangeRole } from '@/types/mission.types'

interface RoleSelectorProps {
  value: MesangeRole
  onChange: (role: MesangeRole) => void
  /** Un Roi existe déjà AILLEURS dans la flotte : le bouton Roi est désactivé
   *  (pas juste déconseillé) — il ne peut jamais y en avoir deux, et cette
   *  Mesange-ci ne peut redevenir Roi qu'en passant par la Mesange qui l'est
   *  actuellement. */
  kingTakenElsewhere?: boolean
}

/** Contrôle segmenté Roi / Dame / Pion, chaque rôle en fusée coiffée, teinté
 *  par sa couleur CHESS (même famille que les cônes sur la carte) — le rôle
 *  actif se distingue par sa propre couleur, pas un accent générique. */
export function RoleSelector({ value, onChange, kingTakenElsewhere = false }: RoleSelectorProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-surface-2 p-1.5">
      {MESANGE_ROLES.map((role) => {
        const active = role.id === value
        const colorClass = getMesangeRoleTextClass(role.id)
        const disabled = role.id === 'KING' && kingTakenElsewhere
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            disabled={disabled}
            title={disabled ? 'Another Mesange is already the King' : role.hint}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-all duration-200 disabled:pointer-events-none disabled:opacity-30 ${
              active ? `bg-bg ${colorClass}` : 'text-ink-faint hover:bg-bg/40 hover:text-ink-dim'
            }`}
          >
            <RoleRocketIcon role={role.id} className="h-7" />
            <span className="text-xs font-semibold">{role.label}</span>
          </button>
        )
      })}
    </div>
  )
}
