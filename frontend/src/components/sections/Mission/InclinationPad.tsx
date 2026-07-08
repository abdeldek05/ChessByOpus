import { usePointerDrag } from '@/hooks/usePointerDrag'
import { DialValueInput } from './DialValueInput'
import { INCLINATION_MIN, INCLINATION_MAX } from '@/lib/validateScenario'

interface InclinationPadProps {
  value: number
  onChange: (deg: number) => void
}

// Pivot du cadran (bas-gauche) dans le viewBox 240×160.
const PX = 46
const PY = 132
const MIN = INCLINATION_MIN
const MAX = INCLINATION_MAX

function polar(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180
  return { x: PX + radius * Math.cos(rad), y: PY - radius * Math.sin(rad) }
}

/**
 * Cadran d'angle de tir : on drague le long de l'arc 45→90°, la fusée pivote
 * et la trajectoire balistique se redessine en direct (plus vertical = plus
 * haut, moins loin). Mapping = angle du pointeur, clampé sur [45, 90].
 */
export function InclinationPad({ value, onChange }: InclinationPadProps) {
  const { ref, onPointerDown } = usePointerDrag(
    (dx, dy) => {
      const deg = (Math.atan2(-dy, dx) * 180) / Math.PI
      onChange(Math.min(MAX, Math.max(MIN, Math.round(deg))))
    },
    { x: PX / 240, y: PY / 160 },
  )

  const rad = (value * Math.PI) / 180
  const range = 150 * Math.sin(2 * rad)
  const height = 92 * Math.sin(rad) ** 2
  const path = `M ${PX} ${PY} Q ${PX + range / 2} ${PY - 2 * height} ${PX + range} ${PY}`

  const tip = polar(value, 44)
  const nose = polar(value, 52)

  return (
    <div data-guide="inclination" className="flex flex-col items-center gap-1">
      <svg
        ref={ref}
        viewBox="0 0 240 160"
        onPointerDown={onPointerDown}
        className="w-56 cursor-grab touch-none select-none active:cursor-grabbing"
      >
        {/* Trajectoire balistique */}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="3 5" strokeOpacity="0.7" />

        {/* Fusée qui vole l'arc */}
        <g>
          <polygon points="-5,-3.5 7,0 -5,3.5" fill="var(--color-accent-bright)" />
          <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto" path={path} />
        </g>

        {/* Socle */}
        <rect x={PX - 12} y={PY - 4} width="24" height="6" rx="2" fill="var(--color-surface-2)" />

        {/* Fusée inclinée (on l'attrape pour changer l'angle) */}
        <line x1={PX} y1={PY} x2={tip.x} y2={tip.y} stroke="var(--color-accent-bright)" strokeWidth="4" strokeLinecap="round" />
        <circle cx={nose.x} cy={nose.y} r="3.5" fill="var(--color-accent-bright)" />
        <circle cx={PX} cy={PY} r="4" fill="var(--color-ink)" />
      </svg>

      <DialValueInput value={value} min={MIN} max={MAX} unit="°" label="inclinaison" onChange={onChange} />
    </div>
  )
}
