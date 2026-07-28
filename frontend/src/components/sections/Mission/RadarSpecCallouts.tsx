import type { RadarConfig } from '@/types/radar.types'

interface RadarSpecCalloutsProps {
  config: RadarConfig
}

interface Spec {
  label: string
  value: string
  position: string
}

/** Étiquettes flottantes des specs radar — pastilles douces, sans trait de liaison. */
export function RadarSpecCallouts({ config }: RadarSpecCalloutsProps) {
  const specs: Spec[] = [
    { label: 'Range', value: `${config.rangeKm} km`, position: 'top-6 left-6' },
    { label: 'Ceiling', value: `${config.ceilingM} m`, position: 'top-6 right-6 text-right' },
    { label: 'Rotating', value: config.rotating ? 'Yes' : 'No', position: 'bottom-6 left-6' },
  ]

  return (
    <>
      {specs.map((spec) => (
        <div
          key={spec.label}
          className={`hud-glass pointer-events-none absolute ${spec.position} z-10 rounded-xl px-3 py-2`}
        >
          <p className="type-label-tight text-ink-dim">{spec.label}</p>
          <p className="text-sm font-medium text-accent-bright">{spec.value}</p>
        </div>
      ))}
    </>
  )
}
