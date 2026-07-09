import { usePointerDrag } from '@/hooks/usePointerDrag'
import { INCLINATION_MIN, INCLINATION_MAX } from '@/lib/validateScenario'
import { SoundingRocket2D } from './SoundingRocket2D'

interface InclinationDialProps {
  value: number
  onChange: (deg: number) => void
}

// Pivot (base de la fusée) au centre-bas du viewBox 200×150.
const PX = 100
const PY = 128
const MIN = INCLINATION_MIN
const MAX = INCLINATION_MAX
// Rayons de l'arc gradué et de la fusée.
const ARC_R = 72
const ROCKET_LEN = 66

/** Point sur un cercle centré au pivot, angle mesuré depuis l'horizontale. */
function polar(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180
  return { x: PX + radius * Math.cos(rad), y: PY - radius * Math.sin(rad) }
}

/**
 * Cadran d'élévation : on saisit la fusée et on la fait pivoter sur l'arc
 * gradué 70→90°, au dixième de degré. Léger (SVG pur), fluide et lisible —
 * remplace l'ancien hologramme 3D. Mapping = angle du pointeur autour du
 * pivot, clampé sur [70, 90].
 */
export function InclinationDial({ value, onChange }: InclinationDialProps) {
  const { ref, onPointerDown } = usePointerDrag(
    (dx, dy) => {
      const deg = (Math.atan2(-dy, dx) * 180) / Math.PI
      onChange(Math.min(MAX, Math.max(MIN, Math.round(deg * 10) / 10)))
    },
    { x: PX / 200, y: PY / 150 },
  )

  const arcStart = polar(MIN, ARC_R)
  const arcEnd = polar(MAX, ARC_R)
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${ARC_R} ${ARC_R} 0 0 1 ${arcEnd.x} ${arcEnd.y}`

  const knob = polar(value, ARC_R)
  // Fusée dessinée verticale (90°) puis pivotée autour de sa base : sens horaire
  // pour pencher vers la droite quand l'élévation baisse vers 70°.
  const rocketTilt = 90 - value

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 150"
      onPointerDown={onPointerDown}
      className="w-full cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {/* Piste de l'arc (fond) */}
      <path d={arcPath} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" strokeLinecap="round" />

      {/* Graduations aux bornes */}
      {[MIN, MAX].map((deg) => {
        const inner = polar(deg, ARC_R - 6)
        const outer = polar(deg, ARC_R + 6)
        const label = polar(deg, ARC_R + 18)
        return (
          <g key={deg}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--color-ink-faint)" strokeWidth="1.5" />
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--color-ink-faint)">
              {deg}°
            </text>
          </g>
        )
      })}

      {/* Socle */}
      <rect x={PX - 14} y={PY} width="28" height="6" rx="3" fill="var(--color-surface-2)" />

      {/* Fusée-sonde qu'on attrape pour régler l'angle : pivote autour de sa base */}
      <g transform={`rotate(${rocketTilt} ${PX} ${PY})`}>
        <SoundingRocket2D pivotX={PX} pivotY={PY} length={ROCKET_LEN} />
      </g>

      {/* Marqueur qui glisse sur l'arc, aligné sur l'angle courant */}
      <circle cx={knob.x} cy={knob.y} r="5" fill="var(--color-accent-bright)" />

      {/* Pivot */}
      <circle cx={PX} cy={PY} r="4" fill="var(--color-ink)" />
    </svg>
  )
}
