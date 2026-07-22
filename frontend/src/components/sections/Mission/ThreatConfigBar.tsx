import { FleetTabs } from './FleetTabs'
import { RoleSelector } from './RoleSelector'
import { RoleRocketIcon } from './RoleRocketIcon'
import { getMesangeRoleLabel } from '@/lib/getMesangeRoleLabel'
import { getMesangeRoleTextClass } from '@/lib/getMesangeRoleColorClass'
import { INCLINATION_MIN, INCLINATION_MAX } from '@/lib/validateScenario'
import type { MesangeLaunchConfig } from '@/types/mission.types'

interface ThreatConfigBarProps {
  configs: MesangeLaunchConfig[]
  selected: MesangeLaunchConfig
  /** Position 1-based de `selected` dans `configs` — pour l'étiquette "Mesange 0X". */
  selectedIndex: number
  canAdd: boolean
  canRemove: boolean
  /** Une AUTRE Mesange de la flotte est déjà Roi — désactive le choix Roi ici. */
  kingTakenElsewhere: boolean
  onSelect: (id: string) => void
  onAdd: () => void
  onChange: (patch: Partial<MesangeLaunchConfig>) => void
  onBackToCount: () => void
  onRemove: () => void
}

/** Champ compact étiquette + curseur + valeur, pour tenir sur une ligne dans
 *  le bandeau (variante resserrée des contrôles pleine hauteur du reste de
 *  l'app — ici la carte occupe tout l'espace, ce bandeau doit rester bas). */
function InlineField({
  label,
  hint,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex min-w-[12.5rem] flex-col gap-1.5">
      <span className="flex items-baseline gap-1.5 text-xs font-medium text-ink-faint">
        {label}
        {hint && <span className="font-normal opacity-70">{hint}</span>}
      </span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="range-brass"
        />
        <span className="w-12 shrink-0 text-right text-sm font-semibold text-accent-bright tabular-nums">
          {Math.round(value)}
          {unit}
        </span>
      </div>
    </label>
  )
}

/** Lecture seule (pas un curseur) : l'azimut ne se règle QUE sur la carte, en
 *  saisissant le cône — mais sa valeur exacte doit rester visible ici, sans
 *  quoi le client règle "à l'œil" sans jamais voir le chiffre précis. */
function AzimuthReadout({ value }: { value: number }) {
  return (
    <div className="flex min-w-[7rem] flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-faint">Azimuth</span>
      <span className="text-lg font-semibold text-accent-bright tabular-nums">
        {Math.round(value)}°
      </span>
    </div>
  )
}

/**
 * HUD de configuration ancré en BAS de la carte tactique — jamais une
 * colonne latérale (qui coupait sur les écrans étroits, voir retour client).
 * Deux rangées : les ONGLETS de la flotte (une pastille par Mesange, clic =
 * y sauter directement — même esprit que MissionStepRail, le stepper de
 * mission), puis les RÉGLAGES de la Mesange sélectionnée. La carte reste le
 * théâtre d'opération plein écran : SEUL l'azimut s'y règle (en saisissant
 * le cône directement) ; ce bandeau porte le reste (rôle, élévation, délai).
 *
 * Délai de tir = T+ ABSOLU depuis le début du scénario (t=0), indépendant
 * pour chaque Mesange (le Roi n'est pas forcément à T+0 — c'est un choix
 * tactique : partir après les leurres pour profiter de la saturation).
 */
export function ThreatConfigBar({
  configs,
  selected,
  selectedIndex,
  canAdd,
  canRemove,
  kingTakenElsewhere,
  onSelect,
  onAdd,
  onChange,
  onBackToCount,
  onRemove,
}: ThreatConfigBarProps) {
  const colorClass = getMesangeRoleTextClass(selected.role)

  return (
    <div className="pointer-events-auto absolute right-0 bottom-0 left-0 bg-gradient-to-t from-bg from-70% to-transparent">
      <FleetTabs configs={configs} selectedId={selected.id} canAdd={canAdd} onSelect={onSelect} onAdd={onAdd} />

      <div className="flex flex-wrap items-center gap-6 px-6 pt-3 pb-6">
        <div className="flex shrink-0 items-center gap-3">
          <RoleRocketIcon role={selected.role} className={`h-11 ${colorClass}`} />
          <div>
            <p className="text-base font-semibold text-ink">Mesange {String(selectedIndex).padStart(2, '0')}</p>
            <p className={`text-xs font-semibold tracking-wide uppercase ${colorClass}`}>
              {getMesangeRoleLabel(selected.role)}
            </p>
          </div>
        </div>

        <div className="h-12 w-px shrink-0 bg-border" />

        <RoleSelector value={selected.role} onChange={(role) => onChange({ role })} kingTakenElsewhere={kingTakenElsewhere} />

        <AzimuthReadout value={selected.azimuthDeg} />

        <InlineField
          label="Elevation"
          value={selected.inclinationDeg}
          min={INCLINATION_MIN}
          max={INCLINATION_MAX}
          unit="°"
          onChange={(v) => onChange({ inclinationDeg: v })}
        />
        <InlineField
          label="Liftoff"
          hint="T+ after scenario start"
          value={selected.launchDelaySec}
          min={0}
          max={120}
          unit="s"
          onChange={(v) => onChange({ launchDelaySec: v })}
        />

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={onBackToCount}
            className="text-xs font-medium text-ink-faint transition-colors hover:text-accent-bright"
          >
            Change count
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-ink-faint transition-colors hover:text-alert"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
