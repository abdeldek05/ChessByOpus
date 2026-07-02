import type { MissionStep } from '@/hooks/useMissionStepper'

interface MissionStepRailProps {
  steps: MissionStep[]
  index: number
  onStepClick: (index: number) => void
}

/** Rail de progression 01 ─ 02 ─ … : étape courante en surbrillance, étapes franchies validées. */
export function MissionStepRail({ steps, index, onStepClick }: MissionStepRailProps) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const done = i < index
        const active = i === index
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(i)}
              className={`flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 transition-colors duration-200 ${
                active ? 'bg-surface-2' : 'hover:bg-surface'
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-accent text-bg'
                    : done
                      ? 'bg-accent/25 text-accent-bright'
                      : 'bg-surface text-ink-faint'
                }`}
              >
                {done ? '✓' : String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`hidden text-[11px] font-medium tracking-[0.12em] uppercase sm:inline ${
                  active ? 'text-ink' : done ? 'text-ink-dim' : 'text-ink-faint'
                }`}
              >
                {step.label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
