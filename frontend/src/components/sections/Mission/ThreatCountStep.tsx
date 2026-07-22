import { RoleRocketIcon } from './RoleRocketIcon'

interface ThreatCountStepProps {
  current: number
  onChoose: (count: number) => void
}

const COUNT_OPTIONS = [1, 2, 3, 4, 5]

/**
 * Premier écran de l'assistant Menaces, superposé au centre de la carte
 * (voir StepThreats) : combien de Mesanges dans ce scénario (1 Roi
 * obligatoire + Dames/Pions en option). Une fois choisi, on passe à la
 * configuration une par une dans le bandeau bas (voir ThreatConfigBar).
 */
export function ThreatCountStep({ current, onChoose }: ThreatCountStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-8 text-center shadow-xl shadow-black/40">
      <div>
        <p className="text-sm font-medium text-ink-dim">How many Mesanges</p>
        <p className="text-sm font-medium text-ink-dim">in this scenario?</p>
      </div>

      <div className="flex gap-2">
        {COUNT_OPTIONS.map((count) => {
          const active = count === current
          return (
            <button
              key={count}
              type="button"
              onClick={() => onChoose(count)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 transition-colors duration-150 ${
                active ? 'bg-surface-2 text-accent-bright' : 'text-ink-faint hover:bg-surface-2/50 hover:text-ink-dim'
              }`}
            >
              <RoleRocketIcon role="PAWN" className="h-7" />
              <span className="text-xs font-semibold">{count}</span>
            </button>
          )
        })}
      </div>

      <p className="max-w-[16rem] text-[11px] text-ink-faint">
        One is always the King (primary threat) — the rest are decoys you assign roles to next.
      </p>
    </div>
  )
}
