import { usePointerDrag } from '@/hooks/usePointerDrag'

interface AzimuthDialProps {
  value: number
  onChange: (deg: number) => void
}

const CARDINALS = [
  { label: 'N', deg: 0 },
  { label: 'E', deg: 90 },
  { label: 'S', deg: 180 },
  { label: 'O', deg: 270 },
]

/** Boussole interactive : on tourne l'aiguille pour régler l'azimut, balayage radar animé. */
export function AzimuthDial({ value, onChange }: AzimuthDialProps) {
  const { ref, onPointerDown } = usePointerDrag((dx, dy) => {
    const bearing = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
    onChange((Math.round(bearing / 5) * 5) % 360)
  })

  return (
    <div data-guide="azimuth" className="flex flex-col items-center gap-1">
      <svg
        ref={ref}
        viewBox="0 0 160 160"
        onPointerDown={onPointerDown}
        className="w-36 cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <circle cx="80" cy="80" r="72" fill="var(--color-surface-2)" />
        <circle cx="80" cy="80" r="72" fill="none" stroke="var(--color-accent)" strokeOpacity="0.25" strokeWidth="1" />

        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * 10 * Math.PI) / 180
          const major = i % 9 === 0
          return (
            <line
              key={i}
              x1={80 + 72 * Math.sin(a)}
              y1={80 - 72 * Math.cos(a)}
              x2={80 + (major ? 62 : 67) * Math.sin(a)}
              y2={80 - (major ? 62 : 67) * Math.cos(a)}
              stroke="var(--color-ink-faint)"
              strokeWidth={major ? 1.5 : 0.75}
            />
          )
        })}

        {CARDINALS.map(({ label, deg }) => {
          const a = (deg * Math.PI) / 180
          return (
            <text
              key={label}
              x={80 + 52 * Math.sin(a)}
              y={80 - 52 * Math.cos(a) + 4}
              textAnchor="middle"
              className="fill-ink-dim text-[11px] font-semibold"
            >
              {label}
            </text>
          )
        })}

        {/* Balayage radar */}
        <g opacity="0.5">
          <defs>
            <linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-bright)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--color-accent-bright)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="80,80 68,14 92,14" fill="url(#sweep)" />
          <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="3.5s" repeatCount="indefinite" />
        </g>

        {/* Aiguille = fusée orientée */}
        <g transform={`rotate(${value} 80 80)`}>
          <line x1="80" y1="80" x2="80" y2="20" stroke="var(--color-accent-bright)" strokeWidth="3" strokeLinecap="round" />
          <polygon points="80,12 75,24 85,24" fill="var(--color-accent-bright)" />
        </g>
        <circle cx="80" cy="80" r="5" fill="var(--color-ink)" />
      </svg>

      <p className="text-sm font-semibold text-accent-bright tabular-nums">
        {value}° <span className="font-normal text-ink-faint">azimut</span>
      </p>
    </div>
  )
}
