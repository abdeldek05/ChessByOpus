import { usePointerDrag } from '@/hooks/usePointerDrag'

interface InclinationPadProps {
  value: number
  onChange: (deg: number) => void
}

const PX = 44
const PY = 130
const MIN = 45
const MAX = 90

/**
 * Pas de tir interactif : on incline la fusée à la souris/doigt, la trajectoire
 * balistique se redessine en direct et une fusée parcourt l'arc en boucle.
 * Illustre la relation angle → portée/apogée (plus vertical = plus haut, moins loin).
 */
export function InclinationPad({ value, onChange }: InclinationPadProps) {
  const { ref, onPointerDown } = usePointerDrag(
    (dx, dy) => {
      const deg = (Math.atan2(-dy, Math.abs(dx)) * 180) / Math.PI
      onChange(Math.min(MAX, Math.max(MIN, Math.round(deg))))
    },
    { x: PX / 240, y: PY / 160 },
  )

  const rad = (value * Math.PI) / 180
  const range = 168 * Math.sin(2 * rad)
  const height = 96 * Math.sin(rad) ** 2
  const path = `M ${PX} ${PY} Q ${PX + range / 2} ${PY - 2 * height} ${PX + range} ${PY}`
  const tipX = PX + 30 * Math.cos(rad)
  const tipY = PY - 30 * Math.sin(rad)
  const apexX = PX + range / 2
  const apexY = PY - height

  return (
    <div data-guide="inclination" className="flex flex-col items-center gap-1">
      <svg
        ref={ref}
        viewBox="0 0 240 160"
        onPointerDown={onPointerDown}
        className="w-56 cursor-ns-resize touch-none select-none"
      >
        {/* Sol */}
        <line x1="8" y1={PY} x2="232" y2={PY} stroke="var(--color-border)" strokeWidth="1.5" />

        {/* Trajectoire balistique */}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="3 5" strokeOpacity="0.7" />

        {/* Apogée */}
        <circle cx={apexX} cy={apexY} r="3.5" fill="var(--color-accent-bright)" className="animate-soft-pulse" />

        {/* Fusée qui vole l'arc */}
        <g>
          <polygon points="-5,-3.5 7,0 -5,3.5" fill="var(--color-accent-bright)" />
          <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto" path={path} />
        </g>

        {/* Socle */}
        <rect x={PX - 12} y={PY - 4} width="24" height="6" rx="2" fill="var(--color-surface-2)" />

        {/* Fusée sur le pas de tir, inclinée */}
        <g stroke="var(--color-accent-bright)" strokeWidth="4" strokeLinecap="round">
          <line x1={PX} y1={PY} x2={tipX} y2={tipY} />
        </g>
        <polygon
          points={`${PX + 36 * Math.cos(rad)},${PY - 36 * Math.sin(rad)} ${tipX - 4 * Math.cos(rad) - 4 * Math.sin(rad)},${tipY + 4 * Math.sin(rad) - 4 * Math.cos(rad)} ${tipX - 4 * Math.cos(rad) + 4 * Math.sin(rad)},${tipY + 4 * Math.sin(rad) + 4 * Math.cos(rad)}`}
          fill="var(--color-accent-bright)"
        />
        <circle cx={PX} cy={PY} r="4" fill="var(--color-ink)" />
      </svg>

      <p className="text-sm font-semibold text-accent-bright tabular-nums">
        {value}° <span className="font-normal text-ink-faint">inclinaison</span>
      </p>
    </div>
  )
}
